# Ride Prestige — Affiliate & Driver App

A professional React Native (Expo) app for **Ride Prestige** affiliates and drivers.  
Companion to the Customer-End app. Built with the same tech stack, colour palette, and design language.

---

## Tech Stack

| Area | Technology |
|------|-----------|
| Framework | Expo SDK 54 |
| Language | TypeScript (strict) |
| Navigation | Expo Router v6 (file-based) |
| Styling | React Native StyleSheet |
| State | React Context + useState |
| Animations | react-native-reanimated |
| Icons | @expo/vector-icons |

---

## Quick Start

```bash
cd "affilate and driver app"
npm install
npx expo start
```

Open on device via **Expo Go** or press `a` (Android) / `i` (iOS) / `w` (Web).

---

## App Roles & Navigation

### Affiliate
Dashboard → New Jobs → Accepted Jobs → Drivers → Vehicles → Earnings → Profile

- View incoming ride requests (customer-accepted jobs)
- Accept or reject jobs
- Allocate driver and vehicle to accepted jobs
- Manage driver roster
- Manage vehicle fleet
- Track earnings and commissions

### Affiliate Driver
Dashboard → Available Jobs (assigned only) → My Jobs → Current Ride → Earnings → Profile

- Sees **only** jobs assigned by their affiliate
- Cannot see open marketplace jobs
- Updates ride status through the journey timeline

### Independent Driver
Dashboard → Available Jobs (open) → My Jobs → Current Ride → Earnings → Profile

- Sees **open jobs** offered directly by Ride Prestige/admin
- Can accept or decline offered jobs
- Manages own documents and vehicle information

---

## Folder Structure

```
affilate and driver app/
├── app/
│   ├── _layout.tsx              Root Stack + AuthProvider
│   ├── index.tsx                Auth redirect
│   ├── (auth)/                  Authentication screens
│   │   ├── welcome.tsx
│   │   ├── login.tsx
│   │   ├── register-choice.tsx
│   │   ├── affiliate-registration.tsx
│   │   ├── driver-registration.tsx
│   │   ├── pending-approval.tsx
│   │   └── forgot-password.tsx
│   ├── (affiliate)/             Affiliate tab group
│   │   ├── _layout.tsx          Tab navigator
│   │   ├── index.tsx            Dashboard
│   │   ├── new-jobs.tsx
│   │   ├── accepted-jobs.tsx
│   │   ├── drivers.tsx
│   │   ├── vehicles.tsx
│   │   ├── earnings.tsx
│   │   └── profile.tsx
│   ├── (driver)/                Driver tab group
│   │   ├── _layout.tsx          Tab navigator
│   │   ├── index.tsx            Dashboard
│   │   ├── available-jobs.tsx
│   │   ├── my-jobs.tsx
│   │   ├── current-ride.tsx
│   │   ├── earnings.tsx
│   │   └── profile.tsx
│   ├── job-details.tsx          Shared job detail (affiliate + driver)
│   ├── allocate-driver.tsx
│   ├── allocate-vehicle.tsx
│   ├── add-driver.tsx
│   ├── driver-details.tsx
│   ├── add-vehicle.tsx
│   ├── vehicle-details.tsx
│   ├── ride-history.tsx
│   ├── documents.tsx
│   ├── notifications.tsx
│   └── settings.tsx
├── components/
│   ├── cards/                   JobCard, DriverCard, VehicleCard, DashboardCard
│   ├── common/                  ThemedText, ThemedView, StatusBadge
│   ├── forms/                   FormInput
│   └── layout/                  ScreenWrapper, SectionHeader
├── constants/
│   └── theme.ts                 Colours, fonts, spacing
├── context/
│   └── AuthContext.tsx          Role-based auth state
├── data/                        Static seed/reference data
├── hooks/                       use-color-scheme, use-theme-color
├── services/                    API service layer connected to backend
├── types/
│   └── index.ts                 All TypeScript interfaces
└── utils/
    └── helpers.ts               Formatting and colour helpers
```

---

## Service Layer (Backend Integration)

All services are in `services/`. They call the Ride Prestige backend configured by `EXPO_PUBLIC_API_URL`:

| Service | File |
|---------|------|
| Auth | `services/authService.ts` |
| Affiliate | `services/affiliateService.ts` |
| Driver | `services/driverService.ts` |
| Jobs | `services/jobService.ts` |
| Vehicles | `services/vehicleService.ts` |
| Documents | `services/documentService.ts` |
| Earnings | `services/earningsService.ts` |
| Notifications | `services/notificationService.ts` |

For local testing, set `EXPO_PUBLIC_API_URL` in `.env`. Production builds should point at the Render API.

---

## Design Language

Matches the Customer-End app:

- **Background**: `#030303` (near-black)
- **Gold accent**: `#D7B46A` (Rose Gold)
- **Button gold**: `#C9A24A`
- **Text**: `#F8F3EF` (warm white)
- **Muted**: `#B8B0A4`
- **Card bg**: `#111211`
- **Border**: `#342F24`
- **Font**: Avenir Next (iOS) / sans-serif-medium (Android)

---

## Status Logic

The app follows the backend job lifecycle:

1. `awaiting_affiliate` → Affiliate accepts → `needs_allocation`
2. `needs_allocation` → Assign driver → `driver_assigned`
3. `driver_assigned` → Assign vehicle → `vehicle_assigned`
4. `vehicle_assigned` → Driver accepts → `driver_accepted`
5. `driver_accepted` → Start journey → `on_route`
6. `on_route` → Arrive pickup → `arrived_pickup`
7. `arrived_pickup` → Passenger boards → `passenger_onboard`
8. `passenger_onboard` → Complete ride → `completed`

---

## Notes

- Seed/reference data uses UK-based Ride Prestige locations (Manchester Airport, Heathrow, Sheffield, Leeds, etc.)
- The customer app and operator app both call the backend API
- This app runs independently with its own package.json
- The `@/` import alias resolves to the project root
