import { Lock, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

/**
 * Shown when a user is not signed in OR is signed in but not a member of this project.
 */
export function AccessGate({
  reason, grantNumber,
}: { reason: "unauthenticated" | "not-member"; grantNumber: string }) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="bg-card border border-border rounded-2xl p-8 text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-5">
          <Lock className="h-6 w-6 text-primary" />
        </div>

        {reason === "unauthenticated" ? (
          <>
            <h1 className="text-2xl font-bold text-foreground mb-2">Sign in required</h1>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              To manage privileged project information for{" "}
              <span className="font-mono text-foreground">{grantNumber}</span>, please sign in
              with your Globus identity.
            </p>
            <Button asChild>
              <Link to={`/auth?redirect=${encodeURIComponent(`/projects/${grantNumber}/profile`)}`}>
                Sign in with Globus
              </Link>
            </Button>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-foreground mb-2">Not a project member</h1>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              You're signed in, but your investigator record isn't linked to{" "}
              <span className="font-mono text-foreground">{grantNumber}</span>. Only PIs and Co-PIs
              listed on this grant can edit privileged information.
            </p>
            <p className="text-xs text-muted-foreground mb-6">
              If you believe this is an error, the email on your investigator record may not match
              your Globus identity. Ask a project admin to update your investigator record, or use
              the feedback form to report the issue.
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button asChild variant="outline">
                <Link to={`/projects`}>Back to projects</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link to="/profile">
                  My profile <ExternalLink className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
