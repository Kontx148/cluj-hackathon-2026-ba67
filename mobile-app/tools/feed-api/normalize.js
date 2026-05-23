/** @typedef {import('./normalize.types').RawLawRecord} RawLawRecord */
/** @typedef {import('./normalize.types').FeedItem} FeedItem */

const SOURCE_NAMES = {
  "eur-lex": "EUR-Lex",
  "ep-oeil": "EP Legislative Observatory",
  "ep-thinktank": "EP Think Tank",
  "legislatie-just": "Legislatie.just.ro",
  "monitorul-oficial": "Monitorul Oficial",
  "cdep-plx": "Chamber of Deputies",
  "senat-plx": "Senat",
  "primaria-cluj": "Cluj-Napoca City Hall",
  g4media: "G4Media",
};

const LEVEL_TAGS = {
  EU: "#EU",
  Romania: "#Romania",
  Local: "#Cluj",
};

const TYPE_TAGS = {
  law: "#law-in-force",
  bill: "#bill-proposal",
  vote: "#vote-upcoming",
  local_official: "#local-decision",
  news: "#bill-proposal",
};

const LAW_SOURCE_IDS = new Set([
  "senat-plx",
  "cdep-plx",
  "monitorul-oficial",
  "eur-lex",
  "ep-oeil",
  "legislatie-just",
  "primaria-cluj",
]);

const NEWS_SOURCE_IDS = new Set([
  "g4media",
  "ep-thinktank",
  "digi24",
  "transtelex",
  "maszol",
]);

function inferFeedCategory(raw, entityType, sourceId) {
  if (raw.feedCategory === "news" || raw.feedCategory === "law") {
    return raw.feedCategory;
  }
  if (NEWS_SOURCE_IDS.has(sourceId)) return "news";
  if (LAW_SOURCE_IDS.has(sourceId)) return "law";
  if (["bill", "law", "vote", "local_official"].includes(entityType)) return "law";
  if (["news", "party_program", "politician_stance"].includes(entityType)) return "news";
  return "news";
}

function slug(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function hashString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}

/**
 * @param {RawLawRecord} raw
 */
function buildId(raw) {
  if (raw.id) return raw.id;
  if (raw.celex) return `eu-celex-${raw.celex.replace(/\W/g, "")}`;
  if (raw.procedureRef) return `eu-proc-${slug(raw.procedureRef)}`;
  if (raw.plxNumber) {
    const chamber = raw.sourceId?.includes("senat") ? "senat" : "cdep";
    return `ro-plx-${chamber}-${slug(raw.plxNumber)}`;
  }
  if (raw.moNumber) return `ro-mo-${slug(raw.moNumber)}`;
  const ext = raw.externalId || raw.detailUrl || raw.title;
  return `${raw.sourceId || "item"}-${slug(String(ext))}`;
}

/**
 * @param {RawLawRecord} raw
 */
function inferEntityType(raw) {
  if (raw.entityType) return raw.entityType;
  if (raw.sourceId?.includes("cdep") || raw.sourceId?.includes("senat")) return "bill";
  if (raw.sourceId === "eur-lex" || raw.sourceId === "monitorul-oficial") return "law";
  if (raw.sourceId === "primaria-cluj") return "local_official";
  return "news";
}

/**
 * @param {RawLawRecord} raw
 */
function computeActionPossible(raw) {
  if (typeof raw.actionPossible === "boolean") return raw.actionPossible;
  const status = String(raw.status || "").toLowerCase();
  if (raw.consultationDeadline) {
    const d = new Date(raw.consultationDeadline);
    if (!Number.isNaN(d.getTime()) && d > new Date()) return true;
  }
  if (raw.voteDate) {
    const d = new Date(raw.voteDate);
    const days = (d - new Date()) / (86400000);
    if (days >= 0 && days <= 90) return true;
  }
  if (/consultare|consultation|în dezbatere|dezbatere|comisia|committee|trilog/i.test(status)) {
    return true;
  }
  if (/promulgat|adoptat|publicat în mo|in force|entry into force/i.test(status)) {
    return false;
  }
  return inferEntityType(raw) === "bill";
}

/**
 * @param {RawLawRecord} raw
 */
function computeImportance(raw) {
  if (typeof raw.importance === "number") {
    return Math.min(5, Math.max(1, raw.importance));
  }
  const entity = inferEntityType(raw);
  if (raw.voteDate) {
    const days = (new Date(raw.voteDate) - new Date()) / 86400000;
    if (days >= 0 && days <= 14) return 5;
    if (days >= 0 && days <= 60) return 4;
  }
  if (entity === "law") return 4;
  if (entity === "bill") return 3;
  if (entity === "local_official") return 3;
  return 2;
}

/**
 * @param {RawLawRecord} raw
 */
function computeTags(raw) {
  if (Array.isArray(raw.tags) && raw.tags.length > 0) return raw.tags;
  const level = raw.level || "Romania";
  const entity = inferEntityType(raw);
  const tags = new Set();
  if (LEVEL_TAGS[level]) tags.add(LEVEL_TAGS[level]);
  if (TYPE_TAGS[entity]) tags.add(TYPE_TAGS[entity]);
  if (computeActionPossible(raw) && entity !== "law") tags.add("#consultation");
  return [...tags];
}

/**
 * @param {RawLawRecord} raw
 * @returns {FeedItem}
 */
function normalizeRawRecord(raw) {
  const level = raw.level || "Romania";
  const sourceId = raw.sourceId || "unknown";
  const entityType = inferEntityType(raw);
  const link = raw.detailUrl || raw.link || "";
  const description = (raw.description || raw.title || "").trim().slice(0, 600);
  const feedCategory = inferFeedCategory(raw, entityType, sourceId);

  /** @type {FeedItem} */
  const item = {
    id: buildId({ ...raw, sourceId }),
    title: String(raw.title || "Untitled").trim(),
    link,
    description,
    publishedAt: raw.publishedAt || raw.fetchedAt || new Date().toISOString(),
    source: raw.sourceName || SOURCE_NAMES[sourceId] || sourceId,
    sourceId,
    level,
    sourceLang: raw.sourceLang || (level === "EU" ? "en" : "ro"),
    entityType,
    feedCategory,
    summary: (raw.summary || description).trim(),
    tags: computeTags(raw),
    importance: computeImportance(raw),
    actionPossible: computeActionPossible(raw),
  };

  if (raw.voteDate) item.voteDate = raw.voteDate;
  if (raw.consultationDeadline && !item.voteDate) {
    item.voteDate = raw.consultationDeadline;
  }

  return item;
}

/**
 * @param {RawLawRecord[]} records
 */
function normalizeRecords(records) {
  return records.map(normalizeRawRecord);
}

/**
 * @param {FeedItem[]} existing
 * @param {FeedItem[]} incoming
 */
function mergeFeedItems(existing, incoming) {
  const map = new Map(existing.map((i) => [i.id, i]));
  for (const item of incoming) {
    map.set(item.id, item);
  }
  return [...map.values()].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

/**
 * Parse senat.ro public consultation listing.
 * @param {string} html
 */
function parseSenatConsultationHtml(html) {
  const records = [];
  const blockRe =
    /hCod" id="[^"]+" value="(\d+)"[\s\S]*?hPCT" id="[^"]+" value="([^"]+)"/g;
  let match;

  while ((match = blockRe.exec(html)) !== null) {
    const cod = match[1];
    const pct = match[2];
    const colonIdx = pct.indexOf(" : ");
    const regNumber = colonIdx >= 0 ? pct.slice(0, colonIdx).trim() : pct.trim();
    const titleText = colonIdx >= 0 ? pct.slice(colonIdx + 3).trim() : pct.trim();

    const rowSlice = html.slice(Math.max(0, match.index - 400), match.index);
    const dateMatch = rowSlice.match(/(\d{2}-\d{2}-\d{4})\s*$/);

    records.push({
      sourceId: "senat-plx",
      sourceName: SOURCE_NAMES["senat-plx"],
      level: "Romania",
      sourceLang: "ro",
      entityType: "bill",
      externalId: cod,
      plxNumber: regNumber.replace(/\s+/g, ""),
      title: titleText.length > 120 ? `${regNumber} — ${titleText.slice(0, 117)}…` : `${regNumber} — ${titleText}`,
      detailUrl: `https://www.senat.ro/Legis/Lista.aspx?cod=${cod}`,
      description: titleText.slice(0, 600),
      consultationDeadline: dateMatch
        ? dateMatch[1].split("-").reverse().join("-")
        : undefined,
      publishedAt: new Date().toISOString(),
      fetchedAt: new Date().toISOString(),
      status: "public consultation",
      actionPossible: true,
    });
  }

  return records.slice(0, 30);
}

/**
 * Parse cdep.ro HTML listing into raw records (legacy URL; may 404).
 * @param {string} html
 */
function parseCdepListingHtml(html) {
  const records = [];
  const linkRe =
    /href="(\/pls\/proiecte\/[^"]+)"[^>]*>([^<]{10,200})<\/a>/gi;
  let match;
  const seen = new Set();

  while ((match = linkRe.exec(html)) !== null) {
    const path = match[1];
    const title = match[2].replace(/\s+/g, " ").trim();
    if (seen.has(path)) continue;
    seen.add(path);

    const plxMatch = title.match(/(PL-x?\s*[^\/\s]+)/i) || path.match(/(\d+)/);
    records.push({
      sourceId: "cdep-plx",
      sourceName: SOURCE_NAMES["cdep-plx"],
      level: "Romania",
      sourceLang: "ro",
      entityType: "bill",
      externalId: path,
      plxNumber: plxMatch ? plxMatch[1] : path,
      title,
      detailUrl: `https://www.cdep.ro${path}`,
      description: title,
      publishedAt: new Date().toISOString(),
      fetchedAt: new Date().toISOString(),
      status: "active listing",
    });
  }

  return records.slice(0, 25);
}

module.exports = {
  normalizeRawRecord,
  normalizeRecords,
  mergeFeedItems,
  parseCdepListingHtml,
  parseSenatConsultationHtml,
  inferFeedCategory,
  SOURCE_NAMES,
};
