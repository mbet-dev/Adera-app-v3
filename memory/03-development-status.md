# Development Status

**Last Updated**: 2026-09-16  
**Current Phase**: Phase 6 — Push Notifications Complete  
**Branch**: dev  

## Phase 1 Benchmark (IN PROGRESS)

### ✅ Phase 1 Complete
- [x] Broken package imports fixed (payments, localization, utils)
- [x] Database schema consolidated — `users` table replaces both `users` and `profiles`
- [x] Duplicate SQL type definitions removed
- [x] Dead code removed (WebStabilityWrapper, unused auth hooks still exported)
- [x] Safe area / bottom nav overlap fixed across all tab screens
- [x] Auth store updated to track `last_login_at`
- [x] Chapa payment gateway integration implemented
- [x] i18n framework created with English + Amharic strings
- [x] Utils package populated (QR generator, formatters, validators, tracking utils)
- [x] Memory bank created at project root
- [x] Build verified (1158 modules, zero errors)

### ✅ Phase 2 Complete
- [x] Supabase Storage buckets (avatars, products, parcels, shops) with RLS policies
- [x] Wallet system (wallets + wallet_transactions tables, credit/debit functions)
- [x] LocationService.js — cross-platform location, geocoding, distance calc, watch
- [x] I18nProvider wired with PreferencesProvider (controlled language mode)
- [x] @adera/maps index exports LocationService functions
- [x] Build verified after all changes

### ✅ Phase 3 Complete
- [x] PaymentProvider wired into both app roots (PTP + Shop)
- [x] PaymentCallbackScreen created for Chapa redirect/return handling
- [x] CreateParcel processes Chapa payment after parcel creation
- [x] Shop CheckoutScreen with Chapa payment method option
- [x] usePayment, openChapaCheckout, PaymentStatus exports added
- [x] Chapa is the sole gateway (Telebirr/ArifPay stubs removed 2026-09-27)
- [x] Build verified for both apps

### ✅ Phase 4 Complete
- [x] Jest configuration with babel-jest transform for ESM support
- [x] 87 unit tests: formatters, validators, auth validation, cart store
- [x] All tests passing

### ✅ Phase 5 Complete
- [x] SafeAreaProvider + I18nProvider wired into Shop app root
- [x] SafeAreaHeader component for consistent notch-aware headers
- [x] All 5 shop screens updated with SafeAreaHeader
- [x] Consistent header styling across Market, Product, Cart, Checkout, Orders

### ✅ Phase 6 Complete
- [x] NotificationService with Expo Push Notifications (web-safe)
- [x] Notifications table migration with RLS policies
- [x] Parcel status change notification trigger
- [x] Push token registration wired into PTP app
- [x] NotificationBell with real-time Supabase subscriptions

### ✅ Phase 7 Complete (2026-09-27)
- [x] Loading skeletons (@adera/ui) — dashboard, parcel list, product grid/detail, orders, tracking
- [x] Biometric login — keystore-backed credentials, consent prompt on first login, clear-on-disable
- [x] ESLint 9 (flat config) + Prettier — lint passes with 0 errors
- [x] Sentry error tracking — web-safe, DSN-gated no-op in dev, PII stripped
- [x] GitHub Actions CI — lint → test → audit → web builds (both apps)
- [x] Security audit doc (docs/security-audit.md)
- [x] Development plan v2 — Telebirr/ArifPay dropped, Chapa-only

### ✅ Phase 8 Complete (2026-09-28)
- [x] Chapa verify Edge Function (supabase/functions/chapa-verify) — server-side secret,
      idempotent payment verification; client callback screens now verify via the function
- [x] Map rendering fixed end-to-end (web + native):
      • Root cause #1: Leaflet CSS never imported — injected as singleton on web
      • Root cause #2: Metro bundles react-native-maps into web builds (lazy require is
        NOT enough) — MapView split into MapView.web.js (react-leaflet) / MapView.native.js
      • Root cause #3: PostgREST POINT "(lon,lat)" strings parsed with parseFloat → NaN →
        all 30 partner pins collapsed onto default coordinate — shared parsePoint() added
      • Branded teardrop pins (rotated −45°, tip at coordinate), pulsing user marker,
        fitBounds on both platforms, status-colored pinColor on native
      • WebMapView rebuilt from OSM iframe fake to real Leaflet map (PartnerDetailModal)
      • Driver RouteMap: real screen with assigned parcel stops + driver location; new
        Route tab in DriverNavigator (was unreachable placeholder)
      • Shop: new OrderTrackingScreen — status timeline + map (delivery + partner pins),
        wired as orderTracking route with Track delivery button in Order History
- [x] Role screens completed (mocks → live Supabase data):
      • Partner ParcelManagement: parcels at this partner's drop-off/pickup, pull-to-refresh
      • Staff ParcelOversight: stale/expiring parcels with issue classification
      • Staff Analytics: live platform metrics (parcels 24h, in-transit, orders, revenue)
      • Staff Support: notifications-backed ticket queue + broadcast composer to all users
- [x] RLS: staff broadcast policies (supabase/12-staff-broadcast-policy.sql) + docs/rls-matrix.md
- [x] EAS: OTA updates enabled (updates.url + runtimeVersion appVersion policy) on both apps,
      location permissions added (iOS infoPlist + Android), update channels in eas.json
- [x] docs/release-runbook.md — build/submit procedures, OTA, full rollback plan per layer

### ⬜ Not Started
- [ ] Apply supabase migrations 10, 11, 12 to the live database (wallet + notifications + broadcast policies)
- [ ] Set CHAPA_SECRET_KEY Edge Function secret; switch Chapa keys to production
- [ ] EAS credentials setup + first store builds (Apple/Google accounts)
- [ ] SMS integration for recipient alerts
- [ ] Wallet UI flow (top-up, transaction history, withdrawal)
- [ ] Error retry patterns for network failures
- [ ] Responsive layout audit (tablet/desktop)
- [ ] npm audit CI gating after advisory triage

## Feature Matrix

| Feature | Status |
|---------|--------|
| Auth (login/signup/reset) | ✅ Complete |
| Onboarding flow | ✅ Complete |
| App selector (PTP ↔ Shop) | ✅ Complete |
| Customer dashboard | ✅ Complete |
| Create parcel (4-step wizard) | ✅ Complete |
| Track parcel (real-time) | ✅ Complete |
| Parcel history | ✅ Complete |
| Partner screens | ✅ Complete |
| Driver screens | ✅ Complete |
| Staff screens | ✅ Complete |
| Shop marketplace | ✅ Complete |
| Shop cart (Zustand) | ✅ Complete |
| Database schema | ✅ Complete |
| Payment gateway (Chapa) | ✅ Wired into PTP + Shop |
| Payment gateway (TeleBirr/ArifPay) | ❌ Dropped — Chapa settles via TeleBirr etc. |
| Wallet system | ⬜ Stub |
| Push notifications | ✅ Expo Push + Supabase |
| SMS integration | ⬜ Missing |
| Amharic localization | ✅ Strings defined |
| Image storage | ✅ Supabase Storage buckets |
| Testing | ✅ 87 Jest tests passing |
| Error tracking (Sentry) | ✅ Wired, DSN-gated |
| CI/CD | ✅ GitHub Actions (lint/test/audit/build) |
| Loading skeletons | ✅ All data screens |
| Biometric login | ✅ Native (fingerprint/face) |
| Linting/formatting | ✅ ESLint 9 + Prettier |
