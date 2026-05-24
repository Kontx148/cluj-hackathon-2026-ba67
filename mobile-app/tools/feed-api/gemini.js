const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";

function getGeminiConfig() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !String(apiKey).trim()) {
    throw new Error("GEMINI_API_KEY is not set on feed-api");
  }
  return {
    apiKey: String(apiKey).trim(),
    model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
  };
}

function geminiUrl(model, apiKey) {
  return `${GEMINI_BASE}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
}

async function geminiJson(system, user) {
  const { apiKey, model } = getGeminiConfig();
  const response = await fetch(geminiUrl(model, apiKey), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: {
        temperature: 0.3,
        responseMimeType: "application/json",
      },
    }),
    signal: AbortSignal.timeout(60000),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini HTTP ${response.status}: ${errText.slice(0, 300)}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned empty content");
  return JSON.parse(text);
}

module.exports = { getGeminiConfig, geminiJson };
