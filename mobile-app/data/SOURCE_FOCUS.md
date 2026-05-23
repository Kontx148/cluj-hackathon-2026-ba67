# CivicAI content focus

Ingest merges everything into one JSON file per type (`law-items.json` or `news-items.json`), deduping by item `id`.

**Source registry (machine-readable):** [source-registry.json](./source-registry.json)

## Active n8n workflows

| Type | Count | App tab | Target file |
|------|-------|---------|-------------|
| **Law** | **2** | Upcoming votes | `law-items.json` |
| **News** | **3** | Civic news | `news-items.json` |

See [../n8n/README.md](../n8n/README.md) for the full workflow list.

| Pillar | Sources |
|--------|---------|
| **Upcoming votes** | Senat, Camera Deputaților |
| **Romanian civic news** | G4Media, Digi24 |
| **Local civic news (Cluj)** | Maszol |

One n8n workflow per source. Activate the ones you need — they all POST to the same ingest endpoint.

---

## 1. Upcoming votes (2 law workflows)

**Goal:** National bills in **public consultation** or still to be **voted on**.

| Source | Access | Workflow |
|--------|--------|----------|
| [Senat — legiproiect](https://www.senat.ro/legiproiect.aspx) | `GET /api/fetch/senat` | `civicai-senat-romania.json` |
| [Camera Deputaților](https://www.cdep.ro/) | `GET /api/fetch/cdep` | `civicai-cdep-romania.json` |

**Ingest:** `category: law` · Tags: `#vote-upcoming`, `#consultation`

---

## 2. Romanian civic news (2 news workflows)

**Goal:** National stories that affect **daily life** (taxes, health, jobs, housing, energy…).

| Source | RSS | Workflow |
|--------|-----|----------|
| G4Media | `https://www.g4media.ro/feed` | `civicai-g4media-ro-civic.json` |
| Digi24 | `https://www.digi24.ro/rss` | `civicai-digi24-ro-civic.json` |

**Filter:** [civic-keywords.json](./civic-keywords.json) → `romaniaNational`

**Ingest:** `category: news`, `level: Romania`, `sourceLang: ro`

---

## 3. Local civic news — Cluj area (1 news workflow)

**Goal:** Council, transport, schools, housing, community news.

| Source | RSS | Workflow |
|--------|-----|----------|
| Maszol | `https://maszol.ro/rss` | `civicai-maszol-local-civic.json` |

**Filter:** [civic-keywords.json](./civic-keywords.json) → `localCluj`

**Ingest:** `category: news`, `level: Local`, `sourceLang: ro`

---

## Adding another source

1. Add an entry to [source-registry.json](./source-registry.json)
2. Duplicate a workflow JSON in `n8n/workflows/`, change RSS URL or fetch path + `sourceId`
3. Import workflow → Execute → Active
4. Rebuild the Flutter app

---

## Pipeline

```
Law source  ──┐
Law source  ──┼→ n8n → POST /api/ingest/raw → law-items.json
News source ──┘                          └→ news-items.json
```

See [../tools/feed-api/README.md](../tools/feed-api/README.md).
