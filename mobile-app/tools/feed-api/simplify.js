const { llmJson, getLlmConfig } = require("./llm");

const SYSTEM = [
  "Ești un expert care explică legislația românească cetățenilor obișnuiți, în limbaj clar și neutru.",
  "Returnează JSON strict cu cheile plain_summary și plain_summary_en.",
  "Fiecare cheie este un obiect cu:",
  "  tldr: array cu 3-5 puncte scurte (max ~20 cuvinte/punct),",
  "  sections: array cu 2-4 obiecte { title, body } — subtitluri clare + 1-3 fraze explicative fiecare.",
  "plain_summary în română; plain_summary_en în engleză.",
  "Subtitluri utile: ce propune, cine este afectat, ce se schimbă practic, consultare publică (dacă e cazul).",
  "Nu inventa date, termene sau rezultate. Fii practic și neutru.",
].join(" ");

/**
 * @param {unknown} raw
 * @param {string} label
 */
function normalizeSummaryBlock(raw, label) {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const tldr = (raw.tldr || [])
      .map((s) => String(s).trim())
      .filter(Boolean)
      .slice(0, 5);
    const sections = (raw.sections || [])
      .map((s) => ({
        title: String(s?.title || "").trim(),
        body: String(s?.body || "").trim(),
      }))
      .filter((s) => s.body)
      .slice(0, 5);

    if (tldr.length < 3) {
      throw new Error(`${label}: need at least 3 tldr bullet points`);
    }
    if (sections.length < 2) {
      throw new Error(`${label}: need at least 2 sections with body text`);
    }

    return JSON.stringify({ tldr, sections });
  }

  const text = String(raw || "").trim();
  if (!text) {
    throw new Error(`${label}: missing summary content`);
  }

  // Legacy LLM response: one prose block → wrap as single section.
  return JSON.stringify({
    tldr: [],
    sections: [{ title: "", body: text }],
  });
}

async function simplifyRecord(rec) {
  const user = [
    `Titlu: ${rec.title}`,
    `Descriere: ${rec.description || ""}`,
    `Sursă: ${rec.sourceName || rec.sourceId || "Senat"}`,
    `Consultare publică deschisă: ${rec.actionPossible !== false ? "da" : "nu"}`,
    `Link: ${rec.link || rec.detailUrl || ""}`,
  ].join("\n");

  const parsed = await llmJson(SYSTEM, user);
  const plain_summary = normalizeSummaryBlock(parsed.plain_summary, "plain_summary");
  const plain_summary_en = normalizeSummaryBlock(
    parsed.plain_summary_en,
    "plain_summary_en",
  );

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

module.exports = { simplifyRecord, simplifyRecords, normalizeSummaryBlock };
