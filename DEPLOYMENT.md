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
Build Command: npm install && npx prisma generate && npm run build
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
