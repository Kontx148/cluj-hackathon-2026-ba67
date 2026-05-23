# Mobile app data

JSON files bundled into the Flutter app and updated by **n8n** (or edited by hand).

| File | Purpose |
|------|---------|
| `feed-items.json` | Feed items (dummy seed today) |
| `sources.json` | Source catalog for future RSS/API wiring |
| `schemas/feed-item.schema.json` | JSON Schema for n8n mapping |

## Ingest

- **API (optional):** `POST http://localhost:3001/api/ingest/feed` when `tools/feed-api` is running
- **Direct:** edit `feed-items.json` on disk

English `summary` field is shown in the app.
