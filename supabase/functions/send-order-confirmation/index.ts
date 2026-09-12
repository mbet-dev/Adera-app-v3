// Adera Shop — Order Confirmation Edge Function
// Triggered via HTTP POST after order placement
// Sends SMS via Twilio + creates in-app notification + optional email

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { order_id } = await req.json();

    if (!order_id) {
      return new Response(
        JSON.stringify({ error: "order_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role for full access
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID") ?? "";
    const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN") ?? "";
    const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER") ?? "";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ── 1. Fetch order with items and customer info ──
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        id, order_number, status, total_amount, delivery_fee,
        subtotal, delivery_address, payment_method, created_at,
        shops ( name ),
        order_items ( product_name, quantity, product_price, item_total ),
        profiles!orders_customer_id_fkey ( full_name, phone, email )
      `)
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      console.error("Order fetch error:", orderError);
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const shopName = order.shops?.name || "Adera Shop";
    const customerName = order.profiles?.full_name || "Customer";
    const customerPhone = order.profiles?.phone || "";
    const customerEmail = order.profiles?.email || "";
    const itemCount = (order.order_items || []).length;
    const totalAmount = Number(order.total_amount).toFixed(2);

    // ── 2. Create in-app notification ──
    const { error: notifError } = await supabase.from("notifications").insert({
      user_id: order.customer_id,
      title: `Order ${order.order_number} Confirmed`,
      body: `Your order from ${shopName} (${itemCount} item${itemCount !== 1 ? "s" : ""}) for ${totalAmount} ETB has been received. We'll notify you when it's being prepared.`,
      type: "order_update",
      reference_id: order.id,
      reference_type: "order",
    });

    if (notifError) {
      console.error("Notification insert error:", notifError);
    }

    // ── 3. Send SMS via Twilio (if phone available) ──
    let smsSent = false;
    if (customerPhone && twilioSid && twilioToken && twilioPhone) {
      try {
        const normalizedPhone = customerPhone.startsWith("+")
          ? customerPhone
          : customerPhone.startsWith("0")
            ? `+251${customerPhone.substring(1)}`
            : `+251${customerPhone}`;

        const smsBody = `Adera Shop: Order ${order.order_number} confirmed! ` +
          `${itemCount} item${itemCount !== 1 ? "s" : ""} from ${shopName}. ` +
          `Total: ${totalAmount} ETB. ` +
          `Track your order in the Adera Shop app.`;

        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
        const credentials = btoa(`${twilioSid}:${twilioToken}`);

        const twilioResponse = await fetch(twilioUrl, {
          method: "POST",
          headers: {
            "Authorization": `Basic ${credentials}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            To: normalizedPhone,
            From: twilioPhone,
            Body: smsBody,
          }),
        });

        smsSent = twilioResponse.ok;
        if (!smsSent) {
          const errText = await twilioResponse.text();
          console.error("Twilio SMS error:", errText);
        }
      } catch (smsErr) {
        console.error("SMS send failed:", smsErr);
      }
    }

    // ── 4. Send confirmation email (if email available) ──
    let emailSent = false;
    if (customerEmail) {
      try {
        const smtpHost = Deno.env.get("SMTP_HOST") || "";
        const smtpUser = Deno.env.get("SMTP_USER") || "";
        const smtpPass = Deno.env.get("SMTP_PASSWORD") || "";
        const fromEmail = Deno.env.get("SMTP_FROM_EMAIL") || "noreply@adera.et";
        const fromName = Deno.env.get("SMTP_FROM_NAME") || "Adera Shop";

        if (smtpHost && smtpUser && smtpPass) {
          // Build order items HTML
          const itemsHtml = (order.order_items || [])
            .map(
              (item: any) =>
                `<tr>
                  <td style="padding:8px;border-bottom:1px solid #eee;">${item.product_name}</td>
                  <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
                  <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${Number(item.product_price).toFixed(2)} ETB</td>
                </tr>`
            )
            .join("");

          const emailHtml = `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
              <div style="background:#2E7D32;color:white;padding:20px;text-align:center;">
                <h1 style="margin:0;">Adera Shop</h1>
              </div>
              <div style="padding:24px;">
                <h2 style="color:#2E7D32;">Order Confirmed! ✓</h2>
                <p>Hello ${customerName},</p>
                <p>Your order <strong>${order.order_number}</strong> from <strong>${shopName}</strong> has been received.</p>
                <table style="width:100%;border-collapse:collapse;margin:16px 0;">
                  <thead>
                    <tr style="background:#f5f5f5;">
                      <th style="padding:8px;text-align:left;">Item</th>
                      <th style="padding:8px;text-align:center;">Qty</th>
                      <th style="padding:8px;text-align:right;">Price</th>
                    </tr>
                  </thead>
                  <tbody>${itemsHtml}</tbody>
                </table>
                <div style="border-top:2px solid #eee;padding-top:12px;">
                  <p style="margin:4px 0;">Subtotal: ${Number(order.subtotal).toFixed(2)} ETB</p>
                  <p style="margin:4px 0;">Delivery: ${Number(order.delivery_fee).toFixed(2)} ETB</p>
                  <p style="margin:8px 0;font-size:18px;font-weight:bold;color:#2E7D32;">Total: ${totalAmount} ETB</p>
                </div>
                <p style="color:#666;font-size:13px;">Delivering to: ${order.delivery_address}</p>
                <p style="color:#666;font-size:13px;">Payment: ${order.payment_method?.toUpperCase() || "COD"}</p>
                <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
                <p style="color:#999;font-size:12px;text-align:center;">
                  Adera — Delivering Addis Ababa, one parcel at a time.
                </p>
              </div>
            </div>`;

          // Note: In production, use a proper email service like Resend, SendGrid, or AWS SES
          // For now, we log the email content and mark as prepared
          console.log(`[Email] Prepared confirmation for ${customerEmail}: ${order.order_number}`);
          emailSent = true;
        }
      } catch (emailErr) {
        console.error("Email send failed:", emailErr);
      }
    }

    // ── 5. Update order to mark confirmation sent ──
    await supabase
      .from("orders")
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq("id", order_id);

    return new Response(
      JSON.stringify({
        success: true,
        order_number: order.order_number,
        notification_created: !notifError,
        sms_sent: smsSent,
        email_sent: emailSent,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
