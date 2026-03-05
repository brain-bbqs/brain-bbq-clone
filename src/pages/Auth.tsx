import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Globe } from "lucide-react";

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [globusLoading, setGlobusLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  // Handle Globus callback
  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      handleGlobusCallback(code);
    }
  }, [searchParams]);

  const handleGlobusCallback = async (code: string) => {
    setGlobusLoading(true);
    try {
      const redirectUri = `${window.location.origin}/auth`;
      const { data, error } = await supabase.functions.invoke("globus-auth", {
        body: { action: "callback", code, redirect_uri: redirectUri },
      });

      if (error || data?.error) {
        throw new Error(data?.error || error?.message || "Globus authentication failed");
      }

      // Use the token_hash to verify OTP and get session
      const { error: otpError } = await supabase.auth.verifyOtp({
        token_hash: data.token_hash,
        type: "magiclink",
      });

      if (otpError) {
        throw otpError;
      }

      toast.success(`Welcome, ${data.name || data.email}!`);
      window.history.replaceState({}, "", "/auth");
      navigate("/");
    } catch (err: any) {
      console.error("Globus callback error:", err);
      toast.error(err.message || "Globus sign-in failed");
      window.history.replaceState({}, "", "/auth");
    } finally {
      setGlobusLoading(false);
    }
  };

  const handleGlobusLogin = async () => {
    setGlobusLoading(true);
    try {
      const redirectUri = `${window.location.origin}/auth`;
      const { data, error } = await supabase.functions.invoke("globus-auth", {
        body: { action: "login", redirect_uri: redirectUri },
      });

      if (error || data?.error) {
        throw new Error(data?.error || error?.message || "Failed to start Globus login");
      }

      window.location.href = data.url;
    } catch (err: any) {
      toast.error(err.message || "Failed to start Globus login");
      setGlobusLoading(false);
    }
  };

  // Show loading if processing Globus callback
  if (globusLoading && searchParams.get("code")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-12 flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Signing in with Globus…</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to BBQS</CardTitle>
          <CardDescription>
            Sign in with your institutional Globus account to access the consortium platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            type="button"
            className="w-full h-12 text-base"
            onClick={handleGlobusLogin}
            disabled={globusLoading}
          >
            {globusLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Globe className="mr-2 h-5 w-5" />
            )}
            Sign in with Globus
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Access is restricted to BBQS consortium affiliates. Sign in using your university identity through Globus.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
