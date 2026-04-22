/**
 * Shared critical-error alerting utility.
 *
 * Edge functions call `reportCriticalError(...)` whenever they detect a
 * condition that should never silently fail (missing API key, embedding
 * failure, upstream 5xx, unexpected exception, auth-session anomaly).
 *
 * The dispatcher function (`report-critical-error`) handles deduplication,
 * email-via-Resend, GitHub issue creation, and persistence to the
 * `system_alerts` table.
 *
 * IMPORTANT: This is fire-and-forget — never throws, never blocks the
 * calling function's response.
 */

export type AlertSeverity = "info" | "warning" | "critical";

export interface CriticalErrorPayload {
  /** Edge function or area name, e.g. "metadata-chat" */
  source: string;
  /** Stable error code, e.g. "MISSING_API_KEY", "EMBEDDING_FAILURE" */
  errorCode: string;
  /** Human-readable one-liner */
  message: string;
  /** Severity (defaults to "critical") */
  severity?: AlertSeverity;
  /** Arbitrary structured details (stack, user_id, status, etc.) */
  details?: Record<string, unknown>;
}

/**
 * Fire-and-forget alert reporter. Safe to call from any edge function.
 * Never throws.
 */
export function reportCriticalError(payload: CriticalErrorPayload): void {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) {
      console.error("[alerts] cannot dispatch — SUPABASE_URL or SERVICE_ROLE_KEY missing");
      return;
    }

    // Always log to function logs first (immediate visibility)
    console.error(
      `[CRITICAL][${payload.source}][${payload.errorCode}] ${payload.message}`,
      payload.details ?? {},
    );

    // Fire-and-forget POST to dispatcher
    fetch(`${supabaseUrl}/functions/v1/report-critical-error`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify(payload),
    }).catch((e) => {
      console.error("[alerts] dispatcher fetch failed:", e);
    });
  } catch (e) {
    console.error("[alerts] reportCriticalError threw (suppressed):", e);
  }
}

/**
 * Helper: assert a required secret exists, otherwise report and throw.
 * Use at the top of edge functions for required API keys.
 */
export function requireSecret(name: string, source: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    reportCriticalError({
      source,
      errorCode: "MISSING_API_KEY",
      severity: "critical",
      message: `Required secret ${name} is not configured for ${source}`,
      details: { secret_name: name },
    });
    throw new Error(`Missing required secret: ${name}`);
  }
  return value;
}