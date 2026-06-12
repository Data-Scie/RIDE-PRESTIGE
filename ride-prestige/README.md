# Ride Prestige — Premium Transport Booking Platform

Sheffield-based premium transport booking website with full admin CMS panel.

---

## Quick Start (Step by Step)

### Step 1 — Install Node.js LTS
Download from https://nodejs.org and install.

### Step 2 — Open in VS Code
Open the project folder in VS Code.

### Step 3 — Install dependencies
```bash
npm install
```

### Step 4 — Start the development server
```bash
npm run dev
```

### Step 5 — Open the website
Visit: http://localhost:3000

### Step 6 — Open the admin panel
Visit: http://localhost:3000/admin/login

### Step 7 — Sign in to admin
| Field    | Value                        |
|----------|------------------------------|
| Email    | admin@rideprestige.co.uk     |
| Password | Admin123!                    |

---

## Website Pages

| Route | Description |
|-------|-------------|
| `/` | Homepage with Sheffield map + booking widget |
| `/book` | Full booking form (postcodes, passengers, vehicle) |
| `/prices` | Fare comparison across all vehicle categories |
| `/quote` | Quote review page with fare breakdown |
| `/fleet` | All vehicles: Prestige, Minibus, Coach, Taxi |
| `/promotions` | Discount codes and offers |
| `/faq` | Frequently asked questions |
| `/contact` | Contact form (Acquire London College, Sheffield) |
| `/refund` | Cancellation and refund policy |
| `/terms` | Terms and conditions |
| `/privacy-policy` | Privacy policy |
| `/thank-you` | Booking confirmation page |
| `/login` | Customer login (phone/Google) |

## Admin Panel Routes

| Route | Description |
|-------|-------------|
| `/admin/login` | Admin sign in |
| `/admin/dashboard` | Overview, stats, recent bookings |
| `/admin/bookings` | Manage all bookings (search, filter, update status) |
| `/admin/quotes` | View and process quotes |
| `/admin/support` | Customer support tickets |
| `/admin/fleet` | Edit fleet categories |
| `/admin/promotions` | Create and manage promo codes |
| `/admin/faqs` | Edit FAQ questions |
| `/admin/navigation` | Edit header navigation links |
| `/admin/content` | Edit page content and SEO |
| `/admin/pricing` | Edit fare formulas (per mile, hourly, daily rates) |
| `/admin/refund` | Edit cancellation policy rules |
| `/admin/contact-settings` | Edit phone, email, address |
| `/admin/settings` | Global site settings, branding |

---

## Pricing Formulas

| Vehicle | Formula |
|---------|---------|
| Prestige | £4.40/mile + £70/hour |
| Minibus (16-seat) | £4/mile + £420/day |
| Minibus (33-seat) | £4/mile + £600/day |
| Coach | £4/mile + £110/hour |
| Taxi | £3/mile (min £8) |

Edit these in the admin panel at `/admin/pricing`.

---

## Cancellation Policy

- Must cancel **at least 8 hours** before the ride
- Refund processed within **48 hours** of approval
- Edit at `/admin/refund`

---

## Driver Search Radius

- Default: **20 miles** from pickup postcode
- Edit in admin → Pricing Manager

---

## How to Add Google Maps API

When you're ready to integrate real maps:

### 1. Set up Google Cloud
1. Go to https://console.cloud.google.com
2. Create a project
3. Enable these APIs:
   - **Maps JavaScript API** (for map display)
   - **Places API** (for postcode/address autocomplete)
   - **Distance Matrix API** (for real distance calculation)
4. Create an API key
5. Restrict it to your domain (for security)

### 2. Add the key to .env.local
```bash
cp .env.local.example .env.local
```
Then edit `.env.local`:
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_key_here
GOOGLE_MAPS_DISTANCE_MATRIX_API_KEY=your_distance_key_here
```

### 3. Update the map component
In `src/components/map/MapPreview.tsx`:
Replace the `<iframe>` with Google Maps JavaScript API.
Full instructions are in the comments at the top of that file.

### 4. Update the distance function
In `src/lib/distance.ts`:
Replace the `estimateDistance()` function body with the real Google Maps Distance Matrix API call.
Full instructions are in the comments at the top of that file.

### 5. Restart the server
```bash
npm run dev
```

---

## npm Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

---

## Project Structure

```
src/
├── app/
│   ├── admin/          # All admin panel pages
│   ├── book/           # Booking form
│   ├── fleet/          # Fleet showcase
│   ├── prices/         # Fare comparison
│   ├── quote/          # Quote review
│   ├── refund/         # Refund policy
│   ├── contact/        # Contact page
│   └── page.tsx        # Homepage
├── components/
│   ├── home/           # Homepage sections
│   ├── layout/         # Header, Footer
│   ├── map/            # MapPreview (Sheffield / Google Maps)
│   └── admin/          # Admin UI components
├── lib/
│   ├── data.ts         # All mock data and settings
│   ├── fare.ts         # Fare calculation engine
│   └── distance.ts     # Distance estimation (ready for Google Maps)
└── types/
    └── index.ts        # TypeScript type definitions
```

---

## Deployment (Vercel — Recommended)

```bash
npm install -g vercel
vercel login
vercel --prod
```

Add environment variables in the Vercel dashboard.

---

*Built with Next.js 16, TypeScript, Tailwind CSS. Sheffield, UK.*
