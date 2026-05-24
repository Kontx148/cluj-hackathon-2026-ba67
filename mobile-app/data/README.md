# Mobile app data

JSON feed files bundled into the Flutter app. Updated by **feed-api ingest** (via n8n) or by hand.

**How ingest writes these files:** [../tools/feed-api/README.md](../tools/feed-api/README.md)

---

## Files

| File | Purpose |
|------|---------|
| `news-items.json` | News section — politician stances, party programs, RSS news |
| `law-items.json` | Laws section — bills, laws, consultations (incl. Senat ingest) |
| `law-sources.json` | Registry of official sources (documentation; **not enforced** at ingest) |
| `source-registry.json` | **All sources by pillar** — multiple sources per purpose |
| `SOURCE_FOCUS.md` | Product focus and workflow mapping |
| `civic-keywords.json` | Regex filters for n8n news workflows |
| `feed-items.json` | Legacy combined feed (superseded by news + law split) |
| `LAW_GATHERING.md` | ID rules, importance, `actionPossible`, pipeline notes |
| `schemas/feed-item.schema.json` | Shape consumed by the Flutter app |
| `schemas/raw-law-record.schema.json` | Shape n8n sends to `/api/ingest/raw` |

---

## How data gets here

```
n8n workflow → POST /api/ingest/raw → feed-api → news-items.json | law-items.json
```

| `category` in ingest POST | Written to | Active workflows |
|---------------------------|------------|------------------|
| `law` | `law-items.json` | **2** — Senat, Camera Deputaților |
| `news` | `news-items.json` | **3** — G4Media, Digi24, Maszol |

Full list: [../n8n/README.md](../n8n/README.md) · [source-registry.json](./source-registry.json)

Merge is by item `id` — re-ingest updates existing rows, does not duplicate.

---

## Phone app vs disk

| Mode | Behaviour |
|------|-----------|
| **Default (release build)** | App reads **bundled** copies of `news-items.json` + `law-items.json` from the last `flutter build`. Refresh in-app reloads the same bundle. |
| **Live API (`API_BASE`)** | App calls `GET /api/feed` on feed-api — see [mobile README](../README.md). |

After n8n updates files on disk, run a **new release build** unless using `API_BASE`.

---

## Manual edit

You can edit `news-items.json` / `law-items.json` directly, then rebuild the app. Each item should match [feed-item.schema.json](./schemas/feed-item.schema.json).

Required fields include `sourceLang` (`en` | `ro`) — the app filters by selected language.

---

## Ingest without n8n

```bash
curl -X POST http://localhost:3001/api/ingest/raw \
  -H "Content-Type: application/json" \
  -H "X-Ingest-Key: civicai-dev-key" \
  -d '{"category":"law","records":[{"sourceId":"senat-plx","title":"Test","detailUrl":"https://example.com","publishedAt":"2026-05-23T12:00:00Z"}]}'
```

Requires feed-api running (`docker compose up -d` in `n8n/`).
