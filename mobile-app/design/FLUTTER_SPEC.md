# CivicAI — Flutter Implementation Spec

> Widget tree, theme, and package notes. Use with `design/DESIGN.md` under `mobile-app/`.

## 1. Packages (`pubspec.yaml`)

```yaml
dependencies:
  flutter:
    sdk: flutter
  go_router: ^14.0.0
  http: ^1.2.0
  flutter_riverpod: ^2.5.0
  url_launcher: ^6.2.5
  shadcn_ui: ^0.17.0   # optional shadcn-style widgets
  intl: ^0.19.0
```

## 2. Theme

See `lib/theme.dart` and the token table in `DESIGN.md`.

## 3. Routes (`go_router`)

- `/` → `FeedScreen` (MVP)
- Later: `/article/:id`, `/vote`, `/laws`

## 4. Widget tree

```
MaterialApp
└─ FeedScreen
   ├─ Header (eyebrow, title, tagline, refresh)
   ├─ Level filter chips
   └─ News cards (list / responsive grid)
```

## 5. State (Riverpod — optional)

```dart
final feedProvider = FutureProvider<List<FeedItem>>((ref) {
  return FeedService().fetchFeed();
});
```

## 6. API

Feed JSON from `services/feed-api` (`GET /api/feed`). Configure base URL via `--dart-define=API_BASE=...`.

## 7. File layout

```
lib/
├── main.dart
├── theme.dart
├── l10n/app_strings.dart
├── models/feed_item.dart
├── services/feed_service.dart
└── screens/feed_screen.dart
```
