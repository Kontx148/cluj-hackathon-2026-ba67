/**
 * Central HTTP client.
 *
 * Production upgrade seams (keep these clean):
 *  - All auth header logic lives in `getHeaders()`. Swap it out for mTLS or
 *    signed JWTs without touching the rest of the codebase.
 *  - The base URL is read from a single env var (`VITE_GATEWAY_URL`). The
 *    app never builds a URL outside this module.
 *  - To enable gateway failover, uncomment the marked block below.
 */
/**
 * Where the SPA actually sends requests.
 *
 * In dev (`vite`) the gateway has no CORS, so we use the dev-server proxy
 * defined in `vite.config.ts` (`/gw/*` → `VITE_GATEWAY_URL`). The browser
 * only ever talks to `localhost:5173`, sidestepping CORS entirely.
 *
 * In a production build we hit the gateway directly — at that point the
 * gateway is expected to set `Access-Control-Allow-Origin`, or the SPA is
 * served from the same origin / behind a shared reverse proxy.
 */
const BASE: string = import.meta.env.DEV
  ? '/gw'
  : (import.meta.env.VITE_GATEWAY_URL as string);
// const BASE_2 = import.meta.env.VITE_GATEWAY_2_URL as string;

/**
 * The "real" upstream URLs, surfaced in the credential bar and validator
 * panel so the operator can see which deployment they're talking to, even
 * when traffic is being proxied through the dev server.
 */
/** Public URLs shown in the UI (may differ from [BASE] when proxied via `/gw`). */
export const GATEWAY_URLS = {
  primary:
    (import.meta.env.VITE_GATEWAY_PUBLIC_URL as string | undefined) ||
    (import.meta.env.VITE_GATEWAY_URL as string),
  secondary: import.meta.env.VITE_GATEWAY_2_URL as string,
};

export const CREDENTIAL_STORAGE_KEYS = {
  institutionId: 'institutionId',
  apiKey: 'apiKey',
} as const;

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const institutionId = sessionStorage.getItem(CREDENTIAL_STORAGE_KEYS.institutionId);
  const apiKey = sessionStorage.getItem(CREDENTIAL_STORAGE_KEYS.apiKey);
  // "Admin" is a UI label only — the backend has no "Admin" institution, so
  // we omit x-institution-id and rely on the admin API key.
  if (institutionId && institutionId !== 'Admin') headers['x-institution-id'] = institutionId;
  if (apiKey) headers['x-api-key'] = apiKey;
  return headers;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { ...getHeaders(), ...(options?.headers ?? {}) },
  });

  // ---------------------------------------------------------------------------
  // OPTIONAL: gateway failover. Uncomment to retry against the secondary
  // gateway whenever the primary is unreachable or returns a 5xx.
  //
  // if (!res.ok && res.status >= 500) {
  //   const fallback = await fetch(`${BASE_2}${path}`, {
  //     ...options,
  //     headers: { ...getHeaders(), ...(options?.headers ?? {}) },
  //   });
  //   if (fallback.ok) return fallback.json();
  // }
  // ---------------------------------------------------------------------------

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message =
      (body && typeof body === 'object' && 'error' in body && typeof body.error === 'string'
        ? body.error
        : null) ?? `HTTP ${res.status}`;
    throw new ApiError(res.status, message);
  }
  // Some endpoints (notably 204) won't have a JSON body.
  const text = await res.text();
  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return undefined as T;
  }
}
