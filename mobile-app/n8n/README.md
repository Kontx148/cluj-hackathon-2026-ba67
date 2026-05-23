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

Each workflow POSTs to `POST /api/ingest/raw` with `category: law` or `category: news`. Ingest merges by item `id`.

---

## Quick start

```bash
cd mobile-app/n8n
cp .env.example .env
docker compose up -d
```

1. **http://localhost:5678** → import workflows from `workflows/`
2. Execute each active workflow once → toggle **Active**
3. `curl http://localhost:3001/api/feed | head -c 400`
4. Rebuild app: `cd .. && flutter build ios --release && flutter install --release`

---

## Law workflows → `law-items.json` (2)

| File | Source | Fetch |
|------|--------|-------|
| `civicai-senat-romania.json` | [senat.ro/legiproiect](https://www.senat.ro/legiproiect.aspx) | `GET /api/fetch/senat` (~68 bills in consultation) |
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
