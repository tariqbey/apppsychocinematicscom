import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PostPayload {
  platform: "facebook" | "twitter" | "instagram" | "tiktok";
  content: string;
  mediaUrl?: string;
  mediaType?: "image" | "video";
}

const BRANDING_HASHTAGS = "#PsychoCinematics #DirectorOfYourLife #MindMovie";
const BRANDING_SIGNATURE = "\n\n— Posted from Psycho-Cinematics™";

async function postToTwitter(
  apiKey: string,
  apiSecret: string,
  accessToken: string,
  accessSecret: string,
  content: string
): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    // OAuth 1.0a signature generation for Twitter API v2
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = crypto.randomUUID().replace(/-/g, "");
    
    const oauthParams = {
      oauth_consumer_key: apiKey,
      oauth_nonce: nonce,
      oauth_signature_method: "HMAC-SHA1",
      oauth_timestamp: timestamp.toString(),
      oauth_token: accessToken,
      oauth_version: "1.0",
    };

    // Create signature base string
    const baseUrl = "https://api.twitter.com/2/tweets";
    const paramString = Object.entries(oauthParams)
      .sort()
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join("&");
    
    const signatureBaseString = `POST&${encodeURIComponent(baseUrl)}&${encodeURIComponent(paramString)}`;
    const signingKey = `${encodeURIComponent(apiSecret)}&${encodeURIComponent(accessSecret)}`;
    
    // Generate HMAC-SHA1 signature
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(signingKey),
      { name: "HMAC", hash: "SHA-1" },
      false,
      ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(signatureBaseString));
    const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));

    const authHeader = `OAuth oauth_consumer_key="${encodeURIComponent(apiKey)}", oauth_nonce="${nonce}", oauth_signature="${encodeURIComponent(signatureBase64)}", oauth_signature_method="HMAC-SHA1", oauth_timestamp="${timestamp}", oauth_token="${encodeURIComponent(accessToken)}", oauth_version="1.0"`;

    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: content,
      }),
    });

    const data = await response.json();
    console.log("Twitter response:", data);

    if (response.ok && data.data?.id) {
      return { success: true, postId: data.data.id };
    }
    return { success: false, error: data.detail || data.title || "Failed to post" };
  } catch (error) {
    console.error("Twitter post error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

async function postToFacebook(
  accessToken: string,
  pageId: string | undefined,
  content: string,
  mediaUrl?: string
): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    const endpoint = pageId 
      ? `https://graph.facebook.com/v18.0/${pageId}/feed`
      : `https://graph.facebook.com/v18.0/me/feed`;

    const body: Record<string, string> = {
      message: content,
      access_token: accessToken,
    };

    if (mediaUrl) {
      body.link = mediaUrl;
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(body),
    });

    const data = await response.json();
    console.log("Facebook response:", data);

    if (data.id) {
      return { success: true, postId: data.id };
    }
    return { success: false, error: data.error?.message || "Failed to post" };
  } catch (error) {
    console.error("Facebook post error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { platform, content, mediaUrl }: PostPayload = await req.json();

    // Get user's social media integration
    const { data: integration } = await supabaseClient
      .from("user_integrations")
      .select("*")
      .eq("user_id", user.id)
      .eq("service_name", `social_${platform}`)
      .single();

    if (!integration?.api_key) {
      return new Response(
        JSON.stringify({ error: `${platform} not connected` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const settings = integration.settings as Record<string, string> | null;
    const brandedContent = `${content}\n\n${BRANDING_HASHTAGS}${BRANDING_SIGNATURE}`;

    let result: { success: boolean; postId?: string; error?: string };

    switch (platform) {
      case "twitter": {
        const apiSecret = settings?.api_secret || "";
        const accessToken = settings?.access_token || "";
        const accessSecret = settings?.access_secret || "";
        
        if (!apiSecret || !accessToken || !accessSecret) {
          return new Response(
            JSON.stringify({ error: "Twitter credentials incomplete" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        result = await postToTwitter(
          integration.api_key,
          apiSecret,
          accessToken,
          accessSecret,
          brandedContent
        );
        break;
      }

      case "facebook": {
        const pageId = settings?.page_id;
        result = await postToFacebook(integration.api_key, pageId, brandedContent, mediaUrl);
        break;
      }

      case "instagram":
      case "tiktok":
        // These platforms require more complex OAuth flows and media upload
        // For now, return instructions for manual posting
        return new Response(
          JSON.stringify({
            success: false,
            error: `Direct posting to ${platform} requires additional setup. Please use the share menu to copy content and post manually.`,
            manualPost: true,
            content: brandedContent,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

      default:
        return new Response(
          JSON.stringify({ error: "Unsupported platform" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    console.log(`${platform} post result:`, result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("social-post error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
