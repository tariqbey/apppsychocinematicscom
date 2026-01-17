import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GHL_WEBHOOK_URL = "https://services.leadconnectorhq.com/hooks/f3lkMOjhelReglpXlnVa/webhook-trigger/49984473-d11e-4cac-9996-c248784e2b4c";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, phone } = await req.json();

    const subscriptionStartsAt = new Date();
    subscriptionStartsAt.setMonth(subscriptionStartsAt.getMonth() + 1);

    // Split name into first and last name
    const fullName = name || "Test User";
    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    const ghlPayload = {
      first_name: firstName,
      last_name: lastName,
      phone: phone || "",
      email: email || "test@example.com",
      product: "Done For You Mind Movie Package",
      amount: 497,
      currency: "USD",
      order_id: "test_order_" + Date.now(),
      stripe_session_id: "test_session_" + Date.now(),
      subscription_starts_at: subscriptionStartsAt.toISOString(),
      purchased_at: new Date().toISOString(),
    };

    console.log("Sending payload to GHL:", JSON.stringify(ghlPayload));

    const ghlResponse = await fetch(GHL_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(ghlPayload),
    });

    const responseText = await ghlResponse.text();
    console.log("GHL Response:", ghlResponse.status, responseText);

    return new Response(JSON.stringify({ 
      success: ghlResponse.ok,
      status: ghlResponse.status,
      response: responseText,
      payload_sent: ghlPayload
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
