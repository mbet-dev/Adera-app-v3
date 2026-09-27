# Security Audit — Adera Hybrid App

**Date:** 2026-09-27
**Scope:** Repository, dependencies, backend (Supabase), client apps (PTP + Shop), payment flow (Chapa)

---

## 1. Executive Summary

| Area | Status | Notes |
|------|--------|-------|
| Dependency audit | ⚠️ Report-only | `npm audit --audit-level=high` runs in CI; advisory until triaged |
| Secrets hygiene | ✅ Pass | `.env*` git-ignored; only `.env.example` templates tracked |
| Supabase RLS | ⚠️ Partial | Wallets, notifications, storage buckets covered; needs end-to-end review (Phase 8) |
| Payment flow | ✅ Pass | Chapa-only; secret key must live server-side (Edge Function), never in app bundle |
| Error tracking | ✅ Pass | Sentry wired with `sendDefaultPii: false`, Authorization headers stripped |

## 2. Findings & Recommendations

### 2.1 Secrets hygiene — PASS
- `.env`, `.env.local` and variants are git-ignored; only `.env.example` templates are tracked.
- **Action:** rotate any key that was ever committed historically, even once.
- **Rule:** Chapa *secret* key and Supabase *service* key belong only in Supabase Edge Functions / CI secrets — never in `EXPO_PUBLIC_*` (those are embedded in the client bundle).

### 2.2 Dependencies — REPORT-ONLY
- CI runs `npm audit --audit-level=high` on every push/PR (non-gating until transitive advisories are triaged).
- **Action:** triage the current audit report and flip the CI job to gating once clean.

### 2.3 Supabase Row-Level Security — PARTIAL
Covered by migrations: storage buckets with RLS (`09-storage-buckets.sql`), wallet credit/debit functions (`10-wallet-system.sql`), notifications with RLS + triggers (`11-notifications-push.sql`).
**Open (Phase 8):** end-to-end RLS review of every table with an authenticated-vs-anon matrix, plus rate-limiting on publicly writable tables.

### 2.4 Payment flow (Chapa) — PASS
- Chapa is the only actively supported gateway; Telebirr/ArifPay stubs are removed.
- Client initializes transactions with the **public key** only; verification must happen server-side (Edge Function holding the secret key) before any order is marked paid.
- Payment callback screen verifies status through the provider abstraction — no client-side trust of redirect params alone.

### 2.5 Client-side validation
- Yup/Formik validation on all auth forms; Ethiopian phone normalization shared via `@adera/utils` validators.
- Server-side constraints must mirror client validation (do not rely on client alone).

## 3. Hardening Backlog (Phase 8)

1. Flip `npm audit` CI job to gating after triage.
2. End-to-end RLS matrix review + drop any overly permissive policies.
3. Move Chapa verification fully into an Edge Function with the secret key; add idempotency keys.
4. Rate-limit auth endpoints (Supabase dashboard) and add CAPTCHA on signup if abuse appears.
5. Add `expo-secure-store` retention check: biometric credentials auto-clear on biometric disable (done) and on sign-out (verify).
6. Dependency update cadence: monthly `npm outdated` + patch PRs.
