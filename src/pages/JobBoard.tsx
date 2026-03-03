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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Plus, MapPin, Building2, Mail, ExternalLink, Clock } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { AgGridReact } from "ag-grid-react";
import type { ColDef } from "ag-grid-community";

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
  title: "",
  institution: "",
  department: "",
  location: "",
  job_type: "postdoc",
  description: "",
  contact_name: "",
  contact_email: "",
  application_url: "",
};

export default function JobBoard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<JobFormData>(INITIAL_FORM);

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
      const { error } = await supabase.from("jobs").insert({
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

  const colDefs: ColDef[] = [
    {
      headerName: "Title",
      field: "title",
      flex: 2,
      minWidth: 200,
      cellRenderer: (params: any) => {
        const url = params.data?.application_url;
        return url
          ? `<a href="${url}" target="_blank" rel="noopener" class="text-primary hover:underline font-medium">${params.value}</a>`
          : `<span class="font-medium">${params.value}</span>`;
      },
    },
    {
      headerName: "Type",
      field: "job_type",
      width: 140,
      valueFormatter: (p: any) => JOB_TYPE_LABELS[p.value] || p.value,
    },
    { headerName: "Institution", field: "institution", flex: 1, minWidth: 160 },
    { headerName: "Department", field: "department", flex: 1, minWidth: 140 },
    { headerName: "Location", field: "location", width: 150 },
    { headerName: "Contact", field: "contact_name", width: 150 },
    { headerName: "Email", field: "contact_email", width: 200 },
    {
      headerName: "Posted",
      field: "created_at",
      width: 130,
      valueFormatter: (p: any) => p.value ? formatDistanceToNow(new Date(p.value), { addSuffix: true }) : "",
      sort: "desc",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <PageMeta title="Job Board | BBQS" description="Open positions in the BBQS consortium" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Job Board</h1>
              <p className="text-sm text-muted-foreground">Open positions across the BBQS consortium</p>
            </div>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="gap-2"
                onClick={() => {
                  if (!user) {
                    toast.error("Please sign in to post a job");
                    return;
                  }
                }}
                disabled={!user}
              >
                <Plus className="h-4 w-4" />
                Post a Job
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

        {!user && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="py-3 px-4 text-sm text-muted-foreground">
              <a href="/auth" className="text-primary hover:underline font-medium">Sign in</a> to post a new position.
            </CardContent>
          </Card>
        )}

        {/* AG Grid */}
        <div className="ag-theme-alpine-dark w-full" style={{ height: 500 }}>
          <AgGridReact
            rowData={jobs || []}
            columnDefs={colDefs}
            defaultColDef={{
              sortable: true,
              filter: true,
              resizable: true,
              autoHeight: true,
              wrapText: true,
            }}
            animateRows
            loading={isLoading}
            overlayNoRowsTemplate="<span class='text-muted-foreground'>No open positions yet. Be the first to post!</span>"
          />
        </div>

        {/* Card view for mobile / overview */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobs?.map(job => (
            <Card key={job.id} className="bg-card border-border hover:border-primary/30 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm font-semibold leading-tight">{job.title}</CardTitle>
                  <Badge variant="secondary" className="shrink-0 text-[10px]">
                    {JOB_TYPE_LABELS[job.job_type] || job.job_type}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Building2 className="h-3 w-3 shrink-0" />
                  <span>{job.institution}{job.department ? ` · ${job.department}` : ""}</span>
                </div>
                {job.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span>{job.location}</span>
                  </div>
                )}
                {job.description && (
                  <p className="text-foreground/80 line-clamp-3 mt-1">{job.description}</p>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    <span>{formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {job.contact_email && (
                      <a href={`mailto:${job.contact_email}`} className="text-primary hover:text-primary/80">
                        <Mail className="h-3.5 w-3.5" />
                      </a>
                    )}
                    {job.application_url && (
                      <a href={job.application_url} target="_blank" rel="noopener" className="text-primary hover:text-primary/80">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
