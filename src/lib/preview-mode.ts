/**
 * Returns true when the app is running in a development build.
 * In preview mode, auth gating is bypassed so all features are accessible
 * without signing in via Globus.
 */
export function isPreviewMode(): boolean {
  try {
    if (typeof window === "undefined") return false;
    const host = window.location.hostname;
    // Local dev
    if (import.meta.env.DEV && (host === "localhost" || host === "127.0.0.1")) return true;
    // Lovable preview / sandbox hosts (e.g. id-preview--xxx.lovable.app, *.sandbox.lovable.dev)
    if (host.endsWith(".lovable.app") && host.includes("preview")) return true;
    if (host.endsWith(".sandbox.lovable.dev")) return true;
    return false;
  } catch {
    return false;
  }
}
