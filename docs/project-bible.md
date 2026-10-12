# Adera Project Bible — The Complete Owner's & Rookie's Manual

> **Document ID:** ADR-BIBLE-001 · **Owner:** MBET Digital Solutions · **Prepared for:** Ermias Dejene Abesha (project owner)
> **Purpose:** one document that explains **everything** about Adera — how the product works, how each person uses it, how the business earns, and how *you* administer it in production or pitch it to an investor — written for someone who starts at zero.
> **Companion docs:** `docs/business-rules.md` (rule-level detail with IDs), `docs/rls-matrix.md` (database access), `docs/release-runbook.md` (ship procedures), `docs/security-audit.md`, plus `memory/` for engineering history.

---

## Table of contents

1. [What Adera is, in one paragraph](#1-what-adera-is)
2. [The elevator pitch (for investors, your mum, anyone)](#2-the-elevator-pitch)
3. [The problem & the market](#3-the-problem--the-market)
4. [How the two apps fit together](#4-the-two-apps)
5. [Under the hood — architecture for non-engineers](#5-under-the-hood)
6. [The cast of characters — every role explained](#6-the-roles)
7. [The life of a parcel — main story from start to finish](#7-life-of-a-parcel)
8. [The life of a shop order — the e-commerce story](#8-life-of-a-shop-order)
9. [How money flows in — every revenue stream](#9-money)
10. [Who benefits — stakeholders & their wins](#10-stakeholders)
11. [Payment methods & the wallet, in plain words](#11-payments)
12. [Tracking, QR codes & the anti-fraud design](#12-tracking-security)
13. [How the system is monitored day to day](#13-monitoring)
14. [Administering production — your ops playbook](#14-ops-playbook)
15. [Running it locally (the dev cheatsheet)](#15-dev-cheatsheet)
16. [What's built vs. what's on the roadmap](#16-status-roadmap)
17. [Glossary — the 30-second lookup](#17-glossary)
18. [FAQ — questions rookies actually ask](#18-faq)

---

## 1. What Adera is

**Adera is two businesses in one app**, built for Addis Ababa:

1. **Adera-PTP** — a parcel delivery and tracking network. Anyone can send a package across the city by dropping it at a neighbourhood shop (a "partner"), and the recipient picks it up at a shop near *them*. Every step is scanned, tracked on a map, and verified with codes — like a local, hyper-connected version of DHL that uses corner shops instead of warehouses.
2. **Adera-Shop** — an e-commerce marketplace where those same neighbourhood shops sell their goods in mini online storefronts. A buyer orders a product, pays online or on delivery, and the parcel is delivered through the PTP network the buyer is already looking at.

The magic is the **hybrid loop**: the delivery network gives shops a reason to join (they earn from parcels), and the shops give the delivery network density (people trust dropping a package at a shop they know). Each arm feeds the other, and both are independently usable.

**One-sentence version:** *"Adera turns neighbourhood shops into a verified parcel network, and those same shops into online sellers — one app, two income engines."*

---

## 2. The elevator pitch

> Addis Ababa has 5+ million people, booming small commerce, and no trusted last-mile delivery layer. International couriers are expensive and slow to onboard locals; informal couriers are untrackable and unsafe. Meanwhile, thousands of minimarkets and boutique shops have no affordable way to sell online.
>
> **Adera solves both with one move.** We recruit corner shops as "partners" — they become parcel drop-off/pick-up micro-hubs *and* storefront owners in our marketplace. Senders get QR-verified, real-time-tracked delivery for ~50–300 Birr. Shops earn commission on every parcel plus 96% of every item they sell online. Drivers earn per-parcel. We take a small delivery fee and a 4% marketplace commission. It's Shopify meets a delivery network, built for how Addis actually pays (cash, TeleBirr, Chapa) and speaks (Amharic, English, Afaan Oromoo).

---

## 3. The problem & the market

| Problem in Addis today | What Adera does about it |
|---|---|
| Fragmented, untrackable delivery | One unified parcel system; every scan is logged with time, GPS and role |
| Small shops can't afford e-commerce | Free storefront templates; they only pay when they sell |
| Cash-based economy | Cash on Delivery, Cash on Drop-off, wallet, and gateway payments all coexist |
| Language barriers | English default, Amharic built in; four more languages spec'd |
| Trust deficit | QR + re-hashed pickup code + 3-photo evidence at every handover |
| Phone-first, weak internet | Mobile-first Expo app, offline-tolerant flows, 3G-optimized |

**Who it's for:** urban adults 18–65 sending/receiving parcels; small & medium merchants; social-media sellers (Telegram/Facebook) needing fulfilment; and eventually franchise operators.

---

## 4. The two apps

Both apps live in **one code repository (a "monorepo")** and share most of their machinery:

```
adera-hybrid-app/
├── apps/
│   ├── adera-ptp/      ← the logistics app (customer, driver, partner, staff, admin)
│   └── adera-shop/     ← the shopping app (marketplace, cart, checkout, orders)
├── packages/           ← shared building blocks both apps import
│   ├── auth  (login, sessions, Supabase wiring)
│   ├── ui    (theme, buttons, screens — "Material 3" design language)
│   ├── payments (Chapa gateway + wallet + COD logic)
│   ├── maps  (OpenStreetMap location services)
│   ├── preferences (language, theme, biometrics)
│   ├── utils (QR generation, prices, validators)
│   └── localization (translations)
├── supabase/           ← the database: schema, rules, functions
├── docs/               ← the documents you are reading
└── memory/             ← engineering notes
```

**Why this matters to you:** fix or improve a shared component once, and both apps improve. Ship them independently when one arm needs a faster release.

**How users get in:** a customer opens **Adera-PTP** to send/track or taps into the shop world through the app selector. A pure shopper opens **Adera-Shop** directly (guest browsing is allowed; buying needs an account).

---

## 5. Under the hood

You don't need to code to administer this — but you should be able to *picture* it:

```
      [Phones & browsers]
        Adera-PTP app  ·  Adera-Shop app
              │  (internet, HTTPS)
              ▼
      [Supabase — the backend]
        • PostgreSQL database (all tables, all rules)
        • Auth (accounts, sessions)
        • Storage (parcel photos, logos, product images)
        • Realtime (live status updates, notifications)
        • Edge Functions (server-side secret-keeping, e.g. payment verification)
              │
              ▼
      [External services]
        • Chapa — payment gateway (settles TeleBirr, CBE Birr, M-Pesa, Amole, banks)
        • OpenStreetMap — maps & geocoding (free, no licence fees)
        • Expo/FCM — push notifications
        • Sentry — error watchtower
```

Key facts (for talking with engineers):

- One technology (JavaScript/React Native via Expo) produces the **iOS, Android and web** apps.
- Data rules are enforced **inside the database** (Row Level Security), not just in the app — so a hacked phone still can't see other people's parcels.
- Payment secrets live **only on the server** (Edge Functions). The apps never touch them.
- The QR/verification scheme is described in §12.

---

## 6. The roles

Five role types, each with a purpose-built interface. A person has exactly one role.

### 6.1 Customer — the sender *and* the recipient
- **May be a registered member** (full app access) — or, on the receiving side, a **"walking customer"** with no account, reached purely by SMS.
- Can do: create a delivery, choose the drop-off shop (P1) and pickup shop (P2) on a **map**, pay (wallet/Chapa/Cash-on-Drop-off/recipient-pays), watch the parcel move in real time, chat with support, rate the experience.
- Dashboard shows wallet balance, parcel stats ("Parcel Pulse"), quick actions.
- A shop buyer becomes a *recipient-payer* too — any Ethiopian phone number can receive.

### 6.2 Partner — the neighbourhood shop (P1 / P2)
- Receives parcels from senders (drop-off point, **P1**) and hands them to recipients (pickup point, **P2**). Many partners do both.
- Daily work: **scan QR codes** in/out, verify recipients with their pickup code, reject bad parcels (photo evidence required), manage inventory of parcels waiting for pickup.
- Extra superpower: they can open an **e-shop** — list products, prices (with the commission math shown transparently), orders, earnings.
- Earnings: commission per parcel handled (+ per item sold).

### 6.3 Driver — the wheels
- Gets assigned jobs (pick up batch from P1 → hub → P2 runs), navigates with the in-app **Route Map**, scans every handover, takes photos if something's wrong, earns commission per parcel.
- GPS pings (~every 5 minutes) attach to the parcels in their custody.

### 6.4 Staff — the sorting hub crew
- Work at Adera's central **sorting facility**. Batch-scan parcels in/out of the hub, assign drivers to outbound legs, triage stale/expiring/problem parcels, handle support tickets and broadcasts.

### 6.5 Admin — you (and your team)
- See everything: KPIs, revenue, disputes, users, payments. Approve partners, moderate users, reconcile money, configure the platform. Does NOT normally touch data rows directly — corrections go through support actions and server functions.

**Eligibility ("how it goes"):** customers self-register. Partners apply with business details (name, category, location pin, hours, licence photo) and are **approved by admin** — this gate is the trust anchor of the whole network. Drivers are onboarded through Adera's ops team. Staff/admin accounts are created internally, never publicly.

---

## 7. Life of a parcel

The 7-phase journey (numbers match the app's status timeline and QR codes):

```
0 Created ──► 1 At Drop-off ──► 2 To Hub ──► 3 At Hub ──► 4 Dispatched ──► 5 At Pickup ──► 6 Delivered
    Abel          P1 shop          Driver      Facility       Driver           P2 shop         Beza
   (sender)      scans in         scans out   staff sorts    takes to P2      scans in        verifies
```

**The full story, scene by scene:**

1. **Abel wants to send a parcel to Beza.** In the app: recipient name/phone → package size (Document 50 / Small 100 / Medium 150 / Large 250 Birr base) → picks P1 (where he'll drop it) and P2 (near Beza) on the map → price appears instantly (base + 20 ETB × distance between P1 and P2) → payment method → accepts terms & prohibited items → pays.
2. **The system creates the parcel:** unique tracking ID, QR code generated, Beza gets an SMS (works even without the app) and both partners get notified.
3. **Abel drops it at P1.** Partner scans the QR (status 1), eyeballs the 3 photos Abel attached to confirm it's the same item.
4. **Driver D1 picks up from P1.** Scan (status 2), GPS logged. Drives toward the sorting hub. (In dense direct routes the network may route P1→P2 without a hub pass — the phase machine still holds.)
5. **Hub staff scan intake (status 3), sort, assign D2.** This is where Adera spots bottlenecks — staff Analytics show 24-h volumes, in-transit counts, revenue.
6. **D2 takes it to P2 (status 4 "Dispatched").** Scan at P2 (status 5) **and here the magic**: the system re-hashes Abel's original code into a *different* string and SMSes it to Beza. Now nobody who merely photographed the original QR can steal the parcel — the release code is fresh and only Beza has it.
7. **Beza walks to P2** (she may be a member or a walking customer), shows the code or tells the partner the ID + code. Partner verifies → hands over → **status 6 Delivered** → rating screen. Driver/partner commissions accrue; wallet records them.

**Payment-case variants** (all five are supported business cases):

| Case | Who pays | How it works |
|---|---|---|
| 1 | Sender, online | Wallet/Chapa at creation → parcel activates immediately |
| 2 | Sender, cash at P1 | "Cash on Drop-off": sender chooses a P1 offering the service, notifies ≥24 h before; P1 **consents in-system**, pays Adera via gateway, takes Abel's cash at the counter |
| 3 | Recipient (member) | Beza confirms in-app; **unpaid after 24 h → auto-cancel** |
| 4 | Recipient (walking) | Beza pays via bank transfer reference |
| 5 | Recipient, cash at P2 | A P2 that accepts cash-service takes the money, pays Adera from its wallet; **only then** is Beza's release code issued |

**Rules that will bite if forgotten:** a parcel **pends until payment completes** (24-hour purge for unpaid drafts); parcels can only be **cancelled in phase 0** (later = support ticket); the **sender is the only entitle­ment to create a parcel** — the sanctioned exception is the Shop delivery at checkout (§8); every scan must be the *next* sequential phase (no skipping, except admin override).

---

## 8. Life of a shop order

1. **Browse:** Anyone — even not signed in — browses marketplace shops and products (guest mode).
2. **Engage:** Adding to cart/wishlist, buying, rating, or choosing "Use Adera Delivery" **requires an account**.
3. **Checkout:** The Adera-Shop checkout collects recipient name/phone, delivery location on the map, and offers delivery styles — **standard door delivery at 150 ETB** or **PTP-network delivery at 250 ETB** — and payment via COD or Chapa.
4. **Commission transparency (the thing partners must trust):** item price 1 000 ETB → display price **1 020 ETB** (seller's 2% baked in). At checkout the buyer sees **buyer's 2% (20 ETB)** as its own line. Seller gets 1 000; Adera books 40. The seller sees the identical math when creating the item.
5. **The parcel link:** if the buyer chose PTP delivery, the checkout **auto-creates the parcel** — the buyer (as recipient-designer) triggers the delivery order. This is the one sanctioned exception to "only senders create parcels."
6. **Fulfilment:** shop packs → handover into the PTP flow (phases 1–6 as above) or direct dispatch; the shop's order screen and the buyer's **Order Tracking** screen both show the same timeline + map.
7. **Stats:** when an order hits *delivered*, a trigger bumps the shop's `total_orders`; ratings recompute on every review.

---

## 9. Money

### 9.1 Revenue streams (Adera the operator)

| Stream | How it's charged | Numbers today |
|---|---|---|
| **Delivery fees** | Sender pays per parcel | base + 20 ETB/km (base 50–250 by size). For scale: a 5 km small-parcel run = 204 ETB; Adera's gross margin on it is the fee minus driver/partner payouts per route |
| **Shop commission** | 4% per item sold | split **2% buyer / 2% seller** — collected from both sides without surprising either |
| **Shop checkout delivery** | Buyer pays at checkout | 150 ETB door / 250 ETB PTP-integrated |
| **COD service margin** | Partners front the cash, settle via gateway | a processing convenience partners value (rate configurable) |
| **Future levers** | Ads/promotions in-app, premium storefront features, franchise fees, B2B logistics, white-label API | spec'd, not yet switched on |

### 9.2 Where the money physically sits

- **Adera Wallet** (in-app balance per user) — top-ups arrive from Chapa; payments debit it; refunds credit it; driver/partner commissions are **credited** to it. Every movement is a ledger row (`balance_before`/`balance_after`) — it's a proper double-entry-style audit trail, not a float.
- **Chapa settlement** — online card/mobile-money payments; verification happens server-side (nobody can fake a "paid" status from a phone).
- **Cash** — lives with partners/door deliveries, reconciled through the COD rules and partner statements.

### 9.3 What result-side earners take

- Drivers: per-parcel commission (rate configured in env, `EXPO_PUBLIC_DRIVER_COMMISSION_RATE`) on scans they complete, shown in **Driver Earnings** with daily metrics.
- Partners: per-parcel handling commission (`EXPO_PUBLIC_PARTNER_COMMISSION_RATE`) plus their 96% of item sales, all visible in **Partner Earnings** with withdrawal history.
- Weekly auto-payout batching is the design target ("parcel scanned → status complete → commission accrues → auto payout weekly").

### 9.4 The 60-second example that explains the whole model

Beza buys a 1 000 ETB dress from a partner's shop, chooses PTP delivery:
- Dress displayed at 1 020 (seller's 2% included) + checkout line "platform commission 20" (buyer's 2%) + delivery 250 = **Beza pays 1 290 ETB**.
- **Shop gets** 1 000 (**96%** of item value, no listing fee ever paid).
- **Adera gets** 40 (4% split) + 250 (delivery) = **290 ETB** — minus driver + partner commissions on the parcel leg.
- Everyone can *see* the math before committing — no hidden fees. That transparency is why partners stay.

---

## 10. Stakeholders & their wins

| Stakeholder | What they get |
|---|---|
| **You / MBET (owner)** | Asset-light network (shops are the infrastructure), two revenue engines from one ops org, defensible local moat (trust + density), clean data for expansion |
| **Customers** | Predictable, cheap, *trackable* delivery; a near delivery point always nearby; pay however they live (cash→code→gateway) |
| **Recipients (even non-members)** | SMS works without an account; verified handover means no lost parcels; cash options at pickup |
| **Partner shops** | Free delivery foot-traffic (senders come daily), new revenue (commissions + e-commerce), free storefront tech, analytics on their own performance |
| **Drivers** | Flexible income, transparent per-parcel earnings, real navigation tooling |
| **Staff** | Structured hub tooling instead of paper manifests |
| **The city** | Formalises informal logistics, digital payment adoption, local language tech |
| **Investors** | Clear unit economics (§9), network-effect moat, modular expansion path (other cities → B2B → API) |

---

## 11. Payments

Plain-words guide to every method a user can encounter:

| Method | What it is | Where used |
|---|---|---|
| **Adera Wallet** | In-app balance. Top up via Chapa; spend on parcels; receive refunds & commissions | Both apps |
| **Chapa** | Ethiopia's payment gateway — one checkout that settles TeleBirr, CBE Birr, M-Pesa, Amole, and bank transfer. *This is the only online gateway; direct TeleBirr/ArifPay integrations were deliberately dropped (2026-09-27)* | Both apps |
| **COD** — *(Shop sense)* "Cash on Delivery" | Recipient pays the courier: seller amount + delivery fee | Shop orders |
| **COD** — *(PTP sense)* "Cash on Drop-off" | Partner P1 fronts the fee for a cash-in-hand sender (24-h notice + explicit in-system consent required) | PTP parcels |
| **Recipient-pays** | Payment deferred to the recipient; 24-h unpaid → auto-cancel; walking-customer variants: bank transfer or cash-at-P2 (partner fronts it from its wallet) | PTP parcels |

**Safety spine:** Chapa payments are **verified by a server-side function** that holds the secret key. Client apps can *initiate* payments but can never *declare* one successful. Wallet operations run as database functions — atomic, ledgered.

---

## 12. Tracking & security

**The QR scheme** (this is the crown jewel — explain it exactly like this):

```
QR = TRACKING_ID + PHASE_FLAG + TIMESTAMP + HASH
e.g. ADE20231001-2-1672531005-7c6d3a
                        └ phase 2 = "In Transit to Hub"
```

- Every scan has to be the **next** phase — a hub scan can't appear before a drop-off scan.
- **The re-hash trick:** when the parcel lands at P2, the server regenerates the hash (`7c6d3a → k53y7f`) and sends *only* to the recipient's phone. Presenting the old QR (which a thief could have photographed at drop-off) fails; P2 verifies the fresh pair. This single design decision is your strongest anti-theft story.
- Every scan binds **timestamp + GPS + user role** → the full history is a chain of evidence for disputes (damage, loss, wrong handover — each party can attach up to 3 photos).
- Guest status-tracking by ID alone is deliberately **blocked** by database policy (privacy); a sanctioned server function path exists if product later wants "SMS link tracking."

**Account security:** biometric unlock (fingerprint/face) with explicit consent, credentials wiped when disabled. Error tracking (Sentry) runs silently and strips personal data.

---

## 13. Monitoring

How the system watches itself (and how you watch it):

**Inside the product:**
- **Staff Analytics** — parcels/24 h, in-transit count, orders, revenue — your daily "is it alive" dashboard.
- **Parcel Oversight** — stale (>24 h) and expiring parcels auto-classified with issue tags; this is your exceptions queue.
- **Support queue + broadcasts** — tickets are notifications addressed to staff; reply inline or broadcast to everyone (rate changes, promotions, downtime).
- **Partner dashboards** — pending parcels, earnings, conversion (they self-monitor; you audit).

**Around the product:**
- **Sentry** captures app errors (web + native) before users have to report them.
- **Supabase logs/audit** — `events_log` mirrors every meaningful actor action (who did what to which parcel, when, where).
- **CI/CD (GitHub Actions)** — every code change runs lint → 87 unit tests → security audit → web builds for both apps. Broken code doesn't reach production branches.
- **Payment reconciliation** — compare `payments` intents against Chapa-verified results; mismatches are your dispute pipeline.

**Your morning routine, admin edition:** open Staff Analytics (volume + revenue) → Parcel Oversight (exceptions) → Support queue (tickets) → Sentry (any errors) → chat with engineers only if red.

---

## 14. Ops playbook

### 14.1 Environments & branches
- `dev` — active development. `stable` — staging/release candidate. `main` — production (auto-deploys web).
- Mobile releases go through **EAS** (Expo Application Services) with OTA (over-the-air) updates for JS-only fixes; channels are preconfigured in `eas.json`. Full procedures + rollback plan: `docs/release-runbook.md`.

### 14.2 The environment file (`.env.local`)
Lives in each app folder; **never committed**. Critical keys:

| Key | What it is | Where it must live |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Backend address + public client key | App (safe to be public) |
| `EXPO_PUBLIC_CHAPA_PUBLIC_KEY` | Payment public key | App |
| `CHAPA_SECRET_KEY` | Payment **secret** | Server only (Edge Function secret) |
| `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `QR_SECRET_KEY` | God-mode keys | Server only |
| `EXPO_PUBLIC_BASE_DELIVERY_FEE`, `PER_KM_RATE`, `*_COMMISSION_RATE`, `URGENT_MULTIPLIER`, `FRAGILE_FEE` | The pricing/business config | App config (changing = deploy like code) |

### 14.3 Database changes
Database rules live in versioned SQL under `supabase/` (schema, numbered change files, migrations). **Pending today:** migrations 10 (wallet system), 11/12 (notifications + broadcast policies) still need applying to the live database, and the Chapa secret must be set as an Edge Function secret before real-money launch. Procedures + verification steps: `docs/release-runbook.md`.

### 14.4 Trust operations (the human side)
- **Partner approval** is your biggest lever — approve carefully, audit quarterly (photos, licence, location).
- **Disputes:** open the parcel's event chain (every scan + photos), decide, act via staff tools; money corrections go through defined refund flows (§7.5 of business rules).
- **User moderation:** deactivate (never delete rows — the ledger is your evidence).

---

## 15. Dev cheatsheet

For your machine (this repo as it stands today):

```bash
npm install --legacy-peer-deps     # once, or after pulling changes

npm run dev        # PTP app web  → http://localhost:8081
npm run dev:shop   # Shop app web → http://localhost:8081  (stop the other first)

# the preview servers running right now in this workspace:
#   PTP  → http://localhost:8082   (launcher: .freebuff/start-preview.sh)
#   Shop → http://localhost:8083
```

| Command | Meaning |
|---|---|
| `npm run build` | Build all apps (turbo) |
| `npm test` | 87 unit tests |
| `npm run lint` | Code style & correctness gate |
| `npm run type-check` | Static typing check |
| `npx expo start --web --port 8082` | Manual PTP web server on any port |
| `.freebuff/start-preview.sh` | The detached preview launcher used by this environment |

Environment setup for a fresh checkout: copy `apps/adera-ptp/.env.local` from the main checkout (or from `.env.example` + your own values). The Shop app needs 4 values — Supabase URL/key, Chapa public key, Sentry DSN (optional).

---

## 16. Status & roadmap

**Built and working today:** full auth + onboarding; role experiences for all five roles; 4-step parcel wizard; realtime tracking with maps (web + native); QR scanning flows; shop marketplace, cart & checkout; Chapa payments with server-side verification; wallet database layer; notifications (push + realtime bell); loading states; biometrics; Sentry; CI; EAS config; 87 passing tests.

**Deliberately dropped:** direct TeleBirr & ArifPay integrations (Chapa settles both; less maintenance, one contract).

**Open TODOs before/at production (in priority order):**
1. Apply pending DB migrations 10–12 (wallet UI + staff policies).
2. Set `CHAPA_SECRET_KEY` Edge Function secret; switch Chapa keys to production.
3. SMS gateway for recipient alerts (the walking-customer experience depends on it).
4. Wallet screens (top-up / history / withdraw) — the schema is live, the UI isn't.
5. Server-side fee validation (move parcel INSERT behind an Edge Function) — kills fee tampering.
6. EAS store builds + credentials (Apple/Google accounts).
7. Responsive/tablet audit; network-retry polish; `npm audit` advisory triage.

*Live detail lives in `memory/03-development-status.md`; keep that file waving when things ship.*

---

## 17. Glossary

| Term | Meaning |
|---|---|
| **Adera-PTP / Adera-Shop** | The logistics app / the shopping app |
| **P1, P2** | Drop-off partner, pickup partner |
| **Hub** | Adera's central sorting facility (staffed) |
| **Walking customer** | Recipient without an account (SMS-reachable) |
| **Parcel phase 0–6** | created → at drop-off → to hub → at hub → dispatched → at pickup → delivered |
| **Re-hash** | Fresh pickup code generated at P2, sent only to the recipient |
| **COD (Shop)** | Cash on Delivery — recipient pays the courier |
| **COD (PTP)** | Cash on Drop-off — partner fronts the fee for a cash payer |
| **Chapa** | The single payment gateway (settles TeleBirr/CBE/M-Pesa/Amole/banks) |
| **RLS** | Row Level Security — database-enforced who-sees-what |
| **Edge Function** | Small server program holding secrets (payment verify) |
| **EAS / OTA** | Expo's build & over-the-air update service |
| **Monorepo** | One repo containing both apps + shared packages |
| **ETB** | Ethiopian Birr |
| **Supabase** | The all-in-one backend (DB + auth + storage + realtime) |

---

## 18. FAQ

**Q: I'm not technical. Can I actually run this?**
Yes — that's what this bible is for. Your daily tools are the Staff/Admin screens, the release runbook, and your engineering loop. Everything money-related is ledgered; everything user-related is logged.

**Q: What if a partner runs off with a parcel?**
The event chain + re-hash code make misuse traceable and hard (the release code only exists on the recipient's phone). Insurance/bond requirements for partners are a business policy add-on, not tech.

**Q: What stops someone faking a payment?**
Verification is server-side with secret keys. The app can only *ask* for a payment; the database's final "paid" state comes from the server comparing notes with Chapa.

**Q: Can someone intercept my parcel by copying the QR?**
No — the original QR only carries phases up to pickup arrival. Releasing the parcel requires the *re-hashed* code that only the recipient's phone received after arrival.

**Q: Why is Shop commission "4%" if buyers pay 2% extra?**
The seller's 2% is baked into the displayed price, the buyer's 2% is a separate checkout line. Everyone sees their side of it (that's mandatory). There's no hidden fee anywhere.

**Q: Can shops use their own delivery?**
Yes — standard checkout supports shop-arranged door delivery (150 ETB) or the Adera network (250 ETB, auto-creates the parcel).

**Q: What do I show an investor?**
§2 pitch → §9 money math → §10 stakeholder wins → §12 anti-fraud design → §16 honest roadmap. The live web previews (PTP + Shop) close the deal.

**Q: Where do I change pricing later?**
Environment variables (§14.2) and, for commission, the `calculate_shop_commission` database function. Both are config-as-code: change → CI → deploy (runbook).

---

*Adera — "delivering trust, one code at a time." Keep this document current: when a rule or flow changes in code, change it here the same day.*
