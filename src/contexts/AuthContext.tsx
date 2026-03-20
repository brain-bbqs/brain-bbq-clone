import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { isPreviewMode } from "@/lib/preview-mode";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Minimal fake user object for preview mode
const PREVIEW_USER = {
  id: "preview-user",
  email: "preview@lovable.app",
  user_metadata: { full_name: "Preview User" },
  app_metadata: {},
  aud: "authenticated",
  created_at: new Date().toISOString(),
} as unknown as User;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const preview = isPreviewMode();

  useEffect(() => {
    if (preview) {
      // In preview mode, immediately provide a fake authenticated user
      setUser(PREVIEW_USER);
      setSession(null);
      setLoading(false);
      return;
    }

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [preview]);

  const signOut = async () => {
    if (preview) return;
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // In preview mode, return a fallback so components render even if
    // AuthProvider hasn't mounted yet (e.g. during initial render tree)
    if (typeof window !== "undefined" && (
      window.location.hostname.endsWith(".lovable.app") ||
      window.location.hostname.endsWith(".lovableproject.com") ||
      window.location.hostname === "localhost"
    )) {
      return {
        user: PREVIEW_USER,
        session: null,
        loading: false,
        signOut: async () => {},
      };
    }
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
