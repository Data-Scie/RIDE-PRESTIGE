# Setting Up Uptime Monitoring

There's a `/health` endpoint on the API (`https://ride-prestige-api.onrender.com/health`)
but nothing currently watches it — if the API goes down, nobody finds out until
a customer complains. This is third-party account setup, not code.

## Recommended: UptimeRobot (free tier is enough)

1. Create a free account at uptimerobot.com.
2. **Add New Monitor**:
   - Monitor Type: `HTTP(s)`
   - Friendly Name: `Ride Prestige API`
   - URL: `https://ride-prestige-api.onrender.com/health`
   - Monitoring Interval: 5 minutes (free tier minimum)
3. Add a second monitor for the website:
   - URL: `https://ride-prestige-sigma.vercel.app`
4. Under each monitor's **Alert Contacts**, add the email (and optionally SMS
   or a Slack/Discord webhook) that should be notified on downtime.

That's it — UptimeRobot will email you within minutes of either service going
down or coming back up, and gives you a public/private status page for free.

## One thing to be aware of

Render's free tier spins the API down after ~15 minutes of no traffic, and the
next request takes 30-60s to wake it back up. A 5-minute monitoring interval
will keep it constantly awake (an inbound request every 5 minutes counts as
traffic), which is actually a nice side effect — but it does mean the API is
effectively never allowed to sleep once monitoring is on. If that's not
desired (e.g. to stay within free-tier hours), monitor only `/health` at a
longer interval (paid UptimeRobot plans allow 1-minute+; free tier is fixed at
5 minutes) or accept the occasional cold-start delay and monitor less
aggressively.

## If you later add Sentry (see HANDOVER.md)

Sentry's own status/uptime features overlap with this somewhat, but Sentry
tracks *application errors*, not whether the service is reachable at all — you
still want UptimeRobot (or similar) as the "is it even up" check independent
of whether the app code is running correctly.
