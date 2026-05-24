const GROQ_BASE = "https://api.groq.com/openai/v1";

function getGroqConfig() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || !String(apiKey).trim()) {
    throw new Error("GROQ_API_KEY is not set on feed-api");
  }
  return {
    apiKey: String(apiKey).trim(),
    model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
  };
}

async function groqJson(system, user) {
  const { apiKey, model } = getGroqConfig();
  const response = await fetch(`${GROQ_BASE}/chat/completions`, {
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
    throw new Error(`Groq HTTP ${response.status}: ${errText.slice(0, 300)}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("Groq returned empty content");
  return JSON.parse(text);
}

module.exports = { getGroqConfig, groqJson };
