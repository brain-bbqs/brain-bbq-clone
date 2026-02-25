import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Lightbulb, Star, ExternalLink, Loader2, Send, ArrowUpDown } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

interface Suggestion {
  id: string;
  title: string;
  description: string | null;
  submitted_by_email: string | null;
  github_issue_number: number | null;
  github_issue_url: string | null;
  status: string;
  votes: number;
  created_at: string;
}

interface Vote {
  suggestion_id: string;
}

export default function FeatureSuggestions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sortBy, setSortBy] = useState<"votes" | "created_at">("votes");

  const { data: suggestions = [], isLoading } = useQuery<Suggestion[]>({
    queryKey: ["feature-suggestions", sortBy],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feature_suggestions")
        .select("*")
        .order(sortBy, { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []) as Suggestion[];
    },
  });

  const { data: userVotes = [] } = useQuery<Vote[]>({
    queryKey: ["user-votes", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feature_votes")
        .select("suggestion_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data || []) as Vote[];
    },
  });

  const votedIds = new Set(userVotes.map((v) => v.suggestion_id));

  const submitMutation = useMutation({
    mutationFn: async () => {
      // 1. Create GitHub issue with "user-request" label
      const { data: ghData, error: ghError } = await supabase.functions.invoke("create-github-issue", {
        body: {
          title: `[Feature Request] ${title.trim()}`,
          description: `**User Request**\n\n${description.trim() || "No description provided."}\n\n---\n_Submitted via BBQS Feature Suggestions by ${user?.email || "anonymous"}_`,
          labels: ["enhancement", "user-request"],
        },
      });
      if (ghError) throw ghError;

      // 2. Insert into feature_suggestions table
      const { error: dbError } = await supabase.from("feature_suggestions").insert({
        title: title.trim(),
        description: description.trim() || null,
        submitted_by: user?.id || null,
        submitted_by_email: user?.email || null,
        github_issue_number: ghData?.issue?.number || null,
        github_issue_url: ghData?.issue?.url || null,
      });
      if (dbError) throw dbError;
    },
    onSuccess: () => {
      toast.success("Feature suggestion submitted!");
      setTitle("");
      setDescription("");
      queryClient.invalidateQueries({ queryKey: ["feature-suggestions"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to submit suggestion");
    },
  });

  const voteMutation = useMutation({
    mutationFn: async (suggestionId: string) => {
      const hasVoted = votedIds.has(suggestionId);

      if (hasVoted) {
        // Remove vote
        await supabase.from("feature_votes").delete().eq("user_id", user!.id).eq("suggestion_id", suggestionId);
        await supabase.from("feature_suggestions").update({ votes: suggestions.find(s => s.id === suggestionId)!.votes - 1 }).eq("id", suggestionId);
      } else {
        // Add vote
        await supabase.from("feature_votes").insert({ user_id: user!.id, suggestion_id: suggestionId });
        await supabase.from("feature_suggestions").update({ votes: suggestions.find(s => s.id === suggestionId)!.votes + 1 }).eq("id", suggestionId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feature-suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["user-votes"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (title.length > 200) {
      toast.error("Title must be under 200 characters");
      return;
    }
    if (description.length > 2000) {
      toast.error("Description must be under 2000 characters");
      return;
    }
    submitMutation.mutate();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Lightbulb className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Suggest a Feature</h1>
          <p className="text-sm text-muted-foreground">Help improve the BBQS platform — your suggestions become tracked GitHub issues</p>
        </div>
      </div>

      {/* Submit form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Submit a New Suggestion</CardTitle>
        </CardHeader>
        <CardContent>
          {!user ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-2">You need to be signed in to submit a suggestion.</p>
              <Button asChild variant="outline" size="sm">
                <Link to="/auth">Sign In</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="suggestion-title">Title</Label>
                <Input
                  id="suggestion-title"
                  placeholder="e.g. Add dark mode toggle, Improve search filters..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={200}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="suggestion-desc">Description (optional)</Label>
                <Textarea
                  id="suggestion-desc"
                  placeholder="Describe the feature, why it would be useful, and any ideas for how it could work..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={2000}
                  rows={4}
                />
              </div>
              <Button type="submit" disabled={submitMutation.isPending}>
                {submitMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Submit Suggestion
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Suggestions table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">All Suggestions</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSortBy(sortBy === "votes" ? "created_at" : "votes")}
              className="text-xs"
            >
              <ArrowUpDown className="h-3 w-3 mr-1" />
              Sort by {sortBy === "votes" ? "newest" : "most voted"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : suggestions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No suggestions yet. Be the first!</p>
          ) : (
            <div className="space-y-3">
              {suggestions.map((s) => {
                const hasVoted = votedIds.has(s.id);
                return (
                  <div
                    key={s.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-secondary/20 transition-colors"
                  >
                    {/* Vote button */}
                    <button
                      onClick={() => user ? voteMutation.mutate(s.id) : toast.error("Sign in to vote")}
                      className={`flex flex-col items-center gap-0.5 pt-1 min-w-[40px] transition-colors ${
                        hasVoted ? "text-primary" : "text-muted-foreground hover:text-foreground"
                      }`}
                      title={hasVoted ? "Remove vote" : "Vote for this"}
                    >
                      <Star className={`h-5 w-5 ${hasVoted ? "fill-primary" : ""}`} />
                      <span className="text-xs font-semibold">{s.votes}</span>
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-foreground">{s.title}</p>
                        <Badge
                          variant={s.status === "open" ? "secondary" : "outline"}
                          className="text-[10px]"
                        >
                          {s.status}
                        </Badge>
                      </div>
                      {s.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                        <span>{format(new Date(s.created_at), "MMM d, yyyy")}</span>
                        {s.submitted_by_email && <span>by {s.submitted_by_email}</span>}
                        {s.github_issue_url && (
                          <a
                            href={s.github_issue_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            #{s.github_issue_number}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
