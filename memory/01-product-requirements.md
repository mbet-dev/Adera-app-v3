# Product Requirements

## Core User Roles
- **Customer** — Send/track parcels, browse shops
- **Partner** — Manage pickup/dropoff points, scan QR codes
- **Driver** — Route management, delivery tasks, earnings
- **Staff/Admin** — Oversight, analytics, support

## Core Flows
1. **Parcel Creation**: 4-step wizard (recipient → package → locations → payment)
2. **Parcel Tracking**: Real-time with Supabase subscriptions + offline cache
3. **Shop Browsing**: Product grid with FTS, categories, sort
4. **Checkout**: Cart → payment gateway → order confirmation
5. **Partner Management**: Dashboard, QR scanning, earnings

## Payment Methods
- TeleBirr (Ethiopian mobile money) — stub, pending full implementation
- Chapa (Ethiopian payment gateway) — **primary**, implemented
- ArifPay — stub, pending implementation
- Adera Wallet — stub, pending implementation
- Cash on Delivery — supported

## Localization
- English (default)
- Amharic (አማርኛ) — translation strings defined, UI integration pending

## Design Principles
- Material 3 with Ethiopian cultural elements
- WCAG AA contrast compliance
- Dark/light/system theme support
- Mobile-first with web support
- 3G network optimization target
