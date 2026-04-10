/**
 * Returns true when the app is running in a development build.
 * In preview mode, auth gating is bypassed so all features are accessible
 * without signing in via Globus.
 */
export function isPreviewMode(): boolean {
  // Only allow preview mode in development builds, not production
  try {
    return import.meta.env.DEV;
  } catch {
    return false;
  }
}
