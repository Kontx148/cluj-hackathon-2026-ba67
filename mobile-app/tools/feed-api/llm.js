const { vertexJson, getVertexConfig } = require("./vertex");
const { geminiJson } = require("./gemini");
const { openaiJson } = require("./openai");
const { groqJson } = require("./groq");

const PROVIDERS = ["vertex", "groq", "gemini", "openai"];

function hasVertexConfig() {
  if (!process.env.GCP_PROJECT_ID?.trim()) return false;
  return Boolean(
    process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim() ||
      process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim()
  );
}

function resolveProvider() {
  const forced = String(process.env.LLM_PROVIDER || "").trim().toLowerCase();
  if (PROVIDERS.includes(forced)) return forced;
  if (hasVertexConfig()) return "vertex";
  if (process.env.GROQ_API_KEY?.trim()) return "groq";
  if (process.env.GEMINI_API_KEY?.trim()) return "gemini";
  if (process.env.OPENAI_API_KEY?.trim()) return "openai";
  throw new Error(
    "No LLM configured. Set GCP_PROJECT_ID + service account for Vertex AI, or GROQ_API_KEY / GEMINI_API_KEY in n8n/.env"
  );
}

function getLlmConfig() {
  const provider = resolveProvider();
  if (provider === "vertex") {
    const { location, model, projectId } = getVertexConfig();
    return { provider, model, projectId, location };
  }
  if (provider === "groq") {
    return {
      provider,
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    };
  }
  if (provider === "gemini") {
    return {
      provider,
      model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
    };
  }
  return {
    provider,
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
  };
}

async function llmJson(system, user) {
  const provider = resolveProvider();
  if (provider === "vertex") return vertexJson(system, user);
  if (provider === "groq") return groqJson(system, user);
  if (provider === "gemini") return geminiJson(system, user);
  return openaiJson(system, user);
}

module.exports = { resolveProvider, getLlmConfig, llmJson, PROVIDERS, hasVertexConfig };
