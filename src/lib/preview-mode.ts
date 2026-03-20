/**
 * Returns true when the app is running on a Lovable preview domain.
 * In preview mode, auth gating is bypassed so all features are accessible
 * without signing in via Globus.
 */
export function isPreviewMode(): boolean {
  const host = window.location.hostname;
  return (
    host.endsWith(".lovable.app") ||
    host.endsWith(".lovableproject.com") ||
    host === "localhost" ||
    host === "127.0.0.1"
  );
}
