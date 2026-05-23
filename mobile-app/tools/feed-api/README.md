# CivicAI feed-api (ingest service)

Node.js / Express service that **listens for HTTP requests**, normalizes civic feed records, and **writes JSON files on disk**. n8n workflows are the primary callers.

See also: [n8n README](../../n8n/README.md) (Docker + workflows), [data README](../../data/README.md) (JSON files), [LAW_GATHERING.md](../../data/LAW_GATHERING.md) (field mapping rules).

---

## End-to-end flow

```
┌─────────────────┐     schedule / manual      ┌──────────────────┐
│  External web   │ ◄──────────────────────────│  n8n workflow    │
│  Senat, RSS…    │                            │  (Docker)        │
└────────┬────────┘                            └────────┬─────────┘
         │ fetch / scrape                               │
         │                                              │ POST /api/ingest/raw
         │                                              │ Header: X-Ingest-Key
         ▼                                              ▼
┌────────────────────────────────────────────────────────────────────┐
│  feed-api (port 3001) — always listening while Docker is up        │
│  1. checkIngestKey()                                               │
│  2. normalizeRecords()  ← tools/feed-api/normalize.js              │
│  3. mergeFeedItems()     ← dedupe by id, sort by publishedAt       │
│  4. writeNewsFeed() / writeLawFeed()                               │
└───────────────────────────────┬────────────────────────────────────┘
                                │
                                ▼
              mobile-app/data/news-items.json
              mobile-app/data/law-items.json
                                │
                                │ bundled at build time (default)
                                ▼
                        Flutter app (iPhone)
```

**Important:** n8n does **not** edit JSON directly. It **POSTs** to feed-api; feed-api writes the files.

The iPhone app does **not** auto-sync. After n8n updates the JSON on disk, rebuild the app (or use `API_BASE` for a live feed — see [mobile README](../../README.md#optional-remote-feed-api-n8n)).

---

## Docker wiring

From `mobile-app/n8n/docker-compose.yml`:

| Container | Host port | Role |
|-----------|-----------|------|
| `feed-api` | 3001 | Ingest + read API |
| `n8n` | 5678 | Workflow UI + scheduler |

Volumes:

```yaml
../tools/feed-api:/app    # API code
../data:/data             # JSON output (MOBILE_APP_DATA_DIR=/data)
```

Inside Docker, n8n calls **`http://feed-api:3001`** (Docker network name, not `localhost`).

---

## Who calls what

| Caller | Can write JSON? | How |
|--------|-----------------|-----|
| n8n workflows | Yes | `POST /api/ingest/raw` with `X-Ingest-Key` |
| curl / script on your Mac | Yes | Same POST if port 3001 reachable + valid key |
| Flutter app (default) | No | Reads bundled assets only |
| Flutter app (`API_BASE` set) | No | `GET /api/feed` read-only |
| Anyone without the key | No | `401 Invalid or missing X-Ingest-Key` |

Ingest is a **listener**; workflows are **callers**.

---

## Security model (current)

### What is protected

- **`POST /api/ingest/raw`** and **`POST /api/ingest/feed`** require header:
  ```
  X-Ingest-Key: <INGEST_API_KEY>
  ```
- Key is set in `mobile-app/n8n/.env` and passed into the `feed-api` container.

### What is not protected (honest limits)

| Gap | Detail |
|-----|--------|
| **Known default key** | Repo uses `civicai-dev-key` in `.env.example` and workflow JSON — change for anything beyond local dev |
| **No source whitelist** | Ingest does **not** verify `sourceId` against `law-sources.json`. Anyone with the key can POST arbitrary `sourceId` values |
| **No workflow verification** | `meta.workflow` is stored but not enforced |
| **Open read API** | `GET /api/feed` has no auth |
| **Port exposure** | Docker publishes `3001` on the host — reachable on your LAN unless firewalled |
| **Empty key bypass** | If `INGEST_API_KEY` is unset, ingest accepts all POSTs |

### Recommended for local dev

1. Set a strong `INGEST_API_KEY` in `n8n/.env`
2. Update the `X-Ingest-Key` header in each workflow (or re-import workflows after changing the key)
3. Do not expose port 3001 beyond your machine

`law-sources.json` is a **registry / documentation** of intended sources — not enforced at ingest time today.

---

## API reference

### Read (no auth)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Service status + data file paths |
| GET | `/api/feed` | Combined news + law items. Query: `level`, `entityType`, `category` (`news`\|`law`), `lang` (`en`\|`ro`) |
| GET | `/api/fetch/senat` | Fetch + parse Senat public consultation HTML → `{ records: [...] }` (~68 bills) |
| GET | `/api/fetch/cdep` | Camera Deputatilor listing (may 404 if URL changes) |
| GET | `/api/fetch/primaria-cluj` | Cluj-Napoca public consultations RSS → `{ records: [...] }` |

### Write (requires `X-Ingest-Key`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/ingest/raw` | **Main n8n endpoint** — normalize + merge records |
| POST | `/api/ingest/feed` | Replace entire news or law file |

### POST `/api/ingest/raw`

```http
POST /api/ingest/raw
X-Ingest-Key: civicai-dev-key
Content-Type: application/json
```

```json
{
  "category": "law",
  "records": [
    {
      "sourceId": "senat-plx",
      "level": "Romania",
      "sourceLang": "ro",
      "entityType": "bill",
      "title": "B123 / 2026 — …",
      "detailUrl": "https://www.senat.ro/…",
      "description": "…",
      "publishedAt": "2026-05-23T12:00:00Z"
    }
  ],
  "meta": { "workflow": "senat-plx" }
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `records` | Yes | Array of raw records ([schema](../../data/schemas/raw-law-record.schema.json)) |
| `category` | No | `"news"` or `"law"` — selects output file. Inferred from records if omitted |
| `meta` | No | Stored in file `meta` (e.g. workflow name, timestamp) |

**Merge behaviour:** items are keyed by normalized `id`. Same id → update; new id → append. Sorted by `publishedAt` descending.

**Output files:**

| `category` | File |
|------------|------|
| `law` | `data/law-items.json` |
| `news` | `data/news-items.json` |

Normalization logic: [normalize.js](./normalize.js).

Romanian law items are auto-translated to English on ingest (`title_en` + `summary`) via [translate.js](./translate.js) (MyMemory API + legal phrase map). To refresh bundled JSON:

```bash
cd mobile-app/tools/feed-api
npm run translate-laws
```

---

## Run locally

### With Docker (recommended)

```bash
cd mobile-app/n8n
cp .env.example .env
docker compose up -d
curl http://localhost:3001/api/health
```

### Without Docker

```bash
cd mobile-app/tools/feed-api
npm install
INGEST_API_KEY=civicai-dev-key MOBILE_APP_DATA_DIR=../../data npm start
```

Point n8n HTTP nodes to `http://localhost:3001` instead of `http://feed-api:3001`.

---

## Workflow → file mapping

**Active workflows:** **2 law** → `law-items.json`, **3 news** → `news-items.json` (see [n8n/README.md](../../n8n/README.md)).

| Workflow | Fetch step | Ingest `category` | Writes to |
|----------|------------|-------------------|-----------|
| `civicai-senat-romania.json` | `GET /api/fetch/senat` | `law` | `law-items.json` |
| `civicai-cdep-romania.json` | `GET /api/fetch/cdep` | `law` | `law-items.json` |
| `civicai-g4media-ro-civic.json` | G4Media RSS | `news` | `news-items.json` |
| `civicai-digi24-ro-civic.json` | Digi24 RSS | `news` | `news-items.json` |
| `civicai-maszol-local-civic.json` | Maszol RSS | `news` | `news-items.json` |

**Paused:** `civicai-ep-thinktank.json` (EU news — not in current focus).

**Fetch helper without bundled workflow:** `GET /api/fetch/primaria-cluj` (Cluj public consultations) — add a workflow if you want it ingested automatically.

---

## After ingest: getting data on the phone

1. n8n runs → JSON updated on disk under `mobile-app/data/`
2. Rebuild and reinstall the app:

```bash
cd mobile-app
flutter build ios --release
flutter install --release
```

Or build with live API (Mac + Docker must stay running, same Wi‑Fi):

```bash
flutter build ios --release --dart-define=API_BASE=http://<your-mac-lan-ip>:3001
```

---

## Add a new source

1. Register in [law-sources.json](../../data/law-sources.json)
2. Duplicate a workflow in `n8n/workflows/`, adjust extract logic
3. POST to `/api/ingest/raw` with the correct `category`
4. Optional: add a fetch helper in [index.js](./index.js) (like `/api/fetch/senat`)

---

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | HTTP port |
| `MOBILE_APP_DATA_DIR` | `../../data` | Directory for `news-items.json` / `law-items.json` |
| `INGEST_API_KEY` | *(empty = no auth)* | Required secret for POST ingest endpoints |

See [.env.example](./.env.example).
