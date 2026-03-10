// State Privacy Risk Matrix — types + seed data

export type RiskLabel = "NO_EXTRA" | "LIMITED_EXPORT" | "FEDERATED_ONLY" | "BLOCKED";

export interface CategoryRule {
  label: RiskLabel;
  note: string;
  statute?: string; // e.g. "Cal. Civ. Code §1798.140(ae)"
  conflict?: string; // What specifically conflicts with BBQS sharing
}

export type BBQSCategory =
  | "brain_behavior"
  | "consumer_health"
  | "reproductive"
  | "minors"
  | "biometric_neuro";

export type BBQSFlags = Record<BBQSCategory, boolean>;

export interface StateRiskRow {
  state: string; // 2-letter abbreviation
  stateName: string;
  last_reviewed: string;
  categories: Record<BBQSCategory, CategoryRule>;
}

export const CATEGORY_LABELS: Record<BBQSCategory, string> = {
  brain_behavior: "Brain / Behavioral Research",
  consumer_health: "Consumer Health / Mental Health",
  reproductive: "Reproductive / Sexual Health",
  minors: "Minors / Students",
  biometric_neuro: "Biometric / Neurological IDs",
};

export const RISK_LABEL_META: Record<RiskLabel, { color: string; text: string; score: number }> = {
  NO_EXTRA: { color: "hsl(142, 60%, 45%)", text: "No Extra Restrictions", score: 0 },
  LIMITED_EXPORT: { color: "hsl(45, 90%, 50%)", text: "Limited Export", score: 1 },
  FEDERATED_ONLY: { color: "hsl(25, 85%, 55%)", text: "Federated Only", score: 2 },
  BLOCKED: { color: "hsl(0, 75%, 50%)", text: "Blocked", score: 3 },
};

const DEFAULT_ROW: StateRiskRow["categories"] = {
  brain_behavior: { label: "NO_EXTRA", note: "Not clearly addressed beyond HIPAA/general privacy law.", statute: "", conflict: "" },
  consumer_health: { label: "NO_EXTRA", note: "Not clearly addressed beyond HIPAA/general privacy law.", statute: "", conflict: "" },
  reproductive: { label: "NO_EXTRA", note: "Not clearly addressed beyond HIPAA/general privacy law.", statute: "", conflict: "" },
  minors: { label: "NO_EXTRA", note: "Not clearly addressed beyond HIPAA/general privacy law.", statute: "", conflict: "" },
  biometric_neuro: { label: "NO_EXTRA", note: "Not clearly addressed beyond HIPAA/general privacy law.", statute: "", conflict: "" },
};

// Seed data — states with notable stricter-than-HIPAA rules
export const STATE_RISK_MATRIX: StateRiskRow[] = [
  {
    state: "CA", stateName: "California", last_reviewed: "2025-06-01",
    categories: {
      brain_behavior: { label: "LIMITED_EXPORT", statute: "Cal. Civ. Code §1798.140(ae)", conflict: "Inferences from biometric/behavioral data classified as sensitive PI; opt-out rights conflict with pooled analysis pipelines.", note: "CCPA/CPRA treat inferences derived from biometric/behavioral data as sensitive PI; opt-out and data minimization required." },
      consumer_health: { label: "LIMITED_EXPORT", statute: "Cal. Civ. Code §56 et seq. (CMIA)", conflict: "CMIA requires written authorization for disclosure of medical information; BBQS automated sharing would need per-subject consent.", note: "CMIA imposes stricter consent for medical information disclosure than HIPAA." },
      reproductive: { label: "FEDERATED_ONLY", statute: "AB 352 (2024), Health & Safety Code §123462", conflict: "Prohibits disclosure of reproductive/sexual health info to out-of-state entities without explicit consent; raw data cannot leave CA.", note: "AB 352 prohibits disclosure of reproductive/sexual health info to out-of-state entities without explicit consent." },
      minors: { label: "LIMITED_EXPORT", statute: "AB 2273 (Age-Appropriate Design Code)", conflict: "Data minimization requirements for minors conflict with BBQS comprehensive data collection; DPIA required.", note: "COPPA plus CA Age-Appropriate Design Code impose data minimization for minors' data." },
      biometric_neuro: { label: "LIMITED_EXPORT", statute: "SB 1223 (2024), Cal. Civ. Code §1798.140(c)", conflict: "Neural data added to sensitive PI definition; collection requires opt-in consent incompatible with batch processing.", note: "CCPA classifies biometric information and neural data as sensitive PI; SB 1223 adds neurorights protections." },
    },
  },
  {
    state: "IL", stateName: "Illinois", last_reviewed: "2025-06-01",
    categories: {
      brain_behavior: { label: "NO_EXTRA", statute: "", conflict: "", note: "Not clearly addressed beyond HIPAA/general privacy law." },
      consumer_health: { label: "NO_EXTRA", statute: "", conflict: "", note: "Not clearly addressed beyond HIPAA/general privacy law." },
      reproductive: { label: "NO_EXTRA", statute: "", conflict: "", note: "Reproductive Health Act protects access but doesn't restrict research data sharing beyond HIPAA." },
      minors: { label: "LIMITED_EXPORT", statute: "105 ILCS 85 (SOPPA)", conflict: "Restricts commercial use of K-12 student data; BBQS must ensure no commingling of student records in shared datasets.", note: "Student Online Personal Protection Act restricts commercial use of K-12 student data." },
      biometric_neuro: { label: "FEDERATED_ONLY", statute: "740 ILCS 14/15(b) (BIPA)", conflict: "Requires informed written consent before collection of biometric identifiers; private right of action means raw biometric data must not leave state.", note: "BIPA requires informed consent before collection of biometric identifiers; private right of action." },
    },
  },
  {
    state: "TX", stateName: "Texas", last_reviewed: "2025-06-01",
    categories: {
      brain_behavior: { label: "NO_EXTRA", statute: "", conflict: "", note: "Not clearly addressed beyond HIPAA/general privacy law." },
      consumer_health: { label: "NO_EXTRA", statute: "Tex. Bus. & Com. Code Ch. 541 (TDPSA)", conflict: "", note: "TDPSA applies but aligns with HIPAA for health data." },
      reproductive: { label: "BLOCKED", statute: "SB 8, Tex. Health & Safety Code §171", conflict: "Laws restrict sharing info that could facilitate prohibited procedures; any data flagging reproductive health must not enter BBQS.", note: "SB 8 and related laws restrict sharing of info that could facilitate prohibited procedures." },
      minors: { label: "LIMITED_EXPORT", statute: "TDPSA §541.101(32)", conflict: "Minors' data classified as sensitive; requires consent for processing that BBQS batch pipelines may not obtain.", note: "TDPSA classifies minors' data as sensitive; consent required for processing." },
      biometric_neuro: { label: "LIMITED_EXPORT", statute: "Tex. Bus. & Com. Code §503.001 (CUBI Act)", conflict: "Requires consent before capture of biometric identifiers; BBQS must verify consent chain before ingestion.", note: "Texas CUBI Act requires consent before capture of biometric identifiers." },
    },
  },
  {
    state: "NY", stateName: "New York", last_reviewed: "2025-06-01",
    categories: {
      brain_behavior: { label: "NO_EXTRA", statute: "", conflict: "", note: "Not clearly addressed beyond HIPAA/general privacy law." },
      consumer_health: { label: "LIMITED_EXPORT", statute: "NY Mental Hygiene Law §33.13", conflict: "Strict confidentiality on mental health records beyond HIPAA; BBQS sharing requires redaction of mental health indicators.", note: "NY Mental Hygiene Law §33.13 imposes strict confidentiality on mental health records beyond HIPAA." },
      reproductive: { label: "LIMITED_EXPORT", statute: "NY Public Health Law §18", conflict: "Out-of-state subpoenas for reproductive health info limited; BBQS must ensure no cross-state legal discovery exposure.", note: "Reproductive health information protected under Public Health Law; out-of-state subpoenas limited." },
      minors: { label: "LIMITED_EXPORT", statute: "NY Education Law §2-d", conflict: "Restricts use and disclosure of student PII; BBQS pipelines processing student-derived data need DPA agreements.", note: "Education Law §2-d restricts use and disclosure of student PII." },
      biometric_neuro: { label: "NO_EXTRA", statute: "", conflict: "", note: "No comprehensive biometric privacy law yet (proposed bills pending)." },
    },
  },
  {
    state: "WA", stateName: "Washington", last_reviewed: "2025-06-01",
    categories: {
      brain_behavior: { label: "NO_EXTRA", statute: "", conflict: "", note: "Not clearly addressed beyond HIPAA/general privacy law." },
      consumer_health: { label: "LIMITED_EXPORT", statute: "RCW 19.373 (MHMDA)", conflict: "Requires affirmative consent for collection/sharing of consumer health data broader than HIPAA; BBQS must obtain separate consent.", note: "My Health My Data Act requires consent for collection/sharing of consumer health data, broader than HIPAA." },
      reproductive: { label: "LIMITED_EXPORT", statute: "RCW 19.373.010(8) (MHMDA)", conflict: "Explicitly covers reproductive/sexual health data with geofencing protections; BBQS cannot geo-locate subjects near health facilities.", note: "MHMDA explicitly covers reproductive/sexual health data with geofencing protections." },
      minors: { label: "LIMITED_EXPORT", statute: "RCW 19.373 (MHMDA §3)", conflict: "Heightened consent for minors' health data; BBQS must implement age-gating before data ingestion.", note: "MHMDA applies to minors' health data with heightened consent." },
      biometric_neuro: { label: "LIMITED_EXPORT", statute: "RCW 19.375", conflict: "Requires consent/notice before collection of biometric identifiers; BBQS must verify upstream consent.", note: "WA biometric identifier provision requires consent/notice before collection." },
    },
  },
  {
    state: "CO", stateName: "Colorado", last_reviewed: "2025-06-01",
    categories: {
      brain_behavior: { label: "NO_EXTRA", statute: "", conflict: "", note: "Colorado Privacy Act doesn't single out brain/behavioral research data beyond sensitive data rules." },
      consumer_health: { label: "LIMITED_EXPORT", statute: "CRS §6-1-1303 (CPA)", conflict: "Health data classified as sensitive; opt-in consent required that BBQS batch processing may not satisfy.", note: "CPA classifies health data as sensitive; opt-in consent required." },
      reproductive: { label: "LIMITED_EXPORT", statute: "COAA Act, CRS §25-6-402", conflict: "Limits out-of-state disclosure of reproductive health data; BBQS cross-state sharing needs explicit authorization.", note: "Reproductive health data protected under COAA Act; limits out-of-state disclosure." },
      minors: { label: "LIMITED_EXPORT", statute: "CRS §22-16.5-103 (Student Data Act)", conflict: "Student data transparency requirements conflict with BBQS automated metadata collection.", note: "CPA treats minors' data as sensitive; Student Data Transparency and Security Act adds protections." },
      biometric_neuro: { label: "LIMITED_EXPORT", statute: "CRS §6-1-1303(24) (CPA)", conflict: "Biometric data classified as sensitive PI; opt-in consent required before processing.", note: "CPA classifies biometric data as sensitive PI; opt-in consent required for processing." },
    },
  },
  {
    state: "MA", stateName: "Massachusetts", last_reviewed: "2025-06-01",
    categories: {
      brain_behavior: { label: "NO_EXTRA", statute: "", conflict: "", note: "Not clearly addressed beyond HIPAA/general privacy law." },
      consumer_health: { label: "LIMITED_EXPORT", statute: "201 CMR 17.00", conflict: "Strict data security requirements; BBQS must meet MA-specific encryption and access control standards.", note: "MA Data Privacy Law and AG regulations impose strict data security requirements." },
      reproductive: { label: "LIMITED_EXPORT", statute: "MA Shield Act, MGL c.111 §70F", conflict: "Protects reproductive health data from out-of-state legal process; BBQS must firewall reproductive indicators.", note: "Shield Act protects reproductive health data from out-of-state legal process." },
      minors: { label: "LIMITED_EXPORT", statute: "603 CMR 23.00", conflict: "Student records regulations restrict disclosure; BBQS must exclude student-linked records without DPA.", note: "Student privacy protected under MA Student Records Regulations." },
      biometric_neuro: { label: "NO_EXTRA", statute: "", conflict: "", note: "No comprehensive biometric privacy law (bills proposed but not enacted)." },
    },
  },
];
// US states list for generating default rows
const US_STATES: { abbr: string; name: string }[] = [
  { abbr: "AL", name: "Alabama" }, { abbr: "AK", name: "Alaska" }, { abbr: "AZ", name: "Arizona" },
  { abbr: "AR", name: "Arkansas" }, { abbr: "CA", name: "California" }, { abbr: "CO", name: "Colorado" },
  { abbr: "CT", name: "Connecticut" }, { abbr: "DE", name: "Delaware" }, { abbr: "FL", name: "Florida" },
  { abbr: "GA", name: "Georgia" }, { abbr: "HI", name: "Hawaii" }, { abbr: "ID", name: "Idaho" },
  { abbr: "IL", name: "Illinois" }, { abbr: "IN", name: "Indiana" }, { abbr: "IA", name: "Iowa" },
  { abbr: "KS", name: "Kansas" }, { abbr: "KY", name: "Kentucky" }, { abbr: "LA", name: "Louisiana" },
  { abbr: "ME", name: "Maine" }, { abbr: "MD", name: "Maryland" }, { abbr: "MA", name: "Massachusetts" },
  { abbr: "MI", name: "Michigan" }, { abbr: "MN", name: "Minnesota" }, { abbr: "MS", name: "Mississippi" },
  { abbr: "MO", name: "Missouri" }, { abbr: "MT", name: "Montana" }, { abbr: "NE", name: "Nebraska" },
  { abbr: "NV", name: "Nevada" }, { abbr: "NH", name: "New Hampshire" }, { abbr: "NJ", name: "New Jersey" },
  { abbr: "NM", name: "New Mexico" }, { abbr: "NY", name: "New York" }, { abbr: "NC", name: "North Carolina" },
  { abbr: "ND", name: "North Dakota" }, { abbr: "OH", name: "Ohio" }, { abbr: "OK", name: "Oklahoma" },
  { abbr: "OR", name: "Oregon" }, { abbr: "PA", name: "Pennsylvania" }, { abbr: "RI", name: "Rhode Island" },
  { abbr: "SC", name: "South Carolina" }, { abbr: "SD", name: "South Dakota" }, { abbr: "TN", name: "Tennessee" },
  { abbr: "TX", name: "Texas" }, { abbr: "UT", name: "Utah" }, { abbr: "VT", name: "Vermont" },
  { abbr: "VA", name: "Virginia" }, { abbr: "WA", name: "Washington" }, { abbr: "WV", name: "West Virginia" },
  { abbr: "WI", name: "Wisconsin" }, { abbr: "WY", name: "Wyoming" }, { abbr: "DC", name: "District of Columbia" },
];

// Build full matrix: seeded states + defaults for the rest
export function getFullMatrix(): StateRiskRow[] {
  const seeded = new Set(STATE_RISK_MATRIX.map((r) => r.state));
  const defaults: StateRiskRow[] = US_STATES
    .filter((s) => !seeded.has(s.abbr))
    .map((s) => ({
      state: s.abbr,
      stateName: s.name,
      last_reviewed: "2025-06-01",
      categories: { ...DEFAULT_ROW },
    }));
  return [...STATE_RISK_MATRIX, ...defaults].sort((a, b) => a.state.localeCompare(b.state));
}

export function mostRestrictive(labels: RiskLabel[]): RiskLabel {
  if (labels.includes("BLOCKED")) return "BLOCKED";
  if (labels.includes("FEDERATED_ONLY")) return "FEDERATED_ONLY";
  if (labels.includes("LIMITED_EXPORT")) return "LIMITED_EXPORT";
  return "NO_EXTRA";
}

export function getStateRiskScore(row: StateRiskRow, flags: BBQSFlags): number {
  let max = 0;
  for (const [cat, active] of Object.entries(flags) as [BBQSCategory, boolean][]) {
    if (active) {
      const score = RISK_LABEL_META[row.categories[cat].label].score;
      if (score > max) max = score;
    }
  }
  return max;
}
