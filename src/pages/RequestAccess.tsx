import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import { PageMeta } from "@/components/PageMeta";

const requestSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Please enter your full name")
    .max(120, "Name must be under 120 characters"),
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address")
    .max(255, "Email must be under 255 characters"),
  institution: z
    .string()
    .trim()
    .min(2, "Please enter your institution")
    .max(200, "Institution must be under 200 characters"),
  message: z
    .string()
    .trim()
    .max(1500, "Message must be under 1500 characters")
    .optional()
    .or(z.literal("")),
});

export default function RequestAccess() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    institution: "",
    message: "",
  });

  const update =
    (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = requestSchema.safeParse(form);
    if (!parsed.success) {
      const first = parsed.error.errors[0];
      toast.error(first?.message ?? "Please review the form.");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("access_requests").insert({
        full_name: parsed.data.full_name,
        email: parsed.data.email.toLowerCase(),
        institution: parsed.data.institution,
        message: parsed.data.message || null,
        globus_name: parsed.data.full_name,
        status: "pending",
      });
      if (error) throw error;
      setSubmitted(true);
    } catch (err: any) {
      console.error(err);
      toast.error(
        err?.message?.includes("row-level")
          ? "Submission blocked. Please double-check your details and try again."
          : err?.message ?? "Failed to submit request.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <PageMeta
          title="Request submitted — BBQS"
          description="Your access request has been received."
        />
        <Card className="w-full max-w-md">
          <CardContent className="p-10 flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Request submitted</h1>
            <p className="text-sm text-muted-foreground">
              Thanks! A consortium administrator will review your request shortly. You'll be
              notified by email once approved, after which you can sign in via Globus.
            </p>
            <Button asChild variant="outline" className="mt-2">
              <Link to="/auth">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to sign-in
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <PageMeta
        title="Request access — BBQS"
        description="Request a BBQS consortium account."
      />
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Request an account</CardTitle>
          <CardDescription>
            BBQS is a consortium-restricted platform. Submit a quick request and an
            administrator will review it. Once approved, you'll sign in with your institutional
            Globus account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full name</Label>
              <Input
                id="full_name"
                value={form.full_name}
                onChange={update("full_name")}
                placeholder="Jane Doe"
                maxLength={120}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Institutional email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={update("email")}
                placeholder="jane@university.edu"
                maxLength={255}
                required
              />
              <p className="text-xs text-muted-foreground">
                Use the email tied to your Globus identity.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="institution">Institution</Label>
              <Input
                id="institution"
                value={form.institution}
                onChange={update("institution")}
                placeholder="University of Example"
                maxLength={200}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Why are you requesting access? (optional)</Label>
              <Textarea
                id="message"
                value={form.message}
                onChange={update("message")}
                placeholder="Briefly describe your role and how you'd use the platform."
                rows={4}
                maxLength={1500}
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <Button asChild variant="ghost" type="button">
                <Link to="/auth">
                  <ArrowLeft className="h-4 w-4 mr-2" /> Sign in instead
                </Link>
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Submit request
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}