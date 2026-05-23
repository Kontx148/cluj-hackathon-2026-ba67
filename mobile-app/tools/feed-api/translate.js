/** @typedef {import('./normalize.types').FeedItem} FeedItem */

const cache = new Map();

const PHRASES = [
  [/Propunere legislativă/gi, "Legislative proposal"],
  [/Proiect de lege/gi, "Bill"],
  [/Proiectul de lege/gi, "The bill"],
  [/pentru modificarea și completarea/gi, "to amend"],
  [/pentru modificarea si completarea/gi, "to amend"],
  [/pentru completarea/gi, "to supplement"],
  [/pentru abrogarea/gi, "to repeal"],
  [/privind/gi, "on"],
  [/Legii nr\./gi, "Law no."],
  [/Legii /gi, "Law "],
  [/Ordonanței de urgență/gi, "Emergency Ordinance"],
  [/ordonanței de urgență/gi, "Emergency Ordinance"],
  [/ordonanţei de urgenţă/gi, "Emergency Ordinance"],
  [/Codul fiscal/gi, "Tax Code"],
  [/Codul penal/gi, "Criminal Code"],
  [/Guvernului/gi, "Government"],
  [/Parlamentului/gi, "Parliament"],
  [/consultare publică/gi, "public consultation"],
  [/dezbatere publică/gi, "public debate"],
  [/Planul Urbanistic Zonal/gi, "Zonal Urban Plan"],
  [/Proiectul de buget/gi, "Budget draft"],
  [/municipiului Cluj-Napoca/gi, "Cluj-Napoca municipality"],
];

function applyPhraseReplacements(text) {
  let out = String(text);
  for (const [pattern, replacement] of PHRASES) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

/**
 * @param {string} text
 */
async function translateRoToEn(text) {
  const input = String(text || "").trim();
  if (!input) return input;

  const cacheKey = input.slice(0, 500);
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const fallback = applyPhraseReplacements(input);

  try {
    const q = encodeURIComponent(input.slice(0, 480));
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${q}&langpair=ro|en`,
      {
        headers: { "User-Agent": "CivicAI/1.0 (hackathon)" },
        signal: AbortSignal.timeout(12000),
      },
    );
    if (!response.ok) {
      cache.set(cacheKey, fallback);
      return fallback;
    }

    const data = await response.json();
    const translated = String(data?.responseData?.translatedText || "").trim();
    const result =
      translated && translated.toUpperCase() !== input.toUpperCase()
        ? translated
        : fallback;
    cache.set(cacheKey, result);
    return result;
  } catch {
    cache.set(cacheKey, fallback);
    return fallback;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Add English fields for Romanian law items.
 * @param {FeedItem[]} items
 * @param {{ delayMs?: number }} [options]
 */
async function translateLawItems(items, options = {}) {
  const delayMs = options.delayMs ?? 250;
  const out = [];

  for (const item of items) {
    const isRoLaw =
      item.feedCategory === "law" &&
      item.sourceLang === "ro" &&
      !item.title_en;

    if (!isRoLaw) {
      out.push(item);
      continue;
    }

    const titleEn = await translateRoToEn(item.title);
    await sleep(delayMs);
    const summaryEn = await translateRoToEn(item.description || item.summary || item.title);
    await sleep(delayMs);

    out.push({
      ...item,
      title_en: titleEn,
      summary: summaryEn,
    });
  }

  return out;
}

module.exports = {
  translateRoToEn,
  translateLawItems,
  applyPhraseReplacements,
};
