# One-time VPS setup + GitHub Actions CI/CD for n8n + feed-api
#
# Server: 165.232.67.137 (DigitalOcean droplet)

## Overview

```
push to main  →  GitHub Actions  →  SSH to VPS  →  git pull  →  docker compose up -d
     (mobile-app/n8n, feed-api, data paths)
```

Secrets stay in **GitHub Repository secrets** — never committed to git.

---

## Part 1 — One-time VPS setup

SSH into the droplet:

```bash
ssh root@165.232.67.137
```

### Install Docker

```bash
curl -fsSL https://get.docker.com | sh
apt-get install -y docker-compose-plugin git
```

### Clone the repo

```bash
mkdir -p /opt/civicai
cd /opt/civicai
git clone https://github.com/YOUR_ORG/cluj-hackathon-2026-ba67.git .
# or: git clone git@github.com:YOUR_ORG/cluj-hackathon-2026-ba67.git .
```

### Open firewall ports

```bash
ufw allow OpenSSH
ufw allow 3001/tcp   # feed-api
ufw allow 5678/tcp   # n8n UI
ufw enable
```

### Deploy SSH key for GitHub Actions

On your **laptop**, generate a key used only for deploy:

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/civicai_deploy -N ""
```

Add the **public** key to the VPS:

```bash
ssh-copy-id -i ~/.ssh/civicai_deploy.pub root@165.232.67.137
```

Keep the **private** key (`~/.ssh/civicai_deploy`) — you will paste it into GitHub Secrets.

### First manual deploy (verify before CI)

```bash
cd /opt/civicai/mobile-app/n8n
cp .env.deploy.example .env
nano .env                          # GCP_PROJECT_ID, passwords, etc.
nano gcp-service-account.json      # paste service account JSON
docker compose up -d
curl http://localhost:3001/api/health/llm
curl http://localhost:3001/api/health
```

Import n8n workflows once at http://165.232.67.137:5678 and activate them.

---

## Part 2 — GitHub repository secrets

In GitHub: **Repository → Settings → Secrets and variables → Actions → New repository secret**

| Secret name | Value | Example |
|-------------|-------|---------|
| `VPS_HOST` | Droplet IP | `165.232.67.137` |
| `VPS_USER` | SSH user | `root` |
| `VPS_SSH_KEY` | Full private key file | contents of `~/.ssh/civicai_deploy` |
| `VPS_DEPLOY_PATH` | Repo path on server | `/opt/civicai` |
| `N8N_DOTENV` | Entire production `.env` file (multiline) | copy from working local/VPS `.env` |
| `GCP_SERVICE_ACCOUNT_JSON` | Full service account JSON (one line is fine) | copy from `gcp-service-account.json` |

### How to create `N8N_DOTENV`

Use your production `.env` (based on `.env.deploy.example`):

```env
INGEST_API_KEY=long-random-string
GENERIC_TIMEZONE=Europe/Bucharest
SENAT_FETCH_LIMIT=5
LLM_PROVIDER=vertex
GCP_PROJECT_ID=inventoryflow-493306
GCP_REGION=europe-west4
VERTEX_MODEL=gemini-2.5-flash
GOOGLE_APPLICATION_CREDENTIALS=/secrets/gcp-credentials.json
N8N_HOST=165.232.67.137
N8N_PROTOCOL=http
WEBHOOK_URL=http://165.232.67.137:5678/
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=strong-password-here
```

Paste the **whole file** into the `N8N_DOTENV` secret.

### Optional: Environment instead of repo secrets

For staging/production split: **Settings → Environments → New environment** (e.g. `production`) and add the same secrets there. Update the workflow `environment: production` line.

---

## Part 3 — Enable the workflow

The workflow file is:

`.github/workflows/deploy-backend.yml`

It runs on:

- **Push to `main`** when `mobile-app/n8n`, `mobile-app/tools/feed-api`, or `mobile-app/data` change
- **Manual run**: Actions tab → **Deploy backend (n8n + feed-api)** → **Run workflow**

After pushing the workflow to `main`:

1. Go to **Actions** tab
2. Confirm the workflow appears
3. Click **Run workflow** for a test deploy
4. Check logs; then verify:
   ```bash
   curl http://165.232.67.137:3001/api/health/llm
   curl http://165.232.67.137:3001/api/feed
   ```

---

## Part 4 — Flutter app (separate from backend deploy)

The mobile app is **not** deployed by this workflow. Build on your machine or add a second workflow:

```bash
cd mobile-app
flutter build apk --release --dart-define=API_BASE=http://165.232.67.137:3001
```

Optional later: GitHub Actions job with `subosito/flutter-action` to build APK and upload as artifact.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| SSH permission denied | Check `VPS_SSH_KEY` is the **private** key; public key is in `~/.ssh/authorized_keys` on VPS |
| `git pull` fails on VPS | Ensure repo cloned with deploy key or HTTPS; or use `git fetch` + reset in workflow |
| Vertex 404 / auth error | Check `N8N_DOTENV` and `GCP_SERVICE_ACCOUNT_JSON` secrets match working local setup |
| n8n workflows missing | CI only updates code — import workflows once manually in n8n UI |
| Port not reachable | `ufw status`, DigitalOcean cloud firewall, `docker compose ps` |

---

## Security checklist

- [ ] Strong `INGEST_API_KEY` and `N8N_BASIC_AUTH_PASSWORD` in `N8N_DOTENV`
- [ ] `gcp-service-account.json` never committed (gitignored)
- [ ] Deploy SSH key is deploy-only, not your personal key
- [ ] Rotate GCP service account key if it was ever exposed
- [ ] Consider HTTPS (nginx + Let's Encrypt) before production
