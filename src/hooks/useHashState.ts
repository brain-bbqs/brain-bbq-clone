import { useCallback, useEffect, useState } from "react";

/**
 * Sync a piece of state with the URL hash (#value), so individual
 * tabs/sections can be deep-linked and shared.
 *
 * - `defaultValue` is used when no hash is present.
 * - `allowed` (optional) restricts which hash values are accepted; any other
 *   hash falls back to `defaultValue`.
 */
export function useHashState<T extends string>(
  defaultValue: T,
  allowed?: readonly T[]
): [T, (next: T) => void] {
  const read = (): T => {
    if (typeof window === "undefined") return defaultValue;
    const raw = window.location.hash.replace(/^#/, "");
    if (!raw) return defaultValue;
    if (allowed && !allowed.includes(raw as T)) return defaultValue;
    return raw as T;
  };

  const [value, setValue] = useState<T>(read);

  useEffect(() => {
    const onHash = () => setValue(read());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = useCallback((next: T) => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.hash = next ? `#${next}` : "";
    // pushState avoids a full hashchange-driven scroll jump
    window.history.pushState(null, "", url.toString());
    setValue(next);
  }, []);

  return [value, update];
}
