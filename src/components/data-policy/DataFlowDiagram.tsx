import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Database,
  Users,
  Lock,
  Globe,
  Building2,
  Network,
  Eye,
  ServerCog,
} from "lucide-react";

const InstitutionNode = ({ name, color }: { name: string; color: string }) => {
  const colors: Record<string, string> = {
    blue: "border-blue-500/40 bg-blue-500/10 shadow-blue-500/10",
    purple: "border-purple-500/40 bg-purple-500/10 shadow-purple-500/10",
    teal: "border-teal-500/40 bg-teal-500/10 shadow-teal-500/10",
    amber: "border-amber-500/40 bg-amber-500/10 shadow-amber-500/10",
    rose: "border-rose-500/40 bg-rose-500/10 shadow-rose-500/10",
    indigo: "border-indigo-500/40 bg-indigo-500/10 shadow-indigo-500/10",
  };
  const iconColors: Record<string, string> = {
    blue: "text-blue-500",
    purple: "text-purple-500",
    teal: "text-teal-500",
    amber: "text-amber-500",
    rose: "text-rose-500",
    indigo: "text-indigo-500",
  };
  return (
    <div className={`rounded-xl border-2 ${colors[color]} px-3 py-2.5 shadow-lg text-center min-w-[100px]`}>
      <Building2 className={`h-4 w-4 mx-auto mb-1 ${iconColors[color]}`} />
      <p className="text-[11px] font-semibold text-foreground leading-tight">{name}</p>
      <p className="text-[9px] text-muted-foreground mt-0.5">IRB · DMSP · Consent</p>
    </div>
  );
};

const ConnectorLine = ({ dashed }: { dashed?: boolean }) => (
  <div className={`h-px flex-1 min-w-4 ${dashed ? "border-t border-dashed border-muted-foreground/30" : "bg-muted-foreground/20"}`} />
);

const VerticalConnector = ({ label }: { label?: string }) => (
  <div className="flex flex-col items-center gap-0.5">
    <div className="w-px h-5 bg-muted-foreground/25" />
    {label && (
      <span className="text-[9px] text-muted-foreground bg-background px-1 rounded">{label}</span>
    )}
    <div className="w-px h-5 bg-muted-foreground/25" />
    <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[5px] border-l-transparent border-r-transparent border-t-muted-foreground/40" />
  </div>
);

export const DataFlowDiagram = () => {
  return (
    <Card className="mb-8 border-border overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Network className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Federated Data Governance Model</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Decentralized architecture — each institution retains sovereignty over consent & compliance
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-6">

          {/* Tier 1: Autonomous Institutions (Federation Ring) */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="text-[10px] bg-muted/50">TIER 1</Badge>
              <span className="text-xs font-medium text-muted-foreground">Autonomous Institutional Nodes</span>
            </div>
            <div className="relative rounded-2xl border border-dashed border-muted-foreground/20 bg-muted/20 p-4">
              {/* Network topology hint */}
              <div className="absolute top-2 right-3 text-[9px] text-muted-foreground/60 flex items-center gap-1">
                <Network className="h-3 w-3" /> Federated Ring
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <InstitutionNode name="Yale" color="blue" />
                <ConnectorLine dashed />
                <InstitutionNode name="MIT" color="purple" />
                <ConnectorLine dashed />
                <InstitutionNode name="UCLA" color="teal" />
                <ConnectorLine dashed />
                <InstitutionNode name="Penn State" color="amber" />
                <ConnectorLine dashed />
                <InstitutionNode name="JHU/APL" color="rose" />
                <ConnectorLine dashed />
                <InstitutionNode name="Others" color="indigo" />
              </div>
              <p className="text-center text-[10px] text-muted-foreground mt-3 italic">
                Each node independently governs IRB approval, consent language, and local data handling
              </p>
            </div>
          </div>

          <VerticalConnector label="Attestation + Metadata" />

          {/* Tier 2: DCAIC Coordination Layer */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="text-[10px] bg-muted/50">TIER 2</Badge>
              <span className="text-xs font-medium text-muted-foreground">Coordination & Classification Layer</span>
            </div>
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                <div className="rounded-xl border-2 border-primary/30 bg-background px-5 py-3 text-center shadow-sm">
                  <ServerCog className="h-5 w-5 text-primary mx-auto mb-1" />
                  <p className="text-sm font-bold text-foreground">DCAIC</p>
                  <p className="text-[10px] text-muted-foreground">Data Coordination &<br/>AI Center</p>
                </div>
                <div className="flex flex-col gap-2 text-[11px]">
                  <div className="flex items-center gap-2 rounded-lg bg-background/80 border border-border px-3 py-1.5">
                    <Eye className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-foreground">DAC reviews access requests</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-background/80 border border-border px-3 py-1.5">
                    <Shield className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-foreground">PHI/PII classification routing</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-background/80 border border-border px-3 py-1.5">
                    <Network className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-foreground">Cross-node discovery & linkage</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <VerticalConnector label="Route by classification" />

          {/* Tier 3: Dual Repository */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="text-[10px] bg-muted/50">TIER 3</Badge>
              <span className="text-xs font-medium text-muted-foreground">Dual Repository Infrastructure</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* EMBER-DANDI */}
              <div className="rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="h-5 w-5 text-emerald-500" />
                  <div>
                    <p className="font-bold text-sm text-foreground">EMBER-DANDI</p>
                    <p className="text-[10px] text-muted-foreground">Open & Registered Access</p>
                  </div>
                </div>
                <div className="space-y-2 text-[11px]">
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30 shrink-0">Public</Badge>
                    <span className="text-muted-foreground">No account needed — fully de-identified</span>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-[9px] bg-yellow-500/10 text-yellow-600 border-yellow-500/30 shrink-0">Registered</Badge>
                    <span className="text-muted-foreground">Account + terms of use required</span>
                  </div>
                  <div className="mt-3 pt-2 border-t border-emerald-500/15 text-[10px] text-muted-foreground">
                    Non-human data · De-identified human · Processed derivatives
                  </div>
                </div>
              </div>

              {/* EMBERvault */}
              <div className="rounded-2xl border-2 border-red-500/30 bg-red-500/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Lock className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="font-bold text-sm text-foreground">EMBERvault</p>
                    <p className="text-[10px] text-muted-foreground">Controlled Access · HIPAA</p>
                  </div>
                </div>
                <div className="space-y-2 text-[11px]">
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-[9px] bg-red-500/10 text-red-600 border-red-500/30 shrink-0">Controlled</Badge>
                    <span className="text-muted-foreground">DAC approval + secure sandbox</span>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-[9px] bg-red-500/10 text-red-600 border-red-500/30 shrink-0">No Export</Badge>
                    <span className="text-muted-foreground">Analysis in-place, summary outputs only</span>
                  </div>
                  <div className="mt-3 pt-2 border-t border-red-500/15 text-[10px] text-muted-foreground">
                    Identifiable human data · PHI/PII · CoC-protected
                  </div>
                </div>
              </div>
            </div>
          </div>

          <VerticalConnector label="Governed access" />

          {/* Tier 4: Users */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="text-[10px] bg-muted/50">TIER 4</Badge>
              <span className="text-xs font-medium text-muted-foreground">Secondary Research Users</span>
            </div>
            <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Users className="h-6 w-6 text-orange-500" />
                  <div>
                    <p className="font-semibold text-sm text-foreground">Authorized Researchers</p>
                    <p className="text-[10px] text-muted-foreground">3-year access window · renewable</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {["Identity Verified", "DUC Signed", "Training Complete", "NR Clause"].map((req) => (
                    <Badge key={req} variant="outline" className="text-[9px] bg-orange-500/10 text-orange-600 border-orange-500/30">
                      {req}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Governance Principles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
            {[
              { icon: Building2, title: "Institutional Sovereignty", desc: "Each node controls its own IRB, consent, and compliance — no central authority overrides local governance" },
              { icon: Network, title: "Federated Discovery", desc: "DCAIC enables cross-node dataset discovery and linkage without centralizing raw data" },
              { icon: Shield, title: "Defense in Depth", desc: "Tiered access, disclosure review, CoC protections, and ongoing risk reassessment at every layer" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-xl border border-border bg-muted/30 p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold text-foreground">{title}</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
