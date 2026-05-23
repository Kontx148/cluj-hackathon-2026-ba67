# Optional dev tools (not required to run the app)

The Flutter app loads `data/feed-items.json` from **bundled assets** by default.

Use `feed-api/` only when you want:

- n8n to `POST /api/ingest/feed` during development
- hot reload of JSON without rebuilding the app (`flutter run --dart-define=API_BASE=http://...`)

```bash
cd mobile-app/tools/feed-api && npm install && npm start
```
