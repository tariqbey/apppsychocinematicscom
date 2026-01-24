import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { 
  validateString, 
  validateEmail, 
  validatePhone,
  MAX_LENGTHS,
  validationErrorResponse 
} from "../_shared/input-validation.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-DFY-CHECKOUT] ${step}${detailsStr}`);
};

// Done For You Mind Movie Package - $497
const DFY_PRICE_ID = "price_1SqSJQKb1BapFa4iypHadcpT";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { name, email, phone } = await req.json();
    
    // Input validation
    const nameResult = validateString(name, "name", { required: true, maxLength: MAX_LENGTHS.NAME, minLength: 1 });
    if (!nameResult.valid) {
      return validationErrorResponse(nameResult.error || "Invalid name", corsHeaders);
    }

    const emailResult = validateEmail(email, true);
    if (!emailResult.valid) {
      return validationErrorResponse(emailResult.error || "Invalid email", corsHeaders);
    }

    const phoneResult = validatePhone(phone);
    if (!phoneResult.valid) {
      return validationErrorResponse(phoneResult.error || "Invalid phone", corsHeaders);
    }

    logStep("Customer info received", { name, email, phone: phone ? "provided" : "not provided" });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check for existing Stripe customer
    const customers = await stripe.customers.list({ email: email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    } else {
      // Create a new customer with the provided info
      const newCustomer = await stripe.customers.create({
        email: email,
        name: name,
        phone: phone || undefined,
        metadata: {
          source: "dfy_mind_movie",
        }
      });
      customerId = newCustomer.id;
      logStep("Created new customer", { customerId });
    }

    // Create checkout session for one-time payment
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: DFY_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/dfy-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/done-for-you`,
      metadata: {
        customer_name: name,
        customer_email: email,
        customer_phone: phone || "",
        product_type: "dfy_mind_movie",
      },
      payment_intent_data: {
        metadata: {
          customer_name: name,
          customer_email: email,
          customer_phone: phone || "",
          product_type: "dfy_mind_movie",
        }
      }
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
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
