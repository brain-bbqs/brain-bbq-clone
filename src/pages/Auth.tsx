import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Mail, Lock, Loader2, User, Globe } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface AllowedDomain {
  id: string;
  domain: string;
  organization_id: string;
}

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("");
  const [loading, setLoading] = useState(false);
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
      // Clear the code from URL
      window.history.replaceState({}, "", "/auth");
      navigate("/");
    } catch (err: any) {
      console.error("Globus callback error:", err);
      toast.error(err.message || "Globus sign-in failed");
      // Clear the code from URL
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

      // Redirect to Globus authorization
      window.location.href = data.url;
    } catch (err: any) {
      toast.error(err.message || "Failed to start Globus login");
      setGlobusLoading(false);
    }
  };

  const { data: allowedDomains = [] } = useQuery<AllowedDomain[]>({
    queryKey: ["allowed-domains"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("allowed_domains")
        .select("id, domain, organization_id")
        .order("domain");
      if (error) throw error;
      return data || [];
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLogin) {
      if (!selectedDomain) {
        toast.error("Please select your university");
        return;
      }
      if (!email.toLowerCase().endsWith(`@${selectedDomain}`)) {
        toast.error(`Your email must end with @${selectedDomain}`);
        return;
      }
    } else {
      // For login, just validate it's a consortium domain
      const domain = email.split("@")[1]?.toLowerCase();
      const isAllowed = allowedDomains.some((d) => d.domain === domain);
      if (!isAllowed) {
        toast.error("Access restricted to consortium university emails");
        return;
      }
    }

    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
        navigate("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        toast.success("Check your university email for the confirmation link!");
      }
    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
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
          <CardTitle className="text-2xl">
            {isLogin ? "Welcome Back" : "Join the Consortium"}
          </CardTitle>
          <CardDescription>
            {isLogin
              ? "Sign in with your university credentials"
              : "Create an account with your consortium university email"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Globus Sign-In */}
          <Button
            type="button"
            variant="outline"
            className="w-full mb-4"
            onClick={handleGlobusLogin}
            disabled={globusLoading}
          >
            {globusLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Globe className="mr-2 h-4 w-4" />
            )}
            Sign in with Globus
          </Button>

          <div className="relative my-4">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
              or
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Jane Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>University</Label>
                  <Select value={selectedDomain} onValueChange={setSelectedDomain}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your university" />
                    </SelectTrigger>
                    <SelectContent>
                      {allowedDomains.map((d) => (
                        <SelectItem key={d.id} value={d.domain}>
                          @{d.domain}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">University Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder={selectedDomain ? `username@${selectedDomain}` : "username@university.edu"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
            </span>{" "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:underline font-medium"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </div>

          <p className="mt-4 text-xs text-center text-muted-foreground">
            Access is restricted to BBQS consortium affiliates only.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
