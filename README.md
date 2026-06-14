# Ride Prestige

Ride Prestige is a monorepo containing:

- `apps/web`: Next.js website and admin/operations portals
- `apps/api`: Express, Prisma, Socket.IO, and PostgreSQL API
- `apps/mobile-customer`: Expo customer app
- `apps/mobile-operator`: Expo affiliate and driver app

## Local Setup

Requirements: Node.js 20+, npm 10+, and PostgreSQL 18 (or Docker).

1. Install dependencies:

   ```powershell
   npm install
   ```

2. Create local environment files from the examples:

   ```powershell
   Copy-Item apps/api/.env.example apps/api/.env
   Copy-Item apps/web/.env.local.example apps/web/.env.local
   Copy-Item apps/mobile-customer/.env.example apps/mobile-customer/.env
   Copy-Item apps/mobile-operator/.env.example apps/mobile-operator/.env
   ```

3. Start PostgreSQL:

   ```powershell
   .\start-postgres.ps1
   ```

   Or use Docker:

   ```powershell
   docker compose up -d postgres
   ```

4. Create/update the schema and seed test accounts:

   ```powershell
   npm run db:generate
   npm run db:migrate -- --name init
   npm run db:seed
   ```

5. Start the API and website:

   ```powershell
   npm run dev
   ```

   Website: http://localhost:3000
   API health: http://localhost:4000/health
   API docs: http://localhost:4000/api-docs

6. Start every app in browser mode:

   ```powershell
   npm run dev:all
   ```

   Customer app: http://localhost:8081
   Operator app: http://localhost:8082

For a physical phone, change both Expo `EXPO_PUBLIC_API_URL` values from `localhost` to this computer's LAN IP.

## Verification

```powershell
npm run check
```

## GitHub

Before committing, confirm that no `.env` file is staged:

```powershell
git status
git check-ignore apps/api/.env apps/web/.env.local apps/mobile-customer/.env apps/mobile-operator/.env
git add .
git commit -m "Prepare Ride Prestige monorepo for local development"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

If `origin` already exists:

```powershell
git remote set-url origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

## Supabase Database

Supabase hosts the PostgreSQL database, not the Next.js, Express, or Expo applications.

1. Create a Supabase project.
2. Click **Connect** and copy the **Supavisor Session pooler** connection string ending in port `5432`.
3. Replace `[YOUR-PASSWORD]` and set it as `DATABASE_URL`.
4. Apply and seed the schema:

   ```powershell
   $env:DATABASE_URL="YOUR_SUPABASE_DIRECT_CONNECTION_STRING"
   npm run db:generate
   npm run db:push --workspace=apps/api
   npm run db:seed
   ```

The session pooler works on IPv4 networks and is the safest default for this Prisma API. A persistent IPv6-capable server can use Supabase's direct connection instead. Avoid transaction mode for Prisma migrations.

## Production Layout

- Deploy `apps/web` to Vercel.
- Deploy `apps/api` to Render, Railway, Fly.io, or another Node.js host.
- Use Supabase for PostgreSQL.
- Build the Expo apps with EAS.

Set `NEXT_PUBLIC_API_URL` on Vercel to the public API URL. Set `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`, and `PORT` on the API host. Set `EXPO_PUBLIC_API_URL` to the same public API URL before building each Expo app.
