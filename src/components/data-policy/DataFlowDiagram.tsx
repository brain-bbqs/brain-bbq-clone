import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Database, Users, Lock, Globe, UserCheck, FileText, ArrowRight, ArrowDown, AlertTriangle } from "lucide-react";

const FlowArrow = ({ direction = "right", label }: { direction?: "right" | "down"; label?: string }) => (
  <div className={`flex ${direction === "down" ? "flex-col items-center py-2" : "items-center px-2"}`}>
    {direction === "down" ? (
      <div className="flex flex-col items-center gap-1">
        <ArrowDown className="h-5 w-5 text-muted-foreground" />
        {label && <span className="text-[10px] text-muted-foreground text-center max-w-20">{label}</span>}
      </div>
    ) : (
      <div className="flex items-center gap-1">
        <div className="h-px w-6 bg-muted-foreground/40" />
        <ArrowRight className="h-4 w-4 text-muted-foreground -ml-1" />
        {label && <span className="text-[10px] text-muted-foreground whitespace-nowrap">{label}</span>}
      </div>
    )}
  </div>
);

const NodeBox = ({
  icon: Icon,
  title,
  subtitle,
  color,
  children,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  color: string;
  children?: React.ReactNode;
}) => {
  const colorMap: Record<string, string> = {
    blue: "border-blue-500/30 bg-blue-500/5",
    green: "border-emerald-500/30 bg-emerald-500/5",
    orange: "border-orange-500/30 bg-orange-500/5",
    red: "border-red-500/30 bg-red-500/5",
    purple: "border-purple-500/30 bg-purple-500/5",
    cyan: "border-cyan-500/30 bg-cyan-500/5",
  };
  const iconColorMap: Record<string, string> = {
    blue: "text-blue-500",
    green: "text-emerald-500",
    orange: "text-orange-500",
    red: "text-red-500",
    purple: "text-purple-500",
    cyan: "text-cyan-500",
  };

  return (
    <div className={`rounded-lg border-2 ${colorMap[color]} p-3 min-w-[140px]`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`h-4 w-4 ${iconColorMap[color]}`} />
        <span className="font-semibold text-sm text-foreground">{title}</span>
      </div>
      {subtitle && <p className="text-[11px] text-muted-foreground leading-tight">{subtitle}</p>}
      {children}
    </div>
  );
};

const AccessTierBadge = ({ tier, color }: { tier: string; color: string }) => {
  const colorMap: Record<string, string> = {
    green: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
    yellow: "bg-yellow-500/15 text-yellow-600 border-yellow-500/30",
    red: "bg-red-500/15 text-red-600 border-red-500/30",
  };
  return (
    <Badge variant="outline" className={`text-[10px] ${colorMap[color]}`}>
      {tier}
    </Badge>
  );
};

export const DataFlowDiagram = () => {
  return (
    <Card className="mb-8 border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          Data Sharing Architecture
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          How BBQS data flows from investigators to repositories and secondary users
        </p>
      </CardHeader>
      <CardContent>
        {/* Main Flow */}
        <div className="space-y-6">
          {/* Row 1: Data Sources */}
          <div className="flex flex-wrap items-start justify-center gap-4">
            <NodeBox icon={Users} title="Investigators" subtitle="Generate multimodal data" color="blue" />
            <FlowArrow label="Submit with DMSP" />
            <NodeBox icon={Shield} title="IRB / Institution" subtitle="Consent & compliance review" color="purple">
              <div className="mt-2">
                <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-600 border-purple-500/30">
                  Attestation Doc
                </Badge>
              </div>
            </NodeBox>
            <FlowArrow label="Approved" />
            <NodeBox icon={FileText} title="DCAIC" subtitle="Coordination & review" color="cyan">
              <div className="mt-2 flex gap-1">
                <Badge variant="outline" className="text-[10px] bg-cyan-500/10 text-cyan-600 border-cyan-500/30">
                  DAC Review
                </Badge>
              </div>
            </NodeBox>
          </div>

          {/* Decision Split */}
          <div className="flex justify-center">
            <div className="rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/30 px-6 py-3 text-center">
              <AlertTriangle className="h-4 w-4 text-orange-500 mx-auto mb-1" />
              <p className="text-xs font-medium text-foreground">Data Classification Decision</p>
              <p className="text-[10px] text-muted-foreground">Contains PHI/PII?</p>
            </div>
          </div>

          {/* Row 2: Repositories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* EMBER-DANDI */}
            <div className="space-y-3">
              <div className="text-center">
                <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 mb-2" variant="outline">
                  No PHI/PII
                </Badge>
              </div>
              <NodeBox icon={Globe} title="EMBER-DANDI" subtitle="De-identified data repository" color="green">
                <div className="mt-3 space-y-2">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Access Tiers:</p>
                  <div className="flex flex-wrap gap-1">
                    <AccessTierBadge tier="🌐 Public" color="green" />
                    <AccessTierBadge tier="🔑 Registered" color="yellow" />
                  </div>
                  <div className="mt-2 text-[10px] text-muted-foreground space-y-1">
                    <p>• Non-human multimodal data</p>
                    <p>• De-identified human data</p>
                    <p>• Derivatives & processed data</p>
                  </div>
                </div>
              </NodeBox>
            </div>

            {/* EMBERvault */}
            <div className="space-y-3">
              <div className="text-center">
                <Badge className="bg-red-500/20 text-red-600 border-red-500/30 mb-2" variant="outline">
                  Contains PHI/PII
                </Badge>
              </div>
              <NodeBox icon={Lock} title="EMBERvault" subtitle="HIPAA-compliant secure repository" color="red">
                <div className="mt-3 space-y-2">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Access Tiers:</p>
                  <div className="flex flex-wrap gap-1">
                    <AccessTierBadge tier="🔒 Controlled" color="red" />
                  </div>
                  <div className="mt-2 text-[10px] text-muted-foreground space-y-1">
                    <p>• Identifiable human data</p>
                    <p>• PHI/PII-containing datasets</p>
                    <p>• Secure sandbox analysis only</p>
                    <p>• No direct download</p>
                  </div>
                </div>
              </NodeBox>
            </div>
          </div>

          {/* Row 3: Users */}
          <div className="flex flex-wrap items-start justify-center gap-4">
            <NodeBox icon={UserCheck} title="Secondary Users" subtitle="Researchers accessing data" color="orange">
              <div className="mt-2 space-y-1 text-[10px] text-muted-foreground">
                <p>• Identity verification</p>
                <p>• Data Use Certification</p>
                <p>• Code of Conduct</p>
                <p>• No Re-identification (NR)</p>
              </div>
            </NodeBox>
          </div>

          {/* Key Safeguards */}
          <div className="mt-4 p-4 rounded-lg bg-muted/40 border border-border">
            <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-primary" />
              Key Safeguards
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px] text-muted-foreground">
              <div className="flex items-start gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                <span>Certificate of Confidentiality follows data</span>
              </div>
              <div className="flex items-start gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 shrink-0" />
                <span>3-year access period with renewal</span>
              </div>
              <div className="flex items-start gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1 shrink-0" />
                <span>Ongoing risk assessment & tier adjustment</span>
              </div>
              <div className="flex items-start gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1 shrink-0" />
                <span>Participant withdrawal honored</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
