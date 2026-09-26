# Ride Prestige — Production Readiness Audit

**Date:** 2026-06-27
**Scope:** Full monorepo — `apps/api` (Express/Prisma/PostgreSQL), `apps/web` (Next.js, 5 portals + public site), `apps/mobile-customer`, `apps/mobile-operator`, CI/CD, deployment topology (Vercel + Render + cPanel/`rideprestige.co.uk` + Supabase).
**Method:** Five parallel full-file audits (database/Prisma, API security/correctness, frontend wiring, integrations/mobile, DevOps/testing/observability), each citing exact `file:line` locations, synthesized and de-duplicated below. This is a snapshot — re-verify file:line citations before acting, since the codebase moves fast (multiple deploys/day per recent commit history).

This is a punch list. Work top to bottom; each item is scoped to be fixable independently.

## Severity legend

| Severity | Meaning |
|---|---|
| 🔴 Critical | Data breach, data loss, or production-blocking risk. Fix before more real traffic. |
| 🟠 High | Real functional or security gap with material business impact. Fix soon. |
| 🟡 Medium | Real gap, lower likelihood or impact, or partial mitigation already exists. |
| 🟢 Low | Hygiene / polish / future-proofing. No urgent exposure. |

| Severity | Count |
|---|---|
| 🔴 Critical | 5 |
| 🟠 High | 11 |
| 🟡 Medium | 15 |
| 🟢 Low | 10 |

---

## 🔴 Critical

### C1. Driver/affiliate compliance documents are publicly readable with no auth
**Where:** `apps/api/src/index.ts:89` (`app.use('/uploads', express.static(...))`), `apps/api/src/lib/documentUpload.ts:27-38`
When Cloudinary isn't configured, ID documents, DBS checks, insurance certificates, and driving licences are written to local disk and served from `/uploads/documents/...` with **zero auth middleware**. Filenames are only `Date.now()`-prefixed (predictable, not a random token); the owner ID in the path is a normal database ID, not a secret. Anyone with or guessing a URL can pull another person's compliance documents — a real PII/GDPR exposure for a UK company.
**Fix:** Put auth (or signed/expiring URLs) in front of `/uploads/documents/*` specifically, or require Cloudinary (with private/signed delivery) for compliance documents. Keep `/uploads/vehicles` (marketing photos) public if that's intentional.

### C2. IDOR — any affiliate can read any other affiliate's full job detail
**Where:** `apps/api/src/routes/affiliate.ts:289-297` (`GET /api/affiliate/jobs/:id`)
This route does `prisma.job.findUnique({ where: { id } })` with **no `affiliateId` filter** — every sibling route (`/accept`, `/reject`, `/assign-driver`, etc.) correctly scopes by `affiliateId`, but this GET was missed. Any authenticated affiliate can enumerate job IDs and read another affiliate's/customer's PII, fare, and addresses.
**Fix:** Scope with `findFirst({ where: { id, OR: [{ affiliateId: affId }, { status: 'awaiting_affiliate', affiliateId: null }] } })`, matching the pattern already used at `affiliate.ts:706-716`.

### C3. No versioned migrations — production schema changes via `prisma db push`
**Where:** `apps/api/prisma/migrations/` (only 5 narrow migrations vs. ~30 models), `DEPLOYMENT.md:46,63`
The documented Render build command runs `npx prisma db push` directly against the live Supabase database. There is no reviewable SQL diff, no rollback path, and `db push` can silently drop/alter columns. The 5 migration folders that exist are stale leftovers, inconsistent with how the schema is actually deployed today.
**Fix:** Pick one: switch to `prisma migrate deploy` with a regenerated baseline migration, or consciously accept `db push` and delete the misleading stale migrations folder.

### C4. No documented backup / disaster-recovery procedure
**Where:** checked `DEPLOYMENT.md`, `HANDOVER.md`, `STAGING.md`, `UPTIME_MONITORING.md`, `README.md` — none mention Supabase backup retention, point-in-time recovery, or a restore runbook.
Combined with C3 (no migration rollback path), a bad schema push or accidental delete has **no documented way back**.
**Fix:** Confirm Supabase's backup/PITR tier for this project and write a one-page restore runbook.

### C5. CI is fully decoupled from deployment
**Where:** `.github/workflows/ci.yml` (typecheck/build/lint only, no deploy gate)
Render and Vercel both auto-deploy on push to `main` independently of GitHub Actions results. **A failing CI run does not block production deployment.**
**Fix:** Enable "require status checks to pass" branch protection on `main` in GitHub repo settings, or move off auto-deploy-on-push toward a CI-gated deploy trigger.

---

## 🟠 High

### H1. Uploaded documents live on Render's ephemeral disk unless Cloudinary is confirmed configured in production
**Where:** `apps/api/src/lib/documentUpload.ts:27-38`
Related to C1 but distinct: Render web services have no persistent disk by default. If `CLOUDINARY_*` env vars aren't actually set on the live Render service, every redeploy/restart silently wipes all uploaded compliance documents, leaving DB rows pointing at 404s.
**Fix:** Confirm `CLOUDINARY_*` is set in Render's production environment right now. If not, either set it or attach a Render persistent Disk mounted at the uploads path.

### H2. Unbounded/N+1 queries remaining after the prior "fix unbounded queries" pass
**Where:** `apps/api/src/routes/ops.ts:860-868` (3 extra queries per affiliate row, no pagination), `ops.ts:152-154` (unbounded affiliate/driver/vehicle lists with deep includes), `ops.ts:998-1006` (unbounded driver list, no filter at all), `admin.ts:1016-1024` (unbounded affiliate list)
These four were missed by the earlier optimization pass (commit "Fix unbounded queries that would not survive real traffic at scale"). Will degrade as data grows.
**Fix:** Add `take`/`skip` pagination to all four; replace the per-affiliate count loop with a single aggregate/`groupBy` query.

### H3. Admin/ops customer & job stat endpoints scan up to 5000 rows per request
**Where:** `apps/api/src/routes/admin.ts:1269-1357`, `apps/api/src/routes/ops.ts:1210-1270`
Both pull up to 5000 `Job` rows plus an unbounded `Customer.findMany()` and aggregate in JS. The code's own comment acknowledges this undercounts once job volume exceeds the window.
**Fix:** Move aggregation (totalJobs, totalSpend, avg rating) into SQL `groupBy`.

### H4. No rate limiting beyond login + the generous global limiter
**Where:** `apps/api/src/index.ts:116-117` (global 500/15min, login 60/15min — nothing else)
Registration, forgot-password, public quote, public booking, and contact endpoints share only the global limiter. Booking/registration writes trigger email+SMS sends — a cost-amplification abuse vector.
**Fix:** Add dedicated limiters (~10-20/15min) on registration, forgot-password, contact, quote, and booking.

### H5. `portal-credentials.txt` (real demo passwords) is untracked but not gitignored
**Where:** repo root; `git check-ignore` confirms it is not covered by any `.gitignore` rule.
A routine `git add -A`/`git add .` would commit live credentials.
**Fix:** Add `portal-credentials.txt` to `.gitignore` now; check `git log --all --full-history -- portal-credentials.txt` to confirm it was never previously committed, and rotate the listed credentials if it was.

### H6. Stripe payment is decoupled from booking success — no idempotency, no cancel reconciliation
**Where:** `apps/api/src/services/paymentService.ts:30-71`, `routes/customer.ts:441-453,477-497`, `routes/public.ts:531-543`
A booking is confirmed and dispatched to affiliates **regardless** of whether the Stripe checkout session is created, fails, or Stripe isn't configured at all. No idempotency key is passed to `stripe.checkout.sessions.create`, so a network retry/double-submit can create two sessions for one booking. Cancelling a booking never expires the Stripe session or updates the `Payment` row — cancelled bookings leave orphaned `pending` Payment rows, and a late payment completion after cancellation is still marked `paid` with no reconciliation.
**Fix:** Add an idempotency key (e.g. bookingId) to session creation; expire/reconcile the Stripe session and `Payment` row on cancel; decide whether payment should gate dispatch.

### H7. Profile-fetch failures across nearly every portal show zero error feedback
**Where:** `apps/web/src/app/account/layout.tsx:90`, `app/affiliate/layout.tsx:93`, `app/driver/layout.tsx:110`, 10+ admin pages (e.g. `app/admin/fleet/page.tsx:38`, `app/admin/settings/page.tsx:52`)
All use `.catch(() => {})` on the initial data load. If the API is down or returns a 5xx, the page silently renders blank with no explanation.
**Fix:** Surface a toast/banner on catch; at minimum log the error and set visible error state.

### H8. Booking quote-fetch failure is silently swallowed on the main booking form
**Where:** `apps/web/src/app/book/BookPageClient.tsx:91`
`catch { setLoading(false); }` — the button just stops spinning with no error message if quote generation fails. This is the single most business-critical form in the app.
**Fix:** Add an error state and render it, mirroring the pattern already correctly used in `QuoteClient.tsx:78-81`.

### H9. The cPanel/custom-domain deployment path is completely undocumented
**Where:** `DEPLOYMENT.md`, `STAGING.md`, `HANDOVER.md` — none mention cPanel, `rideprestige.co.uk`, or `output: "standalone"`.
This is the confirmed root cause of the CORS + sign-in incident just fixed this session: `apps/api/.env.example` and `DEPLOYMENT.md` only ever show the Vercel URL as the example `WEB_ORIGIN` value.
**Fix:** Add a "cPanel Node host" section to `DEPLOYMENT.md` documenting the standalone build steps and an explicit env-var-parity checklist (variable × Render/Vercel/cPanel columns).

### H10. The `output: "standalone"` config change is still uncommitted
**Where:** `apps/web/next.config.ts` — `git status` shows it modified, not committed, as of this audit.
Required for the cPanel build. If lost (`git checkout .`, branch switch, etc.) the cPanel deploy process silently regresses.
**Fix:** Commit this alongside the new "cPanel deployment" documentation section (H9).

### H11. Zero unit tests; only integration scripts, and none run in CI
**Where:** `apps/api/package.json` scripts (`test:ride-lifecycle`, `test:driver-applications`, `test:independent-dispatch`, `test:affiliate-dispatch-visibility`, `test:affiliate-allocation-lifecycle`, `test:document-override-approval`) — all require a live DB, none are invoked by `.github/workflows/ci.yml`. No Jest/Vitest/Mocha anywhere. No Playwright/Cypress config or `*.test.*`/`*.spec.*` files tracked in git.
CI only catches type errors and build failures — not regressions in dispatch, payment, or auth logic, the riskiest code paths.
**Fix:** Add a CI job with a real Postgres service container that runs the 6 existing integration scripts on every PR.

---

## 🟡 Medium

### M1. `onDelete` relation behavior is inconsistent and mostly left at Prisma's default
**Where:** `schema.prisma:90` (`Driver.affiliate`), `:171` (`FleetVehicle.affiliate`) default to `Restrict`; `:173` (`FleetVehicle.ownerDriver`) uses `SetNull`; document/offer tables use `Cascade`. No documented policy.
Low risk today (the app soft-deletes via status flags), but any future hard-delete path (e.g. GDPR erasure) will hit unhandled `Restrict` errors.
**Fix:** Add explicit `onDelete` to every relation per a documented policy.

### M2. Status fields are free-text strings, not enums, across ~15 columns
**Where:** `Job.status`, `Booking.status`, `Driver.status/applicationStatus/documentsStatus`, `FleetVehicle.status/approvalStatus`, `Payment.status`, `EarningEntry.status`, etc.
The database enforces nothing on these — a typo'd status string is accepted silently; only application code validates it, inconsistently across 8 route files.
**Fix:** Convert at least `Job.status`, `Booking.status`, `Driver.applicationStatus` to real Prisma enums.

### M3. `Customer.phone`/`passwordHash` nullable for Google auth with no DB-level "phone OR Google" constraint
**Where:** `apps/api/prisma/migrations/20260622043000_customer_google_auth/migration.sql:1-2`
Mostly handled defensively in application code (`customer.ts:307`), but not universally — worth an audit pass on every read of `Customer.phone`.

### M4. Duplicate route definition
**Where:** `apps/api/src/routes/public.ts:23-34` and `:684-695` — `GET /affiliates` defined twice, identically.
Dead/confusing code; quick cleanup.

### M5. Minimal schema validation on admin/affiliate writes
**Where:** `admin.ts:1494-1506` (pricing config — accepts negative rates/absurd commission %), `2029-2030`, `2061-2062`, `2093-2094` (vacancies/courses/attributes)
Validation is selectively applied (contrast `affiliate.ts:1097`, which does validate vehicle category against an allow-list) — not systemic. Money-affecting fields have no bounds checking.
**Fix:** Add zod schemas at minimum for pricing/promotions/site-settings and vehicle registration.

### M6. Admin/ops compliance overrides have no audit trail and no role separation
**Where:** `admin.ts:63-72, 858-883, 1181-1219` — force-approve flows bypass expired MOT/insurance/missing-document checks with no logged actor/reason, and `ops` shares the same override power as `admin`.
**Fix:** Log overrides explicitly (actor, role, reason); consider restricting override capability to `admin` only.

### M7. Stripe redirect URLs fall back to the Vercel demo domain if `WEB_ORIGIN` is unset
**Where:** `apps/api/src/services/paymentService.ts:18-20`
Could silently misdirect checkout success/cancel redirects in a misconfigured prod deploy.

### M8. All portal JWT cookies are `httpOnly: false` by design, with no CSP
**Where:** `app/api/admin/login/route.ts:33`, `ops/login`, `affiliate/login`, `driver/login` routes
Deliberate so `lib/api-client.ts` can read the cookie client-side — but any XSS on these pages can exfiltrate the session token directly via `document.cookie`. A server-side proxy (`app/api/backend/[...path]/route.ts`) already exists and could eliminate the need for client-readable cookies.
**Fix:** Route portal API calls through the existing proxy and make cookies httpOnly; at minimum add a CSP header.

### M9. Hardcoded third-party stock photo in the fleet page, not CMS-managed
**Where:** `apps/web/src/app/fleet/FleetClient.tsx:156` — Unsplash photo hotlinked for the taxi category banner, unlike every other vehicle image which pulls from CMS data.

### M10. CMS content can be stale up to 60 seconds, not real "no-store"
**Where:** `apps/web/src/lib/cms.ts:21-23` uses `next: { revalidate: 60 }`, not `cache: 'no-store'`; no `revalidatePath`/`revalidateTag` call exists anywhere in `apps/web`.
Contradicts the assumption (recorded in prior project memory) that admin edits are instantly live — they can take up to a minute.

### M11. Email/SMS only cover one lifecycle event — booking creation
**Where:** grep across `apps/api/src` found `sendTransactionalEmail`/`sendSms` called only from the two booking-creation routes.
No password-reset email, ride-reminder notification email/SMS (the in-app reminder scheduler exists, but doesn't email/text), driver-assigned/en-route notification, cancellation confirmation, or payment-confirmed receipt despite the Stripe webhook existing.

### M12. Mobile Google Sign-In env var is undocumented
**Where:** `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` is read in `apps/mobile-customer/app/auth/login.tsx:25` but absent from `.env.example` — silent misconfiguration risk for anyone setting up the project fresh.

### M13. Single shared Supabase database for local dev AND production — still in effect
**Where:** `STAGING.md:3-6` describes this in present tense as the current state; the doc is an unexecuted plan, not a completed migration to a separate staging DB.
Any local script run (including `db:reset-demo`) can mutate real customer/booking data.
**Fix:** Execute `STAGING.md`'s plan — treat it as a punch-list item, not just documentation.

### M14. Render free-tier cold-start risk isn't flagged as a go-live blocker
**Where:** `DEPLOYMENT.md:125`, `UPTIME_MONITORING.md:25-33` mention the 50+ second cold-start as a quirk to poll around, not as something to fix before directing real customer traffic at `rideprestige.co.uk`.
**Fix:** Add an explicit go-live gate: upgrade Render to a paid plan before real customer traffic.

### M15. `artifacts/` deployment bundles only partially gitignored
**Where:** `.gitignore` only excludes `artifacts/local-dev/` and `artifacts/live-demo/demo-account.json` — not the root `artifacts/` directory, so the multi-MB `ride-prestige-cpanel-node.tar.gz`/`.zip` bundles are one `git add -A` away from being committed (same root cause as H5).

---

## 🟢 Low

### L1. `seed.ts` instantiates its own `PrismaClient` instead of using the shared singleton
**Where:** `apps/api/prisma/seed.ts:4`. Harmless (disconnects on exit) but inconsistent with `lib/db.ts`'s singleton pattern used everywhere else.

### L2. Most route catch blocks swallow error detail with no logging
**Where:** most of `admin.ts`/`ops.ts`/`public.ts` (e.g. `public.ts:53,73,94`) return a generic 500 with no `console.error`/Sentry capture — not a client-facing leak, but it hurts incident diagnosis.

### L3. No startup-time sanity log of resolved CORS `allowedOrigins`
**Where:** `apps/api/src/index.ts:61-79`. A misconfigured `WEB_ORIGIN` fails silently rather than logging what was actually parsed.

### L4. Dead/unused fare-config exports
**Where:** `apps/web/src/lib/fare.ts:131-135` and a duplicate in `lib/data.ts:258` — zero references anywhere, leftover from before the real `/api/public/quote` backend replaced client-side fare math. Risk of a future dev wiring to the stale config by mistake.

### L5. Missing per-page metadata on several public pages
**Where:** `contact`, `faq`, `fleet`, `terms`, `privacy-policy`, `rate-ride` pages have no `generateMetadata`, unlike the homepage which pulls SEO fields from the CMS.

### L6. Stripe test/live key mode isn't distinguished or guarded
**Where:** `paymentService.ts:7-16` — whichever `STRIPE_SECRET_KEY` is set is used blindly, no warning if a live key ends up in a non-prod environment.

### L7. Mobile apps default to `localhost` API URL if env var is unset
**Where:** `apps/mobile-customer/services/api.ts:5`, `apps/mobile-operator/services/apiClient.ts:6` — documented, intentional dev fallback, but confirm `eas.json` build profiles actually inject `EXPO_PUBLIC_API_URL` for `preview`/`production` (not found in the file reviewed).

### L8. Push notification token fetch omits explicit `projectId`
**Where:** `services/pushNotifications.ts` in both mobile apps — likely auto-resolves on Expo SDK 54, but unconfirmed against a real standalone build.

### L9. No structured logging or request tracing
**Where:** `morgan('combined')` + ~28 scattered `console.log/error/warn` calls across 9 files. No correlation/request-ID propagation. Low priority at current scale.

### L10. No Dependabot or `npm audit` in CI; some bleeding-edge/beta package versions
**Where:** no `.github/dependabot.yml`; `apps/web/package.json` pins `next: 16.2.6`, `react/react-dom: 19.2.4`, `next-auth: ^5.0.0-beta.31` — worth confirming these are intentional and not a typo'd/inflated range, and that a beta major-version auth library is an accepted production risk.

---

## ✅ Verified clean — confirmed working, no action needed

- AuthN coverage is complete: every role-gated route file (`admin`, `finance`, `ops`, `affiliate`, `driver`, `customer`) applies its auth gate at the top of the file with no escape hatches.
- `JWT_SECRET` has no weak fallback — throws at startup if unset.
- Stripe webhook signature verification is enforced and reachable; raw body is correctly mounted before the JSON parser.
- Socket.IO requires a valid JWT at handshake; room-join ownership is checked for customer/driver roles; location broadcasts can't be spoofed (driver ID comes from the verified token, not client input).
- Every other `:id`-scoped route besides C2 correctly scopes by owner — this was a single regression, not a systemic pattern.
- Prisma singleton (`lib/db.ts`) is correctly implemented; all 8 route files use the shared client (seed.ts is the sole, harmless exception — L1).
- `DATABASE_URL`/`DIRECT_URL` are correctly split for Supavisor pooling.
- `seed.ts` and the demo-reset script match the current schema with no field drift.
- The CORS origin regex is properly anchored (no substring-bypass risk); the new comma-separated `WEB_ORIGIN` parsing is sound.
- All 4 portal login pages are still correctly excluded from the authenticated shell (a previously-fixed bug stayed fixed).
- Cookie encode/decode is symmetric — the previously-reported JWT-corruption bug is not present.
- No hardcoded production URLs found anywhere in `apps/web/src`; `NEXT_PUBLIC_API_URL` vs `API_URL` usage is consistent and correctly scoped server/client.
- Remaining `window.alert`/`prompt` usages are low-frequency admin/ops confirmations, not regressions of the previously-fixed pattern.
- Maps/geocoding has a real implementation with a genuine (non-crashing) fallback when no API key is present.
- Sentry is genuinely wired on both API and web (correct init order, correctly gated on DSN presence) — not dead code.
- Mobile app bundle identifiers and EAS project IDs are real, not placeholders.
- Secrets hygiene is otherwise solid: no real `.env` files are tracked in git; `.gitignore` correctly covers env file patterns.
- Email/SMS services genuinely no-op (not crash) when keys are absent.

---

## Recommended order of execution

1. **C1, C2** — close the two live data-exposure holes (auth on `/uploads/documents`, the affiliate IDOR). These are exploitable right now.
2. **H5, M15** — gitignore `portal-credentials.txt` and `artifacts/`, confirm neither was ever committed.
3. **H9, H10** — commit the `standalone` config and document the cPanel path, so the deployment that's currently being fixed live doesn't regress again.
4. **C5** — wire up branch protection so this kind of thing gets caught before prod next time.
5. **H1** — confirm Cloudinary is actually configured in the Render production environment.
6. **H6** — fix the payment/booking decoupling; this is a revenue-integrity issue.
7. **C3, C4** — decide a migration strategy and write the backup runbook (these are process fixes, can run in parallel with the above).
8. **H7, H8** — restore error visibility on the booking form and portal dashboards (cheap, high user-trust payoff).
9. Everything else in High, then Medium, then Low — none of the rest are urgent, but H2-H4, H11, M13, M14 matter most before real paying-customer volume.
