import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

// Default app origin for redirecting the user back after ClickUp auth.
// Falls back to lovable preview if not set as env var.
const APP_ORIGIN = Deno.env.get("APP_PUBLIC_URL") || "https://app.psychocinematics.com";

function redirectWith(params: Record<string, string>, path = "/settings"): Response {
  const url = new URL(path, APP_ORIGIN);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new Response(null, { status: 302, headers: { Location: url.toString() } });
}

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    if (error) {
      console.error("ClickUp returned error:", error);
      return redirectWith({ clickup: "error", reason: error });
    }
    if (!code || !state) {
      return redirectWith({ clickup: "error", reason: "missing_code_or_state" });
    }

    const clientId = Deno.env.get("CLICKUP_CLIENT_ID");
    const clientSecret = Deno.env.get("CLICKUP_CLIENT_SECRET");
    if (!clientId || !clientSecret) {
      return redirectWith({ clickup: "error", reason: "server_not_configured" });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Validate state
    const { data: stateRow, error: stateErr } = await admin
      .from("oauth_states")
      .select("*")
      .eq("state", state)
      .eq("provider", "clickup")
      .maybeSingle();

    if (stateErr || !stateRow) {
      console.error("Invalid state", stateErr);
      return redirectWith({ clickup: "error", reason: "invalid_state" });
    }
    if (new Date(stateRow.expires_at).getTime() < Date.now()) {
      return redirectWith({ clickup: "error", reason: "state_expired" });
    }

    // Exchange code for access token
    const tokenResp = await fetch("https://api.clickup.com/api/v2/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    const tokenText = await tokenResp.text();
    if (!tokenResp.ok) {
      console.error("ClickUp token exchange failed:", tokenResp.status, tokenText.slice(0, 500));
      return redirectWith({ clickup: "error", reason: "token_exchange_failed" });
    }
    let tokenJson: { access_token?: string };
    try {
      tokenJson = JSON.parse(tokenText);
    } catch {
      return redirectWith({ clickup: "error", reason: "bad_token_response" });
    }
    const accessToken = tokenJson.access_token;
    if (!accessToken) {
      return redirectWith({ clickup: "error", reason: "no_access_token" });
    }

    // Fetch the authorized user & teams for nicer UX
    let clickupUser: any = null;
    let teams: any[] = [];
    try {
      const userResp = await fetch("https://api.clickup.com/api/v2/user", {
        headers: { Authorization: accessToken },
      });
      if (userResp.ok) {
        const j = await userResp.json();
        clickupUser = j?.user ?? null;
      }
      const teamsResp = await fetch("https://api.clickup.com/api/v2/team", {
        headers: { Authorization: accessToken },
      });
      if (teamsResp.ok) {
        const j = await teamsResp.json();
        teams = Array.isArray(j?.teams) ? j.teams : [];
      }
    } catch (e) {
      console.warn("Non-fatal: failed to fetch ClickUp user/teams:", e);
    }

    // Upsert into user_integrations
    const settings = {
      clickup_user: clickupUser
        ? { id: clickupUser.id, username: clickupUser.username, email: clickupUser.email }
        : null,
      teams: teams.map((t) => ({ id: t.id, name: t.name })),
      connected_at: new Date().toISOString(),
    };

    const { data: existing } = await admin
      .from("user_integrations")
      .select("id")
      .eq("user_id", stateRow.user_id)
      .eq("service_name", "clickup")
      .maybeSingle();

    if (existing) {
      await admin
        .from("user_integrations")
        .update({ api_key: accessToken, settings, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
    } else {
      await admin.from("user_integrations").insert({
        user_id: stateRow.user_id,
        service_name: "clickup",
        api_key: accessToken,
        settings,
      });
    }

    // Burn the state row
    await admin.from("oauth_states").delete().eq("id", stateRow.id);

    // Cleanup expired states best-effort
    await admin.from("oauth_states").delete().lt("expires_at", new Date().toISOString());

    const target = stateRow.redirect_to || "/settings?tab=integrations&clickup=connected";
    // Allow absolute or relative paths
    if (/^https?:\/\//i.test(target)) {
      return new Response(null, { status: 302, headers: { Location: target } });
    }
    return redirectWith({ clickup: "connected" }, target.split("?")[0] || "/settings");
  } catch (err) {
    console.error("clickup-oauth-callback error:", err);
    return redirectWith({ clickup: "error", reason: "server_error" });
  }
});
