# Adera — Release Runbook

> Companion to `docs/project-bible.md`. Playbook for shipping a version — web, mobile, and rollback — written for the repo as it stands today.

## Matrix

| Dimension | dev | stable | main |
|---|---|---|---|
| Purpose | active development | staging / release candidate | production (web auto-deploys here) |
| Branch | `dev` | `stable` | `main` |
| Web preview | `.freebuff/start-preview.sh` → port 8082 | review before merge | auto-deploy target |
| Mobile | `npx expo start --android/ios` from either app | OTA channel staging | EAS builds + store submit |

**Flow:** work on `dev` → PR into `dev` → when a cut is ready, merge `dev` → `stable` (release candidate) → after verification, merge `stable` → `main` (production web deploy triggers).

## Before first real-money / production-ready release

These are still TODO per `memory/03-development-status.md` and must be done **before** pushing real payment or wallet traffic:

1. **Apply pending Supabase migrations** 10 (wallet system), 11/12 (notifications + staff broadcast policies) to the live database.
2. **Set `CHAPA_SECRET_KEY` as an Edge Function secret** (and any other server-side secret the `chapa-verify` function needs); switch Chapa keys from test to production values.
3. **EAS credentials** (Apple + Google developer accounts) + first store builds; confirm `eas.json` OTA channel config matches runtime version policy (`appVersion`).
4. **SMS gateway** for recipient alerts (walking-customer flows depend on it).
5. **Wallet UI** (top-up / transaction history / withdraw) — the DB layer is ready; screens are not.
6. **Server-side fee validation** — move parcel INSERT behind an Edge Function so the client cannot tamper with the fee.

Until those land, keep the app in the mock/demo posture and treat any live traffic as fair-game only with the secrets and migrations in place.

## Shipping a web release (manual)

```bash
# 1. Work on dev, open the PR, get it in.
# 2. Cut stable:
git checkout stable
git merge dev                       # or rebase, whichever the team standard is
git push origin stable

# 3. Verify stable preview:
#    - start PTP preview on a free port
#    - walk the critical flows (login, create parcel, track, shop checkout)
#    - check Sentry for new errors, lint + tests green

# 4. Promote to main:
git checkout main
git merge stable
git push origin main               # web auto-deploys from main (per README)
```

If the web auto-deploy trigger does **not** exist yet, deploy manually from `main` using the platform's deploy step (Vercel is mentioned in README historically — confirm current target before promoting).

## Shipping a mobile OTA update (JS-only change)

Expo OTA (via EAS) is configured in `eas.json` with an `appVersion` runtime version policy. For a JS-only change (no native change):

```bash
eas update --branch production --message "<what changed>"
```

This pushes a JS bundle update to existing installed apps without a store submission. Native changes (new permissions, native modules, SDK bumps that touch native code) still require a new build + store submit.

OTA is enabled on both apps today. Confirm the channel and runtime version policy in `eas.json` before pushing an OTA, because a mismatched runtime version policy can leave some installed app versions unable to receive the update.

## Shipping a full mobile build (native change)

```bash
eas build --platform <ios|android> --profile <production|development>
```

You'll need the store credentials configured. First-time flow:

1. `eas credentials` to provision/sign.
2. Choose the right build profile in `eas.json`.
3. Run the build, submit to the store (EAS submit or manual).
4. Record the version in `memory/03-development-status.md` and `docs/release-runbook.md` changelog.

## Rollback

### Web (auto-deploy from main)

- **Revert the merge** on `main` (revert the merge commit or cherry-pick the good state back), push — web redeploys from the reverted `main`.
- If the bad change is still on `dev`/`stable`, revert or fix there too so the next cut isn't re-contaminated.

### OTA update (EAS)

- Publish a **corrective OTA update** that supersedes the bad one (newer update wins).
- If the bad update is irrecoverable at the JS layer, issue a new OTA that restores the previous good bundle or force a minimum version pin if the policy allows.
- For native-breaking changes, rollback means shipping a new build — plan accordingly and avoid native changes in the same cut as risky JS.

### Database / schemas

- Schema changes are additive in this repo (CREATE IF NOT EXISTS / new tables / new policies). Reverting a bad schema change means a **new migration** that corrects rather than drops — never manually drop production tables.
- For a bad function or policy, deploy a corrected version in a new change file and apply; document both the mistake and the fix in status.

### Wallet / payments

- If a payment-related change is suspect, **stop** automated payout/commission flows that touch real money until verified; switch Chapa back to test keys if needed to halt real transactions while you diagnose.
- Wallet movements are ledgered (`balance_before`/`balance_after`) — reconciliation can reconstruct truth from the ledger even after a bad flow.

## Verification checklist before promoting stable → main

- [ ] `npm run lint` green
- [ ] `npm test` green (87 tests)
- [ ] `npm run type-check` green
- [ ] `npm audit` reviewed (no high/critical unaddressed)
- [ ] Critical flows exercised in a live preview: auth, create parcel + track, shop browse + checkout, role screens (at least customer + partner)
- [ ] Wallet query uses `.maybeSingle()` (or equivalent) so zero-row rows don't 406
- [ ] No `.env.local` or secrets in the diff
- [ ] Sentry shows no new spikes (or they're understood)
- [ ] `memory/03-development-status.md` updated with what shipped
- [ ] `docs/project-bible.md` / `docs/business-rules.md` updated if rules/flows changed
- [ ] Run doc `.freebuff/run.md` still reflects how to spin up the previews

## Changelog

| Date | Release activity |
|---|---|
| 2026-10-12 | Runbook written as companion to onboarding cheat sheet + project bible; reflects repo state as of this write (dev latest, stable + main bridged from dev, OTA + EAS configured, wallet/secret/migration TODOs outstanding). |
