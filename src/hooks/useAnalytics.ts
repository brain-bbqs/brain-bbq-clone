import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

function getSessionId(): string {
  let sid = sessionStorage.getItem("bbqs_session_id");
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem("bbqs_session_id", sid);
  }
  return sid;
}

export function useAnalytics() {
  const location = useLocation();
  const lastPath = useRef<string>("");

  // Track page views on route change
  useEffect(() => {
    const path = location.pathname;
    if (path === lastPath.current) return;
    lastPath.current = path;

    const sessionId = getSessionId();

    supabase.from("analytics_pageviews").insert({
      path,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
      session_id: sessionId,
    }).then(() => {});
  }, [location.pathname]);

  // Track clicks globally
  useEffect(() => {
    const sessionId = getSessionId();

    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // Find the closest meaningful element
      const clickable = target.closest("a, button, [role='button'], [data-track]") as HTMLElement | null;
      if (!clickable) return;

      const tag = clickable.tagName.toLowerCase();
      const text = (clickable.textContent || "").trim().slice(0, 100);
      const href = clickable.getAttribute("href") || null;
      
      // Find section context
      const section = clickable.closest("[data-section]")?.getAttribute("data-section")
        || clickable.closest("section")?.getAttribute("id")
        || null;

      supabase.from("analytics_clicks").insert({
        path: location.pathname,
        element_tag: tag,
        element_text: text,
        element_href: href,
        section,
        session_id: sessionId,
      }).then(() => {});
    };

    document.addEventListener("click", handler, { capture: true });
    return () => document.removeEventListener("click", handler, { capture: true });
  }, [location.pathname]);
}
