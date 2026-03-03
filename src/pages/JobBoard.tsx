import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PageMeta } from "@/components/PageMeta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, Plus, MapPin, Building2, Mail, ExternalLink, Clock, User, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const JOB_TYPES = ["postdoc", "phd", "research_scientist", "engineer", "faculty", "internship", "other"] as const;

const JOB_TYPE_LABELS: Record<string, string> = {
  postdoc: "Postdoc",
  phd: "PhD Position",
  research_scientist: "Research Scientist",
  engineer: "Engineer",
  faculty: "Faculty",
  internship: "Internship",
  other: "Other",
};

const JOB_TYPE_COLORS: Record<string, string> = {
  postdoc: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  phd: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  research_scientist: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  engineer: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  faculty: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  internship: "bg-teal-500/15 text-teal-400 border-teal-500/30",
  other: "bg-secondary text-muted-foreground border-border",
};

interface JobFormData {
  title: string;
  institution: string;
  department: string;
  location: string;
  job_type: string;
  description: string;
  contact_name: string;
  contact_email: string;
  application_url: string;
}

const INITIAL_FORM: JobFormData = {
  title: "", institution: "", department: "", location: "",
  job_type: "postdoc", description: "", contact_name: "",
  contact_email: "", application_url: "",
};

export default function JobBoard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<JobFormData>(INITIAL_FORM);
  const [filterType, setFilterType] = useState<string>("all");

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["jobs"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("jobs")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const postJob = useMutation({
    mutationFn: async (data: JobFormData) => {
      if (!user) throw new Error("Must be signed in");
      const { error } = await (supabase as any).from("jobs").insert({
        ...data,
        posted_by: user.id,
        posted_by_email: user.email,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      setDialogOpen(false);
      setForm(INITIAL_FORM);
      toast.success("Job posted successfully!");
    },
    onError: (err: any) => toast.error(err.message || "Failed to post job"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.institution.trim()) {
      toast.error("Title and institution are required");
      return;
    }
    postJob.mutate(form);
  };

  const filteredJobs = filterType === "all"
    ? jobs
    : jobs?.filter((j: any) => j.job_type === filterType);

  const jobCounts = jobs?.reduce((acc: Record<string, number>, j: any) => {
    acc[j.job_type] = (acc[j.job_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <div className="min-h-screen bg-background">
      <PageMeta title="Job Board | BBQS" description="Open positions in the BBQS consortium" />

      {/* Hero header */}
      <div className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-accent/5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-lg shadow-primary/10 border border-primary/10">
                <Briefcase className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">Job Board</h1>
                <p className="text-muted-foreground mt-1">
                  Open positions across the BBQS consortium
                  {jobs?.length ? <span className="text-foreground font-medium"> · {jobs.length} {jobs.length === 1 ? "listing" : "listings"}</span> : ""}
                </p>
              </div>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="lg"
                  className="gap-2 shadow-lg shadow-primary/20"
                  onClick={() => {
                    if (!user) {
                      toast.error("Please sign in to post a job");
                      return;
                    }
                  }}
                  disabled={!user}
                >
                  <Plus className="h-4 w-4" />
                  Post a Position
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Post a New Position</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Position Title *</Label>
                    <Input id="title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Postdoctoral Researcher in Computational Neuroscience" required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="institution">Institution *</Label>
                      <Input id="institution" value={form.institution} onChange={e => setForm(f => ({ ...f, institution: e.target.value }))} placeholder="e.g. UC Berkeley" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Input id="department" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} placeholder="e.g. Neuroscience Institute" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input id="location" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Berkeley, CA" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="job_type">Position Type</Label>
                      <Select value={form.job_type} onValueChange={v => setForm(f => ({ ...f, job_type: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {JOB_TYPES.map(t => (
                            <SelectItem key={t} value={t}>{JOB_TYPE_LABELS[t]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the position, requirements, and how to apply..." rows={4} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="contact_name">Contact Name</Label>
                      <Input id="contact_name" value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} placeholder="e.g. Dr. Jane Smith" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact_email">Contact Email</Label>
                      <Input id="contact_email" type="email" value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} placeholder="e.g. jane@university.edu" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="application_url">Application URL</Label>
                    <Input id="application_url" type="url" value={form.application_url} onChange={e => setForm(f => ({ ...f, application_url: e.target.value }))} placeholder="https://..." />
                  </div>
                  <Button type="submit" className="w-full" disabled={postJob.isPending}>
                    {postJob.isPending ? "Posting..." : "Post Position"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {!user && (
          <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-transparent px-5 py-3.5 text-sm text-muted-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
            <a href="/auth" className="text-primary hover:underline font-medium">Sign in</a> to post a new position to the board.
          </div>
        )}

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterType("all")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
              filterType === "all"
                ? "bg-primary/15 text-primary border-primary/30"
                : "bg-secondary/50 text-muted-foreground border-border hover:border-primary/20"
            }`}
          >
            All {jobs?.length ? `(${jobs.length})` : ""}
          </button>
          {Object.entries(jobCounts).map(([type, count]: [string, number]) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                filterType === type
                  ? JOB_TYPE_COLORS[type] || JOB_TYPE_COLORS.other
                  : "bg-secondary/50 text-muted-foreground border-border hover:border-primary/20"
              }`}
            >
              {JOB_TYPE_LABELS[type] || type} ({count})
            </button>
          ))}
        </div>

        {/* Job cards */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-48 rounded-xl bg-secondary/30 animate-pulse" />
            ))}
          </div>
        ) : filteredJobs?.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Briefcase className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">No open positions yet</p>
            <p className="text-sm mt-1">Be the first to post a position to the BBQS community!</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filteredJobs?.map((job: any) => (
              <Card
                key={job.id}
                className="group bg-card border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 overflow-hidden"
              >
                {/* Color accent bar */}
                <div className={`h-1 ${
                  job.job_type === "postdoc" ? "bg-emerald-500" :
                  job.job_type === "phd" ? "bg-violet-500" :
                  job.job_type === "research_scientist" ? "bg-sky-500" :
                  job.job_type === "engineer" ? "bg-amber-500" :
                  job.job_type === "faculty" ? "bg-rose-500" :
                  job.job_type === "internship" ? "bg-teal-500" :
                  "bg-muted-foreground"
                }`} />
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-semibold text-foreground leading-snug group-hover:text-primary transition-colors">
                      {job.title}
                    </h3>
                    <Badge className={`shrink-0 text-[10px] font-semibold border ${JOB_TYPE_COLORS[job.job_type] || JOB_TYPE_COLORS.other}`}>
                      {JOB_TYPE_LABELS[job.job_type] || job.job_type}
                    </Badge>
                  </div>

                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center gap-2 text-foreground/90">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="font-medium">{job.institution}</span>
                      {job.department && <span className="text-muted-foreground">· {job.department}</span>}
                    </div>
                    {job.location && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span>{job.location}</span>
                      </div>
                    )}
                    {job.contact_name && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-3.5 w-3.5 shrink-0" />
                        <span>{job.contact_name}</span>
                      </div>
                    )}
                  </div>

                  {job.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{job.description}</p>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-border/50">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {job.contact_email && (
                        <a
                          href={`mailto:${job.contact_email}`}
                          className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                        >
                          <Mail className="h-3.5 w-3.5" />
                          Email
                        </a>
                      )}
                      {job.application_url && (
                        <a
                          href={job.application_url}
                          target="_blank"
                          rel="noopener"
                          className="inline-flex items-center gap-1 text-xs bg-primary/10 hover:bg-primary/20 text-primary px-2.5 py-1 rounded-md font-medium transition-colors"
                        >
                          Apply
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
