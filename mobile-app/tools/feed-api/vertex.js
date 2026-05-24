const { GoogleAuth } = require("google-auth-library");

function getVertexConfig() {
  const projectId = process.env.GCP_PROJECT_ID?.trim();
  const location =
    process.env.GCP_REGION?.trim() ||
    process.env.VERTEX_LOCATION?.trim() ||
    "europe-west4";
  const model = process.env.VERTEX_MODEL || "gemini-2.5-flash";

  if (!projectId) {
    throw new Error("GCP_PROJECT_ID is not set on feed-api");
  }

  return { projectId, location, model };
}

function createGoogleAuth() {
  const inlineJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (inlineJson) {
    return new GoogleAuth({
      credentials: JSON.parse(inlineJson),
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });
  }

  return new GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
}

async function getAccessToken() {
  const auth = createGoogleAuth();
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  const token = tokenResponse?.token;
  if (!token) {
    throw new Error(
      "Failed to get Vertex AI access token. Set GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_SERVICE_ACCOUNT_JSON"
    );
  }
  return token;
}

function vertexUrl({ projectId, location, model }) {
  return `https://${location}-aiplatform.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/locations/${encodeURIComponent(location)}/publishers/google/models/${encodeURIComponent(model)}:generateContent`;
}

async function vertexJson(system, user) {
  const config = getVertexConfig();
  const token = await getAccessToken();

  const response = await fetch(vertexUrl(config), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
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
    throw new Error(`Vertex AI HTTP ${response.status}: ${errText.slice(0, 300)}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Vertex AI returned empty content");
  return JSON.parse(text);
}

module.exports = { getVertexConfig, vertexJson };
