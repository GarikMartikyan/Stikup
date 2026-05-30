# Stikup — Deployment Guide (cheapest single-droplet setup)

Target: one DigitalOcean droplet running `docker-compose.prod.yml` (Postgres +
Redis as containers, backend, frontend, Caddy auto-HTTPS, nightly DB backup),
behind a name.com domain. Hosting is covered by the GitHub Student Pack
(DigitalOcean credit + free domain).

This guide is the human checklist. Each step says who does it.

---

## Roadmap status

- [x] **Step 1** — dev/prod config split (`APP_ENV`, per-env `.env`, env-aware logic). _(code)_
- [x] **Step 2** — prod Docker stack + Caddy + dev infra compose. _(code)_
- [ ] **Step 3** — create DO droplet + claim name.com domain + DNS. _(you, below)_
- [ ] **Step 4** — server bootstrap + first deploy. _(you run a provided script)_
- [ ] **Step 5** — CI/CD: build → GHCR → deploy on tag. _(code + you add GH secrets)_
- [ ] **Step 6+** — features: real AI, DO Spaces, Stripe, Telegram delivery.

---

## Step 3 — DigitalOcean droplet + name.com domain (YOU)

### 3a. Create an SSH key (if you don't have one)

On your Mac:

```bash
ls ~/.ssh/id_ed25519.pub 2>/dev/null || ssh-keygen -t ed25519 -C "stikup-deploy"
cat ~/.ssh/id_ed25519.pub   # copy this — you'll paste it into DigitalOcean
```

### 3b. Activate the Student Pack credit

1. Go to https://education.github.com/pack → find **DigitalOcean** → get the
   credit code (usually $200 / 12 months).
2. Create a DO account, redeem the code under **Billing → referral/credit**.
3. Confirm the credit shows in your billing balance.

### 3c. Create the droplet

DigitalOcean → **Create → Droplets**:

- **Region:** closest to your users (CIS/EU → Frankfurt `FRA1` or Amsterdam `AMS3`).
- **Image:** Ubuntu 24.04 (LTS) x64.
- **Size:** Basic → Regular → **4 GB RAM / 2 vCPU (~$24/mo)**.
- **Authentication:** SSH key → paste the public key from 3a.
- **Hostname:** `stikup-prod`.
- Create. **Copy the droplet's public IPv4** (e.g. `203.0.113.10`).

Quick login test:

```bash
ssh root@YOUR_DROPLET_IP   # accept the fingerprint; you should land in a shell
exit
```

### 3d. Claim the free domain at name.com

1. https://education.github.com/pack → **name.com** → get the coupon (free domain ~1yr).
2. Register a domain (e.g. `stikup.me`, `stikup.live`, `getstikup.com`).
3. **Tell Claude the exact domain** — it gets wired into `PUBLIC_APP_URL`, the
   Google OAuth redirect, Caddy, and cookie settings.

### 3e. Point DNS at the droplet

name.com → your domain → **DNS records**. Add two A records → the droplet IP:

| Type | Host (name) | Answer / Value    | TTL |
| ---- | ----------- | ----------------- | --- |
| A    | `@`         | `YOUR_DROPLET_IP` | 300 |
| A    | `www`       | `YOUR_DROPLET_IP` | 300 |

Remove any default parking/forwarding records that conflict. Verify (wait a few min):

```bash
dig +short YOUR_DOMAIN      # should print YOUR_DROPLET_IP
```

> Caddy needs DNS resolving to the droplet **before** first boot, so it can get
> the Let's Encrypt certificate. Don't deploy until `dig` returns the droplet IP.

### When 3a–3e are done, give Claude:

1. The **domain** you registered.
2. The **droplet IP**.
3. Confirmation `dig +short YOUR_DOMAIN` returns that IP.

Then we do **Step 4** (server bootstrap + first deploy) together.

---

## Reference: local development

```bash
# Start backing services (Postgres + Redis) in Docker:
docker compose -f docker-compose.dev.yml up -d

# Run both apps on the host with hot reload:
npm run dev

# Stop services:
docker compose -f docker-compose.dev.yml down
```

Put real dev secrets (Telegram bot token, Google OAuth) in
`.env.development.local` (gitignored). Everything else has a safe default in the
committed `.env.development`.

## Reference: production deploy command (used in Step 4)

On the droplet, from the repo directory, with a populated
`.env.production.local`:

```bash
docker compose \
  --env-file .env.production \
  --env-file .env.production.local \
  -f docker-compose.prod.yml up -d --build
```
