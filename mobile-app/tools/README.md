# Optional dev tools

| Path | Purpose |
|------|---------|
| [feed-api/](./feed-api/) | Ingest API — listens on port 3001, writes `../data/news-items.json` and `law-items.json` |
| [../n8n/](../n8n/) | Docker Compose (n8n + feed-api) + importable workflows |

**Canonical ingest documentation:** [feed-api/README.md](./feed-api/README.md)

---

## Quick start (Docker)

```bash
cd mobile-app/n8n
cp .env.example .env
docker compose up -d
```

Import workflows from `n8n/workflows/`, execute, then rebuild the Flutter app.

---

## feed-api only (no Docker)

```bash
cd mobile-app/tools/feed-api
npm install
INGEST_API_KEY=civicai-dev-key MOBILE_APP_DATA_DIR=../../data npm start
```

See [feed-api/README.md](./feed-api/README.md) for endpoints and security notes.
