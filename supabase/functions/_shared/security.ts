/**
 * Shared security utilities for Edge Functions.
 * Phase 5: Prompt injection mitigation
 * Phase 6: Per-user / per-IP rate limiting
 */



// ═══════════════════════════════════════════════════════════════
// Phase 5: Tool Call Whitelist Validation
// ═══════════════════════════════════════════════════════════════

/**
 * Validates that LLM tool calls only use allowed function names.
 * Prevents prompt injection from tricking the model into calling
 * unauthorized functions.
 */
export function validateToolCalls(
  toolCalls: any[],
  allowedFunctions: Set<string>,
): { valid: boolean; rejected: string[] } {
  const rejected: string[] = [];
  for (const tc of toolCalls) {
    const fnName = tc?.function?.name;
    if (!fnName || !allowedFunctions.has(fnName)) {
      rejected.push(fnName || "unknown");
    }
  }
  return { valid: rejected.length === 0, rejected };
}

// ═══════════════════════════════════════════════════════════════
// Phase 5: Prompt Injection Sanitization
// ═══════════════════════════════════════════════════════════════

/**
 * Common prompt injection patterns to detect and neutralize.
 * Strips or flags attempts to override system instructions.
 */
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|rules?)/i,
  /you\s+are\s+now\s+(a\s+)?/i,
  /system\s*:\s*/i,
  /\[INST\]/i,
  /\<\|im_start\|\>/i,
  /\<\|system\|\>/i,
  /```\s*system/i,
  /override\s+(system|instructions?)/i,
  /forget\s+(everything|all|your)\s+(instructions?|rules?)/i,
  /act\s+as\s+(if\s+)?you\s+(have\s+)?no\s+restrictions/i,
  /do\s+not\s+follow\s+your\s+(guidelines|rules|instructions)/i,
  /reveal\s+(your|the)\s+(system|secret|hidden)\s+(prompt|instructions?)/i,
  /what\s+(is|are)\s+your\s+(system|secret)\s+(prompt|instructions?)/i,
];

export interface SanitizationResult {
  sanitized: string;
  injectionDetected: boolean;
  patternsMatched: string[];
}

/**
 * Sanitizes user input before passing to LLM context.
 * Does NOT block the request — just neutralizes dangerous patterns
 * and flags for logging.
 */
export function sanitizeForLLM(input: string): SanitizationResult {
  const patternsMatched: string[] = [];
  let sanitized = input;

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(sanitized)) {
      patternsMatched.push(pattern.source.slice(0, 40));
      // Wrap the matched portion in brackets to neutralize it
      sanitized = sanitized.replace(pattern, (match) => `[filtered: ${match}]`);
    }
  }

  return {
    sanitized,
    injectionDetected: patternsMatched.length > 0,
    patternsMatched,
  };
}

// ═══════════════════════════════════════════════════════════════
// Phase 5: Output Validation (PII Leakage Prevention)
// ═══════════════════════════════════════════════════════════════

/**
 * Patterns that should never appear in LLM output.
 * Catches leaked secrets, emails from auth tables, etc.
 */
const PII_PATTERNS = [
  // Service role keys, JWTs with specific claims
  /eyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}/g,
  // Explicit secret markers
  /SUPABASE_SERVICE_ROLE_KEY\s*[:=]\s*\S+/gi,
  /OPENROUTER_API_KEY\s*[:=]\s*\S+/gi,
  /LOVABLE_API_KEY\s*[:=]\s*\S+/gi,
  /RESEND_API_KEY\s*[:=]\s*\S+/gi,
  // Connection strings
  /postgres(ql)?:\/\/[^\s"']+/gi,
  // AWS-style keys
  /AKIA[0-9A-Z]{16}/g,
];

/**
 * Scrubs sensitive data from LLM responses before returning to client.
 */
export function scrubOutput(output: string): { scrubbed: string; leaksDetected: number } {
  let scrubbed = output;
  let leaksDetected = 0;

  for (const pattern of PII_PATTERNS) {
    const matches = scrubbed.match(pattern);
    if (matches) {
      leaksDetected += matches.length;
      scrubbed = scrubbed.replace(pattern, "[REDACTED]");
    }
  }

  return { scrubbed, leaksDetected };
}

// ═══════════════════════════════════════════════════════════════
// Phase 6: Rate Limiting
// ═══════════════════════════════════════════════════════════════

/**
 * In-memory sliding window rate limiter.
 * Uses a Map keyed by identifier (user_id or IP).
 * Each entry stores an array of timestamps.
 *
 * For Edge Functions that may cold-start, this provides
 * per-instance rate limiting. For distributed limiting,
 * use the database-backed approach below.
 */
const rateLimitWindows = new Map<string, number[]>();

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

/**
 * In-memory rate limit check (per Edge Function instance).
 * Returns true if the request should be allowed.
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig,
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now();
  const windowStart = now - config.windowMs;

  let timestamps = rateLimitWindows.get(identifier) || [];
  // Prune old entries
  timestamps = timestamps.filter((t) => t > windowStart);

  if (timestamps.length >= config.maxRequests) {
    const oldestInWindow = timestamps[0];
    const retryAfterMs = oldestInWindow + config.windowMs - now;
    rateLimitWindows.set(identifier, timestamps);
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(retryAfterMs, 1000),
    };
  }

  timestamps.push(now);
  rateLimitWindows.set(identifier, timestamps);

  // Cleanup: if map gets too large, prune stale keys
  if (rateLimitWindows.size > 10000) {
    for (const [key, ts] of rateLimitWindows) {
      if (ts.every((t) => t < windowStart)) {
        rateLimitWindows.delete(key);
      }
    }
  }

  return {
    allowed: true,
    remaining: config.maxRequests - timestamps.length,
    retryAfterMs: 0,
  };
}

/**
 * Extract client IP from request headers.
 * Checks standard proxy headers.
 */
export function getClientIP(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

/**
 * Returns a 429 rate-limit response with standard headers.
 */
export function rateLimitResponse(
  headers: Record<string, string>,
  retryAfterMs: number,
): Response {
  return new Response(
    JSON.stringify({ error: "Too many requests. Please try again later." }),
    {
      status: 429,
      headers: {
        ...headers,
        "Content-Type": "application/json",
        "Retry-After": String(Math.ceil(retryAfterMs / 1000)),
      },
    },
  );
}

// ═══════════════════════════════════════════════════════════════
// Rate limit presets
// ═══════════════════════════════════════════════════════════════

/** LLM-backed endpoints: 20 requests per minute per user */
export const LLM_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 20,
  windowMs: 60_000,
};

/** Public API endpoints: 60 requests per minute per IP */
export const PUBLIC_API_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 60,
  windowMs: 60_000,
};

/** Seed/admin endpoints: 5 requests per minute */
export const ADMIN_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 5,
  windowMs: 60_000,
};
