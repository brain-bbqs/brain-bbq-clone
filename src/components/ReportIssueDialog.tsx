import { useState } from "react";
import { Bug, ExternalLink, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function ReportIssueDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdIssue, setCreatedIssue] = useState<{ number: number; url: string } | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for the issue.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setCreatedIssue(null);

    try {
      const { data, error } = await supabase.functions.invoke("create-github-issue", {
        body: { title: title.trim(), description: description.trim() },
      });

      if (error) {
        throw new Error(error.message || "Failed to create issue");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setCreatedIssue({ number: data.issue.number, url: data.issue.url });
      toast({
        title: "Issue reported!",
        description: `Issue #${data.issue.number} has been created on GitHub.`,
      });

      // Reset form after short delay to show success state
      setTimeout(() => {
        setTitle("");
        setDescription("");
        setCreatedIssue(null);
        setOpen(false);
      }, 2000);
    } catch (error) {
      console.error("Error creating issue:", error);
      toast({
        title: "Failed to report issue",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
      setOpen(newOpen);
      if (!newOpen) {
        setTitle("");
        setDescription("");
        setCreatedIssue(null);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
        >
          <Bug className="h-5 w-5" />
          <span>Report Issue</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Report an Issue
          </DialogTitle>
          <DialogDescription>
            Submit a bug report. This will create an issue on GitHub for the team to review.
          </DialogDescription>
        </DialogHeader>

        {createdIssue ? (
          <div className="py-6 text-center">
            <div className="mb-4 text-primary">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-lg font-medium mb-2">Issue #{createdIssue.number} created!</p>
            <a
              href={createdIssue.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              View on GitHub
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Brief description of the issue"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={256}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Steps to reproduce, expected behavior, etc."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                disabled={isSubmitting}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !title.trim()}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Issue"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
