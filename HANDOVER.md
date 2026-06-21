# Production Readiness — Handover Notes

This documents the 7 production-readiness gaps that were identified and
resolved. Every integration below is **fully built and code-complete**, but
several of them need real credentials from accounts that have to be created
by whoever owns the business (billing, sender identity, KYC) — an AI agent
can't and shouldn't create a Stripe/Twilio/Google account on your behalf.

Everything below follows the same pattern already used for email: **if the
relevant API key/secret isn't set, the feature is silently disabled and
nothing else changes** — no broken booking flow, no crash, no error shown to
customers. Add the key later and it activates automatically, no code changes
or redeploy logic needed (just restart/redeploy after setting the env var).

## 1. CI/CD — done, no action needed

`.github/workflows/ci.yml` runs on every push/PR to `main`: typecheck + build
for the API, typecheck + lint + build for the web app, lint for both mobile
apps. Nothing to configure — it just works once pushed to GitHub.

## 2. Staging environment — needs ~15 minutes of your time

See `STAGING.md`. This is account/dashboard setup (a second free Supabase
project, a second free Render service, a Vercel Preview environment) — no
code changes were needed or made.

## 3. Error tracking (Sentry) + uptime monitoring

**Sentry** (api + web) is fully wired and currently inert. To activate:

1. Create a free account/project at sentry.io (one project per app, or one
   shared — your call).
2. Set `SENTRY_DSN` in Render (API) and `NEXT_PUBLIC_SENTRY_DSN` in Vercel
   (web), to the DSN Sentry gives you.
3. Optional, for source-map upload on build: also set `SENTRY_ORG`,
   `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` in Vercel.
4. Redeploy. Errors will start appearing in your Sentry dashboard.

**Uptime monitoring**: see `UPTIME_MONITORING.md` — a 5-minute UptimeRobot
setup, free, no code involved.

## 4. Real payments (Stripe)

Fully built: booking creation (both the public site and the authenticated
customer API) now creates a Stripe Checkout Session for the estimated fare
and includes its URL in the response; the website redirects the customer
there to pay by card. A webhook marks the booking's `Payment` record `paid`
once Stripe confirms it.

To activate:

1. Create a Stripe account (or use an existing one) at stripe.com.
2. Render env vars: `STRIPE_SECRET_KEY` (from Stripe dashboard → Developers →
   API keys).
3. In Stripe dashboard → Developers → Webhooks, add an endpoint:
   `https://ride-prestige-api.onrender.com/api/public/stripe/webhook`,
   listening for `checkout.session.completed` and `checkout.session.expired`.
   Copy the signing secret it gives you into Render as `STRIPE_WEBHOOK_SECRET`.
4. Optional: set `NEXT_PUBLIC_STRIPE_KEY` in Vercel if you want the
   publishable key available client-side later (not required for the current
   Checkout-redirect flow, which only needs the secret key server-side).
5. Test with Stripe's test-mode keys first, using their test card
   `4242 4242 4242 4242`, before switching to live keys.

**Until this is configured, the booking flow works exactly as it does
today** — customers book on an estimate, no payment is collected, ops/admin
manage payment manually (cash/bank transfer) as they currently do.

## 5. Real email + SMS

**Email was already fully built** — it just needed a key. Set `RESEND_API_KEY`
in Render (resend.com, free tier covers low volume) and confirmation emails
start sending for real instead of logging `[Email disabled]`.

**SMS is newly built** (`apps/api/src/services/smsService.ts`, via Twilio).
Booking confirmation texts now send to the customer's phone alongside the
email, once configured:

1. Create a Twilio account, buy a phone number (or use their free trial
   number for testing).
2. Render env vars: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`,
   `TWILIO_FROM_NUMBER`.

`sendSms()` is generic — it's currently wired to booking confirmation only,
but can be called from anywhere else in the API (driver assigned, ride
status updates, etc.) the same way `sendTransactionalEmail()` already is.

## 6. Real geocoding (Google Maps)

**Already fully built** — fare distance calculation already calls Google's
real Distance Matrix API and only falls back to the estimate-based mock when
no key is set. Set `GOOGLE_MAPS_DISTANCE_MATRIX_API_KEY` in Render (Google
Cloud Console → enable "Distance Matrix API", needs billing enabled but has a
generous free monthly quota) to switch from estimated to real road distances.

(`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is a separate, browser-restricted key for
any future live map display on the website — not required for fare
calculation.)

## 7. Cookie consent, analytics, structured data — done, mostly no action needed

- A cookie consent banner now appears on first visit to the public site.
  Visitors must accept before any tracking script loads.
- Google Analytics 4 is wired but only loads after consent **and** only if
  `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set in Vercel (get this from
  analytics.google.com after creating a GA4 property — free).
- JSON-LD structured data (LocalBusiness schema) now renders on every public
  page, sourced live from the same site name/address/phone/email you already
  manage in the admin CMS settings — no action needed, it's already live.

## What still isn't addressed

These were out of scope for this pass — flagging so they're not forgotten:

- No real-time driver location tracking on a live map for customers.
- No automated unit or browser/E2E test suite (5 backend integration scripts
  exist and now cover the Stripe-unconfigured path too, but there's no
  Jest/Playwright suite).
- No formal backup/disaster-recovery procedure beyond Supabase's own
  automatic backups (which exist on their paid tiers, not their free tier —
  worth checking what plan you're on).
