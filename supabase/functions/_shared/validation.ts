/**
 * Shared input validation utilities for Edge Functions.
 * Prevents resource exhaustion, injection, and path traversal attacks.
 */

// ─── String validators ──────────────────────────────────────

export function isNonEmptyString(val: unknown, maxLen = 10000): val is string {
  return typeof val === "string" && val.length > 0 && val.length <= maxLen;
}

export function sanitizeString(val: string, maxLen = 10000): string {
  return val.slice(0, maxLen).trim();
}

// ─── Grant number format ─────────────────────────────────────
// NIH grant numbers look like: 1U19NS123456-01, UF1NS108213, etc.
const GRANT_NUMBER_RE = /^[A-Z0-9][A-Z0-9\-]{3,30}$/i;

export function isValidGrantNumber(val: unknown): val is string {
  return typeof val === "string" && GRANT_NUMBER_RE.test(val.trim());
}

// ─── Chat message validation ─────────────────────────────────

export interface ChatMessage {
  role: string;
  content: string;
}

export function validateChatMessages(
  messages: unknown,
  opts: { maxMessages?: number; maxContentLen?: number } = {},
): { valid: true; messages: ChatMessage[] } | { valid: false; error: string } {
  const maxMessages = opts.maxMessages ?? 50;
  const maxContentLen = opts.maxContentLen ?? 10000;

  if (!Array.isArray(messages)) {
    return { valid: false, error: "messages must be an array" };
  }
  if (messages.length === 0) {
    return { valid: false, error: "messages array is empty" };
  }
  if (messages.length > maxMessages) {
    return { valid: false, error: `Too many messages (max ${maxMessages})` };
  }

  const validRoles = new Set(["user", "assistant", "system"]);

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (!msg || typeof msg !== "object") {
      return { valid: false, error: `messages[${i}] is not an object` };
    }
    if (!validRoles.has(msg.role)) {
      return { valid: false, error: `messages[${i}].role is invalid` };
    }
    if (typeof msg.content !== "string") {
      return { valid: false, error: `messages[${i}].content must be a string` };
    }
    if (msg.content.length > maxContentLen) {
      return { valid: false, error: `messages[${i}].content exceeds ${maxContentLen} chars` };
    }
  }

  return { valid: true, messages: messages as ChatMessage[] };
}

// ─── Path traversal prevention ───────────────────────────────

export function isSafePath(path: unknown): path is string {
  if (typeof path !== "string" || path.length === 0 || path.length > 500) return false;
  // Block path traversal sequences
  if (path.includes("..") || path.includes("//") || path.startsWith("/")) return false;
  // Only allow alphanumeric, hyphens, underscores, dots, forward slashes
  return /^[a-zA-Z0-9_\-./]+$/.test(path);
}

// ─── Request body size guard ─────────────────────────────────
// Use for checking base64 payloads, etc.

export function checkPayloadSize(val: string, maxBytes: number, fieldName: string): string | null {
  if (val.length > maxBytes) {
    return `${fieldName} exceeds maximum size (${Math.round(maxBytes / 1024 / 1024)}MB limit)`;
  }
  return null;
}

// ─── Array validator ─────────────────────────────────────────

export function validateStringArray(
  val: unknown,
  opts: { maxItems?: number; maxItemLen?: number; fieldName?: string } = {},
): { valid: true; values: string[] } | { valid: false; error: string } {
  const maxItems = opts.maxItems ?? 100;
  const maxItemLen = opts.maxItemLen ?? 500;
  const fieldName = opts.fieldName ?? "array";

  if (!Array.isArray(val)) {
    return { valid: false, error: `${fieldName} must be an array` };
  }
  if (val.length > maxItems) {
    return { valid: false, error: `${fieldName} has too many items (max ${maxItems})` };
  }
  for (let i = 0; i < val.length; i++) {
    if (typeof val[i] !== "string") {
      return { valid: false, error: `${fieldName}[${i}] must be a string` };
    }
    if (val[i].length > maxItemLen) {
      return { valid: false, error: `${fieldName}[${i}] exceeds ${maxItemLen} chars` };
    }
  }
  return { valid: true, values: val as string[] };
}

// ─── Generic error response builder ─────────────────────────

export function validationError(
  message: string,
  headers: Record<string, string>,
  status = 400,
): Response {
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers: { ...headers, "Content-Type": "application/json" } },
  );
}
