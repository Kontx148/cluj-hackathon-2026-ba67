const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");

const PORT = Number(process.env.PORT) || 3001;

// Mobile app owns feed JSON; override with MOBILE_APP_DATA_DIR if needed.
const DATA_DIR =
  process.env.MOBILE_APP_DATA_DIR || path.resolve(__dirname, "../../data");

const DATA_FILE = path.join(DATA_DIR, "feed-items.json");
const SOURCES_FILE = path.join(DATA_DIR, "sources.json");

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function writeFeed(data) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

function checkIngestKey(req) {
  const expected = process.env.INGEST_API_KEY;
  if (!expected) return true;
  return req.get("x-ingest-key") === expected;
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "feed-api", dataDir: DATA_DIR });
});

app.get("/api/feed", (req, res) => {
  const data = readJson(DATA_FILE, { items: [], meta: {} });
  let items = data.items || [];

  const { level, entityType } = req.query;
  if (level) items = items.filter((i) => i.level === level);
  if (entityType) items = items.filter((i) => i.entityType === entityType);

  items = [...items].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );

  res.json({
    items,
    cachedAt: data.meta?.updatedAt || null,
    fresh: true,
    dummy: data.meta?.source === "dummy-seed",
  });
});

app.get("/api/sources", (_req, res) => {
  res.json(readJson(SOURCES_FILE, { sources: [] }));
});

app.post("/api/ingest/feed", (req, res) => {
  if (!checkIngestKey(req)) {
    return res.status(401).json({ error: "Invalid or missing X-Ingest-Key" });
  }

  const { items, meta } = req.body || {};
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: "Body must include items: []" });
  }

  const payload = {
    items,
    meta: {
      ...meta,
      source: meta?.source || "n8n",
      updatedAt: new Date().toISOString(),
    },
  };

  writeFeed(payload);
  res.json({
    ok: true,
    count: items.length,
    updatedAt: payload.meta.updatedAt,
    path: DATA_FILE,
  });
});

app.listen(PORT, () => {
  console.log(`CivicAI feed-api listening on http://localhost:${PORT}`);
  console.log(`Reading feed data from ${DATA_DIR}`);
});
