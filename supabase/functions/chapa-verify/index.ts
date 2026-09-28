// Adera — Chapa Payment Verification Edge Function
// ------------------------------------------------
// Server-side verification of Chapa transactions using the SECRET key
// (never exposed to clients). Marks parcels/orders paid idempotently.
//
// Callers:
//   1. Client apps after Chapa redirect:  supabase.functions.invoke('chapa-verify', { body: { tx_ref } })
//      Authenticated with the user's JWT — the user must own the parcel/order.
//   2. Chapa webhook callback (callback_url): Chapa POSTs the full transaction
//      payload. Authenticated with the shared secret header `x-adera-callback-secret`.
//
// Env vars (set via `supabase secrets set`):
//   CHAPA_SECRET_KEY        - Chapa secret key (server-side only)
//   CHAPA_WEBHOOK_SECRET    - Shared secret for webhook calls
//
// Idempotency strategy:
//   - payments row keyed by gateway_transaction_id (tx_ref): short-circuits if
//     already 'completed'; guarded UPDATE otherwise; INSERT only when absent.
//   - parcel/order settlement uses guarded UPDATE ... WHERE payment_status <> 'paid',
//     so replaying the same tx_ref can never double-apply or error.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-adera-callback-secret",
};

const CHAPA_BASE_URL = "https://api.chapa.co/v1";

interface ChapaVerifyResponse {
  status?: string;
  message?: string;
  data?: {
    tx_ref?: string;
    amount?: string | number;
    currency?: string;
    status?: string; // "success" | "failed" | "pending"
    method?: string;
    first_name?: string;
    last_name?: string;
    meta?: Record<string, unknown>;
  };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const chapaSecretKey = Deno.env.get("CHAPA_SECRET_KEY") ?? "";
  const webhookSecret = Deno.env.get("CHAPA_WEBHOOK_SECRET") ?? "";

  if (!chapaSecretKey) {
    console.error("CHAPA_SECRET_KEY is not configured");
    return json({ error: "Payment verification is not configured" }, 500);
  }

  // ── 1. Parse request ──────────────────────────────────────────────
  let body: { tx_ref?: string; trx_ref?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  // Chapa webhook sends trx_ref; our client sends tx_ref
  const txRef = body.tx_ref || body.trx_ref;
  if (!txRef || typeof txRef !== "string") {
    return json({ error: "tx_ref is required" }, 400);
  }

  // ── 2. Authenticate the caller ────────────────────────────────────
  // Two accepted paths:
  //   a) Chapa webhook with the shared secret header, OR
  //   b) Supabase user JWT (the user must own the referenced parcel/order).
  const callbackSecret = req.headers.get("x-adera-callback-secret") ?? "";
  const isTrustedCallback = webhookSecret !== "" && callbackSecret === webhookSecret;

  let callerUserId: string | null = null;

  if (!isTrustedCallback) {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }
    const userClient = createClient(supabaseUrl, serviceRoleKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData?.user) {
      return json({ error: "Unauthorized" }, 401);
    }
    callerUserId = userData.user.id;
  }

  // ── 3. Idempotency short-circuit: already settled? ────────────────
  const admin = createClient(supabaseUrl, serviceRoleKey);

  const { data: existingPayment } = await admin
    .from("payments")
    .select("id, payment_status, parcel_id, order_id, user_id, amount")
    .eq("gateway_transaction_id", txRef)
    .maybeSingle();

  if (existingPayment?.payment_status === "completed") {
    return json({
      success: true,
      already_processed: true,
      tx_ref: txRef,
      parcel_id: existingPayment.parcel_id ?? null,
      order_id: existingPayment.order_id ?? null,
    });
  }

  // ── 4. Verify with Chapa using the SECRET key ─────────────────────
  let verification: ChapaVerifyResponse;
  try {
    const chapaRes = await fetch(`${CHAPA_BASE_URL}/transaction/verify/${encodeURIComponent(txRef)}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${chapaSecretKey}` },
    });
    verification = await chapaRes.json();
    if (!chapaRes.ok) {
      console.error("Chapa verify failed:", chapaRes.status, verification?.message);
      return json(
        { success: false, error: verification?.message || "Chapa verification failed" },
        chapaRes.status === 404 ? 404 : 502,
      );
    }
  } catch (err) {
    console.error("Chapa network error:", err);
    return json({ error: "Failed to reach Chapa" }, 502);
  }

  const chapaData = verification.data;
  const chapaStatus = (chapaData?.status || verification.status || "").toLowerCase();

  // ── 5. Resolve the target parcel/order and validate ownership+amount ──
  // Priority: explicit meta from Chapa payload -> existing payments row -> tx_ref lookup.
  const meta = (chapaData?.meta ?? {}) as Record<string, unknown>;
  let parcelId = (meta.parcel_id as string) || existingPayment?.parcel_id || null;
  let orderId = (meta.order_id as string) || existingPayment?.order_id || null;
  let ownerId = existingPayment?.user_id || null;
  let expectedAmount: number | null = existingPayment ? Number(existingPayment.amount) : null;

  if (parcelId) {
    const { data: parcel } = await admin
      .from("parcels")
      .select("id, sender_id, total_amount, payment_status")
      .eq("id", parcelId)
      .maybeSingle();
    if (parcel) {
      ownerId = ownerId || parcel.sender_id;
      expectedAmount = expectedAmount ?? Number(parcel.total_amount);
    } else {
      parcelId = null;
    }
  }

  if (!parcelId && orderId) {
    const { data: order } = await admin
      .from("orders")
      .select("id, customer_id, total_amount, payment_status, tx_ref")
      .eq("id", orderId)
      .maybeSingle();
    if (order) {
      ownerId = ownerId || order.customer_id;
      expectedAmount = expectedAmount ?? Number(order.total_amount);
    } else {
      orderId = null;
    }
  }

  // Fallback: PTP stores tracking_id as tx_ref; Shop stores tx_ref column.
  if (!parcelId && !orderId) {
    const { data: parcelByTracking } = await admin
      .from("parcels")
      .select("id, sender_id, total_amount, payment_status")
      .eq("tracking_id", txRef)
      .maybeSingle();
    if (parcelByTracking) {
      parcelId = parcelByTracking.id;
      ownerId = parcelByTracking.sender_id;
      expectedAmount = Number(parcelByTracking.total_amount);
    } else {
      const { data: orderByTxRef } = await admin
        .from("orders")
        .select("id, customer_id, total_amount, payment_status")
        .eq("tx_ref", txRef)
        .maybeSingle();
      if (orderByTxRef) {
        orderId = orderByTxRef.id;
        ownerId = orderByTxRef.customer_id;
        expectedAmount = Number(orderByTxRef.total_amount);
      }
    }
  }

  if (!parcelId && !orderId) {
    return json({ error: "No parcel or order found for this transaction reference" }, 404);
  }

  // Ownership check for client-initiated calls
  if (!isTrustedCallback && callerUserId && ownerId && callerUserId !== ownerId) {
    return json({ error: "Forbidden: transaction does not belong to caller" }, 403);
  }

  // Amount validation — never trust the client-paid amount alone
  const paidAmount = Number(chapaData?.amount ?? NaN);
  if (Number.isFinite(paidAmount) && expectedAmount !== null && Math.abs(paidAmount - expectedAmount) > 0.01) {
    console.error(`Amount mismatch for ${txRef}: paid ${paidAmount}, expected ${expectedAmount}`);
    await admin.from("payments").upsert(
      {
        parcel_id: parcelId,
        order_id: orderId,
        user_id: ownerId,
        amount: paidAmount,
        currency: chapaData?.currency || "ETB",
        payment_method: "chapa",
        payment_status: "failed",
        gateway_transaction_id: txRef,
        gateway_response: { reason: "amount_mismatch", paid: paidAmount, expected: expectedAmount, raw: verification },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "gateway_transaction_id" },
    );
    return json({ success: false, error: "Payment amount does not match the order total" }, 409);
  }

  const isPaid = chapaStatus === "success" || chapaStatus === "completed";
  const nowIso = new Date().toISOString();

  // ── 6. Record the payment idempotently ────────────────────────────
  if (existingPayment) {
    await admin
      .from("payments")
      .update({
        payment_status: isPaid ? "completed" : chapaStatus === "pending" ? "pending" : "failed",
        gateway_response: verification,
        updated_at: nowIso,
        completed_at: isPaid ? (existingPayment as any).completed_at ?? nowIso : null,
      })
      .eq("id", existingPayment.id);
  } else {
    await admin.from("payments").insert({
      parcel_id: parcelId,
      order_id: orderId,
      user_id: ownerId,
      amount: paidAmount || expectedAmount || 0,
      currency: chapaData?.currency || "ETB",
      payment_method: "chapa",
      payment_status: isPaid ? "completed" : chapaStatus === "pending" ? "pending" : "failed",
      gateway_transaction_id: txRef,
      gateway_response: verification,
      completed_at: isPaid ? nowIso : null,
    });
  }

  if (!isPaid) {
    return json({ success: false, status: chapaStatus || "failed", tx_ref: txRef });
  }

  // ── 7. Settle the parcel/order with guarded idempotent updates ────
  const settledAt = nowIso;
  if (parcelId) {
    const { data: updatedParcel } = await admin
      .from("parcels")
      .update({ payment_status: "paid", paid_at: settledAt })
      .eq("id", parcelId)
      .neq("payment_status", "paid")
      .select("id");
    const firstSettle = (updatedParcel?.length ?? 0) > 0;

    // Insert a parcel event so tracking shows the payment milestone
    if (firstSettle && ownerId) {
      const { data: parcelRow } = await admin
        .from("parcels")
        .select("status, current_location")
        .eq("id", parcelId)
        .maybeSingle();
      if (parcelRow) {
        await admin.from("parcel_events").insert({
          parcel_id: parcelId,
          status: parcelRow.status ?? 0,
          actor_id: ownerId,
          actor_role: "customer",
          location: parcelRow.current_location,
          notes: "Payment confirmed via Chapa",
          verification_method: "chapa_gateway",
        });
      }
    }
  }

  if (orderId) {
    await admin
      .from("orders")
      .update({ payment_status: "paid", paid_at: settledAt, status: "confirmed" })
      .eq("id", orderId)
      .neq("payment_status", "paid");
  }

  // ── 8. Notify the user (in-app; push handled by NotificationBell) ──
  if (ownerId) {
    const label = parcelId ? "parcel" : "order";
    await admin.from("notifications").insert({
      user_id: ownerId,
      title: "Payment Confirmed",
      body: `Your Chapa payment of ${paidAmount || expectedAmount} ETB for ${label} ${txRef} was confirmed successfully.`,
      type: "payment",
      reference_id: parcelId || orderId,
      reference_type: parcelId ? "parcel" : "order",
    });
  }

  return json({
    success: true,
    already_processed: false,
    tx_ref: txRef,
    parcel_id: parcelId,
    order_id: orderId,
    amount: paidAmount || expectedAmount,
    currency: chapaData?.currency || "ETB",
    method: chapaData?.method || null,
  });
});
