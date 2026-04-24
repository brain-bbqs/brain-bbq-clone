/**
 * Returns true when the app is running in a development build.
 * In preview mode, auth gating is bypassed so all features are accessible
 * without signing in via Globus.
 */
export function isPreviewMode(): boolean {
  try {
    if (!import.meta.env.DEV || typeof window === "undefined") {
      return false;
    }

    const host = window.location.hostname;
    return host === "localhost" || host === "127.0.0.1";
  } catch {
    return false;
  }
}
