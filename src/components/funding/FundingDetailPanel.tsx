import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, DollarSign, Calendar, Building2 } from "lucide-react";
import { format, parseISO } from "date-fns";

interface FundingOpportunity {
  id: string;
  fon: string;
  title: string;
  activity_code: string | null;
  announcement_type: string | null;
  participating_orgs: string[] | null;
  purpose: string | null;
  posted_date: string | null;
  open_date: string | null;
  expiration_date: string | null;
  due_dates: any[] | null;
  url: string | null;
  status: string;
  relevance_tags: string[] | null;
  eligible_activity_codes: string[] | null;
  budget_ceiling: number | null;
  notes: string | null;
}

interface FundingDetailPanelProps {
  opportunity: FundingOpportunity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusColors: Record<string, string> = {
  open: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  closed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  upcoming: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
};

export function FundingDetailPanel({ opportunity, open, onOpenChange }: FundingDetailPanelProps) {
  if (!opportunity) return null;

  const formatDate = (d: string | null) =>
    d ? format(parseISO(d), "MMM d, yyyy") : "—";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="pr-8">
          <div className="flex items-center gap-2 mb-1">
            <Badge className={statusColors[opportunity.status] || ""}>
              {opportunity.status?.charAt(0).toUpperCase() + opportunity.status?.slice(1)}
            </Badge>
            {opportunity.activity_code && (
              <Badge variant="secondary">{opportunity.activity_code}</Badge>
            )}
            <code className="text-xs font-mono text-muted-foreground">{opportunity.fon}</code>
          </div>
          <SheetTitle className="text-left text-base leading-snug">
            {opportunity.title}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Details for funding opportunity {opportunity.fon}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {/* Key dates */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Posted</p>
              <p className="font-medium">{formatDate(opportunity.posted_date)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Opens</p>
              <p className="font-medium">{formatDate(opportunity.open_date)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-0.5">Expires</p>
              <p className="font-medium">{formatDate(opportunity.expiration_date)}</p>
            </div>
            {opportunity.budget_ceiling && (
              <div>
                <p className="text-muted-foreground text-xs mb-0.5">Budget Ceiling</p>
                <p className="font-medium inline-flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {opportunity.budget_ceiling.toLocaleString("en-US")}
                </p>
              </div>
            )}
          </div>

          {/* Due dates */}
          {opportunity.due_dates && opportunity.due_dates.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1.5 font-medium">Due Dates</p>
              <div className="space-y-1">
                {opportunity.due_dates.map((d: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{format(parseISO(d.date), "MMM d, yyyy")}</span>
                    <span className="text-muted-foreground text-xs">({d.type})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Purpose */}
          {opportunity.purpose && (
            <div>
              <p className="text-xs text-muted-foreground mb-1 font-medium">Purpose</p>
              <p className="text-sm leading-relaxed">{opportunity.purpose}</p>
            </div>
          )}

          {/* NIH Institutes */}
          {opportunity.participating_orgs && opportunity.participating_orgs.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1.5 font-medium flex items-center gap-1">
                <Building2 className="h-3 w-3" /> Participating Institutes
              </p>
              <div className="flex flex-wrap gap-1">
                {opportunity.participating_orgs.map((org, i) => (
                  <Badge key={i} variant="outline" className="text-xs">{org}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {opportunity.relevance_tags && opportunity.relevance_tags.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1.5 font-medium">Relevance Tags</p>
              <div className="flex flex-wrap gap-1">
                {opportunity.relevance_tags.map((tag, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {opportunity.notes && (
            <div>
              <p className="text-xs text-muted-foreground mb-1 font-medium">Notes</p>
              <p className="text-sm leading-relaxed">{opportunity.notes}</p>
            </div>
          )}

          {/* View NOFO button + iframe */}
          {opportunity.url && (
            <div className="space-y-3">
              <Button asChild className="w-full">
                <a href={opportunity.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Full NOFO
                </a>
              </Button>

              <div className="border rounded-lg overflow-hidden">
                <iframe
                  src={opportunity.url}
                  title={`NOFO: ${opportunity.fon}`}
                  className="w-full h-[50vh] bg-white"
                  sandbox="allow-scripts allow-same-origin allow-popups"
                />
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                Some sites may block embedding. Use the button above to view directly.
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
