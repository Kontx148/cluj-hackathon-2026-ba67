# Cursor prompt — paste into chat

Rebuild the **CivicAI** app in **Flutter** using specs under `mobile-app/design/`.

**Read these files in order:**

1. `DESIGN.md` — product, tokens, layout, screens, behavior
2. `FLUTTER_SPEC.md` — packages, widget tree, file layout
3. `STRINGS.json` — English UI copy
4. `screens/*.png` — visual reference

**Requirements:**

- Match screenshots closely; mobile-first
- Responsive card grid: 1 / 2 / 3 columns
- English UI only
- Feed from `services/feed-api` (dummy data until n8n ingest)
- Clean structure: models / services / screens / widgets

**Out of scope for now:**

- Voting system
- Database
- Authentication

Start with `main.dart`, `theme.dart`, and `FeedScreen`, then add components incrementally.
