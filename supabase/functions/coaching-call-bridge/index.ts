import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// System prompt for the AI coach
const COACHING_SYSTEM_PROMPT = `You are the Director's Coach, a supportive and motivating AI voice assistant for the Director's OS app. Your role is to help users stay on track with their personal transformation journey using the Psycho-Cinematics framework.

Your personality:
- Warm, encouraging, and accountable
- Use cinematic language (scenes, scripts, character, action, etc.)
- Keep conversations focused and under 3 minutes
- Be genuinely interested in their progress

Conversation flow:
1. Greet them by their Director Character name
2. Ask if they've watched their Mind Movie today
3. Go through their Three Things (daily tasks) one by one
4. Ask if they've read their Definite Chief Aim today
5. If not, offer to read it to them
6. Celebrate their streak and encourage continued momentum
7. End with a motivating send-off

Remember: You're not just checking boxes - you're helping them embody their Director Character and stay committed to their vision.`;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  // Handle WebSocket upgrade for streaming audio
  if (upgradeHeader.toLowerCase() === "websocket") {
    return handleWebSocketConnection(req);
  }

  // Handle webhook events from Telnyx
  try {
    const body = await req.json();
    console.log("Telnyx webhook event:", JSON.stringify(body, null, 2));

    const eventType = body.data?.event_type;
    const callControlId = body.data?.payload?.call_control_id;

    switch (eventType) {
      case "call.initiated":
        console.log(`Call initiated: ${callControlId}`);
        break;

      case "call.answered":
        console.log(`Call answered: ${callControlId}`);
        // Start streaming when call is answered
        await startStreaming(callControlId, body.data?.payload?.client_state);
        break;

      case "call.hangup":
        console.log(`Call ended: ${callControlId}`);
        break;

      case "streaming.started":
        console.log(`Streaming started for call: ${callControlId}`);
        break;

      case "streaming.stopped":
        console.log(`Streaming stopped for call: ${callControlId}`);
        break;

      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function startStreaming(callControlId: string, clientStateB64: string) {
  const TELNYX_API_KEY = Deno.env.get("TELNYX_API_KEY");
  
  try {
    // Command Telnyx to start streaming
    const response = await fetch(
      `https://api.telnyx.com/v2/calls/${callControlId}/actions/streaming_start`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${TELNYX_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stream_track: "both_tracks",
          stream_bidirectional_mode: "mp3", // or "l16" for raw audio
        }),
      }
    );

    if (!response.ok) {
      console.error("Failed to start streaming:", await response.text());
    }
  } catch (error) {
    console.error("Error starting stream:", error);
  }
}

async function handleWebSocketConnection(req: Request): Promise<Response> {
  const { socket: telnyxSocket, response } = Deno.upgradeWebSocket(req);
  
  const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
  
  let geminiSocket: WebSocket | null = null;
  let callContext: any = null;

  telnyxSocket.onopen = () => {
    console.log("Telnyx WebSocket connected");
  };

  telnyxSocket.onmessage = async (event) => {
    try {
      const message = JSON.parse(event.data);
      
      // Handle different message types from Telnyx
      if (message.event === "connected") {
        console.log("Stream connected, stream_id:", message.stream_id);
        
        // Extract call context from client_state if available
        if (message.client_state) {
          try {
            callContext = JSON.parse(atob(message.client_state));
            console.log("Call context:", callContext);
          } catch (e) {
            console.log("Could not parse client state");
          }
        }

        // Connect to Gemini Live API
        geminiSocket = await connectToGemini(GOOGLE_AI_API_KEY!, callContext);
        
        // Set up Gemini message handler to send audio back to Telnyx
        if (geminiSocket) {
          geminiSocket.onmessage = (geminiEvent) => {
            handleGeminiMessage(geminiEvent, telnyxSocket);
          };
        }
      }
      
      if (message.event === "media") {
        // Forward audio from Telnyx to Gemini
        if (geminiSocket && geminiSocket.readyState === WebSocket.OPEN) {
          // Telnyx sends base64 encoded audio
          const audioData = message.media.payload;
          
          // Send to Gemini in the expected format
          geminiSocket.send(JSON.stringify({
            realtime_input: {
              media_chunks: [{
                data: audioData,
                mime_type: "audio/pcm;rate=8000"
              }]
            }
          }));
        }
      }
      
      if (message.event === "stop") {
        console.log("Stream stopped");
        if (geminiSocket) {
          geminiSocket.close();
        }
      }
    } catch (error) {
      console.error("Error processing Telnyx message:", error);
    }
  };

  telnyxSocket.onclose = () => {
    console.log("Telnyx WebSocket closed");
    if (geminiSocket) {
      geminiSocket.close();
    }
  };

  telnyxSocket.onerror = (error) => {
    console.error("Telnyx WebSocket error:", error);
  };

  return response;
}

async function connectToGemini(apiKey: string, context: any): Promise<WebSocket> {
  // Build personalized system prompt with user context
  let personalizedPrompt = COACHING_SYSTEM_PROMPT;
  
  if (context) {
    personalizedPrompt += `\n\nUser Context for this call:
- Director Character Name: ${context.director_name}
- Current Streak: ${context.current_streak} days
- Day Number: ${context.day_number}`;

    if (context.chief_aim?.what) {
      personalizedPrompt += `\n- Definite Chief Aim: ${context.chief_aim.what}`;
    }
    if (context.chief_aim?.by_when) {
      personalizedPrompt += `\n- Target Date: ${context.chief_aim.by_when}`;
    }
    if (context.tasks && context.tasks.length > 0) {
      personalizedPrompt += `\n- Today's Three Things:`;
      context.tasks.forEach((task: any, i: number) => {
        personalizedPrompt += `\n  ${i + 1}. ${task.title} (${task.completed ? "completed" : "not yet done"})`;
      });
    }
  }

  // Connect to Gemini Live API
  const geminiWsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey}`;
  
  const geminiSocket = new WebSocket(geminiWsUrl);
  
  return new Promise((resolve, reject) => {
    geminiSocket.onopen = () => {
      console.log("Connected to Gemini Live API");
      
      // Send setup message with system prompt
      geminiSocket.send(JSON.stringify({
        setup: {
          model: "models/gemini-2.0-flash-exp",
          generation_config: {
            response_modalities: ["AUDIO"],
            speech_config: {
              voice_config: {
                prebuilt_voice_config: {
                  voice_name: "Aoede" // Warm, friendly voice
                }
              }
            }
          },
          system_instruction: {
            parts: [{ text: personalizedPrompt }]
          }
        }
      }));
      
      resolve(geminiSocket);
    };
    
    geminiSocket.onerror = (error) => {
      console.error("Gemini WebSocket error:", error);
      reject(error);
    };
  });
}

function handleGeminiMessage(event: MessageEvent, telnyxSocket: WebSocket) {
  try {
    const message = JSON.parse(event.data);
    
    // Check for audio response from Gemini
    if (message.serverContent?.modelTurn?.parts) {
      for (const part of message.serverContent.modelTurn.parts) {
        if (part.inlineData?.mimeType?.startsWith("audio/")) {
          // Send audio back to Telnyx
          if (telnyxSocket.readyState === WebSocket.OPEN) {
            telnyxSocket.send(JSON.stringify({
              event: "media",
              media: {
                payload: part.inlineData.data
              }
            }));
          }
        }
      }
    }
  } catch (error) {
    console.error("Error handling Gemini message:", error);
  }
}
