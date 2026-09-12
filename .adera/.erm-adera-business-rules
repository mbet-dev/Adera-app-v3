
---
trigger: always_on
alwaysApply: true
---


# Business Rules (Adera)

## General
- Roles: customer (sender/recipient), partner, driver, staff, admin.
- Multilingual: English default; Amharic supported at launch.

## Logistics (Adera-PTP)
- Parcel creation requires payment; pending entries auto-expire within 24h if unpaid.
- Status flags (0→6): created, dropoff, in_transit_to_hub, at_hub, dispatched, at_pickup_partner, delivered.
 - QR structure: TRACKING_ID + PHASE_FLAG + TIMESTAMP + HASH.
   - Hashing strategy (server-side): HMAC-SHA256 over `TRACKING_ID|PHASE|PICKUP_PARTNER_ID|issued_at` with a server secret; encode as short base36 (6–8 chars).
   - Rehash rotation: on arrival at pickup partner; previous code invalidated; expiry 48h; single-use; constant-time compare.
   - Storage: store only hashed/peppered value for verification; log events in `parcel_events`.
- Pickup-point rehash: backend generates new hash on arrival at pickup partner; recipient receives SMS/app code; verification requires TRACKING_ID + new hash or scanning new QR.
- Each scan stores timestamp, location (GPS), and actor role; transitions must be sequential.
- Drivers upload up to 3 photos for issues; same for sender/recipient/staff for disputes.
- Dynamic pricing by distance, size/weight, urgency; route optimization for drivers.

## Payments
- Initial Gateways: Telebirr, Chapa; ArifPay optional later. In-app wallet; COD supported.
- COD semantics:
  - Adera-Shop: Cash on Delivery (buyer pays on receipt incl. delivery fee).
  - Adera-PTP: Cash on Dropoff (partner pre-consents to pay on sender’s behalf within 24h; parcel remains pending until paid).

## E-Commerce (Adera-Shop)
- Guest browsing allowed; actions (wishlist, checkout, review, Adera delivery) require login.
- Checkout can auto-create a logistics order where recipient may be the one triggering delivery (exception to PTP sender-only rule).
- Commission: 0% for now (launch policy). Future policy example: 4% per item auto-included in price with transparent split (2% buyer, 2% seller) shown at item creation (partner) and checkout (buyer).
- Partner payouts: accrued on completed transactions; weekly auto-payout.
- Ratings/reviews and in-app promotions/ads supported (future growth).

## Partner Onboarding (key fields)
 - Business name, legal rep, phone (collected), email, password, category, map location, operating hours, accepted payment methods, T&C acceptance; optional license and logo.
 - Verification: email and in-app verification for now; SMS OTP to be enabled when provider is provisioned.

## Notifications
- Push for active users and Email for critical alerts (codes, confirmations). SMS is disabled for now and will be enabled later (Twilio/local aggregator). In-app banners persist until read.

## Onboarding & Guest Mode
- App opens to onboarding with two primary CTAs and app selector:
  - "Log In / Sign Up" (auth flow) and "Continue as Guest".
  - App tiles: Adera-PTP and Adera-Shop.
- Post-auth routing is role-based:
  - Customer: PTP dashboard (create/track) and Shop marketplace.
  - Partner: scanning dashboard (PTP) and shop dashboard (Shop).
  - Driver: task list and navigation.
  - Staff/Admin: redirected to relevant portals (internal/web for admin in Phase 3).
- Guest capabilities:
  - Browse Adera-Shop marketplace (read-only). Actions (wishlist, cart, checkout, reviews) require auth.
  - View Adera-PTP partner locations within Create Parcel screen context, but parcel creation requires authentication (CTA prompts login).
