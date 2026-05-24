# CivicAI n8n automation

Docker Compose: **n8n** + **feed-api**. Workflows fetch civic data and merge into JSON under `mobile-app/data/`.

**Sources registry:** [../data/source-registry.json](../data/source-registry.json)  
**Content focus:** [../data/SOURCE_FOCUS.md](../data/SOURCE_FOCUS.md)  
**Ingest API:** [../tools/feed-api/README.md](../tools/feed-api/README.md)

---

## Workflow inventory

| Type | Count | Target file | Workflows |
|------|-------|-------------|-----------|
| **Law** | **2** | `law-items.json` | Senat, Camera Deputaților |
| **News** | **3** | `news-items.json` | G4Media, Digi24, Maszol |
| **Paused** | 1 | — | EP Think Tank (EU; do not activate) |

**Total in `workflows/`:** 6 JSON files — import the **5 active** ones (2 law + 3 news).

Each workflow POSTs to `POST /api/ingest/raw` with `category: law` or `category: news`. Law feeds **replace** on each run; news **merge** by item `id`.

**CI deploy:** GitHub Actions only re-imports workflows when JSON files under `workflows/` change (or when you run deploy manually with **Import n8n workflows** checked). Pushes that only touch code/backend will **not** overwrite live n8n workflows.

---

## Quick start

```bash
cd mobile-app/n8n
cp .env.example .env
# Edit .env locally — Vertex AI + gcp-service-account.json (never commit; both gitignored)
docker compose up -d
```

**API keys stay off GitHub.** Docker reads secrets from your local `.env` file (`env_file` in `docker-compose.yml`) or from your shell:

```bash
export GCP_PROJECT_ID='your-project'
# Place service account JSON at mobile-app/n8n/gcp-service-account.json
docker compose up -d
```

Only `.env.example` (local) and `.env.deploy.example` (VPS) are in the repo — not your real `.env`.

### Deploy on VPS (165.232.67.137)

```bash
cd mobile-app/n8n
cp .env.deploy.example .env
nano .env   # GCP_PROJECT_ID + strong passwords; copy gcp-service-account.json into n8n/
docker compose up -d
```

| URL | Purpose |
|-----|---------|
| http://165.232.67.137:5678 | n8n UI |
| http://165.232.67.137:3001/api/feed | feed-api (Flutter `API_BASE`) |
| http://165.232.67.137:3001/api/health | health check |

**Flutter release APK** (phone talks to the server):

```bash
flutter build apk --release --dart-define=API_BASE=http://165.232.67.137:3001
```

Open ports on the droplet firewall: **3001**, **5678** (or put nginx + HTTPS in front later).

**CI/CD:** see [DEPLOY_CI.md](./DEPLOY_CI.md) for GitHub Actions setup (secrets, SSH, auto-deploy on push to `main`).

Workflow JSON still uses `http://feed-api:3001` between containers — leave that as-is.

1. **http://localhost:5678** (local) or **http://165.232.67.137:5678** (VPS) → import workflows
2. Execute each active workflow once → toggle **Active**
3. `curl http://localhost:3001/api/feed | head -c 400`
4. Rebuild app: `cd .. && flutter build ios --release && flutter install --release`

---

## Law workflows → `law-items.json` (2)

| File | Source | Fetch |
|------|--------|-------|
| `civicai-senat-romania.json` | [senat.ro/legiproiect](https://www.senat.ro/legiproiect.aspx) | Fetch → **feed-api Gemini simplify** → ingest |

**Senat simplify:** `POST /api/simplify/records` via **Vertex AI** (Gemini on GCP). Fetches **5 bills max** per run (`SENAT_FETCH_LIMIT=5`). Romanian `plain_summary` + English `plain_summary_en`. Verify: `curl http://localhost:3001/api/health/llm`.

| `civicai-cdep-romania.json` | [cdep.ro](https://www.cdep.ro/) | `GET /api/fetch/cdep` (best-effort; may return no records) |

---

## News workflows → `news-items.json` (3)

| File | Source | Level |
|------|--------|-------|
| `civicai-g4media-ro-civic.json` | [G4Media RSS](https://www.g4media.ro/feed) | Romania |
| `civicai-digi24-ro-civic.json` | [Digi24 RSS](https://www.digi24.ro/rss) | Romania |
| `civicai-maszol-local-civic.json` | [Maszol RSS](https://maszol.ro/rss) | Local (Cluj area) |

RSS workflows filter items with civic keywords — see [snippets/rss-civic-filter.js](./snippets/rss-civic-filter.js).

---

## Paused (not in current focus)

| File | Note |
|------|------|
| `civicai-ep-thinktank.json` | EU news — out of RO/local scope; leave inactive |

---

## Add a source

1. Register in [source-registry.json](../data/source-registry.json)
2. Duplicate an RSS workflow (news) or a fetch workflow (law), edit URL + `sourceId`
3. Import → Execute → Active → rebuild the Flutter app
