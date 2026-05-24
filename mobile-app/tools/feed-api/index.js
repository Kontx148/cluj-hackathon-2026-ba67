const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const {
  normalizeRecords,
  mergeFeedItems,
  parseSenatConsultationHtml,
  parseCdepListingHtml,
  parsePrimariaClujConsultationRss,
} = require("./normalize");
const { translateLawItems } = require("./translate");
const { simplifyRecords } = require("./simplify");
const { llmJson, getLlmConfig, resolveProvider } = require("./llm");

const PORT = Number(process.env.PORT) || 3001;

const DATA_DIR =
  process.env.MOBILE_APP_DATA_DIR || path.resolve(__dirname, "../../data");

const NEWS_FILE = path.join(DATA_DIR, "news-items.json");
const LAW_FILE = path.join(DATA_DIR, "law-items.json");
const SOURCES_FILE = path.join(DATA_DIR, "sources.json");

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function readNewsFeed() {
  return readJson(NEWS_FILE, { items: [], meta: {} });
}

function readLawFeed() {
  return readJson(LAW_FILE, { items: [], meta: {} });
}

function writeNewsFeed(data) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(NEWS_FILE, JSON.stringify(data, null, 2), "utf8");
}

function writeLawFeed(data) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(LAW_FILE, JSON.stringify(data, null, 2), "utf8");
}

function readCombinedFeed() {
  const news = readNewsFeed();
  const laws = readLawFeed();
  return {
    items: [...(news.items || []), ...(laws.items || [])],
    meta: {
      news: news.meta || {},
      laws: laws.meta || {},
    },
  };
}

function checkIngestKey(req) {
  const expected = process.env.INGEST_API_KEY;
  if (!expected) return true;
  return req.get("x-ingest-key") === expected;
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "4mb" }));

app.get("/api/health", (_req, res) => {
  let llm = null;
  try {
    llm = getLlmConfig();
  } catch {
    llm = null;
  }
  res.json({
    ok: true,
    service: "feed-api",
    dataDir: DATA_DIR,
    files: { news: NEWS_FILE, laws: LAW_FILE },
    llm,
  });
});

/** Quick LLM key check — GET /api/health/llm (Gemini free tier recommended) */
app.get("/api/health/llm", async (_req, res) => {
  let config;
  try {
    config = getLlmConfig();
  } catch (err) {
    return res.status(503).json({
      ok: false,
      error: err instanceof Error ? err.message : "No LLM configured",
      hint: "Set GCP_PROJECT_ID + GOOGLE_APPLICATION_CREDENTIALS for Vertex AI (see n8n/.env.example)",
    });
  }

  try {
    await llmJson(
      'Răspunde cu JSON strict: {"ok":true}',
      "ping"
    );
    res.json({ ok: true, ...config });
  } catch (err) {
    const message = err instanceof Error ? err.message : "LLM check failed";
    console.error("[feed-api] LLM health check failed:", message);
    const hints = {
      vertex:
        "Check GCP_PROJECT_ID, GCP_REGION, VERTEX_MODEL, and service account JSON. Enable Vertex AI API in Google Cloud.",
      groq: "Get a free key at https://console.groq.com/keys then docker compose up -d feed-api",
      gemini:
        "Gemini quota exceeded — wait for reset or switch to Vertex AI (LLM_PROVIDER=vertex)",
      openai:
        "Add API billing at https://platform.openai.com/settings/billing or switch to Vertex AI",
    };
    res.status(502).json({
      ok: false,
      provider: config.provider,
      error: message,
      hint: hints[config.provider] || hints.groq,
    });
  }
});

app.get("/api/feed", (req, res) => {
  const data = readCombinedFeed();
  let items = data.items || [];

  const { level, entityType, category, lang } = req.query;
  if (level) items = items.filter((i) => i.level === level);
  if (entityType) items = items.filter((i) => i.entityType === entityType);
  if (category === "news" || category === "law") {
    items = items.filter((i) => i.feedCategory === category);
  }
  if (lang === "en" || lang === "ro") {
    items = items.filter((i) => i.sourceLang === lang);
  }

  items = [...items].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );

  res.json({
    items,
    cachedAt: data.meta?.laws?.updatedAt || data.meta?.news?.updatedAt || null,
    fresh: true,
    source: "combined",
  });
});

app.get("/api/sources", (_req, res) => {
  res.json(readJson(SOURCES_FILE, { sources: [] }));
});

/** Replace entire news or law feed. Body: { items, meta?, category?: "news"|"law" } */
app.post("/api/ingest/feed", (req, res) => {
  if (!checkIngestKey(req)) {
    return res.status(401).json({ error: "Invalid or missing X-Ingest-Key" });
  }

  const { items, meta, category = "news" } = req.body || {};
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: "Body must include items: []" });
  }
  if (category !== "news" && category !== "law") {
    return res.status(400).json({ error: 'category must be "news" or "law"' });
  }

  const payload = {
    items,
    meta: {
      ...meta,
      feed: category,
      source: meta?.source || "n8n-feed-replace",
      updatedAt: new Date().toISOString(),
    },
  };

  const targetFile = category === "law" ? LAW_FILE : NEWS_FILE;
  if (category === "law") writeLawFeed(payload);
  else writeNewsFeed(payload);

  res.json({
    ok: true,
    mode: "replace",
    category,
    count: items.length,
    updatedAt: payload.meta.updatedAt,
    path: targetFile,
  });
});

/**
 * Ingest normalized or raw records into news-items.json or law-items.json.
 * Law feeds replace entirely on each run; news feeds merge by item id.
 * Body: { records: RawLawRecord[], meta?, category?: "news"|"law", mode?: "merge"|"replace" }
 */
app.post("/api/ingest/raw", async (req, res) => {
  if (!checkIngestKey(req)) {
    return res.status(401).json({ error: "Invalid or missing X-Ingest-Key" });
  }

  const { records, meta, category, mode: modeOverride } = req.body || {};
  if (!Array.isArray(records)) {
    return res.status(400).json({ error: "Body must include records: []" });
  }

  let incoming = normalizeRecords(records);
  const resolvedCategory =
    category === "news" || category === "law"
      ? category
      : incoming.every((item) => item.feedCategory === "news")
        ? "news"
        : "law";

  if (resolvedCategory === "law") {
    incoming = await translateLawItems(incoming);
  }

  const mode =
    modeOverride === "merge" || modeOverride === "replace"
      ? modeOverride
      : resolvedCategory === "law"
        ? "replace"
        : "merge";

  const existing = resolvedCategory === "news" ? readNewsFeed() : readLawFeed();
  const items =
    mode === "replace"
      ? [...incoming].sort(
          (a, b) =>
            new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
        )
      : mergeFeedItems(existing.items || [], incoming);

  const payload = {
    items,
    meta: {
      ...(mode === "merge" ? existing.meta : {}),
      ...meta,
      feed: resolvedCategory,
      source: meta?.source || "n8n-ingest",
      updatedAt: new Date().toISOString(),
      lastIngestCount: incoming.length,
    },
  };

  const targetFile = resolvedCategory === "law" ? LAW_FILE : NEWS_FILE;
  if (resolvedCategory === "law") writeLawFeed(payload);
  else writeNewsFeed(payload);

  res.json({
    ok: true,
    mode,
    category: resolvedCategory,
    ingested: incoming.length,
    total: items.length,
    updatedAt: payload.meta.updatedAt,
    path: targetFile,
  });
});

/** Plain-language summaries for raw law records (n8n Senat workflow). */
app.post("/api/simplify/records", async (req, res) => {
  if (!checkIngestKey(req)) {
    return res.status(401).json({ error: "Invalid or missing X-Ingest-Key" });
  }

  const { records } = req.body || {};
  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ error: "Body must include records: []" });
  }

  let config;
  try {
    config = getLlmConfig();
  } catch (err) {
    return res.status(503).json({
      error: err instanceof Error ? err.message : "No LLM configured",
    });
  }

  try {
    const simplified = await simplifyRecords(records);
    res.json({
      ok: true,
      count: simplified.length,
      engine: config.provider,
      records: simplified,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "simplify failed";
    console.error(`[feed-api] simplify/records failed (${records.length} records):`, message);
    res.status(502).json({
      error: message,
      hint: "Run curl http://localhost:3001/api/health/llm — check Vertex AI config in n8n/.env",
    });
  }
});

/** Fetch + parse Senat public consultation bills (primary RO source). */
app.get("/api/fetch/senat", async (req, res) => {
  try {
    const limit = Math.max(
      1,
      Number(req.query?.limit) || Number(process.env.SENAT_FETCH_LIMIT) || 5
    );
    const url = "https://www.senat.ro/legiproiect.aspx";
    const response = await fetch(url, {
      headers: {
        "User-Agent": "CivicAI/1.0 (hackathon)",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) {
      return res.status(502).json({ error: `senat HTTP ${response.status}` });
    }

    const html = await response.text();
    const allRecords = parseSenatConsultationHtml(html);
    const records = allRecords.slice(0, limit);
    res.json({
      ok: true,
      count: records.length,
      totalParsed: allRecords.length,
      limit,
      records,
    });
  } catch (err) {
    res.status(502).json({
      error: err instanceof Error ? err.message : "senat fetch failed",
    });
  }
});

/** Fetch + parse Cluj-Napoca public consultations (local upcoming decisions). */
app.get("/api/fetch/primaria-cluj", async (_req, res) => {
  try {
    const url =
      "https://primariaclujnapoca.ro/cetateni/dezbateri-publice/feed/";
    const response = await fetch(url, {
      headers: {
        "User-Agent": "CivicAI/1.0 (hackathon)",
        Accept: "application/rss+xml, application/xml, text/xml",
      },
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) {
      return res.status(502).json({ error: `primaria-cluj HTTP ${response.status}` });
    }

    const xml = await response.text();
    const records = parsePrimariaClujConsultationRss(xml);
    res.json({ ok: true, count: records.length, records });
  } catch (err) {
    res.status(502).json({
      error: err instanceof Error ? err.message : "primaria-cluj fetch failed",
    });
  }
});

/** Fetch + parse Camera Deputatilor listing (may fail if URL changes). */
app.get("/api/fetch/cdep", async (_req, res) => {
  try {
    const urls = [
      "https://www.cdep.ro/pls/proiecte/upl_pck2015.lista?cam=2&anb=2026",
      "https://www.cdep.ro/pls/proiecte/upl_pck2015.lista?cam=2&anb=2025",
    ];

    let html = "";
    for (const url of urls) {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "CivicAI/1.0 (hackathon)",
          Accept: "text/html",
        },
        signal: AbortSignal.timeout(20000),
      });
      if (response.ok) {
        html = await response.text();
        if (html.length > 500 && !html.includes("404 Not Found")) break;
      }
    }

    if (!html || html.includes("404 Not Found")) {
      return res.status(502).json({
        error: "cdep listing unavailable — use /api/fetch/senat instead",
      });
    }

    const records = parseCdepListingHtml(html);
    res.json({ ok: true, count: records.length, records });
  } catch (err) {
    res.status(502).json({
      error: err instanceof Error ? err.message : "cdep fetch failed",
    });
  }
});

app.listen(PORT, () => {
  console.log(`CivicAI feed-api listening on http://localhost:${PORT}`);
  console.log(`Data directory: ${DATA_DIR}`);
  console.log(`Ingest: POST /api/ingest/raw  (category: news|law)`);
});
