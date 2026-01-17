import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CONFIRM-DFY-PURCHASE] ${step}${detailsStr}`);
};

// Go High Level Webhook URL
const GHL_WEBHOOK_URL = "https://services.leadconnectorhq.com/hooks/f3lkMOjhelReglpXlnVa/webhook-trigger/c640f54b-49e1-44ec-a0c3-1d86a53c4ca6";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { sessionId } = await req.json();
    if (!sessionId) {
      return new Response(JSON.stringify({ error: "Session ID is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    logStep("Verifying session", { sessionId });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['customer', 'payment_intent']
    });

    logStep("Session retrieved", { 
      status: session.payment_status,
      customerEmail: session.customer_details?.email 
    });

    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ 
        error: "Payment not completed",
        status: session.payment_status 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Extract customer info from metadata or session
    const customerName = session.metadata?.customer_name || session.customer_details?.name || "";
    const customerEmail = session.metadata?.customer_email || session.customer_details?.email || "";
    const customerPhone = session.metadata?.customer_phone || session.customer_details?.phone || "";

    logStep("Customer info extracted", { customerName, customerEmail, customerPhone: customerPhone ? "provided" : "not provided" });

    // Create Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check if order already exists
    const { data: existingOrder } = await supabaseAdmin
      .from("dfy_orders")
      .select("id")
      .eq("stripe_session_id", sessionId)
      .single();

    if (existingOrder) {
      logStep("Order already processed", { orderId: existingOrder.id });
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Order already processed",
        orderId: existingOrder.id 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Calculate subscription start date (1 month from now)
    const subscriptionStartsAt = new Date();
    subscriptionStartsAt.setMonth(subscriptionStartsAt.getMonth() + 1);

    // Insert order into database
    const { data: order, error: insertError } = await supabaseAdmin
      .from("dfy_orders")
      .insert({
        stripe_session_id: sessionId,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone || null,
        status: "paid",
        amount_paid: session.amount_total || 49700,
        subscription_starts_at: subscriptionStartsAt.toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      logStep("Error inserting order", { error: insertError.message });
      throw new Error(`Failed to save order: ${insertError.message}`);
    }

    logStep("Order saved", { orderId: order.id });

    // Send webhook to Go High Level
    let ghlWebhookSent = false;
    try {
      // Split name into first and last name
      const nameParts = customerName.trim().split(/\s+/);
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      const ghlPayload = {
        first_name: firstName,
        last_name: lastName,
        phone: customerPhone,
        email: customerEmail,
        product: "Done For You Mind Movie Package",
        amount: 497,
        currency: "USD",
        order_id: order.id,
        stripe_session_id: sessionId,
        subscription_starts_at: subscriptionStartsAt.toISOString(),
        purchased_at: new Date().toISOString(),
      };

      logStep("Sending GHL webhook", { url: GHL_WEBHOOK_URL });

      const ghlResponse = await fetch(GHL_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(ghlPayload),
      });

      if (ghlResponse.ok) {
        ghlWebhookSent = true;
        logStep("GHL webhook sent successfully");
      } else {
        const responseText = await ghlResponse.text();
        logStep("GHL webhook failed", { status: ghlResponse.status, response: responseText });
      }
    } catch (webhookError) {
      logStep("GHL webhook error", { error: webhookError instanceof Error ? webhookError.message : String(webhookError) });
    }

    // Update order with webhook status
    await supabaseAdmin
      .from("dfy_orders")
      .update({ ghl_webhook_sent: ghlWebhookSent })
      .eq("id", order.id);

    return new Response(JSON.stringify({ 
      success: true, 
      orderId: order.id,
      customerName,
      customerEmail,
      ghlWebhookSent,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
