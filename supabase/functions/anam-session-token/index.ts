// Anam live avatar session token for the Director AI (audio passthrough mode).
//
// In passthrough mode Anam doesn't run its own brain or voice: the browser feeds it
// the GPT-Live voice audio and Anam renders the avatar's face and lip-sync.
//
// Secrets: ANAM_API_KEY (required), ANAM_AVATAR_ID (optional; defaults to Ava / Elena).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsError || !claimsData?.claims?.sub) return json({ error: "Invalid token" }, 401);

    const apiKey = Deno.env.get("ANAM_API_KEY");
    // Default: Ava's face (Anam "Elena" avatar). Not a secret; ANAM_AVATAR_ID overrides it.
    const avatarId = Deno.env.get("ANAM_AVATAR_ID") || "edf47a8e-2f18-46fa-9d43-36fb13559d3b";
    if (!apiKey) {
      return json({ error: "The avatar isn't set up yet: add the ANAM_API_KEY secret." }, 503);
    }

    const resp = await fetch("https://api.anam.ai/v1/auth/session-token", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        personaConfig: {
          avatarId,
          avatarModel: Deno.env.get("ANAM_AVATAR_MODEL") || "cara-4",
          enableAudioPassthrough: true,
        },
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("anam-session-token error", resp.status, text);
      return json({ error: "Anam couldn't start the avatar session.", status: resp.status }, 502);
    }

    const data = await resp.json();
    return json({ sessionToken: data.sessionToken });
  } catch (e) {
    console.error("anam-session-token error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
