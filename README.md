# cluj-hackathon-2026-ba67

Built for Cluj Hackathon 2026.

## Election Chain Backend

The permissioned, blockchain-style election chain backend lives in
[`ChainBackend/`](./ChainBackend/). It is a self-contained Docker Compose
project with three services: `chain-backend`, `validator-1`, and
`validator-2`.

To run it:

```bash
cd ChainBackend
docker compose up --build
```

See [`ChainBackend/README.md`](./ChainBackend/README.md) for the full API
reference, environment variables, and an end-to-end test flow with `curl`.
