# Setting Up a Staging Environment

Today, local development and production both point at the **same** Supabase
database (see `DEPLOYMENT.md`). That's fine for a small team, but it means
local testing can touch real customer/booking data, and there's no safe place
to test a risky change before it reaches production.

This is config/account setup, not code — nothing in the repository needs to
change. It takes about 15 minutes.

## 1. Create a second, free Supabase project

1. In Supabase, click **New project**. Name it `ride-prestige-staging`.
2. Once it's provisioned, copy its two connection strings (same place as the
   production ones — Connect dialog → Transaction pooler / Session pooler).
3. Run the schema + seed against it, from the repo root:

   ```powershell
   $env:DATABASE_URL="STAGING_TRANSACTION_POOLER_URL"
   $env:DIRECT_URL="STAGING_SESSION_POOLER_URL"
   npm run db:generate
   npm run db:push --workspace=apps/api
   npm run db:seed
   ```

## 2. Create a second Render service for the staging API

1. Render → **New Web Service**, same repo, same settings as the production
   one in `DEPLOYMENT.md` section 2, but:
   - Name it `ride-prestige-api-staging`.
   - Branch: `staging` (create this branch in GitHub if it doesn't exist yet).
   - Use the **staging** Supabase connection strings from step 1.
   - Use a different `JWT_SECRET` than production (so staging tokens can
     never be replayed against production or vice versa).
2. After it deploys, confirm `https://ride-prestige-api-staging.onrender.com/health`
   returns `"status":"ok"`.

## 3. Point a Vercel Preview environment at staging

Vercel already builds a free **Preview Deployment** automatically for every
branch/PR that isn't `main` — you don't need a second Vercel project.

1. Vercel project → **Settings → Environment Variables**.
2. Add `NEXT_PUBLIC_API_URL` and `API_URL` scoped to **Preview** only (not
   Production), pointing at the staging Render URL from step 2.
3. Push to the `staging` branch (or open a PR against it) and Vercel will
   build a preview at a `*.vercel.app` URL wired to the staging API + DB.

## 4. Day to day

- Test risky changes (migrations, dispatch logic, anything touching money)
  against the `staging` branch/environment first.
- Point your local `.env`/`.env.local` at the staging Supabase project instead
  of production, so local dev no longer touches real customer data:

  ```text
  DATABASE_URL=STAGING_TRANSACTION_POOLER_URL
  DIRECT_URL=STAGING_SESSION_POOLER_URL
  NEXT_PUBLIC_API_URL=https://ride-prestige-api-staging.onrender.com
  ```

- Promote a change to production the normal way: merge `staging` → `main`.
- Re-run `npm run db:push --workspace=apps/api` against staging whenever the
  Prisma schema changes there, same as you already do for production.
