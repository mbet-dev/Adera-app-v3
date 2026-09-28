# Release Runbook — Adera Hybrid App

**Scope:** `apps/adera-ptp` (parcel delivery) and `apps/adera-shop` (e-commerce) — iOS + Android via EAS.
**Last updated:** 2026-09-28

---

## 1. Prerequisites Checklist

- [ ] EAS account + project linked (`eas whoami`; `projectId` present in `app.json.extra.eas.projectId`)
- [ ] Apple credentials configured (`eas credentials`); Google service account key at `apps/*/google-services.json` (git-ignored)
- [ ] Environment files present per app: `apps/adera-ptp/.env`, `apps/adera-shop/.env` — copy from `.env.example` and fill:
  - `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  - `EXPO_PUBLIC_SENTRY_DSN` (optional; silent no-op if unset)
  - `EXPO_PUBLIC_CHAPA_PUBLIC_KEY` (Chapa checkout init)
- [ ] Chapa **secret** key lives ONLY in the `chapa-verify` Edge Function secrets — never in app env:
  `supabase secrets set CHAPA_SECRET_KEY=...`
- [ ] Edge Functions deployed: `supabase functions deploy chapa-verify send-order-confirmation`
- [ ] DB migrations applied in order: `supabase/schema.sql`, then numbered `supabase/*.sql` files

## 2. Pre-Release Verification (run all green)

```bash
npm run lint          # 0 errors
npm test              # all Jest suites pass
cd apps/adera-ptp && CI=1 npx expo export --platform web   # bundles clean
cd apps/adera-shop && CI=1 npx expo export --platform web  # bundles clean
```

CI (`.github/workflows/ci.yml`) runs the same gates on every push — the release commit must be green there.

## 3. Build & Submit

```bash
# Staged rollout candidates (internal QA builds)
cd apps/adera-ptp && eas build --profile preview --platform android
cd apps/adera-ptp && eas build --profile preview --platform ios

# Production
cd apps/adera-ptp && eas build --profile production --platform all
cd apps/adera-ptp && eas submit --profile production --platform all   # after credentials set

cd apps/adera-shop && eas build --profile production --platform all
cd apps/adera-shop && eas submit --profile production --platform all
```

`production` profile auto-increments versionCode/buildNumber and produces `.aab` (Play) / `.ipa` (TestFlight).

**Web:** `npx expo export --platform web` per app → deploy `dist/` to your static host (Vercel/Netlify/Cloudflare Pages).

## 4. Store Assets & OTA

- Store listings/screenshots maintained outside this repo (EAS Submit pulls `appleId/ascAppId/appleTeamId` from `eas.json` — fill those before submitting).
- JS-only fixes can ship via OTA without store review: `eas update --branch production --message "fix: ..."`.
- Native/config changes (permissions, plugins, SDK) require a full build.

## 5. Rollback Plan

| Layer | Rollback procedure |
|---|---|
| **OTA update** | `eas update --branch production --message "rollback"` republishing the last known-good bundle; or `eas update:rollback --branch production` |
| **Android (Play)** | Play Console → Production → halt staged rollout; promote previous `.aab` from release library (catalog keeps last N builds) |
| **iOS (App Store)** | Cannot revert a released binary; ship a new build with the fix expedited. TestFlight users: push corrected build to same group |
| **Edge Function** | `supabase functions deploy chapa-verify` from the previous git tag: `git checkout <last-good-tag> -- supabase/functions && supabase functions deploy chapa-verify` |
| **DB migrations** | Migrations are additive (`CREATE TABLE IF NOT EXISTS`, `CREATE POLICY`); a bad policy is fixed forward by `DROP POLICY` + re-`CREATE`. Never restore from backup for policy mistakes — issue a corrective migration |
| **Client env (Supabase/keys)** | Rotate in Supabase/Chapa dashboards; app picks up on next launch (no rebuild needed for anon key rotation) |

## 6. Post-Release Verification

- [ ] Chapa sandbox→production switch confirmed (`CHAPA_SECRET_KEY` points at live)
- [ ] Create a real parcel end-to-end → pay via Chapa → confirm `payments.payment_status='completed'` and `parcels.paid_at` set by the Edge Function
- [ ] Shop order → checkout → Edge Function marks order paid → `Track delivery` button appears in Order History → Order Tracking screen shows map pins
- [ ] Sentry receiving events (`EXPO_PUBLIC_SENTRY_DSN` live) — trigger a test exception in staging build
- [ ] Push notifications: parcel status change inserts a `notifications` row and reaches the device

## 7. Escalation

Payment pipeline failures (Chapa verify) are **P1** — revert the Edge Function to last-good tag, then investigate. Data-integrity issues (missing paid flags) can be repaired idempotently by re-invoking `chapa-verify` with the same `tx_ref` (it is safe to re-run).
