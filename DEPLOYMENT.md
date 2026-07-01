# Ride Prestige Production Deployment

Production services:

- Supabase: PostgreSQL database
- Render: Express and Prisma API from `apps/api`
- Vercel: Next.js website from `apps/web`

All website CMS content is stored in Supabase and accessed through the Render
API. No separate Redis or Upstash database is required.

Never paste database passwords, JWT secrets, or API tokens into GitHub.

## 1. Supabase

Use these two connection strings from Supabase's Connect dialog:

```text
DATABASE_URL=Supavisor transaction pooler URL on port 6543
DIRECT_URL=Supavisor session pooler URL on port 5432
```

The Prisma schema uses `DATABASE_URL` for the running API and `DIRECT_URL`
for schema operations.

Apply the schema and seed data from the repository root:

```powershell
$env:DATABASE_URL="YOUR_TRANSACTION_POOLER_URL"
$env:DIRECT_URL="YOUR_SESSION_POOLER_URL"
npm run db:generate
npm run db:push --workspace=apps/api
npm run db:seed
```

## 2. Render API

Create a Render Web Service connected to the GitHub repository.

Use these settings:

```text
Branch: main
Root Directory: apps/api
Runtime: Node
Build Command: npm install && npx prisma generate && npx prisma db push && npm run build
Start Command: npm start
Health Check Path: /health
```

Add these Render environment variables:

```text
DATABASE_URL=<Supabase transaction pooler URL, port 6543>
DIRECT_URL=<Supabase session pooler URL, port 5432>
JWT_SECRET=<long unique random value>
JWT_EXPIRES_IN=7d
NODE_ENV=production
```

Do not manually set `PORT`; Render supplies it.

`prisma db push` keeps Supabase aligned with the deployed API. Review schema
changes before deployment and never use `--force-reset` in production.

After deployment, open:

```text
https://YOUR-RENDER-SERVICE.onrender.com/health
```

The response must contain `"status":"ok"`.

## 3. Vercel Website

The Vercel project must use:

```text
Framework Preset: Next.js
Root Directory: apps/web
Build Command: Next.js default
Output Directory: Next.js default
Install Command: npm install
```

Add these variables for Production, Preview, and Development:

```text
API_URL=https://YOUR-RENDER-SERVICE.onrender.com
NEXT_PUBLIC_API_URL=https://YOUR-RENDER-SERVICE.onrender.com
NEXT_PUBLIC_BASE_URL=https://YOUR-VERCEL-DOMAIN.vercel.app
AUTH_SECRET=<long unique random value>
ADMIN_SECRET=<long unique random value>
```

Optional features:

```text
AUTH_GOOGLE_ID=<Google OAuth client ID>
AUTH_GOOGLE_SECRET=<Google OAuth client secret>
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<browser-restricted Google Maps key>
GOOGLE_MAPS_DISTANCE_MATRIX_API_KEY=<server-restricted Google Maps key>
```

Google login and live maps remain unavailable until their optional variables are
configured. Website CMS content is stored in Supabase through the Render API.

Redeploy after adding or changing Vercel environment variables.

## 4. Production Smoke Test

Test in this order:

1. Open the Render `/health` URL.
2. Open the Vercel home page and confirm images and navigation load.
3. Submit a quote and booking.
4. Sign in at `/admin/login`.
5. Sign in at `/ops/login`.
6. Register or sign in at `/affiliate/login`.
7. Register or sign in at `/driver/login`.
8. Confirm the new booking appears in admin and operations.
9. Check browser Developer Tools for failed requests.
10. Check Render logs for database, authentication, or HTTP 500 errors.

If Render uses a free service, its first request after inactivity can take longer
while the service starts.

## 5. cPanel Node.js Host (rideprestige.co.uk)

The custom domain `rideprestige.co.uk` runs the Next.js app as a standalone Node
process on a cPanel server. This is a separate deployment from Vercel; the Render
API is shared by both.

### Build the standalone bundle

```powershell
npm run build --workspace=apps/web
```

The `output: "standalone"` setting in `apps/web/next.config.ts` produces a
self-contained server at `apps/web/.next/standalone/`. Copy static assets then
archive for upload:

```powershell
# Run from repo root
Copy-Item -Recurse -Force apps/web/.next/static `
  apps/web/.next/standalone/apps/web/.next/static
Copy-Item -Recurse -Force apps/web/public `
  apps/web/.next/standalone/apps/web/public
Compress-Archive -Force `
  -Path apps/web/.next/standalone/* `
  -DestinationPath artifacts/ride-prestige-cpanel-node.zip
```

Upload and extract `artifacts/ride-prestige-cpanel-node.zip` to the cPanel
application root, then set the startup file to `apps/web/server.js`.

### Environment variables — parity checklist

Set these in cPanel → Node.js → Application → Environment Variables.
Every variable marked ✅ for cPanel must be present or Google sign-in, maps,
and API calls will silently fail.

| Variable | Render API | Vercel | cPanel |
|---|---|---|---|
| `DATABASE_URL` | ✅ Supavisor pooler (port 6543) | — | — |
| `DIRECT_URL` | ✅ Supavisor session (port 5432) | — | — |
| `JWT_SECRET` | ✅ | — | — |
| `NODE_ENV` | ✅ `production` | auto | ✅ `production` |
| `API_URL` | — | ✅ Render HTTPS URL | ✅ same Render HTTPS URL |
| `NEXT_PUBLIC_API_URL` | — | ✅ Render HTTPS URL | ✅ same Render HTTPS URL |
| `NEXT_PUBLIC_BASE_URL` | — | ✅ Vercel URL | ✅ `https://rideprestige.co.uk` |
| `WEB_ORIGIN` | ✅ comma-separated all origins | — | — |
| `AUTH_SECRET` | — | ✅ | ✅ **same value as Vercel** |
| `ADMIN_SECRET` | — | ✅ | ✅ **same value as Vercel** |
| `INTERNAL_API_SECRET` | ✅ | ✅ | ✅ **same value everywhere** |
| `AUTH_GOOGLE_ID` | — | ✅ | ✅ same value |
| `AUTH_GOOGLE_SECRET` | — | ✅ | ✅ same value |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | — | ✅ | ✅ same value |
| `GOOGLE_MAPS_DISTANCE_MATRIX_API_KEY` | — | ✅ | ✅ same value |

### Render `WEB_ORIGIN` — include every web origin

The Render API's `WEB_ORIGIN` must list all allowed origins separated by commas.
Update this whenever you add or change a front-end domain:

```text
WEB_ORIGIN=https://rideprestige.co.uk,https://www.rideprestige.co.uk,https://ride-prestige-sigma.vercel.app
```

### Google Cloud Console — register the custom domain

Open the OAuth client (ID begins `558697251419-...`) at
Google Cloud Console → APIs & Services → Credentials and add:

- **Authorized JavaScript origins:** `https://rideprestige.co.uk`
- **Authorized redirect URIs:** `https://rideprestige.co.uk/api/auth/callback/google`

Google sign-in on the custom domain will return an error until both entries are saved.

### Smoke test

After starting the cPanel Node.js application, run the Section 4 smoke test with
`rideprestige.co.uk` substituted for the Vercel URL.

---

## 6. Cloud Operation

The live system does not depend on the development computer:

- Vercel serves the website and browser portals.
- Render runs the API, dispatch rules, websocket events, and ride lifecycle.
- Supabase stores accounts, vehicles, offers, rides, CMS content, and earnings.

The development computer can be switched off after both deployments are healthy.
Free Render services may sleep during inactivity, but requests wake the service
and all persistent dispatch state remains in Supabase.

---

## 7. Backup & Disaster Recovery

### What is backed up and by whom

| Data | Where | Backup owner |
|---|---|---|
| Database (all tables) | Supabase | Supabase automatic daily snapshots |
| Compliance documents | Cloudinary (production) | Cloudinary CDN — no extra action needed |
| Compliance documents | Render ephemeral disk (if Cloudinary not configured) | **Not backed up — configure Cloudinary** |
| CMS content | Supabase (same database) | Supabase automatic daily snapshots |
| Application code | GitHub | Git history |

### Confirm your Supabase backup tier

1. Open Supabase dashboard → your project → Settings → Backups.
2. **Free tier**: daily snapshots, 7-day retention. No PITR.
3. **Pro tier**: daily snapshots + Point-in-Time Recovery (PITR) to any second within the retention window.

For a production service with real customers and payments, upgrade to Pro and enable PITR before directing real traffic.

### Pre-deploy backup checklist

Before any schema change or `prisma db push` run:

```bash
# Export a full schema dump (no data, schema only — fast and safe)
supabase db dump --db-url "$DATABASE_URL" -f schema-$(date +%Y%m%d).sql

# Export data for critical tables
supabase db dump --db-url "$DATABASE_URL" --data-only \
  -t Admin -t Affiliate -t Driver -t Customer -t Booking -t Job -t Payment \
  -f data-$(date +%Y%m%d).sql
```

Store both files somewhere off-Supabase (e.g. a private GitHub gist or local file) before running the deploy.

### Restore procedure

**Scenario A — bad `db push` corrupted a table:**

1. Stop the Render service (Settings → Suspend) to prevent further writes.
2. In Supabase dashboard → Backups → select the last known-good snapshot → Restore.
   - Pro tier: use PITR to restore to one minute before the bad push.
3. Confirm the affected rows are correct via Supabase Table Editor.
4. Resume the Render service.
5. Redeploy the last known-good API commit.

**Scenario B — accidental data delete (customer/booking rows):**

1. Use Supabase PITR (Pro) or the most recent daily snapshot to identify the state of the table just before the delete.
2. Export only the affected rows from the backup (Supabase SQL editor on the restored snapshot).
3. Re-insert the missing rows into production using a targeted `INSERT ... ON CONFLICT DO NOTHING`.

**Scenario C — Render service completely lost (ephemeral disk):**

No action needed for the database — it lives in Supabase independently.
If Cloudinary is configured, documents are safe. If not, uploaded compliance documents
are unrecoverable; affiliates and drivers must re-upload them.

### Contact

- Supabase support: https://supabase.com/support
- Render support: https://render.com/support
- Cloudinary support: https://cloudinary.com/support
