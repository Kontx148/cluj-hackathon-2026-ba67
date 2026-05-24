const OPENAI_BASE = "https://api.openai.com/v1";

function getOpenAiConfig() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !String(apiKey).trim()) {
    throw new Error("OPENAI_API_KEY is not set on feed-api");
  }
  return {
    apiKey: String(apiKey).trim(),
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
  };
}

async function openaiJson(system, user) {
  const { apiKey, model } = getOpenAiConfig();
  const response = await fetch(`${OPENAI_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    }),
    signal: AbortSignal.timeout(60000),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI HTTP ${response.status}: ${errText.slice(0, 300)}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("OpenAI returned empty content");
  return JSON.parse(text);
}

module.exports = { getOpenAiConfig, openaiJson };
