// Simple in-memory rate limiter for edge functions
// Uses a Map to track request counts per user within a time window

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RequestEntry {
  count: number;
  resetTime: number;
}

// In-memory store (resets when function cold-starts)
const rateLimitStore = new Map<string, RequestEntry>();

export function checkRateLimit(
  userId: string,
  config: RateLimitConfig = { maxRequests: 30, windowMs: 60000 }
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const key = userId;
  
  const entry = rateLimitStore.get(key);
  
  if (!entry || now > entry.resetTime) {
    // Create new entry or reset expired one
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs
    });
    return { 
      allowed: true, 
      remaining: config.maxRequests - 1,
      resetIn: config.windowMs
    };
  }
  
  if (entry.count >= config.maxRequests) {
    return { 
      allowed: false, 
      remaining: 0,
      resetIn: entry.resetTime - now
    };
  }
  
  entry.count++;
  rateLimitStore.set(key, entry);
  
  return { 
    allowed: true, 
    remaining: config.maxRequests - entry.count,
    resetIn: entry.resetTime - now
  };
}

// Rate limit response helper
export function rateLimitResponse(corsHeaders: Record<string, string>, resetIn: number) {
  return new Response(
    JSON.stringify({ 
      error: "Too many requests. Please try again later.",
      code: "RATE_LIMIT_EXCEEDED"
    }),
    { 
      status: 429, 
      headers: { 
        ...corsHeaders, 
        "Content-Type": "application/json",
        "Retry-After": Math.ceil(resetIn / 1000).toString()
      } 
    }
  );
}
