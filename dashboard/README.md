# Election Chain — Operations Dashboard

A single-page operations console for the Election Chain backend. Designed for
election operators (institutions: AEP, BEC, COURT, plus Admin) to propose,
approve, and drive elections through their lifecycle, and to inspect the
underlying permissioned blockchain.

This is a **prototype / hackathon UI**. There is no real auth — operators
enter their institution + API key in the credential bar and the dashboard
forwards them as headers (`x-institution-id`, `x-api-key`) on every request.

## Stack

- React 18 + Vite + TypeScript
- `@tanstack/react-query` for all data fetching, polling, and cache invalidation
- `react-router-dom` v6 for page routing
- No UI framework — a single dark, utilitarian stylesheet (`src/styles.css`)

## Setup

```bash
cd dashboard
npm install
cp .env.example .env   # then edit if your gateways are not on 4001/4002
npm run dev
```

The dashboard expects two gateways:

| Env var               | Default                  | Used for                                |
|-----------------------|--------------------------|-----------------------------------------|
| `VITE_GATEWAY_URL`    | `http://localhost:4001`  | All API requests                        |
| `VITE_GATEWAY_2_URL`  | `http://localhost:4002`  | Displayed as a second gateway in the UI |

The second gateway URL is shown in the validator panel for operator visibility;
all actual fetches go to `VITE_GATEWAY_URL`. To enable client-side failover to
gateway 2, uncomment the marked block in `src/api/client.ts`.

## Demo credentials

The backend ships with these dev keys (paste into the credential bar):

| Role    | API key          |
|---------|------------------|
| Admin   | `dev-admin-key`  |
| AEP     | `dev-aep-key`    |
| BEC     | `dev-bec-key`    |
| COURT   | `dev-court-key`  |

Credentials are stored in `sessionStorage` only — they clear when the tab
closes and are never written to disk.

## Pages

- `/` — Elections list + validator status panel.
- `/elections/new` — Propose election form (AEP / Admin only).
- `/elections/:id` — Election detail + lifecycle actions.
- `/chain` — Block browser, transaction lookup, integrity verify.

## Production (DigitalOcean)

Deployed automatically by `.github/workflows/deploy-chain-backend.yml` on push to
`main`, after ChainBackend is healthy.

- **URL:** `http://<DO_HOST>:5173/` (same host as the gateways; port **5173**)
- The container nginx proxies `/gw/*` → `gateway-1:4001` on the Docker network
  so the browser never needs CORS.
- Build-time env is written on the server from `DO_HOST` — no extra GitHub
  secrets beyond the existing deploy set.

Open **port 5173** on the droplet firewall if the UI is unreachable.

Operator API keys in the credential bar must match the keys configured on the
gateways (`CHAIN_*_API_KEY` GitHub secrets → ChainBackend `.env`).

## Upgrade seams

These are the deliberate points to change for production:

1. **Auth** — `getHeaders()` in `src/api/client.ts` is the single place that
   injects credentials. Replace it with mTLS / signed JWT logic without
   touching anything else.
2. **Base URL** — `VITE_GATEWAY_URL` is the single source of truth. The app
   never builds a URL outside `src/api/client.ts`.
3. **Gateway failover** — see the commented block in `src/api/client.ts`.
4. **Polling intervals** — all named constants in `src/constants.ts`.
5. **Vote format** — the dashboard does not submit votes (voter-app concern).
   If added later, ciphertext format is `mock-enc:<electionId>:[1,0,0]` for
   demo, real ElGamal in production.
