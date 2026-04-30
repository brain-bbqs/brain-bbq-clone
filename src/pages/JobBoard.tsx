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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, Plus, MapPin, Building2, Mail, ExternalLink, Clock, User, Sparkles, ChevronDown, ChevronUp, Pencil, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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

/**
 * Render plain-text description with auto-linked URLs and emails.
 * Safe: no HTML is interpreted — URLs are matched, then rendered as <a>.
 */
function renderDescriptionWithLinks(text: string) {
  // Match http(s) URLs, www. URLs, and bare emails
  const pattern = /((?:https?:\/\/|www\.)[^\s<>()]+[^\s<>().,;:!?'"])|([\w.+-]+@[\w-]+\.[\w.-]+)/gi;
  const parts: Array<string | { href: string; label: string }> = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(text)) !== null) {
    if (m.index > lastIndex) parts.push(text.slice(lastIndex, m.index));
    const url = m[1];
    const email = m[2];
    if (url) {
      const href = url.startsWith("http") ? url : `https://${url}`;
      parts.push({ href, label: url });
    } else if (email) {
      parts.push({ href: `mailto:${email}`, label: email });
    }
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));

  return parts.map((p, i) =>
    typeof p === "string" ? (
      <span key={i}>{p}</span>
    ) : (
      <a
        key={i}
        href={p.href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline break-all"
        onClick={(e) => e.stopPropagation()}
      >
        {p.label}
      </a>
    )
  );
}

/**
 * Description with "Show more / Show less" toggle.
 * The toggle only appears when the text is long enough to actually be clipped.
 */
function JobDescription({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  // Heuristic: ~3 lines of card text ≈ 220 chars. Also expand if multiple line breaks.
  const isLong = text.length > 220 || (text.match(/\n/g)?.length ?? 0) >= 3;

  return (
    <div className="space-y-1">
      <p
        className={`text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap ${
          !expanded && isLong ? "line-clamp-3" : ""
        }`}
      >
        {renderDescriptionWithLinks(text)}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        >
          {expanded ? (
            <>Show less <ChevronUp className="h-3 w-3" /></>
          ) : (
            <>Show more <ChevronDown className="h-3 w-3" /></>
          )}
        </button>
      )}
    </div>
  );
}

/**
 * Parse one or more application URLs from a single text field.
 * Accepts URLs separated by commas, newlines, semicolons, or whitespace.
 * Each entry can also be in "Label | https://..." form to give the link a custom label.
 */
function parseApplicationUrls(raw: string | null | undefined): Array<{ href: string; label: string }> {
  if (!raw) return [];
  return raw
    .split(/[\n,;]+|\s{2,}/g)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((entry) => {
      // "Label | url" or "Label - url"
      const sepMatch = entry.match(/^(.+?)\s*[|]\s*(https?:\/\/\S+)$/i);
      if (sepMatch) {
        return { label: sepMatch[1].trim(), href: sepMatch[2].trim() };
      }
      // Bare URL (allow www. by prefixing https://)
      const urlMatch = entry.match(/(https?:\/\/\S+|www\.\S+)/i);
      if (urlMatch) {
        const href = urlMatch[1].startsWith("http") ? urlMatch[1] : `https://${urlMatch[1]}`;
        try {
          const u = new URL(href);
          return { label: u.hostname.replace(/^www\./, ""), href };
        } catch {
          return { label: href, href };
        }
      }
      return null;
    })
    .filter((v): v is { href: string; label: string } => !!v);
}

export default function JobBoard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<JobFormData>(INITIAL_FORM);
  const [filterType, setFilterType] = useState<string>("all");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Authenticated users see full jobs table (with contact info); anonymous users see the safe public_jobs view
  const { data: jobs, isLoading } = useQuery({
    queryKey: ["jobs", !!user],
    queryFn: async () => {
      if (user) {
        const { data, error } = await (supabase as any)
          .from("jobs")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false });
        if (error) throw error;
        return data as any[];
      } else {
        const { data, error } = await (supabase as any)
          .from("public_jobs")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return data as any[];
      }
    },
  });

  const postJob = useMutation({
    mutationFn: async (data: JobFormData) => {
      if (!user) throw new Error("Must be signed in");
      if (editingId) {
        const { error } = await (supabase as any)
          .from("jobs")
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("jobs").insert({
          ...data,
          posted_by: user.id,
          posted_by_email: user.email,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      setDialogOpen(false);
      setForm(INITIAL_FORM);
      toast.success(editingId ? "Position updated!" : "Job posted successfully!");
      setEditingId(null);
    },
    onError: (err: any) => toast.error(err.message || "Failed to save job"),
  });

  const deleteJob = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("jobs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Position removed");
    },
    onError: (err: any) => toast.error(err.message || "Failed to delete job"),
  });

  const openEditDialog = (job: any) => {
    setForm({
      title: job.title ?? "",
      institution: job.institution ?? "",
      department: job.department ?? "",
      location: job.location ?? "",
      job_type: job.job_type ?? "postdoc",
      description: job.description ?? "",
      contact_name: job.contact_name ?? "",
      contact_email: job.contact_email ?? "",
      application_url: job.application_url ?? "",
    });
    setEditingId(job.id);
    setDialogOpen(true);
  };

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

            <Dialog
              open={dialogOpen}
              onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) {
                  setEditingId(null);
                  setForm(INITIAL_FORM);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button
                  size="lg"
                  className="gap-2 shadow-lg shadow-primary/20"
                  onClick={() => {
                    if (!user) {
                      toast.error("Please sign in to post a job");
                      return;
                    }
                    setEditingId(null);
                    setForm(INITIAL_FORM);
                  }}
                  disabled={!user}
                >
                  <Plus className="h-4 w-4" />
                  Post a Position
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingId ? "Edit Position" : "Post a New Position"}</DialogTitle>
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
                    <p className="text-xs text-muted-foreground">
                      Tip: paste any URL or email and it will become a clickable link automatically.
                    </p>
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
                    <div className="flex items-center justify-between">
                      <Label htmlFor="application_url">Application URL(s)</Label>
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Multiple links supported
                      </span>
                    </div>
                    <Textarea
                      id="application_url"
                      value={form.application_url}
                      onChange={e => setForm(f => ({ ...f, application_url: e.target.value }))}
                      placeholder={"https://apply.example.edu/job1\nFaculty portal | https://hr.example.edu/123\nLab site | https://lab.example.edu/apply"}
                      rows={4}
                    />
                    <div className="rounded-md border border-border bg-secondary/40 p-3 text-xs text-muted-foreground space-y-1.5">
                      <p className="font-medium text-foreground">How to add multiple links</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Put <span className="text-foreground">one URL per line</span> (or separate them with commas).</li>
                        <li>
                          To give a link a custom label, write{" "}
                          <code className="bg-background px-1 py-0.5 rounded text-foreground">Label | https://...</code>
                        </li>
                        <li>One URL shows an <span className="text-foreground">Apply</span> button; multiple show an <span className="text-foreground">Apply (N)</span> dropdown.</li>
                      </ul>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={postJob.isPending}>
                    {postJob.isPending
                      ? (editingId ? "Saving..." : "Posting...")
                      : (editingId ? "Save Changes" : "Post Position")}
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

                  {job.description && <JobDescription text={job.description} />}

                  <div className="flex items-center justify-between pt-3 border-t border-border/50 gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</span>
                      {user?.id && job.posted_by === user.id && (
                        <>
                          <span className="mx-1 text-border">·</span>
                          <button
                            type="button"
                            onClick={() => openEditDialog(job)}
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary font-medium transition-colors"
                            aria-label="Edit position"
                          >
                            <Pencil className="h-3 w-3" />
                            Edit
                          </button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive font-medium transition-colors"
                                aria-label="Delete position"
                              >
                                <Trash2 className="h-3 w-3" />
                                Delete
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete this position?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently remove "{job.title}" from the job board.
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteJob.mutate(job.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
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
                      {(() => {
                        const urls = parseApplicationUrls(job.application_url);
                        if (urls.length === 0) return null;
                        if (urls.length === 1) {
                          return (
                            <a
                              href={urls[0].href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs bg-primary/10 hover:bg-primary/20 text-primary px-2.5 py-1 rounded-md font-medium transition-colors"
                            >
                              Apply
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          );
                        }
                        return (
                          <DropdownMenu>
                            <DropdownMenuTrigger className="inline-flex items-center gap-1 text-xs bg-primary/10 hover:bg-primary/20 text-primary px-2.5 py-1 rounded-md font-medium transition-colors">
                              Apply ({urls.length})
                              <ChevronDown className="h-3 w-3" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="max-w-xs">
                              {urls.map((u, i) => (
                                <DropdownMenuItem key={i} asChild>
                                  <a
                                    href={u.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between gap-2 cursor-pointer"
                                  >
                                    <span className="truncate">{u.label}</span>
                                    <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
                                  </a>
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        );
                      })()}
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
