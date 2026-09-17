# System Architecture

## High-Level

```
Expo Apps (PTP + Shop)
    ↓
Shared Packages (@adera/ui, auth, preferences, maps, utils, payments, localization)
    ↓
Supabase (PostgreSQL + Auth + Storage + Real-time)
    ↓
External APIs (Chapa, TeleBirr, OpenStreetMap)
```

## Monorepo Structure

```
adera-hybrid-app/
├── apps/
│   ├── adera-ptp/          # Logistics app (primary entry point)
│   │   ├── App.js          # Root: onboarding → app selector → auth → role routing
│   │   ├── src/
│   │   │   ├── screens/    # customer, driver, partner, staff, Auth, shop
│   │   │   ├── navigation/ # Role-based navigators + ShopNavigator
│   │   │   ├── components/ # MapView, modals, notification bell
│   │   │   ├── context/    # AppFlowContext
│   │   │   ├── hooks/      # usePartners, useParcelHistory, useCameraPermission
│   │   │   ├── services/   # parcelService (Supabase CRUD)
│   │   │   └── utils/      # barcode, media, operatingHours
│   │   └── assets/
│   └── adera-shop/         # E-commerce app (maintained separately)
│       ├── App.js          # Standalone entry point
│       ├── screens/        # MarketDiscovery, ProductDetail, Cart, Orders
│       ├── store/          # cartStore (Zustand)
│       ├── components/     # NotificationBell
│       └── hooks/
├── packages/
│   ├── ui/                 # @adera/ui — theme, components, screens
│   ├── auth/               # @adera/auth — Supabase auth, Zustand store
│   ├── preferences/        # @adera/preferences — theme/language/biometric
│   ├── maps/               # @adera/maps — location services
│   ├── utils/              # @adera/utils — QR, formatters, validators
│   ├── payments/           # @adera/payments — Chapa (implemented), TeleBirr/ArifPay (stubs)
│   └── localization/       # @adera/localization — i18n with English + Amharic
├── supabase/               # Database schema, functions, migrations
├── memory/                 # Project knowledge bank
└── ReferenceResources/     # Product briefs, context docs
```

## Key Patterns

- **Auth**: Zustand store with persist middleware, Supabase onAuthStateChange listener
- **Navigation**: React Navigation 6 with role-based stack/tab navigators
- **Theming**: Material 3 via ThemeProvider context + React Native Paper
- **State**: Zustand for auth (persisted) and cart (ephemeral)
- **Database**: PostgreSQL with RLS, triggers for user creation, event-driven parcel tracking
