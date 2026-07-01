import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/integrations/supabase/client";

/**
 * Syncs the user's theme preference between the ThemeContext (local) and
 * their profiles.theme_preference column (remote). On sign-in we pull the
 * remote value; subsequent local changes are pushed back to the DB.
 */
export function useThemeSync() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const hydrated = useRef<string | null>(null);

  // Pull preference on sign-in
  useEffect(() => {
    if (!user) {
      hydrated.current = null;
      return;
    }
    if (hydrated.current === user.id) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("theme_preference")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      const pref = (data as any)?.theme_preference as "light" | "dark" | "system" | undefined;
      hydrated.current = user.id;
      // If the remote value is the untouched default ('system') but the user
      // has already made an explicit local choice, prefer the local choice
      // and push it up. Otherwise, adopt the remote preference.
      const localExplicit = typeof window !== "undefined" && !!localStorage.getItem("bbqs-theme");
      if (!pref || (pref === "system" && localExplicit && theme !== "system")) {
        await supabase
          .from("profiles")
          .update({ theme_preference: theme } as any)
          .eq("id", user.id);
      } else if (pref !== theme) {
        setTheme(pref);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Push preference whenever it changes locally (after hydration)
  useEffect(() => {
    if (!user || hydrated.current !== user.id) return;
    supabase
      .from("profiles")
      .update({ theme_preference: theme } as any)
      .eq("id", user.id)
      .then(() => {});
  }, [theme, user]);
}