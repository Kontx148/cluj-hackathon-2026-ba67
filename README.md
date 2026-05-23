# cluj-hackathon-2026-ba67

Built for Cluj Hackathon 2026.

## Election Chain Backend

The permissioned, blockchain-style election chain backend lives in
[`ChainBackend/`](./ChainBackend/). It is a self-contained Docker Compose
project with **5 services**: 2 stateless gateways and 3 validators that
each persist their own copy of the chain. Writes go through a 2-of-3
consensus. Election proposals generate an RSA election key pair; mobile
clients fetch the public key and submit only encrypted digital IDs.

To run it:

```bash
cd ChainBackend
docker compose up --build
```

* `gateway-1`   → http://localhost:4001
* `gateway-2`   → http://localhost:4002
* `validator-1` → http://localhost:4101
* `validator-2` → http://localhost:4102
* `validator-3` → http://localhost:4103

See [`ChainBackend/README.md`](./ChainBackend/README.md) for the full API
reference, environment variables, and an end-to-end test flow with `curl`
(propose → approve → open → vote → freeze → tally → threshold-decrypt →
finish → verify).
