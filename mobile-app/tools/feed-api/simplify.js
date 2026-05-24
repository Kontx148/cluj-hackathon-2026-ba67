const { llmJson, getLlmConfig } = require("./llm");

const SYSTEM = [
  "Ești un expert care explică legislația românească cetățenilor obișnuiți, în limbaj clar și neutru.",
  "Returnează JSON strict cu cheile: plain_summary (română, 120-220 cuvinte), plain_summary_en (engleză, 120-220 cuvinte).",
  "plain_summary TREBUIE scris în limba română. Nu inventa date, termene sau rezultate.",
  "Fii practic: ce propune legea, pe cine afectează, ce se poate schimba pentru cetățeni.",
].join(" ");

async function simplifyRecord(rec) {
  const user = [
    `Titlu: ${rec.title}`,
    `Descriere: ${rec.description || ""}`,
    `Sursă: ${rec.sourceName || rec.sourceId || "Senat"}`,
    `Consultare publică deschisă: ${rec.actionPossible !== false ? "da" : "nu"}`,
    `Link: ${rec.link || rec.detailUrl || ""}`,
  ].join("\n");

  const parsed = await llmJson(SYSTEM, user);
  const plain_summary = String(parsed.plain_summary || "").trim();
  const plain_summary_en = String(parsed.plain_summary_en || "").trim();

  if (!plain_summary || !plain_summary_en) {
    throw new Error(`LLM missing plain_summary fields for ${rec.id || rec.title}`);
  }

  const { provider } = getLlmConfig();
  return {
    ...rec,
    plain_summary,
    plain_summary_en,
    analyzed_at: new Date().toISOString(),
    analysis_source: provider,
  };
}

/**
 * @param {object[]} records
 * @param {{ delayMs?: number }} [options]
 */
async function simplifyRecords(records, options = {}) {
  const delayMs = options.delayMs ?? 800;
  const out = [];

  for (const rec of records) {
    out.push(await simplifyRecord(rec));
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return out;
}

module.exports = { simplifyRecord, simplifyRecords };
