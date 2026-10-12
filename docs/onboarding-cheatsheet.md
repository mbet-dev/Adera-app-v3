# Adera Onboarding Cheat Sheet

> Quick-start for the next supporter. If you only read one page, read this one and `docs/project-bible.md` side-by-side.

## 1. What you're looking at

A two-in-one mobile+web platform for Addis Ababa:

- **Adera-PTP** — parcel delivery & tracking (sender → drop-off shop → hub → pickup shop → recipient, QR-verified all the way).
- **Adera-Shop** — e-commerce marketplace where those same shops sell products, with checkpoint-outs that can auto-create delivery orders.

One repo, two apps, shared packages. See `docs/project-bible.md` for the whole story, `docs/business-rules.md` for the rule-level detail.

## 2. Prerequisites

- **Node.js ≥ 18** (the repo currently runs on Node 24 locally). Check with `node --version`.
- **npm ≥ 9**. This repo ships `.npmrc` settings (`legacy-peer-deps`, `auto-install-peers`), so `npm` is the intended client — don't switch to `yarn`/`pnpm` without understanding that.
- **Git** and a checkout of this repo. Branches: `main` (prod web auto-deploys), `stable` (staging candidate), `dev` (active development).

## 3. First-time setup (run exactly once)

```bash
# From the repo root:
npm install --legacy-peer-deps
```

That installs the monorepo workspaces (both apps + 7 shared packages) plus tur repo tooling. The repo's `.npmrc` already opts into peer-dep overrides, so `--legacy-peer-deps` is the safe default even though the lockfile says otherwise.

> If `npm install` complains about peer deps, **do not** switch package managers — the `.npmrc` is there specifically to keep `npm` usable.

### Environment files

Both apps read `.env.local` from their own folder. **Never commit `.env.local`.**

| File | What it's for | Minimum keys |
|---|---|---|
| `apps/adera-ptp/.env.local` | PTP app: Supabase, Chapa public key, wallet/feature flags | `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_CHAPA_PUBLIC_KEY` — plus feature-flag & commission env vars the app already expects |
| `apps/adera-shop/.env.local` | Shop app: Supabase + Chapa public key | same 3 keys as PTP (copy from PTP's `.env.local`) |
| `supabase/.env` | Supabase CLI local config (if you use `supabase` CLI locally) | project ref / local project config |

To create from scratch: `cp apps/adera-ptp/.env.example apps/adera-ptp/.env.local` then fill real values. The example files list every expected var with comments.

**Golden rule:** any value that is *secret* (`SUPABASE_SERVICE_ROLE_KEY`, `CHAPA_SECRET_KEY`, `JWT_SECRET`, `QR_SECRET_KEY`) must live **server-side only** — on the server / Edge Function secrets, never in `.env.local` read by the app. The app's `.env.local` carries only `EXPO_PUBLIC_*` values (public by design).

## 4. Running it (the four most useful commands)

| Command | What it does | Where to see it |
|---|---|---|
| `npm run dev` | Starts **Adera-PTP** web server (Expo, default port 8081) | `http://localhost:8081` |
| `npm run dev:shop` | Starts **Adera-Shop** web server (its scripts pin port 8081) | `http://localhost:8081` — stop the PTP one first |
| `npm run build` | Builds all apps (turbo) | output under each app's build dir |
| `npm test` | 87 Jest unit tests (formatters, validators, auth validation, cart store) | terminal |
| `npm run lint` | ESLint 9 (flat config) + Prettier check | terminal |

For day-to-day preview servers, use the dedicated launcher:

```bash
# Adera-PTP web, detached, port 8082:
./.freebuff/start-preview.sh          # binds to 8082, logs to .freebuff/preview-*.log

# Adera-Shop web, detached, port 8083 (one-off variant):
setsid nohup bash -c 'cd apps/adera-shop && npx expo start --web --port 8083' \
  > .freebuff/preview-shop-8083.log 2>&1 < /dev/null &
```

The `.freebuff/start-preview.sh` launcher cds into `apps/adera-ptp` and runs `npx expo start --web --port 8082`. If 8082 is taken, edit the script (or pass `--port` manually) — the run doc explains how.

> Expo warns about `expo-camera` version mismatches if the package doesn't match SDK 54 — fix with `npx expo install expo-camera` inside the affected app folder (this repo keeps both apps on `~17.0.10` now).

## 5. Where everything lives

```
adera-hybrid-app/
├── apps/
│   ├── adera-ptp/                 # Logistics app (main app you'll work in)
│   │   ├── App.js                 # Root: onboarding → app selector → auth → role navigator
│   │   ├── src/
│   │   │   ├── screens/
│   │   │   │   ├── Auth/         # Login, SignUp, ForgotPassword, callback
│   │   │   │   ├── customer/     # Dashboard, CreateParcel wizard, Track, History, Profile
│   │   │   │   ├── partner/      # Dashboard, ScanQR, ParcelManagement, Earnings, Profile
│   │   │   │   ├── driver/       # Dashboard, TaskList, RouteMap, Earnings, Performance, Profile
│   │   │   │   ├── staff/        # Dashboard, ParcelOversight, Analytics, Support, Profile
│   │   │   │   ├── shop/         # ShopProfile (PTP app hosts its own partner-shop screens too)
│   │   │   │   └── PaymentCallbackScreen.js  # Chapa return path
│   │   │   ├── navigation/       # AppNavigator (root), Auth/Customer/Partner/Driver/Staff/Shop/Guest navigators
│   │   │   ├── components/       # MapView (platform-split), modals, notification bell
│   │   │   ├── context/          # AppFlowContext (onboarding→app selector state)
│   │   │   ├── hooks/            # usePartners, useParcelHistory, usePayment, useCameraPermission, ...
│   │   │   ├── services/         # parcelService (Supabase CRUD)
│   │   │   └── utils/            # barcode helpers, media helpers, operating hours, phone validators
│   │   └── assets/
│   └── adera-shop/               # E-commerce app (separate entry, shares packages)
│       ├── App.js                 # Root: SafeArea + I18n + SafeAreaHeader + ShopNavigator
│       ├── screens/
│       │   ├── MarketDiscoveryScreen.js   # shop browse (guest ok)
│       │   ├── ProductDetailScreen.js
│       │   ├── ShoppingCartScreen.js      # Zustand cart
│       │   ├── CheckoutScreen.js          # COD + Chapa + Adera-Delivery auto-create
│       │   ├── OrderHistoryScreen.js
│       │   └── OrderTrackingScreen.js     # timeline + map
│       ├── components/           # SafeAreaHeader, NotificationBell
│       ├── store/                # cartStore (Zustand, ephemeral)
│       └── hooks/
├── packages/
│   ├── auth                      # @adera/auth — Supabase auth wire, Zustand auth store
│   ├── ui                        # @adera/ui — theme, Paper components, skeleton loaders, nav
│   ├── payments                  # @adera/payments — Chapa gateway, PaymentProvider, wallet types
│   ├── maps                      # @adera/maps — LocationService (geocode, distance, watch)
│   ├── preferences               # @adera/preferences — theme/language/biometric prefs
│   ├── utils                     # @adera/utils — QR generator, formatters, validators, tracking status list
│   └── localization              # @adera/localization — i18n strings (English + Amharic today)
├── supabase/                    # Database: schema.sql + numbered change files + migrations + functions
│   ├── schema.sql               # Source of truth: tables, enums, RLS policies
│   ├── functions.sql            # SQL functions incl. chapa-verify Edge Function + commission calc
│   ├── 10-wallet-system(deployment).sql
│   └── 12-staff-broadcast-policy.sql
├── docs/
│   ├── business-rules.md        # Rule-level detail with stable IDs
│   ├── project-bible.md         # The complete owner's & rookie's manual
│   ├── onboarding-cheatsheet.md # ← this file
│   ├── release-runbook.md       # Ship + rollback playbook
│   ├── rls-matrix.md            # Who can do what on every table
│   └── security-audit.md
├── memory/                      # Engineering knowledge bank (status, architecture, risks, plan)
│   ├── 00-project-overview.md
│   ├── 01-product-requirements.md
│   ├── 02-system-architecture.md
│   ├── 03-development-status.md   # ← always up to date; mirror changes here
│   ├── 04-development-plan.md
│   └── 05-known-risks.md
├── ReferenceResources/          # Product briefs, context docs, mock screens, sample media
├── turbo.json, package.json, package-lock.json, .npmrc
└── .freebuff/                   # Preview tooling (run.md, start-preview.sh, log files)
```

## 6. The big five roles (for context when you touch code)

| Role | Navigator | Main screens | What they touch in the DB |
|---|---|---|---|
| Customer | CustomerNavigator | Dashboard, CreateParcel, TrackParcel, ParcelHistory, Profile | own `users`, own `parcels`, own `wallet`, own `orders` (shop) |
| Partner (P1/P2) | PartnerNavigator | PartnerDashboard, ScanQR, ParcelManagement, Earnings, Profile, ShopProfile | own `shops`, own `products`, partner-scoped `parcels` |
| Driver | DriverNavigator | DriverDashboard, TaskList, RouteMap, Earnings, Performance, Profile | assigned `parcels` (read), `parcel_events` (own scans) |
| Staff | StaffNavigator | StaffDashboard, ParcelOversight, Analytics, Support, Profile | wider reads via staff policies; `parcel_events` + `notifications` writes (staff scope) |
| Admin | same staff tooling + oversight | (use staff screens + RLS admin reads) | same as staff, plus full read across tenant tables |

Auth is Supabase's; the app store (Zustand, persisted) keeps `user` + `last_login_at`. Role is a column on `users` and selects the navigator.

## 7. The two key flows to know cold

### Parcel (PTP)
Phases (0–6) drive everything — same list is in code (`packages/utils/src/trackingUtils.js`) and DB enum (`parcel_status`):
`created → dropoff → in_transit_to_hub → at_hub → dispatched → at_pickup_partner → delivered`.

The QR payload is `TRACKING_ID + PHASE + TIMESTAMP + HASH`. At the pickup shop (P2) the system **re-hashes** and SMSes the recipient a fresh code — that's the anti-theft design. See BR-QR-* in `docs/business-rules.md`.

Pricing: `basePrice (size) + haversineDistance(P1,P2) × 20 ETB/km`. Size base 50/100/150/250 ETB. Urgent/fragile surcharges are env-configurable but default off.

### Shop order
Tower flow: browse (guest) → cart → checkout → payment (COD or Chapa) → order → (if Adera Delivery chosen) auto-create parcel → phases above.

Commission: 4% per item, split 2% buyer + 2% seller. Seller's 2% is baked into the displayed price; buyer's 2% shows as its own line at checkout. `supabase/functions.sql` holds `calculate_shop_commission()`. Seller sees the full price breakdown at item creation (UI exists, flag if missing).

## 8. Making a change — the small safe loop

1. Branch from `dev`: `git checkout -b feat/my-thing dev`.
2. Make the change. If it touches pricing, run a quick mental check against `docs/business-rules.md` BR-PR-* / BR-CM-*.
3. Local verify: start the relevant app (`npm run dev` / `npm run dev:shop`) and click through.
4. Lint + tests: `npm run lint && npm test`.
5. Commit with a conventional subject: `fix:`, `feat:`, `chore:`, `docs:`, `refactor:`.
6. Push to a remote branch, open a PR targeting `dev`.

Never commit `.env.local` — the `.gitignore` should keep it out; double-check with `git status` before committing.

## 9. The dev environment you'll see around you

- **Preview servers** run on 8082 (PTP) and 8083 (Shop) in this workspace via `.freebuff/start-preview.sh` and the shop variant above. The Freebuff preview tab is wired to 8082 right now.
- **Error tracking:** Sentry (DSN-gated; dev no-ops). Errors from the preview appear in the app's error boundary / Sentry only if a DSN is set.
- **CI** (GitHub Actions): runs lint → test → audit → web builds for both apps on push. Broken lint/test blocks merge.
- **Typecheck:** `npm run type-check` (turbo).

## 10. If something's broken — first checks

| Symptom | First thing to check |
|---|---|
| White screen / "Initializing Adera..." stuck | Expo is re-bundling after a code change (wait ~15–30 s). Check the preview log for "Web Bundled" and a 200 on the page. |
| 406 on a Supabase query (e.g. wallets) | You're using `.single()` on a query that can return zero rows — switch to `.maybeSingle()` (this repo already fixed the wallet query that way). |
| "expo-camera should be updated" warning | Run `npx expo install expo-camera` in the app folder. |
| Payment mock vs real | In `.env.local`, `EXPO_PUBLIC_MOCK_PAYMENTS` and `EXPO_PUBLIC_ENABLE_GUEST_MODE` control test behavior — leave them off for prod. |
| Port already in use | 8081/8082/8083 — check `ss -ltn | grep :808`. Pick a free port and pass it to the Metro command, or edit `.freebuff/start-preview.sh`. |
| "Module not found" in shared package | Make sure workspace links are wired: the `package.json` in each app points at `file:../../packages/...`. Re-run `npm install` if the symlinks look stale. |

## 11. Files to keep in sync when you ship

Anytime you change a rule, a flow, or a piece of architecture:

- **`docs/project-bible.md`** — narrative/manual changes.
- **`docs/business-rules.md`** — rule-level changes (add/update a rule ID).
- **`memory/03-development-status.md`** — every shipped feature, every new TODO.
- **`docs/rls-matrix.md`** — if a table's RLS or a policy changes.
- **`supabase/`** files — schema and change SQL are the source of truth; update the numbered file, then record it in status.

When in doubt, touch the bible + status; that pair is the truth for non-engineers.

---

*If you only remember three things: install with `npm install --legacy-peer-deps`, never commit `.env.local`, and read `docs/project-bible.md` before guessing how a flow works.*
