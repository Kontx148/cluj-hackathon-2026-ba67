# CivicAI n8n automation

Docker Compose stack: **n8n** (workflows) + **feed-api** (ingest listener). Workflows fetch civic data and **POST** it to the ingest API, which writes `news-items.json` and `law-items.json`.

**Full ingest flow, security model, and API reference:** [../tools/feed-api/README.md](../tools/feed-api/README.md)

---

## Architecture (summary)

```
External sources (Senat, RSS)
        ↓
   n8n workflow (trigger: schedule or manual)
        ↓
   POST http://feed-api:3001/api/ingest/raw
   Header: X-Ingest-Key
        ↓
   feed-api → normalize → merge → JSON on disk
        ↓
   Flutter app (bundled JSON at build time)
```

| Service | URL (local) |
|---------|-------------|
| n8n UI | http://localhost:5678 |
| feed-api | http://localhost:3001 |

Inside Docker, workflows use **`http://feed-api:3001`** (not `localhost`).

---

## Quick start

```bash
cd mobile-app/n8n
cp .env.example .env    # set N8N_BASIC_AUTH_PASSWORD + INGEST_API_KEY
```

**If `docker compose up` fails with `error getting credentials` (Mac):**

```bash
docker pull node:20-alpine
docker pull docker.n8n.io/n8nio/n8n:latest
docker compose up -d
```

Or remove `"credsStore": "desktop"` from `~/.docker/config.json` and restart Docker Desktop.

**If port 3001 is in use:** `lsof -ti:3001 | xargs kill` or `docker compose down`.

```bash
docker compose up -d
```

1. Open **http://localhost:5678** (basic auth from `.env`)
2. **Workflows → Import from file** — import all JSON in `workflows/`
3. **Execute workflow** on each (test) → toggle **Active**

Verify:

```bash
curl http://localhost:3001/api/health
curl http://localhost:3001/api/feed | head -c 400
ls -la ../data/news-items.json ../data/law-items.json
```

Rebuild the Flutter app so the phone picks up new JSON:

```bash
cd .. && flutter build ios --release && flutter install --release
```

---

## Workflows

| File | Source | Category | Output file |
|------|--------|----------|-------------|
| `civicai-senat-romania.json` | Senat via `/api/fetch/senat` | `law` | `law-items.json` |
| `civicai-g4media-law.json` | G4Media RSS (law keywords) | `news` | `news-items.json` |
| `civicai-ep-thinktank.json` | EP Think Tank RSS | `news` | `news-items.json` |

Each workflow’s last node POSTs to `/api/ingest/raw` with `X-Ingest-Key` matching `INGEST_API_KEY` in `.env`.

---

## Environment (`.env`)

| Variable | Purpose |
|----------|---------|
| `INGEST_API_KEY` | Shared secret for ingest POSTs (feed-api + workflow headers) |
| `N8N_BASIC_AUTH_PASSWORD` | n8n UI login |
| `N8N_HOST` / `WEBHOOK_URL` | Use `localhost` for local Docker |

---

## Run feed-api without Docker

See [../tools/feed-api/README.md](../tools/feed-api/README.md#run-locally).

---

## Optional: LLM enrichment

Add an n8n **OpenAI** or **HTTP Request** node before ingest to fill `summary`, `tags`, and `importance`. Pass through `records[].summary` — normalize uses it when present.
