# Election Chain Backend (Prototype)

A permissioned, blockchain-style backend for running auditable elections.
The system is split into **2 stateless gateways** and **3 validators**,
each validator persisting its own copy of the chain. Consensus is
**2-of-3** in two phases (prepare + commit).

| Service       | Port  | Role                                                                    |
|---------------|-------|-------------------------------------------------------------------------|
| `gateway-1`   | 4001  | Public REST API. Stateless. Forwards write actions to validators.       |
| `gateway-2`   | 4002  | Identical replica of gateway-1. Front-end can use either.               |
| `validator-1` | 4101  | Stores its own chain JSON. Validates txs, signs blocks, decryption share|
| `validator-2` | 4102  | Same as validator-1; independent chain copy.                            |
| `validator-3` | 4103  | Same as validator-1; independent chain copy.                            |

> **This is a hackathon prototype.** Real BFT consensus, real signatures,
> real election public keys, real homomorphic encryption, and real
> threshold decryption are all **mocked**. Search the codebase for
> `TODO:` to see exactly where production cryptography would slot in.

---

## Architecture

```
                         Frontend / Postman / curl
                                    │
                  ┌─────────────────┴─────────────────┐
                  ▼                                   ▼
            ┌──────────┐                       ┌──────────┐
            │ gateway-1│                       │ gateway-2│   ← stateless,
            │   :4001  │                       │   :4002  │     interchangeable
            └────┬─────┘                       └────┬─────┘
                 │  POST /consensus/prepare         │
                 │  POST /consensus/commit          │
                 │  POST /threshold-decryption/share│
                 │  GET  /chain/...                 │
                 │  GET  /elections/...             │
                 ▼                                   ▼
        ┌────────────────────────────────────────────────────┐
        │                                                    │
        │           ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
        │           │ validator-1 │  │ validator-2 │  │ validator-3 │
        │           │    :4101    │  │    :4102    │  │    :4103    │
        │           │  own chain  │  │  own chain  │  │  own chain  │
        │           │  own state  │  │  own state  │  │  own state  │
        │           └─────────────┘  └─────────────┘  └─────────────┘
        │
        │   2-of-3 consensus required to commit a block.
        │   All validators end up with identical block hashes.
        └────────────────────────────────────────────────────┘
```

* **Gateways are replaceable entry points.** They hold no canonical state
  beyond the institution API keys configured in env. Killing one does not
  affect the chain. The front-end can fail over to the other gateway.
* **Validators hold the chain.** Each one persists `validator-N-chain.json`
  on its own Docker volume. State is rebuilt by replaying the chain on
  startup.
* **Writes go through 2-of-3 consensus.** If validator-3 is down, a write
  driven by `gateway-1` still succeeds because `validator-1` and
  `validator-2` reach the threshold.
* **Election-level digital ID encryption.** When an election is proposed,
  the gateway generates an RSA-OAEP/SHA-256 election key pair. The public
  key is available at `GET /elections/:id/public-key`; validators persist
  the private key in their local election state so they can decrypt
  `encryptedDigitalId` during vote validation.

### Election lifecycle

```
PROPOSED ──approve x N──▶ APPROVED ──/open──▶ OPEN ──/freeze──▶ FROZEN
                                                                   │
                                                              /tally
                                                                   ▼
                                                              TALLYING
                                                                   │
                                          /request-threshold-decryption
                                                                   ▼
                                                              DECRYPTED   (cleartext private)
                                                                   │
                                                              /finish
                                                                   ▼
                                                              FINISHED   (cleartext published)
```

Each step is committed as its own auditable block. The cleartext tally is
**only exposed publicly after FINISHED**; before that, public `GET`
endpoints redact `tally` / `publishedTally` fields and return only the
encrypted aggregate metadata + decryption-share proof.

### Demo consensus

For every write action the gateway:

1. Generates a `proposalId` (UUID) and a deterministic `proposedAt` timestamp.
2. `POST /consensus/prepare` to **all** validators with the action payload.
   * Validators run precondition checks against their local state.
   * For derived actions (e.g. `ELECTION_TALLY_AGGREGATED`) the validator
     computes the full payload from its chain and returns it as
     `computedAction`.
   * Each validator returns a mock signature.
3. The gateway groups responses by canonical `computedAction`. If at least
   **CONSENSUS_THRESHOLD** validators agreed on the same payload, the
   gateway proceeds; otherwise it aborts.
4. `POST /consensus/commit` to **all** validators with the agreed payload
   and the collected signatures.
5. Each validator deterministically builds the next block (same
   `previousHash`, `proposedAt`, `transactions`, `signatures` →
   identical `blockHash`), applies the state machine, and persists.
6. If at least **CONSENSUS_THRESHOLD** validators committed, the gateway
   returns the new block summary. Validators that were down are simply
   left out (production: catch-up sync would happen later).

> **TODO:** replace with real PBFT / HotStuff / Tendermint, real
> Ed25519 / BLS signatures, mempool + batching, and validator catch-up
> on reconnect.

### Hashing

All hashes use SHA-256 over deterministic JSON (sorted object keys).

* **Transaction hash** = `sha256(deterministic-json(tx without transactionHash))`
* **Block hash** = `sha256(deterministic-json({blockNumber, previousHash, timestamp, transactions, validatorSignatures}))`

---

## Services

### `gateway/`

Stateless Express + TypeScript service.

* `src/consensus.ts` – orchestrates the 2-phase consensus.
* `src/tally-flow.ts` – drives the aggregate → threshold-decrypt → finish pipeline.
* `src/chain-aggregate.ts` – queries all validators for reads and returns
  the majority-agreed result with consistency metadata.
* `src/auth.ts` – header-based institution auth.

### `validator/`

Express + TypeScript service. Holds the canonical state.

* `src/storage.ts` – per-validator JSON file (`/data/validator-N-chain.json`).
* `src/state.ts` – state machine that applies a transaction
  (`apply(state, tx)`); used both for live commits and for chain replay
  at startup.
* `src/validate.ts` – precondition checks for every action type.
* `src/tally.ts` – mock homomorphic aggregation + cleartext tally derivation.
* `src/vote-vector.ts` – decodes the three supported encrypted-vote formats
  and enforces the vector rules (length = candidate count, all 0/1, sum = 1).
* `src/routes/consensus.ts` – `POST /consensus/prepare` and `/commit`.
* `src/routes/threshold.ts` – `POST /threshold-decryption/share`.
* `src/routes/chain.ts` – chain reads with FINISHED-only redaction.

### Vote encryption formats

The voter (or front-end) encrypts the vote vector against the election's
public key. Three formats are accepted by the validators; the **first
form is preferred** because it binds the ciphertext to the election:

```
1. mock-enc:<electionId>:[1,0,0]            ← preferred
2. mock-encrypted-vector:[1,0,0]            ← legacy vector form
3. mock-encrypted:<candidateId>             ← legacy single-candidate
```

A vote vector must:

* have length equal to the number of candidates
* contain only `0` or `1`
* sum to **exactly 1** (one-hot)

`[1,1,0]`, `[0,0,0]`, `[2,0,0]` are all rejected at prepare time across
every validator with reasons surfaced in the response.

### Digital ID encryption

The mobile app must never send a raw `digitalId` to the gateway. The flow is:

1. `GET /elections/:electionId/public-key`
2. Encrypt the local digital ID with RSA-OAEP/SHA-256 using that public key.
3. Submit the vote with `encryptedDigitalId` (base64 ciphertext).
4. Validators decrypt using the election private key and check their local
   `eligible-voters.json`.

If the decrypted ID is not present locally, validators reject the vote with
`VOTER_NOT_ELIGIBLE`. Validators never log or return the decrypted ID; they
only include a SHA-256 `digitalIdHash` in the committed vote transaction.

Each eligible digital ID may vote **once per election**. A second vote with
the same decrypted ID (even under a fresh `anonymousTokenHash`) is rejected
with HTTP **409** (`Digital ID already voted in this election`).

---

## Environment variables

### `gateway-1` / `gateway-2`

| Variable               | Default                                                              | Description                                |
|------------------------|----------------------------------------------------------------------|--------------------------------------------|
| `PORT`                 | `4001` / `4002`                                                      | HTTP port                                  |
| `GATEWAY_ID`           | `gateway-1` / `gateway-2`                                            | Identifier in logs / responses             |
| `VALIDATOR_URLS`       | `http://validator-1:4101,http://validator-2:4102,http://validator-3:4103` | Comma-separated validator URLs        |
| `CONSENSUS_THRESHOLD`  | `2`                                                                  | Min approvals + commits to proceed         |
| `ADMIN_API_KEY`        | `dev-admin-key`                                                      | Master key (acts as any institution)       |
| `AEP_API_KEY`          | `dev-aep-key`                                                        | API key for institution `AEP`              |
| `BEC_API_KEY`          | `dev-bec-key`                                                        | API key for institution `BEC`              |
| `COURT_API_KEY`        | `dev-court-key`                                                      | API key for institution `COURT`            |

### `validator-1` / `validator-2` / `validator-3`

| Variable                 | Description                                                |
|--------------------------|------------------------------------------------------------|
| `PORT`                   | `4101` / `4102` / `4103`                                   |
| `VALIDATOR_ID`           | `validator-1`, `validator-2`, `validator-3`                |
| `VALIDATOR_PRIVATE_KEY`  | Mock private key used for "signing"                        |
| `CHAIN_STORAGE_PATH`     | `/data/validator-1-chain.json` (etc.)                      |
| `ELIGIBILITY_LIST_PATH`  | `/app/data/eligible-voters.json`                           |
| `CONSENSUS_THRESHOLD`    | `2`                                                        |
| `VALIDATOR_URLS`         | Same value as the gateways (kept for future peer sync)     |

---

## Running with Docker

```bash
cd ChainBackend
docker compose up --build
```

This brings up:

* `gateway-1`   → `http://localhost:4001`
* `gateway-2`   → `http://localhost:4002`
* `validator-1` → `http://localhost:4101`
* `validator-2` → `http://localhost:4102`
* `validator-3` → `http://localhost:4103`

To stop and wipe state:

```bash
docker compose down -v
```

The validators are exposed to localhost in this prototype for direct
debugging. In production they would be internal-only behind the gateways.

---

## Authentication

Institution endpoints require both headers:

```
x-institution-id: AEP | BEC | COURT
x-api-key:        <api key for that institution>
```

`x-api-key` set to `ADMIN_API_KEY` is also accepted on most lifecycle
endpoints. Approvals must always come from a real institution (admin
cannot approve on behalf of another institution).

| Endpoint                                              | Who can call it                          |
|-------------------------------------------------------|------------------------------------------|
| `POST /elections/proposals`                           | `AEP` (proposer role) or admin           |
| `POST /elections/:id/approve`                         | `AEP`, `BEC`, `COURT` (each only once)   |
| `POST /elections/:id/open` / `/freeze` / `/tally`     | Any institution or admin                 |
| `POST /elections/:id/request-threshold-decryption`    | Any institution or admin                 |
| `POST /elections/:id/finish`                          | Any institution or admin                 |
| `POST /votes`                                         | Open (gated by encrypted digital ID, token, and proof) |
| `GET  /chain/...`, `GET /elections/...`               | Public                                   |

> **TODO:** replace header API keys with mTLS + signed requests bound to
> each institution's on-chain identity / DID.

---

## API endpoints (gateway)

### Health / metadata
* `GET /health`
* `GET /validators/status` – health of each validator (head, blockCount, peers)
* `GET /institutions`

### Elections
* `POST /elections/proposals` – propose a new election (AEP)
* `GET  /elections` – list (majority-agreed)
* `GET  /elections/:id` – single election (cleartext tally only after FINISHED)
* `GET  /elections/:id/public-key` – RSA public key for mobile digital ID encryption
* `POST /elections/:id/approve`
* `POST /elections/:id/open`
* `POST /elections/:id/freeze`
* `POST /elections/:id/tally` – aggregation phase
* `POST /elections/:id/request-threshold-decryption` – decryption phase
* `POST /elections/:id/finish` – publish the tally

### Votes
* `POST /votes`

### Public chain
* `GET /chain`
* `GET /chain/blocks`
* `GET /chain/blocks/:blockNumber`
* `GET /chain/transactions/:transactionHash`
* `GET /chain/elections/:electionId`
* `GET /chain/elections/:electionId/transactions`
* `GET /chain/verify` – per-validator integrity report + consistency check

## API endpoints (validator)

* `GET  /health`
* `GET  /status`
* `GET  /chain` (`/blocks`, `/blocks/:n`, `/blocks/by-hash/:blockHash`, `/transactions/:hash`, `/elections/:id`, `/elections/:id/transactions`, `/verify`)
* `GET  /elections`, `GET /elections/:id`
* `POST /consensus/prepare`
* `POST /consensus/commit`
* `POST /threshold-decryption/share`

---

## Full test flow

The flow below alternates between `gateway-1` and `gateway-2` to
demonstrate that the front-end can use either; PowerShell users can swap
`curl` for `curl.exe` or `Invoke-RestMethod`.

### 1. Start everything

```bash
docker compose up --build
```

### 2. Health-check both gateways and three validators

```bash
curl http://localhost:4001/health
curl http://localhost:4002/health
curl http://localhost:4101/health
curl http://localhost:4102/health
curl http://localhost:4103/health
curl http://localhost:4001/validators/status
```

### 3. Propose an election (AEP) via gateway-1

```bash
curl -X POST http://localhost:4001/elections/proposals \
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
      { "id": "candidate-b", "name": "Candidate B" },
      { "id": "candidate-c", "name": "Candidate C" }
    ],
    "startsAt": "2029-11-10T07:00:00Z",
    "endsAt":   "2029-11-10T21:00:00Z",
    "requiredApprovals": 2
  }'
```

The gateway generates an RSA-OAEP/SHA-256 election key pair at proposal
time. Validators receive and store the private key in their local election
state; clients only fetch the public key.

### 4. Read the election via gateway-2 (proves gateways are interchangeable)

```bash
curl http://localhost:4002/elections/RO-PRESIDENTIAL-2029
```

Fetch the public key that the mobile app will use for digital ID encryption:

```bash
curl http://localhost:4001/elections/RO-PRESIDENTIAL-2029/public-key
```

### 5. Approve with BEC and COURT

```bash
curl -X POST http://localhost:4002/elections/RO-PRESIDENTIAL-2029/approve \
  -H "x-institution-id: BEC"   -H "x-api-key: dev-bec-key"

curl -X POST http://localhost:4001/elections/RO-PRESIDENTIAL-2029/approve \
  -H "x-institution-id: COURT" -H "x-api-key: dev-court-key"
```

### 6. Open the election

```bash
curl -X POST http://localhost:4001/elections/RO-PRESIDENTIAL-2029/open \
  -H "x-api-key: dev-admin-key"
```

### 7. Cast votes

The `encryptedDigitalId` values below must be RSA-OAEP/SHA-256 ciphertexts
created with the election public key. In the mobile app, use
`ElectionKeyService` + `DigitalIdEncryptionService`; for backend smoke
testing, run `node scripts/digital-id-smoke.js` after the services are up.

```bash
# token-001 → candidate-a (CJ-01) via gateway-1
curl -X POST http://localhost:4001/votes -H "Content-Type: application/json" -d '{
  "electionId":"RO-PRESIDENTIAL-2029","districtId":"CJ-01",
  "anonymousTokenHash":"token-hash-001",
  "candidateId":"candidate-a",
  "encryptedDigitalId":"<base64-rsa-oaep-ciphertext-for-RO123456789>",
  "voterProof":"mock-zk-proof","timestamp":"2029-11-10T12:30:00Z"
}'

# token-002 → candidate-b (B-01) via gateway-2
curl -X POST http://localhost:4002/votes -H "Content-Type: application/json" -d '{
  "electionId":"RO-PRESIDENTIAL-2029","districtId":"B-01",
  "anonymousTokenHash":"token-hash-002",
  "candidateId":"candidate-b",
  "encryptedDigitalId":"<base64-rsa-oaep-ciphertext-for-RO987654321>",
  "voterProof":"mock-zk-proof","timestamp":"2029-11-10T13:00:00Z"
}'

# token-003 → candidate-a (CJ-01) via gateway-1
curl -X POST http://localhost:4001/votes -H "Content-Type: application/json" -d '{
  "electionId":"RO-PRESIDENTIAL-2029","districtId":"CJ-01",
  "anonymousTokenHash":"token-hash-003",
  "encryptedVote":"mock-enc:RO-PRESIDENTIAL-2029:[1,0,0]",
  "encryptedDigitalId":"<base64-rsa-oaep-ciphertext-for-RO123456789>",
  "voterProof":"mock-zk-proof","timestamp":"2029-11-10T13:30:00Z"
}'

# token-004 → candidate-c (BV-01) via gateway-2
curl -X POST http://localhost:4002/votes -H "Content-Type: application/json" -d '{
  "electionId":"RO-PRESIDENTIAL-2029","districtId":"BV-01",
  "anonymousTokenHash":"token-hash-004",
  "encryptedVote":"mock-enc:RO-PRESIDENTIAL-2029:[0,0,1]",
  "encryptedDigitalId":"<base64-rsa-oaep-ciphertext-for-RO987654321>",
  "voterProof":"mock-zk-proof","timestamp":"2029-11-10T14:00:00Z"
}'
```

The `candidateId` form is accepted as a convenience for mobile clients and
is normalized by validators into the existing mock encrypted vote format.
Existing `encryptedVote` payloads still work, but they must now also include
`encryptedDigitalId`.

### 7b. Run the encrypted digital ID smoke script

This script covers key generation, encrypt/decrypt, local eligibility JSON,
eligible-voter acceptance, and ineligible-voter rejection through the live
gateway/validator consensus path:

```bash
GATEWAY_BASE=http://localhost:4001 node scripts/digital-id-smoke.js
```

On Windows PowerShell:

```powershell
$env:GATEWAY_BASE = "http://127.0.0.1:4001"
node scripts/digital-id-smoke.js
```

Expected final line:

```text
OK: key generation, encryption/decryption, eligibility, accept, and reject checks passed
```

### 8. Invalid vector `[1,1,0]` is rejected

Use `[1,1,0]` in the `encryptedVote` field to verify vector rejection:

```bash
curl -i -X POST http://localhost:4001/votes -H "Content-Type: application/json" -d '{
  "electionId":"RO-PRESIDENTIAL-2029","districtId":"CJ-01",
  "anonymousTokenHash":"token-hash-005",
  "encryptedVote":"mock-enc:RO-PRESIDENTIAL-2029:[1,1,0]",
  "encryptedDigitalId":"<base64-rsa-oaep-ciphertext-for-RO123456789>",
  "voterProof":"mock-zk-proof","timestamp":"2029-11-10T15:00:00Z"
}'
```

→ HTTP `400` `{"error":"vote vector sum must equal 1; got 2", ...}`

### 9. Duplicate token is rejected

```bash
curl -i -X POST http://localhost:4001/votes -H "Content-Type: application/json" -d '{
  "electionId":"RO-PRESIDENTIAL-2029","districtId":"CJ-01",
  "anonymousTokenHash":"token-hash-001",
  "encryptedVote":"mock-enc:RO-PRESIDENTIAL-2029:[0,1,0]",
  "encryptedDigitalId":"<base64-rsa-oaep-ciphertext-for-RO123456789>",
  "voterProof":"mock-zk-proof","timestamp":"2029-11-10T15:00:00Z"
}'
```

→ HTTP `409` `{"error":"Token already used. Re-voting is not supported.", ...}`

### 10. Freeze the election

```bash
curl -X POST http://localhost:4002/elections/RO-PRESIDENTIAL-2029/freeze \
  -H "x-api-key: dev-admin-key"
```

After this point any new vote returns
`HTTP 400 "election is not OPEN (current: FROZEN)"`.

### 11. Aggregate the tally (status → TALLYING)

```bash
curl -X POST http://localhost:4001/elections/RO-PRESIDENTIAL-2029/tally \
  -H "x-api-key: dev-admin-key"
```

Returns the encrypted aggregate, `totalEncryptedVotes`, and a
`note` explaining that the cleartext tally is **not yet known**:

```json
{
  "electionId": "RO-PRESIDENTIAL-2029",
  "status": "TALLYING",
  "threshold": 2,
  "candidateOrder": ["candidate-a","candidate-b","candidate-c"],
  "encryptedAggregateMock": "mock-enc-aggregate:c1ceb755...",
  "totalEncryptedVotes": 4,
  ...
}
```

A read of the election at this stage will return
`status: "TALLYING"` with `tallyAggregate` set but **no** cleartext
`tally` field.

### 12. Threshold decryption (status → DECRYPTED, cleartext still hidden)

```bash
curl -X POST http://localhost:4001/elections/RO-PRESIDENTIAL-2029/request-threshold-decryption \
  -H "x-api-key: dev-admin-key"
```

The gateway calls `POST /threshold-decryption/share` on every validator,
collects ≥ threshold partial shares, combines them (mock: hash of
sorted shares) and commits an `ELECTION_THRESHOLD_DECRYPTED` block.

A subsequent `GET /elections/RO-PRESIDENTIAL-2029` shows
`status: "DECRYPTED"`, `decryptionMeta` with the shares used, but **still
no** cleartext `tally`. Each validator has computed it privately.

### 13. Finish (status → FINISHED, cleartext published)

```bash
curl -X POST http://localhost:4002/elections/RO-PRESIDENTIAL-2029/finish \
  -H "x-api-key: dev-admin-key"
```

After this point `GET /elections/RO-PRESIDENTIAL-2029` returns the
published tally:

```json
{
  "tally": {
    "finalTallyVector": [2,1,1],
    "totalVotes": 4,
    "perCandidate": [
      { "candidateId":"candidate-a","name":"Candidate A","votes":2 },
      { "candidateId":"candidate-b","name":"Candidate B","votes":1 },
      { "candidateId":"candidate-c","name":"Candidate C","votes":1 }
    ],
    "perDistrict": {
      "CJ-01": { "finalTallyVector":[2,0,0], "totalVotes":2, ... },
      "B-01":  { "finalTallyVector":[0,1,0], "totalVotes":1, ... },
      "BV-01": { "finalTallyVector":[0,0,1], "totalVotes":1, ... }
    },
    ...
  }
}
```

### 14. Verify the chain through both gateways

```bash
curl http://localhost:4001/chain/verify
curl http://localhost:4002/chain/verify
```

Both should return:

```json
{
  "consistent": true,
  "allValid": true,
  "allHeadsMatch": true,
  "perValidator": [
    { "validatorId":"validator-1", "valid":true, "blockCount":13, "head":"…" },
    { "validatorId":"validator-2", "valid":true, "blockCount":13, "head":"…" },
    { "validatorId":"validator-3", "valid":true, "blockCount":13, "head":"…" }
  ]
}
```

### 15. (Bonus) 2-of-3 fault tolerance

Stop validator-3 and propose another election to confirm the system
keeps working:

```bash
docker compose stop validator-3

curl -X POST http://localhost:4001/elections/proposals \
  -H "Content-Type: application/json" \
  -H "x-institution-id: AEP" -H "x-api-key: dev-aep-key" \
  -d '{
    "electionId":"RO-LOCAL-2030","name":"Local","type":"LOCAL",
    "districts":["CJ-01"],
    "candidates":[{"id":"x","name":"X"},{"id":"y","name":"Y"}],
    "startsAt":"2030-01-01T00:00:00Z","endsAt":"2030-01-02T00:00:00Z",
    "requiredApprovals":2
  }'
```

Returns `consensus.ok: true`. The `commit` array shows validator-1 and
validator-2 with `committed: true` and identical `blockHash`; the
validator-3 entry is marked unreachable. Bring it back up later with
`docker compose start validator-3`.

---

## What is mocked vs real

| Concern                    | Prototype                                                                  | Production replacement                                                                   |
|----------------------------|----------------------------------------------------------------------------|------------------------------------------------------------------------------------------|
| Validator identity         | Static env var (`VALIDATOR_PRIVATE_KEY`)                                   | HSM-backed Ed25519 / BLS keypair per institution                                         |
| Validator signatures       | `sha256(VALIDATOR_ID \|\| privKey \|\| canonicalContent)`                  | Real digital signatures, optionally aggregated (BLS) for compact blocks                  |
| Consensus protocol         | 2-phase prepare/commit "agree on payload, then commit" round-trip          | Real BFT (PBFT / HotStuff / Tendermint) with view changes, equivocation handling, etc.   |
| Mempool / batching         | One transaction per block                                                  | Mempool, leader-proposed batches, rate limits                                            |
| Election digital ID key    | RSA-OAEP/SHA-256 key pair generated by the gateway and stored by validators | Distributed Key Generation (Pedersen / Feldman) between validators                       |
| Encrypted digital ID       | Mobile encrypts `digitalId` with election public key; validators decrypt locally | Anonymous credentials / blind signatures / zero-knowledge eligibility checks         |
| Encrypted vote             | `mock-enc:<electionId>:[1,0,0]` or `candidateId` convenience form           | Threshold ElGamal / Paillier ciphertext over a one-hot vote vector                       |
| Homomorphic aggregation    | Sum of mock vectors + opaque hash placeholder                              | Real homomorphic addition of ciphertexts; aggregate stays encrypted                      |
| Threshold decryption       | Each validator returns `sha256(ID \|\| privKey \|\| eid \|\| aggregate)`   | Pedersen-DKG / Shamir threshold ElGamal partial decryption + Lagrange combination        |
| Citizen anonymity / token  | Pre-issued `anonymousTokenHash` from out-of-band                           | zk-SNARK / blind signature based eligibility proofs over a citizen registry              |
| Validator catch-up         | None – a validator that misses commits stays behind                        | Peer sync: validators pull missing blocks on reconnect                                   |
| Storage                    | One JSON file per validator                                                | Append-only log + LSM-tree KV store (LevelDB / RocksDB)                                  |
| Networking / auth          | Header API keys, plain HTTP inside compose                                 | mTLS + signed requests bound to institution identity, gateways behind APIM / Front Door  |

Search the codebase for `TODO:` to see exactly where each replacement plugs in.

---

## Local development (without Docker)

You can also run each service directly with `npm`. Each command goes in
its own terminal.

```bash
# Validator 1
cd ChainBackend/validator
npm install
PORT=4101 VALIDATOR_ID=validator-1 \
VALIDATOR_PRIVATE_KEY=mock-validator-1-key \
CHAIN_STORAGE_PATH=./data/validator-1-chain.json \
CONSENSUS_THRESHOLD=2 \
VALIDATOR_URLS=http://localhost:4101,http://localhost:4102,http://localhost:4103 \
npm run dev

# Validator 2 (same folder, different env)
PORT=4102 VALIDATOR_ID=validator-2 \
VALIDATOR_PRIVATE_KEY=mock-validator-2-key \
CHAIN_STORAGE_PATH=./data/validator-2-chain.json \
CONSENSUS_THRESHOLD=2 \
VALIDATOR_URLS=http://localhost:4101,http://localhost:4102,http://localhost:4103 \
npm run dev

# Validator 3
PORT=4103 VALIDATOR_ID=validator-3 \
VALIDATOR_PRIVATE_KEY=mock-validator-3-key \
CHAIN_STORAGE_PATH=./data/validator-3-chain.json \
CONSENSUS_THRESHOLD=2 \
VALIDATOR_URLS=http://localhost:4101,http://localhost:4102,http://localhost:4103 \
npm run dev

# Gateway 1
cd ChainBackend/gateway
npm install
PORT=4001 GATEWAY_ID=gateway-1 \
VALIDATOR_URLS=http://localhost:4101,http://localhost:4102,http://localhost:4103 \
CONSENSUS_THRESHOLD=2 \
ADMIN_API_KEY=dev-admin-key \
AEP_API_KEY=dev-aep-key BEC_API_KEY=dev-bec-key COURT_API_KEY=dev-court-key \
npm run dev

# Gateway 2
PORT=4002 GATEWAY_ID=gateway-2 \
VALIDATOR_URLS=http://localhost:4101,http://localhost:4102,http://localhost:4103 \
CONSENSUS_THRESHOLD=2 \
ADMIN_API_KEY=dev-admin-key \
AEP_API_KEY=dev-aep-key BEC_API_KEY=dev-bec-key COURT_API_KEY=dev-court-key \
npm run dev
```

(PowerShell users: prefix env vars with `$env:NAME = 'value'` on
separate lines instead of inline assignments.)
