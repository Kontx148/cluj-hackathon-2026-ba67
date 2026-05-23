# CivicAI — Design Specification

> Stack-agnostic design document for rebuilding the app in Flutter, React Native, SwiftUI, etc.

---

## 1. Product overview

**CivicAI** is an AI-summarized political and civic news feed at three levels (EU / Romania / Local), with tags and filters. The user sees:

- What happened (title + source)
- What it means (English AI summary)
- How important it is (1–5 score)
- Whether civic action is possible (green badge)
- Topic and type (tag chips)

Long-term vision: digital-ID-based anonymous voting and a law-explainer chat. **This spec covers only the MVP reader/feed.**

---

## 2. Design tokens

### Colors (hex for Flutter / native)

| Token | Light hex | Dark hex | Usage |
|---|---|---|---|
| `background` | `#F7F8FA` | `#0E1422` | App background |
| `foreground` | `#0F1729` | `#F5F7FB` | Primary text |
| `card` | `#FFFFFF` | `#1A2238` | Card background |
| `primary` | `#3B3F8C` | `#E8EBF6` | CTA, active chip, links |
| `primary-foreground` | `#FFFFFF` | `#1A2238` | Text on primary |
| `muted` | `#EEF1F6` | `#222B44` | Tag chip background |
| `muted-foreground` | `#5A6B85` | `#9AA6BE` | Secondary text |
| `border` | `#E1E6EE` | `#FFFFFF1A` | Borders |
| `accent-success` | `#059669` | `#10B981` | “Civic action possible” badge |
| `accent-importance` | `#3B3F8C` | `#E8EBF6` | Importance dots (●) |

Border radius: `12px` base, `9999px` (pill) for chips.

### Typography

- **Headings**: `Space Grotesk` 600–700, letter-spacing `-0.02em`
- **Body**: `Inter` 400/500
- **Mono** (importance dots): system monospace

Mobile sizes:

- App title (h1): 32–36px / 700
- Card title: 16px / 600, max 3 lines
- Summary body: 14px / 400, max 4 lines
- Tag / chip: 11–12px
- Eyebrow: 11px uppercase, tracking `0.15em`, muted

### Spacing

`4 / 8 / 12 / 16 / 24 / 32 / 48` (Tailwind-style scale).

### Shadow

Card hover: `0 10px 30px -10px rgba(15,23,41,0.15)`.

---

## 3. Layout

### Mobile (< 768px) — default

- Single column, 16px padding
- Sticky header with blur
- Filter chips scroll horizontally
- Cards in one column

### Tablet (768–1024px)

- Two card columns, 16px gap
- Max width 768px centered

### Desktop (> 1024px)

- Three card columns
- Container max-width 1152px, 16px side padding

---

## 4. Screens

### 4.1 Header

```
┌─────────────────────────────────────────┐
│ ✨ AI-GENERATED SUMMARIES (DEMO)        │  ← eyebrow
│ CivicAI                                 │  ← h1
│ EU, Romanian, and local politics…       │  ← tagline
│ [↻ Refresh]                             │
└─────────────────────────────────────────┘
```

- Bottom: 1px border
- Background: semi-transparent card + backdrop blur

### 4.2 Filters

1. **Search** (max-width 400px)
2. **Level:** All, EU, Romania, Local (single select pills)
3. **Topics:** 10 tag chips (single select)
4. **Type:** 6 tag chips
5. **Sources:** read-only badges for aggregated feeds

Chip style: inactive border + card bg; active primary fill.

### 4.3 News card

- Level badge (left) + source (right)
- Title (max 3 lines)
- English summary (max 4 lines)
- Tags (max ~6 chips)
- Footer: importance dots, optional civic-action badge, Open link

### 4.4 Empty state

Centered: “No results for the current filters.”

### 4.5 Footer

`CivicAI · Hackathon MVP · Cluj 2026`

---

## 5. Behavior

- **Loading:** skeleton cards
- **Refresh:** spinner while fetching
- **Search:** client-side match on title, source, tags
- **Filters:** AND logic across level, topic, type, and search
- **Cache:** feed stale ~5 min; server AI cache ~30 min (when enabled)

---

## 6. Data model — `FeedItem`

```ts
type Level = "EU" | "Romania" | "Local";
interface FeedItem {
  id: string;
  title: string;
  link: string;
  description: string;
  source: string;
  level: Level;
  publishedAt: string; // ISO
  summary?: string;    // English display summary
  tags?: string[];
  importance?: number; // 1..5
  actionPossible?: boolean;
}
```

Planned RSS sources (via n8n): EUR-Lex, EP, Romanian parliament and news, Cluj local portals.

AI enrichment (later): title + description → English summary, tags, importance, `actionPossible`.

---

## 7. Copy

See `STRINGS.json` for UI strings (English).

---

## 8. Screenshots

See `screens/` for visual reference.
