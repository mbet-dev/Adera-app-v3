# Adera Hybrid App 🇪🇹

Ethiopia's Premier Digital Platform — a logistics (PTP) and e-commerce (Shop) hybrid monorepo for Addis Ababa.

## Architecture

This is a **hybrid monorepo** powered by Expo, React Native, and Turborepo, sharing common packages across two apps:

| App | Purpose | Entry Point |
|-----|---------|-------------|
| **adera-ptp** | Logistics — parcel delivery, partner networks, driver workflows | `apps/adera-ptp/` |
| **adera-shop** | E-commerce — product discovery, shopping, checkout | `apps/adera-shop/` |

### Shared Packages (`packages/`)

| Package | Description |
|---------|-------------|
| `@adera/auth` | Supabase authentication, role-based access, session management |
| `@adera/ui` | Material 3 theme system, shared screens, components |
| `@adera/preferences` | User preferences, biometric auth, secure storage |
| `@adera/maps` | Location services, map components |
| `@adera/utils` | QR code generation/scanning, formatters, validators |
| `@adera/payments` | TeleBirr, Chapa, ArifPay integrations |
| `@adera/localization` | i18n support (Amharic, English) |

## User Roles

- **Customer** — Send/track parcels, browse shops
- **Partner** — Manage pickup/dropoff points, scan QR codes
- **Driver** — Route management, delivery tasks, earnings
- **Staff/Admin** — Oversight, analytics, support

## Quick Start

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### Installation

```bash
npm install --legacy-peer-deps
```

### Run the PTP App (Web)

```bash
npm run dev
# or
cd apps/adera-ptp && npx expo start --web
```

Opens at **http://localhost:8081**

### Run the Shop App (Web)

```bash
npm run dev:shop
# or
cd apps/adera-shop && npx expo start --web
```

### Run on Device

```bash
# PTP App
cd apps/adera-ptp
npx expo start --android
npx expo start --ios

# Shop App
cd apps/adera-shop
npx expo start --android --port 8081
npx expo start --ios --port 8081
```

## Environment Setup

Copy `apps/adera-ptp/.env.example` to `apps/adera-ptp/.env.local` and configure:

- **Supabase** — Backend auth & database
- **TeleBirr / Chapa / ArifPay** — Payment gateways
- **Maps** — OpenStreetMap tile server

## Tech Stack

- **Framework**: Expo SDK 54 + React Native 0.81
- **Language**: JavaScript (with TypeScript-ready packages)
- **State**: Zustand
- **Forms**: Formik + Yup
- **Navigation**: React Navigation 6
- **UI**: React Native Paper (Material 3)
- **Backend**: Supabase (PostgreSQL + Auth)
- **Payments**: TeleBirr, Chapa, ArifPay
- **Maps**: React Native Maps + Leaflet (web)

## Project Structure

```
adera-hybrid-app/
├── apps/
│   ├── adera-ptp/          # Logistics app
│   │   ├── src/
│   │   │   ├── screens/    # customer, driver, partner, staff, Auth
│   │   │   ├── navigation/ # Role-based navigators
│   │   │   ├── components/ # Map views, modals
│   │   │   ├── context/    # App flow context
│   │   │   ├── hooks/      # Custom hooks
│   │   │   ├── services/   # Parcel service
│   │   │   └── utils/      # Barcode, media, hours
│   │   └── assets/
│   └── adera-shop/         # E-commerce app
│       ├── screens/
│       └── assets/
├── packages/
│   ├── auth/               # @adera/auth
│   ├── ui/                 # @adera/ui
│   ├── preferences/        # @adera/preferences
│   ├── maps/               # @adera/maps
│   ├── utils/              # @adera/utils
│   ├── payments/           # @adera/payments
│   └── localization/       # @adera/localization
├── supabase/               # Database schema, functions, migrations
└── ReferenceResources/     # Product briefs, context docs
```

## Branching Strategy

- `main` — Production-ready, auto-deploys to Vercel
- `stable` — Staging/beta, tested features
- `dev` — Active development

## License

Private — MBET Development
