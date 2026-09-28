# Supabase RLS Matrix — Adera Hybrid App

**Last reviewed:** 2026-09-28 · **Source:** `supabase/schema.sql` + `supabase/12-staff-broadcast-policy.sql`

Every table has RLS enabled. This matrix records who can do what, and flags residual gaps.

## Policy Matrix

| Table | SELECT | INSERT | UPDATE | DELETE | Notes |
|---|---|---|---|---|---|
| `users` | own row; staff/admin read all | own row (signup) | own row | — (service role only) | `users_admin_read` added for staff roster views |
| `shops` | active shops (public) | owner | owner | owner | inactive shops hidden from public |
| `products` | available products of active shops | shop owner | shop owner | shop owner | cart resolves shop server-side |
| `parcels` | stakeholders: sender / dropoff partner / pickup partner / driver / staff-admin | stakeholders | stakeholders | — | guest tracking not possible (see gaps) |
| `parcel_events` | same stakeholder set as parent parcel | stakeholders | stakeholders | — | subquery mirror of parcels |
| `orders` | customer; shop owner | customer | customer, shop owner | — | `parcel_id` links auto-created parcel |
| `order_items` | via parent order | via parent order | via parent order | — | |
| `payments` | own payments | own (client) | own | — | **verification should move server-side** (Edge Function does this) |
| `notifications` | own; staff/admin all rows | own; **staff broadcast** | own; staff (mark read) | own | new in `12-staff-broadcast-policy.sql` |

## Staff / Admin (new)

`supabase/12-staff-broadcast-policy.sql` adds:
- `notifications_staff_insert` — staff/admin may insert notifications for any user (broadcasts, support replies).
- `notifications_staff_select` — staff/admin may read all notifications (support ticket queue).
- `notifications_staff_update` — staff/admin may mark tickets read/resolved.

These are required by the Staff → Support broadcast composer and ticket list.

## Known Gaps & Hardening Backlog

1. **Parcel INSERT via Edge Function.** Parcel creation currently happens client-side; moving it behind an Edge Function would let us validate pricing server-side (fee tampering prevention) and auto-assign tracking IDs atomically.
2. **Payments status writes.** `payments` rows are written by clients with the anon key; the `chapa-verify` Edge Function (service role) is the authoritative writer for `payment_status`/`paid_at`. Consider revoking client UPDATE on `payments` once webhooks are live.
3. **Guest parcel tracking.** Stakeholder-only parcel policy means guests cannot track via tracking ID; if guest tracking is wanted, expose it via a security-definer SQL function rather than relaxing RLS.
4. **No DELETE policies anywhere.** Intentional — deletes go through service role only (cascade via `ON DELETE CASCADE` on parcel_events).
5. **Column-level privacy.** `users.location` (POINT) is readable by anyone with `users_admin_read`; acceptable for ops, revisit if partner privacy complaints arise (mask to ~1km grid).
