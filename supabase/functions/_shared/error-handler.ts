// Secure error handling for edge functions
// Maps internal errors to safe client-facing messages

export const ERROR_CODES = {
  AUTH_ERROR: "E1001",
  CONFIG_ERROR: "E1002", 
  DATABASE_ERROR: "E1003",
  VALIDATION_ERROR: "E1004",
  RATE_LIMIT_ERROR: "E1005",
  PAYMENT_ERROR: "E1006",
  EXTERNAL_API_ERROR: "E1007",
  NOT_FOUND_ERROR: "E1008",
  INSUFFICIENT_CREDITS: "E1009",
  UNKNOWN_ERROR: "E9999"
} as const;

export const SAFE_ERROR_MESSAGES: Record<string, string> = {
  [ERROR_CODES.AUTH_ERROR]: "Authentication failed. Please sign in again.",
  [ERROR_CODES.CONFIG_ERROR]: "Service temporarily unavailable. Please try again later.",
  [ERROR_CODES.DATABASE_ERROR]: "Unable to process your request. Please try again.",
  [ERROR_CODES.VALIDATION_ERROR]: "Invalid request data provided.",
  [ERROR_CODES.RATE_LIMIT_ERROR]: "Too many requests. Please try again later.",
  [ERROR_CODES.PAYMENT_ERROR]: "Payment processing failed. Please try again.",
  [ERROR_CODES.EXTERNAL_API_ERROR]: "External service unavailable. Please try again later.",
  [ERROR_CODES.NOT_FOUND_ERROR]: "Requested resource not found.",
  [ERROR_CODES.INSUFFICIENT_CREDITS]: "Insufficient credits. Please purchase more credits to continue.",
  [ERROR_CODES.UNKNOWN_ERROR]: "An unexpected error occurred. Please try again."
};

// Categorize error and return safe message
export function categorizeError(error: unknown): { code: string; message: string } {
  const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  
  // Authentication errors
  if (errorMessage.includes("auth") || errorMessage.includes("token") || 
      errorMessage.includes("unauthorized") || errorMessage.includes("not authenticated")) {
    return { code: ERROR_CODES.AUTH_ERROR, message: SAFE_ERROR_MESSAGES[ERROR_CODES.AUTH_ERROR] };
  }
  
  // Configuration/environment errors  
  if (errorMessage.includes("not configured") || errorMessage.includes("not set") ||
      errorMessage.includes("env") || errorMessage.includes("key")) {
    return { code: ERROR_CODES.CONFIG_ERROR, message: SAFE_ERROR_MESSAGES[ERROR_CODES.CONFIG_ERROR] };
  }
  
  // Database errors
  if (errorMessage.includes("database") || errorMessage.includes("supabase") ||
      errorMessage.includes("insert") || errorMessage.includes("update") ||
      errorMessage.includes("query") || errorMessage.includes("constraint")) {
    return { code: ERROR_CODES.DATABASE_ERROR, message: SAFE_ERROR_MESSAGES[ERROR_CODES.DATABASE_ERROR] };
  }
  
  // Validation errors
  if (errorMessage.includes("required") || errorMessage.includes("invalid") ||
      errorMessage.includes("missing") || errorMessage.includes("validation")) {
    return { code: ERROR_CODES.VALIDATION_ERROR, message: SAFE_ERROR_MESSAGES[ERROR_CODES.VALIDATION_ERROR] };
  }
  
  // Rate limit errors
  if (errorMessage.includes("rate") || errorMessage.includes("limit") ||
      errorMessage.includes("too many")) {
    return { code: ERROR_CODES.RATE_LIMIT_ERROR, message: SAFE_ERROR_MESSAGES[ERROR_CODES.RATE_LIMIT_ERROR] };
  }
  
  // Payment/Stripe errors
  if (errorMessage.includes("stripe") || errorMessage.includes("payment") ||
      errorMessage.includes("subscription") || errorMessage.includes("checkout")) {
    return { code: ERROR_CODES.PAYMENT_ERROR, message: SAFE_ERROR_MESSAGES[ERROR_CODES.PAYMENT_ERROR] };
  }
  
  // External API errors
  if (errorMessage.includes("api") || errorMessage.includes("fetch") ||
      errorMessage.includes("gateway") || errorMessage.includes("timeout")) {
    return { code: ERROR_CODES.EXTERNAL_API_ERROR, message: SAFE_ERROR_MESSAGES[ERROR_CODES.EXTERNAL_API_ERROR] };
  }
  
  // Credit errors
  if (errorMessage.includes("credit") || errorMessage.includes("insufficient") ||
      errorMessage.includes("balance")) {
    return { code: ERROR_CODES.INSUFFICIENT_CREDITS, message: SAFE_ERROR_MESSAGES[ERROR_CODES.INSUFFICIENT_CREDITS] };
  }
  
  // Not found errors
  if (errorMessage.includes("not found") || errorMessage.includes("no record")) {
    return { code: ERROR_CODES.NOT_FOUND_ERROR, message: SAFE_ERROR_MESSAGES[ERROR_CODES.NOT_FOUND_ERROR] };
  }
  
  return { code: ERROR_CODES.UNKNOWN_ERROR, message: SAFE_ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR] };
}

// Create a safe error response
export function safeErrorResponse(
  error: unknown, 
  corsHeaders: Record<string, string>,
  logPrefix: string = "ERROR"
): Response {
  // Log the full error server-side for debugging
  console.error(`[${logPrefix}] Full error:`, error);
  
  const { code, message } = categorizeError(error);
  
  return new Response(
    JSON.stringify({ error: message, code }),
    { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    }
  );
}
