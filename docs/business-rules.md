# Adera Hybrid App — Business Rule Document (BRD)

> **Document ID:** ADR-BRD-001 · **Owner:** MBET Digital Solutions · **Market:** Addis Ababa, Ethiopia
> **Scope:** Both production apps — **Adera-PTP** (peer-to-peer parcel logistics) and **Adera-Shop** (partner e-commerce) — plus their shared backend and package contracts.
> **Source of truth:** This document distils the rules encoded in `supabase/schema.sql`, `supabase/functions.sql`, `supabase/10-wallet-system.sql`, `supabase/12-staff-broadcast-policy.sql`, `packages/utils/src/trackingUtils.js`, `apps/adera-ptp/src/screens/customer/CreateParcel.js`, `apps/adera-shop/screens/CheckoutScreen.js`, `docs/rls-matrix.md` and the product briefs in `ReferenceResources/`.

---

## 1. Reading this document

Every rule has a stable ID so it can be cited in code reviews, product tickets, support replies or investor documents.

* **ID format:** `BR-<DOMAIN>-<nnn>` (e.g. `BR-PC-002` = parcel-creation rule 2).
* **Enforcement (E):** where the rule lives — `DB` (schema/trigger/RLS), `EDGE` (Edge Function / server), `CLIENT` (app UI), `OPS` (human procedure).
* **Status:** ✅ In force today · 🔶 Designed, partially built · ⬜ Planned (write it down before you build on it).

Conventions used throughout:

| Term | Meaning |
|---|---|
| **PTP** | Peer-to-peer parcel logistics arm ("Adera-PTP") |
| **P1** | Drop-off partner (sender hands the parcel here) |
| **P2** | Pickup partner (recipient collects here) |
| **Hub** | Adera sorting facility (role `staff`) |
| **Walking customer** | Recipient who is *not* an Adera account holder; reachable by SMS only |
| **COD** | **Two different things by design** — *Cash on Delivery* in Shop; *Cash-on-Drop-off* in PTP (§7.3) |
| **ETB** | Ethiopian Birr |

---

## 2. Identity, accounts & onboarding

| ID | Rule | Enforcement | Status |
|---|---|---|---|
| BR-ID-001 | Every human account is a row in `users` created by the signup trigger from `auth.users`; the profile carries `role` (one of `customer`, `partner`, `driver`, `staff`, `admin`) and preferred `language`. | DB | ✅ |
| BR-ID-002 | A user holds **exactly one role**; the role selects the navigator (app UI) and every RLS policy. Changing a role is an admin/service-role action. | DB + CLIENT | ✅ |
| BR-ID-003 | Sign-up requires a name, email and password; Ethiopian mobile validation accepts `+2519XXXXXXXX`, `09XXXXXXXX`, `9XXXXXXXX` (9-digit + prefix forms) — see `isValidEthiopianPhone` in `CreateParcel.js` under the same pattern. | CLIENT | ✅ |
| BR-ID-004 | Only login-required users may: add to wishlist, purchase/checkout, review & rate, or use Adera Delivery. Shop **browsing is public** (guest mode). | CLIENT | ✅ |
| BR-ID-005 | A recipient does **not** need an account. Walking customers are identified by phone number on the parcel and receive SMS + in-app (if registered) notifications. | DB + CLIENT | ✅ |
| BR-ID-006 | Partner onboarding collects: business name, legal representative, phone, email, business category, map-pinned location, operating hours, accepted payment methods, optional business licence upload and logo; partner accounts remain **inactive (hidden from public shop browsing)** until an admin approves them. | OPS + DB | 🔶 (approval UX pending) |
| BR-ID-007 | Biometric login is opt-in; keystore-backed credentials are stored only after explicit first-login consent and are cleared when the user disables biometrics. | CLIENT | ✅ |

---

## 3. Roles & access control

| ID | Rule | Enforcement | Status |
|---|---|---|---|
| BR-AC-001 | All tables have **Row Level Security**; no client can bypass it. The full matrix lives in `docs/rls-matrix.md`. | DB | ✅ |
| BR-AC-002 | `parcels` are visible **only to stakeholders**: sender, drop-off partner P1, pickup partner P2, assigned driver, staff/admin. Everyone else — including guests with a tracking ID — is denied at the DB. | DB | ✅ |
| BR-AC-003 | `shops`: public reads **active** shops only; owner manages own shop; inactive shops are invisible publicly. | DB | ✅ |
| BR-AC-004 | `products`: public reads available products of active shops; only the shop owner writes. | DB | ✅ |
| BR-AC-005 | `orders`: customer reads/inserts own; shop owner reads and updates fulfilment status; neither can delete. | DB | ✅ |
| BR-AC-006 | `notifications`: user reads own; **staff/admin may insert notifications for any user** (broadcasts, support replies), read all (ticket queue), and mark read/resolved. | DB (12-staff-broadcast-policy.sql) | ✅ |
| BR-AC-007 | **No DELETE policies exist anywhere.** Deletion happens only via service role (cascades e.g. `parcel_events` on parcel delete). A dishonoured user is deactivated, never row-deleted. | DB | ✅ |
| BR-AC-008 | `payments`: user reads/inserts own; authoritative status writes belong to the **`chapa-verify` Edge Function** using the server-held `CHAPA_SECRET_KEY`. | DB + EDGE | ✅ |
| BR-AC-009 | `users.location` is readable by staff/admin for operations; privacy masking (≈1 km grid) is flagged in the RLS matrix backlog if partner complaints arise. | DB | ✅ |
| BR-AC-010 | Staff broadcast composer and staff ticket queue are the *only* admin powers that write into `notifications`; other overrides (parcel status, refunds) go through the service role / Edge Functions. | DB | ✅ |

---

## 4. Parcel lifecycle (PTP)

### 4.1 Canonical phases

Code anchor: `PARCEL_STATUS` in `packages/utils/src/trackingUtils.js` mirrors DB enum `parcel_status`. The numeric index is what the QR phase flag carries.

| # | Enum | Label shown in app | Meaning |
|---|---|---|---|
| 0 | `created` | Created | Order paid/accepted, awaiting physical drop-off |
| 1 | `dropoff` | At Drop-off | Scanned in at P1 |
| 2 | `in_transit_to_hub` | In Transit to Hub | Driver D1 scanned it out of P1 |
| 3 | `at_hub` | At Hub | Sorted at the facility; pickup address resolved |
| 4 | `dispatched` | Dispatched | Driver D2 took it from the hub toward P2 |
| 5 | `at_pickup_partner` | At Pickup Point | Scanned in at P2; recipient notified |
| 6 | `delivered` | Delivered | Verified handover to recipient (code/QR matched) |

| ID | Rule | Enforcement | Status |
|---|---|---|---|
| BR-PC-001 | Phase progression is **one-directional and sequential**; a scan's phase flag must equal `current + 1` (admin override is the only skip path). | DB (`record_parcel_event`) + CLIENT | ✅ |
| BR-PC-002 | Every scan persists to `parcel_events` with `parcel_id`, `status`, `actor_id`, `location`, `timestamp`; QR scans without a matching progression are rejected. | DB | ✅ |
| BR-PC-003 | A parcel is created **only** by the sender (the customer who fills the wizard). The single sanctioned exception: when a Shop order opts into Adera Delivery, the *buyer* may create the delivery order as recipient at checkout (§8.3). | CLIENT | ✅ |
| BR-PC-004 | Parcel creation **pends until payment completes**. The draft is purged after **24 hours** if unpaid. | CLIENT + DB | ✅ (purge job ⬜) |
| BR-PC-005 | The wizard is a 4-step flow — recipient → package → locations (P1/P2 on OSM map) → payment & terms — and requires terms acceptance including the prohibited-items acknowledgement before submit. | CLIENT | ✅ |
| BR-PC-006 | Attaching up to **3 photos** of the parcel is required at creation for visual cross-check at every handover (wrong-parcel defence). | CLIENT | 🔶 |
| BR-PC-007 | A parcel may be cancelled **only in `created`** state; cancellation in later phases requires a support case and staff action (refunds follow §7.5). | CLIENT (`canCancelParcel`) | ✅ |
| BR-PC-008 | Driver GPS pings every ~5 minutes are recorded with parcel events while a parcel is in their custody. | CLIENT + DB | 🔶 |
| BR-PC-009 | `orders.auto_create_parcel = true` (Shop checkout with Adera Delivery) inserts a linked `parcels` row with `tracking_id` and binds `orders.parcel_id`. Shop-sourced parcels obey the same phase rules from a hub or partner origin. | DB + CLIENT | ✅ |

### 4.2 QR & verification codes

| ID | Rule | Enforcement | Status |
|---|---|---|---|
| BR-QR-001 | QR payload = `TRACKING_ID + PHASE_FLAG + TIMESTAMP + HASH`, e.g. `ADE20231001-2-1672531005-7c6d3a`. The phase flag equals the enum index (0–6). | CLIENT (qr generator) + DB | ✅ |
| BR-QR-002 | **Pickup verification re-hash:** when the parcel arrives at P2, the backend hashes the final hash segment again (e.g. `7c6d3a → k53y7f`) and sends the *new* verification string to the recipient by SMS and/or in-app notification. | DB + EDGE | 🔶 (SMS pending) |
| BR-QR-003 | Release of the parcel at P2 happens only when the presented code pair (tracking ID + re-hashed string, or the re-hashed QR) validates. Wrong pair = no handover; partner logs an issue with photos. | CLIENT + DB | ✅ (manual verify) |
| BR-QR-004 | Each scan is bound to timestamp, location and acting user role; the system flags duplicate/out-of-order scans as anomalies for staff review. | DB | 🔶 |

---

## 5. Pricing & fees

### 5.1 PTP delivery fee

The fee is computed live in the wizard (`CreateParcel.js`):

```
fee = sizeBase + (haversineDistance(P1, P2) × 20 ETB/km)
```

| Size class | basePrice | Reference weight |
|---|---|---|
| Document | 50 ETB | 0.5 kg |
| Small (< 2 kg) | 100 ETB | 1.5 kg |
| Medium (2–5 kg) | 150 ETB | 4 kg |
| Large (5–10 kg) | 250 ETB | 8 kg |

| ID | Rule | Enforcement | Status |
|---|---|---|---|
| BR-PR-001 | Price depends on **size class + P1↔P2 great-circle distance**; urgency/fragile multipliers are env-configurable (`EXPO_PUBLIC_URGENT_MULTIPLIER`, `EXPO_PUBLIC_FRAGILE_FEE`) and default to no surcharge. | CLIENT | 🔶 |
| BR-PR-002 | The quote is displayed **before** payment selection and is bound to the chosen P1/P2 pair; changing partners recalculates it. | CLIENT | ✅ |
| BR-PR-003 | Server-side re-validation of the fee at parcel creation is the **#1 hardening item** (moving parcel INSERT behind an Edge Function) — until then the client-computed fee is trusted. | EDGE | ⬜ |
| BR-PR-004 | Shop-standard checkout delivery fee is **150 ETB** (door delivery) or **250 ETB** via Adera PTP network integration. | CLIENT (CheckoutScreen) | ✅ |

### 5.2 Shop commission (the 4% split)

`supabase/functions.sql §9` — `calculate_shop_commission()`:

```
total_commission = 4% of item price
buyer share      = 2% (added at checkout)
seller share     = 2% (added to the displayed list price)
display_price    = item_price + seller_share
```

| ID | Rule | Enforcement | Status |
|---|---|---|---|
| BR-CM-001 | The commission is **4% per item sold**, split **2% buyer + 2% seller**. | DB | ✅ |
| BR-CM-002 | The **visible price already includes the seller's 2%**; the seller sees the full price breakdown (original, commission, net) at item creation, and the buyer is shown the commission line explicitly at checkout. | CLIENT | 🔶 (seller breakdown UI pending) |
| BR-CM-003 | Seller net on a completed order = original item price; Adera net = seller 2% + buyer 2% (+ any delivery fee the buyer paid beyond Adera's cost). | DB | ✅ |
| BR-CM-004 | Partner/driver percentages from parcel and delivery volume are env-configurable (`EXPO_PUBLIC_PARTNER_COMMISSION_RATE`, `EXPO_PUBLIC_DRIVER_COMMISSION_RATE`) and accrue in the wallet when scans reach `delivered`. | DB (wallets) + CLIENT | 🔶 |

> Worked example (shop): item 1 000 ETB → display price 1 020 ETB; buyer pays 1 020 (+ 20 commission) and sees it as a separate line; seller receives the full 1 000; Adera books 40 ETB.

> Worked example (PTP): small parcel P1→P2 across 5.2 km → 100 + (5.2 × 20) = **204 ETB**.

---

## 6. Shops, products & orders

| ID | Rule | Enforcement | Status |
|---|---|---|---|
| BR-SH-001 | Only approved partners can operate a shop (`shops` row); the storefront inherits the partner's location, hours and payment methods. | DB | ✅ |
| BR-SH-002 | Anyone can browse (guest mode); wishlist, cart checkout, reviews/ratings and Adera-Delivery-at-checkout require sign-in. | CLIENT | ✅ |
| BR-SH-003 | Product reviews are unique per (user, product), rated 1–5, and recompute the product's `average_rating`/`total_reviews` via trigger. | DB (reviews migration) | ✅ |
| BR-SH-004 | A cart round must belong to **one shop** per order (cart resolves the shop server-side; `shop_id` is taken from the first item and validated). | DB + CLIENT | ✅ |
| BR-SH-005 | The buyer may designate **any Ethiopian phone** as recipient and may attach a different delivery address; gift/direct-ship flows are supported. | CLIENT | ✅ |
| BR-SH-006 | On `delivered`, a trigger increments the shop's `total_orders`; shop statistics and rating drive storefront ranking. | DB | ✅ |
| BR-SH-007 | Shops declare accepted payment methods (COD, Chapa settlement channels, wallet) and may declare bank/TeleBirr accounts for direct settlement outside the in-app wallet. | DB + CLIENT | 🔶 |
| BR-SH-008 | Promotion ads and flash sales are product-features (planned); any price shown must still respect BR-CM-002 transparency. | — | ⬜ |

---

## 7. Payments, wallet & refunds

| ID | Rule | Enforcement | Status |
|---|---|---|---|
| BR-PM-001 | Supported methods: **Adera Wallet**, **Chapa** (sole online gateway — its checkout settles TeleBirr, CBE Birr, M-Pesa, Amole, bank transfer), and **COD** per §7.3. TeleBirr/ArifPay direct integrations were **dropped** 2026-09-27. | CLIENT (@adera/payments) | ✅ |
| BR-PM-002 | Chapa payments are created client-side with a `tx_ref` and verified **server-side** by the `chapa-verify` Edge Function, which is idempotent and writes final `payment_status` / `paid_at` via service role. | EDGE | ✅ |
| BR-PM-003 | A PTP parcel with `payment_method = chapa` stays `payment_status = pending` until verify succeeds; the client returns through `PaymentCallbackScreen`. | CLIENT + EDGE | ✅ |
| BR-PM-004 | Wallet debits are atomic with the spend (balance_before/after recorded per transaction); wallet rows are unique per (user, wallet_type) and carry `balance`, `pending_balance`, `total_earned`, `total_spent`, `is_frozen`. | DB | ✅ |
| BR-PM-005 | Wallet transaction types: `credit` (top-up/refund/bonus), `debit` (payment/withdrawal), `commission` (earnings from deliveries), `transfer` (P2P). | DB | ✅ |
| BR-PM-006 | Direct client writes cannot alter another user's wallet; wallet credit/debit functions run as security-definer functions. | DB | ✅ |

### 7.3 The two COD meanings (product-mandated)

| ID | Rule | Enforcement | Status |
|---|---|---|---|
| BR-PM-007 | **Shop COD** — recipient pays the seller's amount + delivery fee in cash at the door; the order can complete without an online payment. | CLIENT | ✅ |
| BR-PM-008 | **PTP Cash-on-Drop-off** — sender with cash only selects a P1 that offers the service; P1 pays the delivery fee on the sender's behalf via the gateways and recovers cash at the counter. The **sender must notify ≥ 24 h before drop-off and P1 must explicitly consent in-system during that window**. | CLIENT + OPS | 🔶 |
| BR-PM-009 | **Recipient-pays / pay-on-pickup** — payment waived to the recipient; unfulfilled after **24 h → auto-cancel** (walking-customer variants: bank transfer, or a P2 that accepts cash and pays Adera from its wallet). In the cash-at-P2 variant, the re-hashed release code is only issued after cash is received. | OPS + CLIENT | 🔶 |

### 7.5 Refunds & cancellations

| ID | Rule | Enforcement | Status |
|---|---|---|---|
| BR-PM-010 | Cancelled-in-`created` parcels auto-refund to source (wallet `credit` type `refund`; gateway refunds via Chapa ops). | CLIENT + EDGE | 🔶 |
| BR-PM-011 | Wallet credits from cancelled shop orders restore the buyer's wallet before the commission ledger is adjusted (no Adera commission on refunded orders). | DB | 🔶 |
| BR-PM-012 | Failed/expired payment intents leave pending drafts for the 24 h purge (BR-PC-004); no orphan charge is possible because verification is server-authoritative. | EDGE | ✅ |

---

## 8. Communication & notifications

| ID | Rule | Enforcement | Status |
|---|---|---|---|
| BR-NT-001 | In-app notifications fire on: parcel creation, each phase change, payment confirmation, and pickup-code delivery. | DB (trigger) + CLIENT (NotificationBell) | ✅ |
| BR-NT-002 | Push notifications via Expo/FCM; live delivery into `notifications` via real-time subscription; unread banner/count surfaced by the notification bell. | CLIENT | ✅ |
| BR-NT-003 | **SMS is mandatory for recipients regardless of membership** (walking customers), carrying tracking ID, then the re-hashed pickup verification code. Integration pending (⬜). | EDGE | 🔶 |
| BR-NT-004 | Staff/admin may broadcast notifications to all users or reply into a support ticket; tickets are notifications of a specific type addressed to staff. | DB (policy 12) | ✅ |
| BR-NT-005 | In-app chat between sender/recipient/driver/partner per parcel is specified; rooms are role-based; support chat moderation belongs to admin. | DB (messages) | ⬜ |
| BR-NT-006 | Every notification-relevant actor event also mirrors to `events_log` (action_type, actor_role, parcel_id, meta) for audit. | DB | ✅ |

---

## 9. Role operating rules

### Partner (P1 / P2)
| ID | Rule |
|---|---|
| BR-PA-001 | Partner scans QR at both role ends: **check-in** (sender presents; status → 1) AND **release** (recipient code verified; status → 6). Manual code entry is the fallback when a phone can't scan. |
| BR-PA-002 | Partners may reject a parcel at check-in (damaged/forbidden content mismatch) and must attach photos (max. 3) — flagged for staff adjudication. |
| BR-PA-003 | Partner earnings dashboard tracks per-parcel commission and withdrawal history (linked TeleBirr/Chapa); payouts accrue on scan-completed deliveries (BR-CM-004). |
| BR-PA-004 | Partners operating COD-on-dropoff must have chosen the service flag at onboarding (BR-PM-008); consent UX flows through their dashboard. |

### Driver
| ID | Rule |
|---|---|
| BR-DR-001 | Drivers only handle parcels assigned to them; the Task List and Route Map show assigned stops, sorted by proximity with turn-by-turn via OSM. |
| BR-DR-002 | Scan out of P1 (→2), scan in at hub (→3 via staff), scan out of hub (→4), scan in at P2 (→5) — every scan logs GPS + timestamp; bulk scan is supported at handover points. |
| BR-DR-003 | Photo capture (max. 3) on suspected damage or a mismatched parcel is mandatory before marking a failure. |
| BR-DR-004 | Earnings = per-parcel commission (BR-CM-004), tracked per day; performance metrics (deliveries/day, ratings) feed the gamification tiers. |

### Staff (hub)
| ID | Rule |
|---|---|
| BR-ST-001 | Staff batch-scan hub intake/outtake, assign drivers to outbound legs, and classify stale/expiring parcels in Parcel Oversight (issue triage: stale > 24 h, expiring, mismatched scans). |
| BR-ST-002 | Staff see ticket queue (support notifications) and can reply/broadcast (BR-NT-004). |
| BR-ST-003 | Staff analytics show platform KPIs: parcels/24 h, in-transit, orders, revenue. |
| BR-ST-004 | Only staff/admin may change a status out of sequence (admin override path of BR-PC-001). |

### Admin
| ID | Rule |
|---|---|
| BR-AD-001 | Admin approves/links partner shops and vendors; deactivates accounts after moderation; approves waivers of cancellation beyond `created` state. |
| BR-AD-002 | Admin reads `users`, `parcels`, `orders`, `payments`, `notifications` across the platform (per RLS matrix) for oversight and reconciliation. |
| BR-AD-003 | Payment reconciliation compares `payments` (client intent) with `chapa-verify` results; mismatches open a dispute, never a client-side edit. |
| BR-AD-004 | Config changes (rates, fees, feature flags via env) are deployed like code; ops runbook governs releases (docs/release-runbook.md). |

---

## 10. Security, privacy & data rules

| ID | Rule | Status |
|---|---|---|
| BR-SG-001 | Secrets live server-side only (`SUPABASE_SERVICE_ROLE_KEY`, `CHAPA_SECRET_KEY`, `JWT_SECRET`, `QR_SECRET_KEY`); clients receive only `EXPO_PUBLIC_*` values. | ✅ |
| BR-SG-002 | Biometric unlock (fingerprint/face) gates sensitive activity; credentials vanish on disable (BR-ID-007). | ✅ |
| BR-SG-003 | Sentry error tracking is wired and DSN-gated; dev no-ops; PII is stripped. | ✅ |
| BR-SG-004 | Guest parcel tracking by ID alone is **not** possible under current RLS; if productised, it must go through a security-definer function, not a policy loosening. | ✅ (design constraint) |
| BR-SG-005 | Rate limiting endpoints: `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX_REQUESTS`. | 🔶 |
| BR-SG-006 | `Event log` immutability: `events_log`, `parcel_events` are append-only for clients; corrections are staff actions recorded as new events. | ✅ |

---

## 11. Operational SLA-ish limits

| Limit | Value | Source |
|---|---|---|
| Unpaid parcel draft retention | 24 h then purge | BR-PC-004 |
| COD/recipient-pays consent window | 24 h before cancel | BR-PM-009 |
| Cash-on-dropoff notice | ≥ 24 h before drop-off, explicit consent | BR-PM-008 |
| Parcel photos per event | max 3 | BR-PC-006 etc. |
| Driver GPS ping cadence | ~5 min | BR-PC-008 |
| Expiry of QR trigger timestamps | phase-bound; hash rotates at P2 | BR-QR-002 |
| Price display rule | full commission transparency on both sides | BR-CM-002 |

---

## 12. Exceptions & open interpretations

These touchpoints need a business decision before the ambiguity bites in production:

1. **Fee tampering (BR-PR-003)** — parcel INSERT should move behind an Edge Function that recomputes the fee with the same constants; none exists today.
2. **Role change for partners awaiting approval** — a partner account whose `is_active` is false cannot operate; the flow for appeal/kYC resubmission is `OPS` manual.
3. **Guest tracking** — blocked by RLS today; if the SMS link should show status, a security-definer `track_by_tracking_id()` is the sanctioned path.
4. **Wallet UI** — the wallets schema is live but top-up/withdraw/transaction-history screens are still to be built (roadmap).
5. **Multi-currency** — everything is ETB; any FX feature is out of scope until central-bank compliance is scoped.

---

## 13. Rule-to-feature map (quick audit index)

| Domain | Feature file(s) | Rules |
|---|---|---|
| Parcel creation | `CreateParcel.js`, `parcelService` | BR-PC-001..009 |
| Tracking | `TrackParcel.js`, `trackingUtils.js` | BR-QR-001..004, BR-PC-002 |
| Shop & cart | `apps/adera-shop/*` | BR-SH-* |
| Checkout & delivery link | `CheckoutScreen.js` | BR-PR-004, BR-PC-009 |
| Payments | `packages/payments/*`, `supabase/functions/chapa-verify` | BR-PM-* |
| Wallet | `10-wallet-system(deployment).sql` | BR-PM-004..006, BR-CM-004 |
| RLS & roles | `schema.sql`, `12-staff-broadcast-policy.sql`, `docs/rls-matrix.md` | BR-AC-* |
| Notifications | `NotificationBell`, `11-12` migrations | BR-NT-* |
| Role UX | `src/navigation/*Navigator.js`, `src/screens/{customer,partner,driver,staff}` | BR-PA/DR/ST/AD-* |

*(Some rule rows cross-list deliberately; audit settlements should update this index alongside the rules.)*

---

## 14. Change log

| Date | Change |
|---|---|
| 2026-10-07 | First exhaustive codification; sourced from live schema, code and product briefs. Chapa-only payment posture, 4% split commission, phase-0..6 lifecycle, two-COD clarification. |
