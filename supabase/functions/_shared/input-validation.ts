/**
 * Input validation utilities for edge functions
 * Provides schema validation to prevent oversized payloads and malformed data
 */

// Maximum lengths for common inputs
export const MAX_LENGTHS = {
  MESSAGE_CONTENT: 15000,    // Max characters per message
  MESSAGE_ARRAY: 50,         // Max messages in conversation
  PROMPT: 5000,              // Max prompt length
  EMAIL: 255,                // Standard email max
  NAME: 255,                 // Name field max
  PHONE: 20,                 // Phone number max
  CONTENT: 2000,             // Social post content max
  TWITTER_CONTENT: 280,      // Twitter limit
  TEXT_SHORT: 500,           // Short text fields
  TEXT_MEDIUM: 1000,         // Medium text fields
  TEXT_LONG: 5000,           // Long text fields
};

// Valid values for enums
export const VALID_PERSONALITY_STYLES = [
  "swag", "formal", "motivational", "zen", "drill", "supportive"
] as const;

export const VALID_SOCIAL_PLATFORMS = [
  "facebook", "twitter", "instagram", "tiktok"
] as const;

export const VALID_ASPECT_RATIOS = [
  "16:9", "9:16", "4:3", "1:1"
] as const;

export const VALID_CHIEF_AIM_STEPS = [
  "what", "byWhen", "exchange", "plan"
] as const;

export const VALID_MESSAGE_ROLES = [
  "user", "assistant", "system"
] as const;

// Validation result type
interface ValidationResult {
  valid: boolean;
  error?: string;
  code?: string;
}

/**
 * Validate a string field with length constraints
 */
export function validateString(
  value: unknown,
  fieldName: string,
  options: { required?: boolean; maxLength?: number; minLength?: number } = {}
): ValidationResult {
  const { required = false, maxLength = MAX_LENGTHS.TEXT_MEDIUM, minLength = 0 } = options;

  if (value === undefined || value === null || value === "") {
    if (required) {
      return { valid: false, error: `${fieldName} is required`, code: "E1004" };
    }
    return { valid: true };
  }

  if (typeof value !== "string") {
    return { valid: false, error: `${fieldName} must be a string`, code: "E1004" };
  }

  if (value.length < minLength) {
    return { valid: false, error: `${fieldName} must be at least ${minLength} characters`, code: "E1004" };
  }

  if (value.length > maxLength) {
    return { valid: false, error: `${fieldName} exceeds maximum length of ${maxLength} characters`, code: "E1004" };
  }

  return { valid: true };
}

/**
 * Validate an email address
 */
export function validateEmail(value: unknown, required = true): ValidationResult {
  if (!value && !required) return { valid: true };
  
  const stringResult = validateString(value, "Email", { required, maxLength: MAX_LENGTHS.EMAIL });
  if (!stringResult.valid) return stringResult;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value as string)) {
    return { valid: false, error: "Invalid email format", code: "E1004" };
  }

  return { valid: true };
}

/**
 * Validate a phone number (basic format check)
 */
export function validatePhone(value: unknown): ValidationResult {
  if (!value) return { valid: true }; // Phone is optional
  
  const stringResult = validateString(value, "Phone", { maxLength: MAX_LENGTHS.PHONE });
  if (!stringResult.valid) return stringResult;

  // Allow common phone formats: +1234567890, (123) 456-7890, etc.
  const phoneRegex = /^[\d\s\+\-\(\)\.]+$/;
  if (!phoneRegex.test(value as string)) {
    return { valid: false, error: "Invalid phone format", code: "E1004" };
  }

  return { valid: true };
}

/**
 * Validate that a value is in a list of allowed values
 */
export function validateEnum<T extends readonly string[]>(
  value: unknown,
  fieldName: string,
  allowedValues: T,
  required = false
): ValidationResult {
  if (!value && !required) return { valid: true };
  
  if (typeof value !== "string") {
    return { valid: false, error: `${fieldName} must be a string`, code: "E1004" };
  }

  if (!allowedValues.includes(value as T[number])) {
    return { valid: false, error: `${fieldName} must be one of: ${allowedValues.join(", ")}`, code: "E1004" };
  }

  return { valid: true };
}

/**
 * Validate an array with length constraints
 */
export function validateArray(
  value: unknown,
  fieldName: string,
  options: { required?: boolean; maxLength?: number } = {}
): ValidationResult {
  const { required = false, maxLength = 50 } = options;

  if (!value && !required) return { valid: true };

  if (!Array.isArray(value)) {
    return { valid: false, error: `${fieldName} must be an array`, code: "E1004" };
  }

  if (value.length > maxLength) {
    return { valid: false, error: `${fieldName} exceeds maximum length of ${maxLength} items`, code: "E1004" };
  }

  return { valid: true };
}

/**
 * Validate messages array (for AI chat endpoints)
 */
export function validateMessages(
  messages: unknown,
  required = true
): ValidationResult {
  const arrayResult = validateArray(messages, "messages", { 
    required, 
    maxLength: MAX_LENGTHS.MESSAGE_ARRAY 
  });
  if (!arrayResult.valid) return arrayResult;

  if (!messages) return { valid: true };

  const messagesArray = messages as unknown[];
  
  for (let i = 0; i < messagesArray.length; i++) {
    const msg = messagesArray[i] as Record<string, unknown>;
    
    if (!msg || typeof msg !== "object") {
      return { valid: false, error: `Message at index ${i} must be an object`, code: "E1004" };
    }

    // Validate role
    const roleResult = validateEnum(msg.role, "role", VALID_MESSAGE_ROLES, true);
    if (!roleResult.valid) {
      return { valid: false, error: `Message at index ${i}: ${roleResult.error}`, code: "E1004" };
    }

    // Validate content
    const contentResult = validateString(msg.content, "content", {
      required: true,
      maxLength: MAX_LENGTHS.MESSAGE_CONTENT
    });
    if (!contentResult.valid) {
      return { valid: false, error: `Message at index ${i}: ${contentResult.error}`, code: "E1004" };
    }
  }

  return { valid: true };
}

/**
 * Validate Chief Aim object
 */
export function validateChiefAim(chiefAim: unknown): ValidationResult {
  if (!chiefAim) return { valid: true };
  
  if (typeof chiefAim === "string") {
    return validateString(chiefAim, "chiefAim", { maxLength: MAX_LENGTHS.TEXT_LONG });
  }

  if (typeof chiefAim !== "object") {
    return { valid: false, error: "chiefAim must be a string or object", code: "E1004" };
  }

  const aim = chiefAim as Record<string, unknown>;
  const fields = ["what", "byWhen", "exchange", "plan"];
  
  for (const field of fields) {
    if (aim[field] !== undefined) {
      const result = validateString(aim[field], field, { maxLength: MAX_LENGTHS.TEXT_MEDIUM });
      if (!result.valid) return result;
    }
  }

  return { valid: true };
}

/**
 * Validate social post content with platform-specific limits
 */
export function validateSocialContent(
  content: unknown,
  platform: string
): ValidationResult {
  const maxLength = platform === "twitter" 
    ? MAX_LENGTHS.TWITTER_CONTENT 
    : MAX_LENGTHS.CONTENT;
  
  return validateString(content, "content", { required: true, maxLength });
}

/**
 * Combined validation error response helper
 */
export function validationErrorResponse(
  error: string,
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({ error, code: "E1004" }),
    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

/**
 * Validate and sanitize the request payload
 * Returns the parsed payload or a validation error
 */
export async function validateRequestPayload<T>(
  req: Request,
  validators: Record<string, (value: unknown) => ValidationResult>,
  corsHeaders: Record<string, string>
): Promise<{ valid: true; payload: T } | { valid: false; response: Response }> {
  let payload: Record<string, unknown>;
  
  try {
    payload = await req.json();
  } catch {
    return {
      valid: false,
      response: validationErrorResponse("Invalid JSON payload", corsHeaders)
    };
  }

  for (const [field, validator] of Object.entries(validators)) {
    const result = validator(payload[field]);
    if (!result.valid) {
      return {
        valid: false,
        response: validationErrorResponse(result.error || `Invalid ${field}`, corsHeaders)
      };
    }
  }

  return { valid: true, payload: payload as T };
}
