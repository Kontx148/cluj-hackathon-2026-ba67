# Election Chain Backend (Prototype)

A permissioned, blockchain-style backend for running auditable elections. This
service is the **chain backend only** — a separate web/news/AI front-end
consumes it through the public REST API.

The system runs as **three containers** under Docker Compose:

| Service          | Port | Role                                                       |
|------------------|------|------------------------------------------------------------|
| `chain-backend`  | 4000 | Public API, election lifecycle, block creation, storage    |
| `validator-1`    | 4101 | Independent validator (simulates an institution's node)    |
| `validator-2`    | 4102 | Independent validator (simulates a second institution)     |

> **This is a hackathon prototype.** Cryptography, BFT consensus, signatures,
> and "encrypted" votes are all **mocked**. Search for `TODO:` in the code for
> the exact spots where real cryptography would slot in.

---

## Architecture

```
                            ┌────────────────────┐
                            │  Front-end / News  │
                            │   AI / civic app   │
                            └─────────┬──────────┘
                                      │ HTTPS / REST
                                      ▼
                       ┌──────────────────────────────┐
                       │        chain-backend         │
                       │  ┌────────────────────────┐  │
                       │  │ Election lifecycle FSM │  │
                       │  │ Vote intake            │  │
                       │  │ Consensus orchestrator │  │
                       │  │ Block builder          │  │
                       │  │ File storage (chain.json)│ │
                       │  └────────┬──────┬────────┘  │
                       └───────────┼──────┼───────────┘
                          POST /validate-transaction
                          POST /sign-block
                                   │      │
                       ┌───────────▼──┐ ┌─▼────────────┐
                       │  validator-1 │ │  validator-2 │
                       │  (mock node) │ │  (mock node) │
                       └──────────────┘ └──────────────┘
```

### Election lifecycle

```
PROPOSED ──approve x N──▶ APPROVED ──/open──▶ OPEN ──/freeze──▶ FROZEN
                                                                    │
                                                                /tally
                                                                    ▼
                                                                TALLYING ──/finish──▶ FINISHED
```

Each transition is recorded on-chain as a system transaction
(`ELECTION_PROPOSED`, `ELECTION_APPROVED`, `ELECTION_OPENED`,
`ELECTION_FROZEN`, `ELECTION_TALLY_STARTED`, `ELECTION_FINISHED`) inside its
own block, so the entire history is auditable.

### Consensus simulation

For every transaction the chain-backend:

1. Sends the transaction to **all** validators (`POST /validate-transaction`).
2. Counts approvals; needs at least `CONSENSUS_THRESHOLD` (default 2 → both).
3. Builds a candidate block referencing the previous block's hash.
4. Sends the block to **all** validators (`POST /sign-block`).
5. Collects mock signatures and only commits the block if ≥ threshold signed.

> **TODO:** replace this two-phase request/response with a real BFT protocol
> (PBFT / HotStuff), real signatures (Ed25519 / BLS), and a mempool.

### Hashing

All hashes use SHA-256 over a deterministic JSON encoding (sorted object keys).

* **Transaction hash** = `sha256(deterministic-json(tx without transactionHash))`
* **Block hash** = `sha256(deterministic-json({blockNumber, previousHash,
  timestamp, transactions, validatorSignatures}))`

---

## Services

### `chain-backend`

* Public REST API (Express + TypeScript)
* Manages elections, approvals, votes, blocks
* Talks to validators over the Docker internal network
* Persists state as JSON at `CHAIN_STORAGE_PATH` (default `/data/chain.json`)

### `validator-1` / `validator-2`

* Independent Node services (same image, different env vars)
* Endpoints:
  * `GET /health`
  * `GET /status`
  * `POST /validate-transaction`
  * `POST /sign-block`
* "Sign" by computing `sha256(VALIDATOR_ID || PRIVATE_KEY || canonicalContent)`

---

## Environment variables

### `chain-backend`

| Variable               | Default                       | Description                                       |
|------------------------|-------------------------------|---------------------------------------------------|
| `PORT`                 | `4000`                        | HTTP port                                         |
| `NODE_ENV`             | `development`                 | Standard Node env                                 |
| `VALIDATOR_1_URL`      | `http://validator-1:4101`     | Reachable URL of validator 1                      |
| `VALIDATOR_2_URL`      | `http://validator-2:4102`     | Reachable URL of validator 2                      |
| `CONSENSUS_THRESHOLD`  | `2`                           | Min approvals/signatures required                 |
| `CHAIN_STORAGE_MODE`   | `file`                        | Only `file` is implemented                        |
| `CHAIN_STORAGE_PATH`   | `/data/chain.json`            | Where the chain JSON is persisted                 |
| `ADMIN_API_KEY`        | `dev-admin-key`               | Master admin key (acts as any institution)        |
| `AEP_API_KEY`          | `dev-aep-key`                 | API key for institution `AEP`                     |
| `BEC_API_KEY`          | `dev-bec-key`                 | API key for institution `BEC`                     |
| `COURT_API_KEY`        | `dev-court-key`               | API key for institution `COURT`                   |

### `validator-1` / `validator-2`

| Variable                 | Description                              |
|--------------------------|------------------------------------------|
| `PORT`                   | HTTP port for the validator              |
| `VALIDATOR_ID`           | Identifier returned in responses         |
| `VALIDATOR_PRIVATE_KEY`  | Mock private key used for "signing"      |

`docker-compose.yml` already wires these. A `.env.example` is provided as a
reference if you want to override anything via a `.env` file.

---

## Running with Docker

```bash
cd ChainBackend
docker compose up --build
```

This brings up:

* `chain-backend` → `http://localhost:4000`
* `validator-1`   → `http://localhost:4101`
* `validator-2`   → `http://localhost:4102`

To stop and wipe state:

```bash
docker compose down -v
```

---

## Authentication

All institution / admin endpoints require **two headers**:

```
x-institution-id: AEP | BEC | COURT
x-api-key:        <api key for that institution>
```

`x-api-key` set to `ADMIN_API_KEY` is accepted on any institution endpoint
(except `/approve`, which must be tied to a specific institution).

| Endpoint                          | Who can call it                                |
|----------------------------------|------------------------------------------------|
| `POST /elections/proposals`       | `AEP` only (proposer role) or admin            |
| `POST /elections/:id/approve`     | `AEP`, `BEC`, `COURT` (each only once)         |
| `POST /elections/:id/open`        | Any institution or admin                       |
| `POST /elections/:id/freeze`      | Any institution or admin                       |
| `POST /elections/:id/tally`       | Any institution or admin                       |
| `POST /elections/:id/finish`      | Any institution or admin                       |
| `POST /votes`                     | Open to all (gated by token + proof on chain)  |
| `GET  /chain/...`, `GET /elections/...` | Public                                   |

---

## API endpoints

### Health / metadata

* `GET /health` — service status, current block count
* `GET /institutions` — list of authorized institutions

### Elections

* `POST /elections/proposals` — propose a new election (AEP)
* `GET  /elections` — list all elections
* `GET  /elections/:id` — full election object
* `GET  /elections/:id/approvals` — approval status
* `POST /elections/:id/approve` — institution approval
* `POST /elections/:id/open` — open voting
* `POST /elections/:id/freeze` — close voting
* `POST /elections/:id/tally` — run mock tally
* `POST /elections/:id/finish` — mark election as finished

### Votes

* `POST /votes` — submit an encrypted vote transaction

### Public chain

* `GET /chain` — the whole chain
* `GET /chain/blocks` — list blocks
* `GET /chain/blocks/:blockNumber`
* `GET /chain/transactions/:transactionHash`
* `GET /chain/elections/:electionId`
* `GET /chain/elections/:electionId/blocks`
* `GET /chain/elections/:electionId/transactions`
* `GET /chain/verify` — re-runs hash, link and policy checks over the chain

### Validators (`validator-1`, `validator-2`)

* `GET  /health`
* `GET  /status`
* `POST /validate-transaction` → `{ validatorId, approved, signature?, reason? }`
* `POST /sign-block`           → `{ validatorId, approved, signature?, reason? }`

---

## Full test flow

The example below uses `curl`. PowerShell users can swap `curl` for `curl.exe`
or `Invoke-RestMethod`.

### 1. Start everything

```bash
docker compose up --build
```

### 2. Health checks

```bash
curl http://localhost:4000/health
curl http://localhost:4101/health
curl http://localhost:4102/health
```

### 3. List institutions

```bash
curl http://localhost:4000/institutions
```

### 4. Propose an election (as AEP)

```bash
curl -X POST http://localhost:4000/elections/proposals \
  -H "Content-Type: application/json" \
  -H "x-institution-id: AEP" \
  -H "x-api-key: dev-aep-key" \
  -d '{
    "electionId": "RO-PRESIDENTIAL-2029",
    "name": "Romanian Presidential Election 2029",
    "type": "PRESIDENTIAL",
    "districts": ["CJ-01", "B-01", "BV-01"],
    "candidates": [
      { "id": "candidate-a", "name": "Candidate A" },
      { "id": "candidate-b", "name": "Candidate B" }
    ],
    "startsAt": "2029-11-10T07:00:00Z",
    "endsAt":   "2029-11-10T21:00:00Z",
    "requiredApprovals": 2
  }'
```

### 5. Approve with BEC and COURT

```bash
curl -X POST http://localhost:4000/elections/RO-PRESIDENTIAL-2029/approve \
  -H "x-institution-id: BEC"   -H "x-api-key: dev-bec-key"

curl -X POST http://localhost:4000/elections/RO-PRESIDENTIAL-2029/approve \
  -H "x-institution-id: COURT" -H "x-api-key: dev-court-key"
```

After two approvals the election transitions to `APPROVED`.

### 6. Open the election

```bash
curl -X POST http://localhost:4000/elections/RO-PRESIDENTIAL-2029/open \
  -H "x-api-key: dev-admin-key"
```

### 7. Cast a vote

```bash
curl -X POST http://localhost:4000/votes \
  -H "Content-Type: application/json" \
  -d '{
    "electionId": "RO-PRESIDENTIAL-2029",
    "districtId": "CJ-01",
    "anonymousTokenHash": "token-hash-001",
    "encryptedVote": "mock-encrypted:candidate-a",
    "proof": "mock-zk-proof",
    "timestamp": "2029-11-10T12:30:00Z"
  }'
```

The response includes the accepted transaction and the new block (with both
validator signatures).

### 8. Try a duplicate vote (should be rejected)

```bash
curl -i -X POST http://localhost:4000/votes \
  -H "Content-Type: application/json" \
  -d '{
    "electionId": "RO-PRESIDENTIAL-2029",
    "districtId": "CJ-01",
    "anonymousTokenHash": "token-hash-001",
    "encryptedVote": "mock-encrypted:candidate-b",
    "proof": "mock-zk-proof",
    "timestamp": "2029-11-10T12:31:00Z"
  }'
```

→ HTTP `409 Conflict`
```json
{ "error": "Token already used. Re-voting is not supported." }
```

### 9. Inspect the chain

```bash
curl http://localhost:4000/chain
curl http://localhost:4000/chain/elections/RO-PRESIDENTIAL-2029
curl http://localhost:4000/chain/verify
```

### 10. Freeze the election

```bash
curl -X POST http://localhost:4000/elections/RO-PRESIDENTIAL-2029/freeze \
  -H "x-api-key: dev-admin-key"
```

After this point any new vote is rejected (`Election is not OPEN`).

### 11. Tally

```bash
curl -X POST http://localhost:4000/elections/RO-PRESIDENTIAL-2029/tally \
  -H "x-api-key: dev-admin-key"
```

The response contains a `tally` object with `totalVotes`, `perCandidate`, and
`perDistrict` counts.

### 12. Finish

```bash
curl -X POST http://localhost:4000/elections/RO-PRESIDENTIAL-2029/finish \
  -H "x-api-key: dev-admin-key"
```

### 13. Final verification

```bash
curl http://localhost:4000/chain/verify
```

Expected:

```json
{ "valid": true, "issues": [], "blockCount": 8, "consensusThreshold": 2 }
```

(Block count grows by one for each lifecycle event + each accepted vote.)

---

## What is mocked vs real

| Concern                    | Prototype                                            | Production replacement                                   |
|----------------------------|------------------------------------------------------|----------------------------------------------------------|
| Validator identity         | Static env var (`VALIDATOR_PRIVATE_KEY`)             | HSM-backed Ed25519 / BLS keypair per institution         |
| Validator signatures       | `sha256(privKey || canonicalContent)`                | Real digital signatures (Ed25519 / ECDSA / BLS)          |
| Consensus protocol         | "Both validators must approve" round-trip            | BFT consensus (PBFT / HotStuff / Tendermint)             |
| Mempool / batching         | One transaction per block                            | Mempool, leader-proposed batches, gas-equivalent limits  |
| Encrypted vote             | `mock-encrypted:<candidateId>` literal               | Threshold ElGamal / Paillier ciphertext                  |
| Tallying                   | String parsing                                       | Homomorphic aggregation + threshold decryption ceremony  |
| Citizen anonymity          | Pre-issued `anonymousTokenHash` from out-of-band     | zk-SNARK / blind signature based eligibility proofs      |
| Storage                    | Single JSON file under `/data`                       | Append-only log + LSM-tree KV store, per-validator       |
| Networking / auth          | Header API keys                                      | mTLS + signed requests bound to institution identity     |

Search the codebase for `TODO:` to see exactly where each replacement plugs in.

---

## Local development (without Docker)

You can also run each service directly with `npm`:

```bash
# terminal 1
cd ChainBackend/validator
npm install
PORT=4101 VALIDATOR_ID=validator-1 VALIDATOR_PRIVATE_KEY=mock-validator-1-key npm run dev

# terminal 2
cd ChainBackend/validator
PORT=4102 VALIDATOR_ID=validator-2 VALIDATOR_PRIVATE_KEY=mock-validator-2-key npm run dev

# terminal 3
cd ChainBackend/chain-backend
npm install
PORT=4000 \
VALIDATOR_1_URL=http://localhost:4101 \
VALIDATOR_2_URL=http://localhost:4102 \
CHAIN_STORAGE_PATH=./data/chain.json \
npm run dev
```

(Windows PowerShell users: prefix env vars with `$env:NAME = 'value'` on
separate lines instead of inline assignments.)
