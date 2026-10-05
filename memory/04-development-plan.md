# Development Plan — v2 (Chapa-only)

> **Revision note (2026-09-27):** This plan supersedes the original roadmap. The biggest
> change: **Telebirr and ArifPay direct integrations are dropped** — Chapa is the single
> payment gateway. Chapa already settles via TeleBirr, cards, and bank transfers through
> its unified checkout, so a direct TeleBirr integration would duplicate work and add
> maintenance cost for zero user-visible benefit. Telebirr stubs have been deleted from
> `@adera/payments`.

## Guiding principles
1. **One gateway:** Chapa for all online payments. Wallet (Adera-internal) and COD remain
   as Adera-native settlement methods.
2. **Client never holds secrets:** Chapa secret key + verification live in a Supabase Edge
   Function; the app only ever sees the public key.
3. **Verify before trust:** No parcel/order is marked paid until server-side Chapa
   verification succeeds (client redirects are treated as untrusted hints).
4. **Tests guard refactors:** Jest suite must stay green through every phase.

---

## Phase 1: Architecture Stabilization ✅ COMPLETE
- Broken package imports fixed; duplicate users/profiles tables consolidated
- Dead code removed; safe-area / bottom-nav fixes; memory bank created

## Phase 2: Core Infrastructure ✅ COMPLETE
- Supabase Storage buckets with RLS; wallet tables + credit/debit functions
- LocationService (geocoding, distance, watching); I18n synced with PreferencesProvider

## Phase 3: Payment Flow Integration ✅ COMPLETE (revised: Chapa-only)
- Chapa checkout wired into CreateParcel + Shop checkout
- PaymentCallbackScreen handles return + verification
- ~~Telebirr~~, ~~ArifPay~~ — removed from types, provider, and screens

## Phase 4: Testing & Reliability ✅ COMPLETE
- Jest + babel-jest; 87 unit tests (formatters, validators, auth validation, cart store)

## Phase 5: Shop UI Consistency ✅ COMPLETE
- SafeAreaProvider + I18nProvider in Shop root; SafeAreaHeader across all 5 screens

## Phase 6: Notifications ✅ COMPLETE
- NotificationService (web-safe Expo Push); notifications table + RLS + triggers
- NotificationBell with real-time subscriptions; token registration in PTP

## Phase 7: Production Hardening ← IN PROGRESS
**Objective:** production-grade reliability and observability
- ✅ Loading skeletons across PTP + Shop screens (perceived performance)
- ✅ Biometric login (fingerprint/face) — keystore-backed credentials, consent-gated
- ✅ ESLint 9 + Prettier (flat config; lint passes with 0 errors)
- ✅ Sentry error tracking (web-safe; DSN-gated; PII stripped)
- ✅ GitHub Actions CI (lint → test → audit → web builds for both apps)
- ✅ Security audit doc (docs/security-audit.md)
- ⬜ Chapa verification Edge Function (secret key server-side, idempotent)
- ⬜ Flip `npm audit` CI job to gating after advisory triage
- ⬜ Error retry patterns + responsive layout audit (tablet/desktop)

## Phase 8: Deployment Preparation ✅ COMPLETE (docs)
**Objective:** ship it
- ✅ End-to-end Supabase RLS matrix review (docs/rls-matrix.md)
- ✅ Release documentation + rollback runbook (docs/release-runbook.md)
- ⬜ SMS recipient alerts (via Chapa-adjacent or local SMS aggregator — evaluate cost)
- ⬜ EAS Build config finalization for iOS/Android; app metadata + screenshots
- ⬜ Production env setup (secrets rotation, Sentry release tagging)
- ⬜ Deploy wallet system migration (supabase/10-wallet-system-deployment.sql)
- ⬜ Set CHAPA_SECRET_KEY Edge Function secret; switch Chapa keys to production
- ⬜ EAS credentials setup + first store builds (Apple/Google accounts)
- ⬜ Error retry patterns for network failures
- ⬜ Responsive layout audit (tablet/desktop)
- ⬜ npm audit CI gating after advisory triage
