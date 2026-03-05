import { SummaryField } from "../SummaryField";
import { SummaryTabs } from "../SummaryTabs";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, FileText, Users, Mail, Link as LinkIcon, FolderOpen } from "lucide-react";

export interface WorkingGroupData {
  name: string;
  shortName: string;
  purpose: string;
  deliverables: string[];
  charterUrl?: string;
  resourcesUrl?: string;
  chairs: { name: string; url: string | null }[];
  contactChairs?: string;
  mailingList?: string;
}

// Static data for all working groups
const WORKING_GROUPS: Record<string, WorkingGroupData> = {
  "wg-analytics": {
    name: "WG-Analytics",
    shortName: "Analytics",
    purpose:
      "The Working Group on Data Analytics and AI aims to establish and promote the sharing, refinement, and adoption of analytics and AI standards for novel sensors and multimodal data integration within the BBQS community. Specifically, the Working Group will strive towards achieving FAIR (Findable, Accessible, Interoperable, Reusable) sharing and reuse of AI and analytics derived results from brain-behavior data.",
    deliverables: [
      "Evaluate and curate relevant ML/AI models and platforms",
      "Assist with aggregating datasets, models, and other ML/AI resources from both within and outside the BBQS consortium",
    ],
    charterUrl:
      "https://docs.google.com/document/d/1WXW1P3-OZguuQq_aXYoFgNDhJrU5ZO8jfyb22STL2io/edit?usp=sharing",
    resourcesUrl: "/resources?search=WG-Analytics",
    chairs: [
      { name: "Kristofer Bouchard", url: "https://biosciences.lbl.gov/profiles/kristofer-e-bouchard/" },
      { name: "Han Yi", url: "https://scholar.google.com/citations?user=MdrCoqAAAAAJ&hl=en" },
    ],
    contactChairs: "wg-chairs@brain-bbqs.org",
    mailingList: "wg-analytics@brain-bbqs.org",
  },
  "wg-devices": {
    name: "WG-Devices",
    shortName: "Devices",
    purpose:
      "Coordinating neural device development, hardware standards, and recording technology across consortium labs.",
    deliverables: [],
    chairs: [{ name: "TBD", url: null }],
  },
  "wg-elsi": {
    name: "WG-Ethics, Legal, and Social Issues (WG-ELSI)",
    shortName: "ELSI",
    purpose:
      "Addressing ethical, legal, and social implications of brain research, ensuring responsible innovation and data governance.",
    deliverables: [],
    chairs: [
      { name: "Laura Cabrera", url: "https://rockethics.psu.edu/people/laura-cabrera/" },
    ],
  },
  "wg-standards": {
    name: "WG-Standards",
    shortName: "Standards",
    purpose:
      "Establishing data formats, metadata schemas, and interoperability standards like NWB across the consortium.",
    deliverables: [],
    chairs: [
      { name: "Oliver Ruebel", url: "https://dav.lbl.gov/~oruebel/" },
      { name: "Melissa Kline Struhl", url: "https://eccl.mit.edu/team-profiles/melissa-kline-struhl" },
    ],
  },
};

export function getWorkingGroupData(id: string): WorkingGroupData | null {
  return WORKING_GROUPS[id] || null;
}

export function WorkingGroupSummary({ id }: { id: string }) {
  const data = getWorkingGroupData(id);

  if (!data) {
    return <p className="p-6 text-muted-foreground">Working group not found.</p>;
  }

  const summaryContent = (
    <div className="space-y-1">
      {/* Purpose */}
      <SummaryField label="Purpose">
        <p className="text-sm leading-relaxed">{data.purpose}</p>
      </SummaryField>

      {/* Deliverables */}
      {data.deliverables.length > 0 && (
        <SummaryField label="Deliverables">
          <ul className="text-sm space-y-1.5 list-disc list-inside text-foreground">
            {data.deliverables.map((d, i) => (
              <li key={i} className="leading-relaxed">{d}</li>
            ))}
          </ul>
        </SummaryField>
      )}

      {/* Chairs */}
      <SummaryField label="Chairs">
        <div className="flex flex-wrap gap-2">
          {data.chairs.map((chair) =>
            chair.url ? (
              <a
                key={chair.name}
                href={chair.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline font-medium"
              >
                {chair.name}
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <span key={chair.name} className="text-sm text-muted-foreground italic">
                {chair.name}
              </span>
            )
          )}
        </div>
      </SummaryField>

      {/* Documentation & Resources */}
      {(data.charterUrl || data.resourcesUrl) && (
        <div className="pt-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Documentation & Resources
          </h3>
          <div className="space-y-2">
            {data.charterUrl && (
              <a
                href={data.charterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline font-medium rounded-lg border border-border p-3 hover:bg-accent/50 transition-colors"
              >
                <FileText className="h-4 w-4" />
                Working Group Charter
                <ExternalLink className="h-3 w-3 ml-auto" />
              </a>
            )}
            {data.resourcesUrl && (
              <a
                href={data.resourcesUrl}
                className="flex items-center gap-2 text-sm text-primary hover:underline font-medium rounded-lg border border-border p-3 hover:bg-accent/50 transition-colors"
              >
                <FolderOpen className="h-4 w-4" />
                View Resources
                <LinkIcon className="h-3 w-3 ml-auto" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Contact */}
      {(data.contactChairs || data.mailingList) && (
        <div className="pt-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Connect with the Group
          </h3>
          <div className="space-y-2">
            {data.contactChairs && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Chairs:</span>
                <a href={`mailto:${data.contactChairs}`} className="text-primary hover:underline">
                  {data.contactChairs}
                </a>
              </div>
            )}
            {data.mailingList && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Mailing List:</span>
                <a href={`mailto:${data.mailingList}`} className="text-primary hover:underline">
                  {data.mailingList}
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div>
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground">{data.name}</h2>
            <p className="text-sm text-muted-foreground">Working Group</p>
          </div>
        </div>
      </div>
      <SummaryTabs
        tabs={[
          {
            id: "summary",
            label: "Summary",
            icon: <FileText className="h-3.5 w-3.5" />,
            content: summaryContent,
          },
        ]}
      />
    </div>
  );
}
