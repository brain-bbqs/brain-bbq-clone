"use client";

import { useState, useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import type { ColDef } from "ag-grid-community";
import { useQuery } from "@tanstack/react-query";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Loader2, Users, ExternalLink, DollarSign, Lightbulb, FlaskConical } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { normalizePiName, piProfileUrl, institutionUrl } from "@/lib/pi-utils";
import { MARR_PROJECTS } from "@/data/marr-projects";
import "@/styles/ag-grid-theme.css";

interface CoPiInfo {
  name: string;
  profileId: number | null;
  isContactPi: boolean;
}

interface GrantInfo {
  grantNumber: string;
  title: string;
  nihLink: string;
  role: string;
  awardAmount: number;
  institution: string;
  fiscalYear: number | null;
  isBbqs: boolean;
  coPis: CoPiInfo[];
}

interface PIRow {
  name: string;
  displayName: string;
  firstName: string;
  lastName: string;
  profileId: number | null;
  projectsAsPi: number;
  projectsAsCoPi: number;
  totalProjects: number;
  totalFunding: number;
  institutions: string[];
  grants: GrantInfo[];
  skills: string[];
  researchAreas: string[];
}

const nameKey = (name: string): string =>
  name.replace(/[,.\-]/g, " ").split(/\s+/).map((s) => s.toLowerCase().trim()).filter(Boolean).sort().join(" ");

const extractGrantType = (grantNumber: string): string => {
  const match = grantNumber?.match(/([A-Z]\d{2})/);
  return match?.[1] || "";
};

/** Open NIH Reporter search for a PI using their profile ID */
const openNihReporterProfile = async (pi: PIRow) => {
  try {
    const body = pi.profileId
      ? { pi_profile_id: pi.profileId }
      : { first_name: pi.firstName, last_name: pi.lastName };

    const { data, error } = await supabase.functions.invoke("nih-reporter-search", { body });
    if (!error && data?.url) {
      window.open(data.url, "_blank");
      return;
    }
  } catch {
    // fallback
  }
  window.open(piProfileUrl(pi.displayName), "_blank");
};

const NameCell = ({ data }: { data: PIRow }) => (
  <div className="flex items-center gap-2">
    <Users className="h-4 w-4 text-muted-foreground shrink-0" />
    <button
      onClick={() => openNihReporterProfile(data)}
      className="font-medium text-primary hover:text-primary/80 hover:underline transition-colors text-left"
      title={`View ${data.displayName} on NIH Reporter`}
    >
      {data.displayName}
    </button>
  </div>
);

const ProjectsCell = ({ data }: { data: PIRow }) => {
  const bbqsCount = data.grants.filter(g => g.isBbqs).length;
  const otherCount = data.grants.filter(g => !g.isBbqs).length;

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <span className="text-foreground cursor-default">
          <span className="font-semibold">{data.totalProjects}</span>
          <span className="text-muted-foreground ml-1">
            ({data.projectsAsPi} PI / {data.projectsAsCoPi} Co-PI)
          </span>
        </span>
      </HoverCardTrigger>
      <HoverCardContent side="bottom" align="start" className="w-72 p-4">
        <p className="font-semibold text-sm mb-2">{data.displayName}</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-muted/50 rounded p-2">
            <p className="text-muted-foreground">As PI</p>
            <p className="font-bold text-foreground text-base">{data.projectsAsPi}</p>
          </div>
          <div className="bg-muted/50 rounded p-2">
            <p className="text-muted-foreground">As Co-PI</p>
            <p className="font-bold text-foreground text-base">{data.projectsAsCoPi}</p>
          </div>
          <div className="bg-emerald-500/10 rounded p-2">
            <p className="text-muted-foreground">BBQS Grants</p>
            <p className="font-bold text-emerald-600 text-base">{bbqsCount}</p>
          </div>
          <div className="bg-muted/50 rounded p-2">
            <p className="text-muted-foreground">Other Grants</p>
            <p className="font-bold text-foreground text-base">{otherCount}</p>
          </div>
        </div>
        {data.totalFunding > 0 && (
          <p className="text-xs font-mono text-emerald-600 font-semibold mt-2">
            Total: ${data.totalFunding.toLocaleString()}
          </p>
        )}
        {/* Frequent co-PIs */}
        {(() => {
          const copiCounts = new Map<string, { name: string; profileId: number | null; count: number }>();
          data.grants.forEach(g => {
            g.coPis.forEach(c => {
              if (nameKey(c.name) === nameKey(data.displayName)) return;
              const key = c.name.toLowerCase();
              const existing = copiCounts.get(key);
              if (existing) existing.count++;
              else copiCounts.set(key, { name: c.name, profileId: c.profileId, count: 1 });
            });
          });
          const topCoPis = Array.from(copiCounts.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, 8);
          if (topCoPis.length === 0) return null;
          return (
            <div className="border-t border-border pt-2 mt-2">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1.5">Co-Investigators</p>
              <div className="flex flex-wrap gap-1">
                {topCoPis.map((c, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className={`text-[11px] ${c.profileId ? 'cursor-pointer hover:bg-primary/15' : ''} bg-muted/50 text-muted-foreground border-border transition-colors`}
                    onClick={c.profileId ? (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      supabase.functions.invoke("nih-reporter-search", {
                        body: { pi_profile_id: c.profileId },
                      }).then(({ data }) => {
                        if (data?.url) window.open(data.url, "_blank");
                      });
                    } : undefined}
                  >
                    {normalizePiName(c.name)}
                    <span className="ml-0.5 opacity-50">({c.count})</span>
                  </Badge>
                ))}
              </div>
            </div>
          );
        })()}
      </HoverCardContent>
    </HoverCard>
  );
};

const FundingCell = ({ value }: { value: number }) => {
  if (!value || isNaN(value)) return <span className="text-muted-foreground">—</span>;
  return <span className="font-mono text-emerald-600 font-semibold">${value.toLocaleString()}</span>;
};

const InstitutionBadgeCell = ({ value }: { value: string[] }) => {
  if (!value || value.length === 0) return <span className="text-muted-foreground">—</span>;
  const first = value[0];
  const remaining = value.length - 1;
  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <div className="flex items-center gap-1.5 cursor-default">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs hover:bg-primary/20 transition-colors truncate max-w-[200px]">
            {first}
          </Badge>
          {remaining > 0 && (
            <span className="text-muted-foreground text-xs whitespace-nowrap">+{remaining}</span>
          )}
        </div>
      </HoverCardTrigger>
      <HoverCardContent side="left" align="start" className="w-72 p-4">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-2">
          Institutions ({value.length})
        </p>
        <div className="flex flex-col gap-1.5">
          {value.map((inst, i) => (
            <a
              key={i}
              href={institutionUrl(inst)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-primary hover:underline transition-colors"
            >
              <ExternalLink className="h-3 w-3 shrink-0" />
              {inst}
            </a>
          ))}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

const GrantsCell = ({ data }: { data: PIRow }) => {
  if (!data?.grants || data.grants.length === 0) return <span className="text-muted-foreground">—</span>;

  // Show BBQS grants first, then others
  const sorted = [...data.grants].sort((a, b) => {
    if (a.isBbqs !== b.isBbqs) return a.isBbqs ? -1 : 1;
    return (b.awardAmount || 0) - (a.awardAmount || 0);
  });

  // Show up to 6 badges, rest as "+N"
  const shown = sorted.slice(0, 6);
  const remaining = sorted.length - 6;

  return (
    <div className="flex flex-wrap gap-1.5 py-1">
      {shown.map((g, idx) => (
        <HoverCard key={`${g.grantNumber}-${idx}`} openDelay={200} closeDelay={100}>
          <HoverCardTrigger asChild>
            <a
              href={g.nihLink || `https://reporter.nih.gov/project-details/${encodeURIComponent(g.grantNumber)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Badge
                variant="outline"
                className={`text-xs cursor-pointer hover:bg-primary/20 transition-colors ${
                  g.isBbqs
                    ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/40 font-semibold dark:text-emerald-400"
                    : "bg-muted text-muted-foreground border-border"
                }`}
              >
                {extractGrantType(g.grantNumber) || g.grantNumber.slice(0, 6)}
                <ExternalLink className="h-2.5 w-2.5 ml-0.5" />
              </Badge>
            </a>
          </HoverCardTrigger>
          <HoverCardContent side="bottom" align="start" className="w-80 p-4">
            <p className="font-semibold text-sm mb-1.5 leading-snug">{g.title}</p>
            <p className="text-xs text-muted-foreground mb-1">
              {g.grantNumber} · {g.institution}
            </p>
            {g.awardAmount > 0 && (
              <p className="text-xs font-mono text-emerald-600 font-semibold mb-2">
                ${g.awardAmount.toLocaleString()}
              </p>
            )}
            {g.coPis && g.coPis.length > 0 && (
              <div className="border-t border-border pt-2 mt-1">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1.5">Investigators</p>
                <div className="flex flex-wrap gap-1">
                  {g.coPis.map((copi, i) => (
                    copi.profileId ? (
                      <Badge
                        key={i}
                        variant="outline"
                        className={`text-[11px] cursor-pointer hover:bg-primary/15 transition-colors ${
                          copi.isContactPi
                            ? "bg-primary/10 text-primary border-primary/30 font-medium"
                            : "bg-muted/50 text-muted-foreground border-border"
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          supabase.functions.invoke("nih-reporter-search", {
                            body: { pi_profile_id: copi.profileId },
                          }).then(({ data }) => {
                            if (data?.url) window.open(data.url, "_blank");
                          });
                        }}
                      >
                        {copi.name}
                        {copi.isContactPi && <span className="ml-0.5 opacity-60">(PI)</span>}
                      </Badge>
                    ) : (
                      <Badge
                        key={i}
                        variant="outline"
                        className={`text-[11px] ${
                          copi.isContactPi
                            ? "bg-primary/10 text-primary border-primary/30 font-medium"
                            : "bg-muted/50 text-muted-foreground border-border"
                        }`}
                      >
                        {copi.name}
                        {copi.isContactPi && <span className="ml-0.5 opacity-60">(PI)</span>}
                      </Badge>
                    )
                  ))}
                </div>
              </div>
            )}
            {g.isBbqs && (
              <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-700 border-emerald-500/30 mt-2 dark:text-emerald-400">
                BBQS Grant
              </Badge>
            )}
          </HoverCardContent>
        </HoverCard>
      ))}
      {remaining > 0 && (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-muted-foreground text-xs cursor-help self-center">+{remaining}</span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-sm p-2">
              <p className="text-xs text-muted-foreground">
                {sorted.slice(6).map(g => extractGrantType(g.grantNumber) || g.grantNumber).join(", ")}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};

const BadgeListCell = ({ value, color }: { value: string[]; color: "primary" | "amber" }) => {
  if (!value || value.length === 0) return <span className="text-muted-foreground">—</span>;
  const shown = value.slice(0, 3);
  const remaining = value.length - shown.length;
  const colorClasses = color === "amber"
    ? "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-400"
    : "bg-primary/10 text-primary border-primary/30";
  return (
    <div className="flex flex-wrap gap-1 py-1">
      {shown.map((item, i) => (
        <Badge key={i} variant="outline" className={`text-[10px] px-1.5 py-0 font-normal ${colorClasses}`}>
          {item}
        </Badge>
      ))}
      {remaining > 0 && (
        <HoverCard openDelay={200} closeDelay={100}>
          <HoverCardTrigger asChild>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal text-muted-foreground cursor-help">
              +{remaining}
            </Badge>
          </HoverCardTrigger>
          <HoverCardContent side="bottom" align="start" className="w-64 p-3">
            <div className="flex flex-wrap gap-1">
              {value.map((item, i) => (
                <Badge key={i} variant="outline" className={`text-[10px] ${colorClasses}`}>
                  {item}
                </Badge>
              ))}
            </div>
          </HoverCardContent>
        </HoverCard>
      )}
    </div>
  );
};

const SkillsCell = ({ value }: { value: string[] }) => <BadgeListCell value={value} color="amber" />;
const ResearchAreasCell = ({ value }: { value: string[] }) => <BadgeListCell value={value} color="primary" />;

const fetchPIs = async (): Promise<PIRow[]> => {
  // Step 1: Get BBQS grants to identify our PIs
  const { data, error } = await supabase.functions.invoke("nih-grants");
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);

  const bbqsGrants = data?.data || [];
  const piMap = new Map<string, PIRow>();

  // Build initial PI list from BBQS grants
  bbqsGrants.forEach((grant: any) => {
    const piDetails: any[] = grant.piDetails || [];
    const allPis = grant.allPis?.split(/[,;]/).map((p: string) => p.trim()).filter(Boolean) || [];
    const contactPi = grant.contactPi?.trim() || "";
    const normalizedContactPi = nameKey(contactPi);

    allPis.forEach((piName: string) => {
      if (!piName) return;
      const key = nameKey(piName);
      const displayName = normalizePiName(piName);

      const matchingDetail = piDetails.find((d: any) => {
        const detailKey = nameKey(d.fullName || `${d.firstName} ${d.lastName}`);
        return detailKey === key;
      });

      const firstName = matchingDetail?.firstName || displayName.split(/\s+/)[0] || "";
      const lastName = matchingDetail?.lastName || displayName.split(/\s+/).pop() || "";
      const profileId = matchingDetail?.profileId || null;

      if (!piMap.has(key)) {
        piMap.set(key, {
          name: piName,
          displayName,
          firstName,
          lastName,
          profileId,
          projectsAsPi: 0,
          projectsAsCoPi: 0,
          totalProjects: 0,
          totalFunding: 0,
          institutions: [],
          grants: [],
          skills: [],
          researchAreas: [],
        });
      }

      const existing = piMap.get(key)!;
      if (profileId && !existing.profileId) existing.profileId = profileId;
    });
  });

  // Step 2: Fetch ALL grants for each PI from NIH Reporter
  const profileIds = Array.from(piMap.values())
    .map(pi => pi.profileId)
    .filter((id): id is number => id !== null);

  if (profileIds.length > 0) {
    try {
      const { data: allGrantsData, error: allGrantsError } = await supabase.functions.invoke("nih-pi-grants", {
        body: { profile_ids: profileIds },
      });

      if (!allGrantsError && allGrantsData?.data) {
        const allGrantsByPi = allGrantsData.data as Record<number, any[]>;

        // Set of BBQS grant numbers for tagging
        const bbqsGrantNumbers = new Set(bbqsGrants.map((g: any) => g.grantNumber));

        for (const [, pi] of piMap) {
          if (!pi.profileId) continue;
          const piGrants = allGrantsByPi[pi.profileId] || [];

          let piAsPi = 0;
          let piAsCoPi = 0;
          const institutions = new Set<string>();
          const grants: GrantInfo[] = [];

          for (const g of piGrants) {
            const isBbqs = bbqsGrantNumbers.has(g.grantNumber);
            if (g.isContactPi) piAsPi++;
            else piAsCoPi++;
            if (g.institution) institutions.add(g.institution);

            grants.push({
              grantNumber: g.grantNumber,
              title: g.title,
              nihLink: g.nihLink,
              role: g.isContactPi ? "contact_pi" : "co_pi",
              awardAmount: g.awardAmount || 0,
              institution: g.institution || "",
              fiscalYear: g.fiscalYear || null,
              isBbqs,
              coPis: (g.coPis || []).map((c: any) => ({
                name: c.name || "",
                profileId: c.profileId || null,
                isContactPi: c.isContactPi || false,
              })),
            });
          }

          pi.projectsAsPi = piAsPi;
          pi.projectsAsCoPi = piAsCoPi;
          pi.totalProjects = piGrants.length;
          pi.totalFunding = grants.reduce((sum, g) => sum + (g.awardAmount || 0), 0);
          pi.institutions = Array.from(institutions);
          pi.grants = grants;
        }
      }
    } catch (e) {
      console.error("Failed to fetch all PI grants:", e);
      // Fall back to BBQS-only data
      _populateFromBbqsOnly(piMap, bbqsGrants);
    }
  } else {
    _populateFromBbqsOnly(piMap, bbqsGrants);
  }

  // Enrich with skills & research areas from Marr projects data
  for (const [, pi] of piMap) {
    const piKey = nameKey(pi.displayName);
    const matchingProjects = MARR_PROJECTS.filter(p => nameKey(p.pi) === piKey);
    const skills = new Set<string>();
    const areas = new Set<string>();
    matchingProjects.forEach(p => {
      p.algorithmic.forEach(s => skills.add(s));
      p.computational.forEach(a => areas.add(a));
    });
    pi.skills = Array.from(skills);
    pi.researchAreas = Array.from(areas);
  }

  return Array.from(piMap.values()).sort((a, b) => a.displayName.localeCompare(b.displayName));
};

/** Fallback: populate from BBQS grants only */
function _populateFromBbqsOnly(piMap: Map<string, PIRow>, bbqsGrants: any[]) {
  bbqsGrants.forEach((grant: any) => {
    const allPis = grant.allPis?.split(/[,;]/).map((p: string) => p.trim()).filter(Boolean) || [];
    const contactPi = grant.contactPi?.trim() || "";
    const normalizedContactPi = nameKey(contactPi);
    const awardAmount = typeof grant.awardAmount === "number" ? grant.awardAmount : 0;

    allPis.forEach((piName: string) => {
      if (!piName) return;
      const key = nameKey(piName);
      const existing = piMap.get(key);
      if (!existing) return;

      const isContact = key === normalizedContactPi;
      if (isContact) existing.projectsAsPi++;
      else existing.projectsAsCoPi++;
      existing.totalProjects++;
      existing.totalFunding += awardAmount;

      if (grant.institution && !existing.institutions.includes(grant.institution)) {
        existing.institutions.push(grant.institution);
      }

      existing.grants.push({
        grantNumber: grant.grantNumber || "",
        title: grant.title || "",
        nihLink: grant.nihLink || "",
        role: isContact ? "contact_pi" : "co_pi",
        awardAmount,
        institution: grant.institution || "",
        fiscalYear: grant.fiscalYear || null,
        isBbqs: true,
        coPis: [],
      });
    });
  });
}

export default function PrincipalInvestigators() {
  const [quickFilterText, setQuickFilterText] = useState("");
  const { data: rowData = [], isLoading } = useQuery({
    queryKey: ["principal-investigators"],
    queryFn: fetchPIs,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const totalFundingAll = useMemo(() => {
    const seen = new Set<string>();
    let total = 0;
    rowData.forEach(pi => {
      pi.grants.forEach(g => {
        if (!seen.has(g.grantNumber)) {
          seen.add(g.grantNumber);
          total += g.awardAmount || 0;
        }
      });
    });
    return total;
  }, [rowData]);

  const defaultColDef = useMemo<ColDef>(() => ({
    sortable: true,
    resizable: true,
    suppressMovable: true,
    unSortIcon: true,
  }), []);

  const columnDefs = useMemo<ColDef<PIRow>[]>(() => [
    {
      field: "displayName",
      headerName: "Name",
      flex: 1,
      minWidth: 200,
      cellRenderer: NameCell,
      sort: "asc",
    },
    {
      headerName: "Projects (PI / Co-PI)",
      width: 180,
      minWidth: 160,
      cellRenderer: ProjectsCell,
      comparator: (_vA, _vB, nodeA, nodeB) =>
        (nodeA.data?.totalProjects || 0) - (nodeB.data?.totalProjects || 0),
    },
    {
      headerName: "Grants",
      flex: 1.5,
      minWidth: 250,
      cellRenderer: GrantsCell,
      comparator: (_vA, _vB, nodeA, nodeB) =>
        (nodeA.data?.grants?.length || 0) - (nodeB.data?.grants?.length || 0),
    },
    {
      field: "totalFunding",
      headerName: "Total Funding",
      width: 160,
      minWidth: 130,
      cellRenderer: FundingCell,
      comparator: (a: number, b: number) => (a || 0) - (b || 0),
    },
    {
      field: "institutions",
      headerName: "Institutions",
      flex: 1,
      minWidth: 200,
      cellRenderer: InstitutionBadgeCell,
    },
    {
      field: "skills",
      headerName: "Skills",
      flex: 1,
      minWidth: 200,
      cellRenderer: SkillsCell,
      wrapText: true,
      autoHeight: true,
      filterValueGetter: (params) => params.data?.skills?.join(", ") || "",
    },
    {
      field: "researchAreas",
      headerName: "Research Areas",
      flex: 1,
      minWidth: 200,
      cellRenderer: ResearchAreasCell,
      wrapText: true,
      autoHeight: true,
      filterValueGetter: (params) => params.data?.researchAreas?.join(", ") || "",
    },
  ], []);

  return (
    <div className="min-h-screen bg-background">
      <div className="px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Principal Investigators</h1>
          <p className="text-muted-foreground mb-6">
            Browse all Principal Investigators and Co-PIs across NIH grants. Click a name to view their NIH Reporter profile. BBQS-affiliated grants are highlighted in green.
          </p>

          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Investigators</p>
                    <p className="text-xl font-bold text-foreground">{rowData.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <DollarSign className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Funding</p>
                    <p className="text-xl font-bold text-emerald-600">
                      {totalFundingAll > 0 ? `$${(totalFundingAll / 1000000).toFixed(1)}M` : "—"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Unique Institutions</p>
                    <p className="text-xl font-bold text-foreground">
                      {new Set(rowData.flatMap(pi => pi.institutions)).size}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-wrap items-center gap-4 mb-4">
            <Input
              type="text"
              placeholder="Filter by name, institution..."
              value={quickFilterText}
              onChange={(e) => setQuickFilterText(e.target.value)}
              className="max-w-xs"
            />
            <span className="text-sm text-muted-foreground">{rowData.length} investigators</span>
          </div>
        </div>

        <div
          className="ag-theme-alpine rounded-lg border border-border overflow-hidden"
          style={{ height: "calc(100vh - 380px)" }}
        >
          <AgGridReact<PIRow>
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            quickFilterText={quickFilterText}
            animateRows={true}
            pagination={true}
            paginationPageSize={25}
            paginationPageSizeSelector={[10, 25, 50, 100]}
            suppressCellFocus={true}
            enableCellTextSelection={true}
            rowHeight={56}
            headerHeight={40}
            loading={isLoading}
            loadingOverlayComponent={() => (
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span>Loading investigators...</span>
              </div>
            )}
            noRowsOverlayComponent={() => (
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Users className="h-8 w-8 text-muted-foreground" />
                <span>No investigators found</span>
              </div>
            )}
          />
        </div>
      </div>
    </div>
  );
}
