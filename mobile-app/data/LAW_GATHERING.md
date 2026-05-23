# Law gathering logic

How CivicAI collects **laws in force**, **bills in progress**, and **vote/consultation dates** into `news-items.json` / `law-items.json` (via local n8n Docker, or manual curation for demo).

The mobile app only needs normalized `FeedItem` rows. This document defines **what to fetch**, **how to classify it**, and **how to map it**.

---

## 1. What we collect

| `entityType` | Meaning | Typical source |
|--------------|---------|----------------|
| `law` | Act in force (promulgated / published) | EUR-Lex, Monitorul Oficial, legislatie.just.ro |
| `bill` | Proposal not yet final law | EP OEIL, Camera Deputaților PL-x, Senat |
| `vote` | Scheduled or completed vote event | EP plenary calendar, chamber agendas |
| `local_official` | HCL, consultation, council decision | Primăria, local gazette |

**Out of scope for law pipeline (separate news pipeline):** `news`, `party_program`, `politician_stance` — unless tied to a specific bill/law id.

---

## 2. Pipeline stages

```
Source → Extract raw record → Normalize → Dedupe by id → Enrich (summary/tags) → Merge into feed-items.json
```

| Stage | Owner | Output |
|-------|--------|--------|
| Extract | n8n HTTP/RSS/HTML node | Raw fields (title, url, date, stage, external id) |
| Normalize | n8n Code node | `FeedItem` draft matching schema |
| Dedupe | n8n + store | Skip or update if `id` exists |
| Enrich | n8n LLM node (optional) | `summary`, `tags`, `importance`, `actionPossible` |
| Merge | n8n | Write `items[]` to JSON or POST ingest |

**Demo shortcut:** skip Extract automation; humans fill rows using rules below.

---

## 3. Stable IDs

IDs must not change when title wording changes.

| Level | Pattern | Example |
|-------|---------|---------|
| EU law | `eu-celex-{CELEX}` | `eu-celex-32024R1689` |
| EU procedure | `eu-proc-{YEAR}-{NUM}` | `eu-proc-2023-0089` |
| RO law | `ro-law-{MO-number}` or `ro-law-{legislatie-id}` | `ro-law-2026-0452` |
| RO bill | `ro-plx-{chamber}-{number}` | `ro-plx-cdep-123-2026` |
| Local | `local-{city}-{type}-{year}-{slug}` | `local-cluj-hcl-2026-bike-lanes` |

---

## 4. Field mapping rules

### Required (schema)

| Field | Rule |
|-------|------|
| `title` | Official or short official title; never empty |
| `link` | Canonical public URL (EUR-Lex, cdep project page, MO PDF landing page) |
| `description` | 1–3 sentences raw context (RO/HU/EN ok); becomes LLM input |
| `publishedAt` | ISO 8601 — date published, filed, or last official update |
| `source` | Human name from `law-sources.json` |
| `sourceId` | Machine id from `law-sources.json` |
| `level` | `EU` \| `Romania` \| `Local` |
| `sourceLang` | `en` \| `ro` \| `hu` |

### Law-specific

| Field | Rule |
|-------|------|
| `entityType` | See §1 |
| `voteDate` | Set when a **confirmed or official tentative** vote/deadline exists; else omit |
| `actionPossible` | `true` if citizen can still act (see §6) |
| `importance` | Rule-based first (§7), LLM may adjust ±1 |
| `tags` | Always include level tag (`#EU`, `#Romania`, `#Cluj`) + topic + type tag |
| `summary` | English, 2–3 sentences for app display |

---

## 5. Sources and gather strategy

See **`law-sources.json`** for the full registry. Summary:

### EU

| sourceId | What to gather | Method | Cadence |
|----------|----------------|--------|---------|
| `eur-lex` | In-force regulations/directives (recent + bookmarked key acts) | SPARQL or search URL → metadata only for feed | Weekly |
| `ep-oeil` | Ongoing procedures, stage, rapporteur, next vote | Scrape procedure list + detail page | Daily |
| `ep-plenary` | Plenary vote calendar | Scrape agenda / PDF links | Weekly |

### Romania

| sourceId | What to gather | Method | Cadence |
|----------|----------------|--------|---------|
| `legislatie-just` | Consolidated laws (reference links for `law`) | Search by keyword / known act numbers | Weekly |
| `monitorul-oficial` | Newly promulgated acts | Index page → MO number + title + link | Daily |
| `cdep-plx` | Active PL-x at Camera | `cdep.ro/pls/legis/` listing by status | Daily |
| `senat-plx` | Active projects at Senat | senat.ro projects listing | Daily |

### Local (Cluj first)

| sourceId | What to gather | Method | Cadence |
|----------|----------------|--------|---------|
| `primaria-cluj` | HCL drafts, public consultations | Site news / transparency section | Weekly |
| `cluj-local-gazette` | Published local decisions | If available; else primaria only | Weekly |

**Do not scrape full legal text into the feed.** Store only title, link, status, dates. Full text is a future `law-documents` collection for the AI agent.

---

## 6. `actionPossible` logic

Set `true` when **any** of:

- Public consultation open (deadline in future)
- Bill in committee with published call for opinions
- Plenary/chamber vote scheduled within 90 days
- Petition or civic hearing announced on official page

Set `false` when:

- Law already in force with no open consultation
- Bill rejected / withdrawn / fully adopted with no further citizen step
- Pure informational record (e.g. MEP aggregate vote from past)

---

## 7. `importance` rules (before LLM)

| Score | Condition |
|-------|-----------|
| 5 | Plenary vote ≤ 14 days, or national budget / electoral / fundamental-rights bill |
| 4 | Active bill in final reading, or major law promulgated this week |
| 3 | Default bill in committee, local HCL with moderate impact |
| 2 | Technical amendment, older law reference update |
| 1 | Archive / historical reference only |

---

## 8. Tag assignment

Always add **one level tag**: `#EU`, `#Romania`, or `#Cluj`.

Add **one type tag** from:

- `#law-in-force`
- `#bill-proposal`
- `#vote-upcoming`
- `#local-decision`
- `#consultation`

Add **0–2 topic tags** from app topic list (`#healthcare`, `#taxation`, …) based on subject.

---

## 9. n8n automation

Implemented under **`mobile-app/n8n/`**:

- Docker Compose: n8n + ingest API
- Workflows: EP Think Tank (EU), Camera Deputatilor (RO), G4Media law filter (RO)
- Ingest: `POST http://feed-api:3001/api/ingest/raw`

See [../n8n/README.md](../n8n/README.md) for local Docker setup.

```
Source → n8n extract → POST /api/ingest/raw → normalize.js → feed-items.json
```

---

## 10. MVP scope (first automation)

Implement in this order:

1. **cdep-plx** — active projects list → `bill` items (highest judge credibility for RO)
2. **ep-oeil** — 5–10 ongoing EU procedures → `bill`
3. **monitorul-oficial** — last 7 days promulgations → `law`
4. Local consultations when time allows

Each workflow output must pass `schemas/feed-item.schema.json` validation before merge.

---

## 11. Validation checklist (per item)

- [ ] `id` stable and unique
- [ ] `link` opens official page
- [ ] `entityType` matches content
- [ ] `voteDate` only if sourced from official calendar
- [ ] `actionPossible` follows §6
- [ ] `summary` in English, no hallucinated dates
- [ ] Tags include level + type

---

## Related files

| File | Purpose |
|------|---------|
| `law-sources.json` | Source registry + gather metadata for n8n |
| `schemas/feed-item.schema.json` | Output shape for app |
| `feed-items.json` | Merged feed consumed by Flutter |
