// Cookie-based storage adapter for Supabase auth.
// Using domain=.brain-bbqs.org means the session cookie is readable by all
// *.brain-bbqs.org subdomains (brain-bbqs.org, agent.brain-bbqs.org, etc.).
export function cookieStorage(domain: string): Storage {
  const isLocal =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1");

  return {
    getItem(key: string): string | null {
      if (typeof document === "undefined") return null;
      const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const match = document.cookie.match(
        new RegExp("(?:^|; )" + escaped + "=([^;]*)")
      );
      return match ? decodeURIComponent(match[1]) : null;
    },
    setItem(key: string, value: string): void {
      if (typeof document === "undefined") return;
      const domainPart = isLocal ? "" : `; domain=${domain}`;
      const securePart = isLocal ? "" : "; Secure";
      const maxAge = 60 * 60 * 24 * 365; // 1 year
      document.cookie = `${key}=${encodeURIComponent(value)}${domainPart}; path=/; max-age=${maxAge}; SameSite=Lax${securePart}`;
    },
    removeItem(key: string): void {
      if (typeof document === "undefined") return;
      const domainPart = isLocal ? "" : `; domain=${domain}`;
      document.cookie = `${key}=; ${domainPart}; path=/; max-age=0; SameSite=Lax`;
    },
    // Supabase only uses getItem/setItem/removeItem — the rest are no-ops.
    get length() { return 0; },
    clear() {},
    key(_index: number) { return null; },
  };
}
