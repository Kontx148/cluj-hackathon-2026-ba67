/**
 * Reference copy of Gemini simplify logic — implemented in feed-api (simplify.js + gemini.js).
 * The Senat workflow calls POST /api/simplify/records instead of running this in n8n Code.
 *
 * Requires: GEMINI_API_KEY (+ optional GEMINI_MODEL) on the feed-api container.
 * Get a key: https://aistudio.google.com/apikey
 */

function readEnv(name) {
  try {
    const value = $env[name];
    if (value == null || String(value).trim() === '') {
      throw new Error(`Missing required env var: ${name}`);
    }
    return String(value).trim();
  } catch (err) {
    throw new Error(`Cannot read env ${name}: ${err.message}. Set GEMINI_API_KEY in n8n/.env and N8N_BLOCK_ENV_ACCESS_IN_NODE=false in docker-compose.`);
  }
}

const GEMINI_API_KEY = readEnv('GEMINI_API_KEY');
let GEMINI_MODEL = 'gemini-2.5-flash';
try {
  if ($env.GEMINI_MODEL && String($env.GEMINI_MODEL).trim()) {
    GEMINI_MODEL = String($env.GEMINI_MODEL).trim();
  }
} catch (_) {
  // default model
}

async function geminiSimplify(rec) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;

  const system = [
    'You explain Romanian legislation to everyday citizens.',
    'Return strict JSON with keys plain_summary and plain_summary_en. Each value is an object: { tldr: [3-5 short bullet strings], sections: [{ title, body }, ...] } (2-4 sections). Romanian plain_summary; English plain_summary_en.',
    'Be neutral and practical. Do not invent dates or outcomes.',
  ].join(' ');

  const user = [
    `Title: ${rec.title}`,
    `Description: ${rec.description || ''}`,
    `Source: ${rec.sourceName || rec.sourceId || 'Senat'}`,
    `Public input open: ${rec.actionPossible !== false ? 'yes' : 'no'}`,
    `Link: ${rec.link || rec.detailUrl || ''}`,
  ].join('\n');

  const payload = {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: 'user', parts: [{ text: user }] }],
    generationConfig: {
      temperature: 0.3,
      responseMimeType: 'application/json',
    },
  };

  let data;
  try {
    data = await $helpers.httpRequest({
      method: 'POST',
      url,
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      json: true,
      timeout: 60000,
    });
  } catch (err) {
    const msg = err?.message || String(err);
    throw new Error(`Gemini HTTP failed for ${rec.title?.slice(0, 60)}: ${msg.slice(0, 300)}`);
  }

  const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) {
    throw new Error(`Gemini returned empty content for ${rec.id || rec.title}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (err) {
    throw new Error(`Gemini JSON parse failed for ${rec.id || rec.title}: ${err.message}`);
  }

  const plain_summary = String(parsed.plain_summary || '').trim();
  const plain_summary_en = String(parsed.plain_summary_en || '').trim();
  if (!plain_summary || !plain_summary_en) {
    throw new Error(`Gemini missing plain_summary fields for ${rec.id || rec.title}`);
  }

  return {
    plain_summary,
    plain_summary_en,
    analyzed_at: new Date().toISOString(),
    analysis_source: 'gemini',
  };
}

const body = $input.first().json;
const records = body.records || [];
if (!records.length) {
  throw new Error('No records to simplify');
}

const simplified = [];
for (const rec of records) {
  const analysis = await geminiSimplify(rec);
  simplified.push({ ...rec, ...analysis });
  await new Promise((r) => setTimeout(r, 400));
}

return [{ json: { records: simplified } }];
