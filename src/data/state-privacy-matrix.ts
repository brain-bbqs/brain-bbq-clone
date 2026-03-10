// State Privacy Risk Matrix — types + seed data

export type RiskLabel = "NO_EXTRA" | "LIMITED_EXPORT" | "FEDERATED_ONLY" | "BLOCKED";

export interface CategoryRule {
  label: RiskLabel;
  note: string;
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
  brain_behavior: { label: "NO_EXTRA", note: "Not clearly addressed beyond HIPAA/general privacy law." },
  consumer_health: { label: "NO_EXTRA", note: "Not clearly addressed beyond HIPAA/general privacy law." },
  reproductive: { label: "NO_EXTRA", note: "Not clearly addressed beyond HIPAA/general privacy law." },
  cannabis: { label: "NO_EXTRA", note: "Not clearly addressed beyond HIPAA/general privacy law." },
  minors: { label: "NO_EXTRA", note: "Not clearly addressed beyond HIPAA/general privacy law." },
  biometric_neuro: { label: "NO_EXTRA", note: "Not clearly addressed beyond HIPAA/general privacy law." },
};

// Seed data — states with notable stricter-than-HIPAA rules
export const STATE_RISK_MATRIX: StateRiskRow[] = [
  {
    state: "CA", stateName: "California", last_reviewed: "2025-06-01",
    categories: {
      brain_behavior: { label: "LIMITED_EXPORT", note: "CCPA/CPRA treat inferences derived from biometric/behavioral data as sensitive PI; opt-out and data minimization required. Cal. Civ. Code §1798.140(ae)." },
      consumer_health: { label: "LIMITED_EXPORT", note: "CMIA (Cal. Civ. Code §56 et seq.) imposes stricter consent for medical information disclosure than HIPAA." },
      reproductive: { label: "FEDERATED_ONLY", note: "AB 352 (2024) prohibits disclosure of reproductive/sexual health info to out-of-state entities without explicit consent." },
      cannabis: { label: "LIMITED_EXPORT", note: "Medical cannabis patient data protected under Health & Safety Code §11362.795; disclosure requires court order." },
      minors: { label: "LIMITED_EXPORT", note: "COPPA plus CA Age-Appropriate Design Code (AB 2273) impose data minimization for minors' data." },
      biometric_neuro: { label: "LIMITED_EXPORT", note: "CCPA classifies biometric information and neural data as sensitive PI; SB 1223 (2024) adds neurorights protections." },
    },
  },
  {
    state: "IL", stateName: "Illinois", last_reviewed: "2025-06-01",
    categories: {
      brain_behavior: { label: "NO_EXTRA", note: "Not clearly addressed beyond HIPAA/general privacy law." },
      consumer_health: { label: "NO_EXTRA", note: "Not clearly addressed beyond HIPAA/general privacy law." },
      reproductive: { label: "NO_EXTRA", note: "Reproductive Health Act protects access but doesn't restrict research data sharing beyond HIPAA." },
      cannabis: { label: "LIMITED_EXPORT", note: "Cannabis Regulation and Tax Act §10-35(c) limits disclosure of medical cannabis patient records." },
      minors: { label: "LIMITED_EXPORT", note: "Student Online Personal Protection Act (SOPPA) restricts commercial use of K-12 student data." },
      biometric_neuro: { label: "FEDERATED_ONLY", note: "BIPA (740 ILCS 14) requires informed consent before collection of biometric identifiers; private right of action. Raw biometric data should not leave state." },
    },
  },
  {
    state: "TX", stateName: "Texas", last_reviewed: "2025-06-01",
    categories: {
      brain_behavior: { label: "NO_EXTRA", note: "Not clearly addressed beyond HIPAA/general privacy law." },
      consumer_health: { label: "NO_EXTRA", note: "Texas Data Privacy and Security Act (TDPSA) applies but aligns with HIPAA for health data." },
      reproductive: { label: "BLOCKED", note: "SB 8 and related laws restrict sharing of info that could facilitate prohibited procedures; data flagging reproductive health should not be shared." },
      cannabis: { label: "NO_EXTRA", note: "Medical cannabis program is very limited; no special data rules beyond HIPAA." },
      minors: { label: "LIMITED_EXPORT", note: "TDPSA classifies minors' data as sensitive; consent required for processing." },
      biometric_neuro: { label: "LIMITED_EXPORT", note: "Texas Capture or Use of Biometric Identifier Act (Bus. & Com. Code §503.001) requires consent before capture." },
    },
  },
  {
    state: "NY", stateName: "New York", last_reviewed: "2025-06-01",
    categories: {
      brain_behavior: { label: "NO_EXTRA", note: "Not clearly addressed beyond HIPAA/general privacy law." },
      consumer_health: { label: "LIMITED_EXPORT", note: "NY Mental Hygiene Law §33.13 imposes strict confidentiality on mental health records beyond HIPAA." },
      reproductive: { label: "LIMITED_EXPORT", note: "Reproductive health information protected under Public Health Law; out-of-state subpoenas limited." },
      cannabis: { label: "LIMITED_EXPORT", note: "MRTA §222-b protects cannabis registry data from disclosure." },
      minors: { label: "LIMITED_EXPORT", note: "Education Law §2-d restricts use and disclosure of student PII." },
      biometric_neuro: { label: "NO_EXTRA", note: "No comprehensive biometric privacy law yet (proposed bills pending)." },
    },
  },
  {
    state: "WA", stateName: "Washington", last_reviewed: "2025-06-01",
    categories: {
      brain_behavior: { label: "NO_EXTRA", note: "Not clearly addressed beyond HIPAA/general privacy law." },
      consumer_health: { label: "LIMITED_EXPORT", note: "My Health My Data Act (MHMDA) requires consent for collection/sharing of consumer health data, broader than HIPAA." },
      reproductive: { label: "LIMITED_EXPORT", note: "MHMDA explicitly covers reproductive/sexual health data with geofencing protections." },
      cannabis: { label: "NO_EXTRA", note: "Legal recreational; no special research data restrictions beyond HIPAA." },
      minors: { label: "LIMITED_EXPORT", note: "MHMDA applies to minors' health data with heightened consent." },
      biometric_neuro: { label: "LIMITED_EXPORT", note: "WA biometric identifier provision in RCW 19.375 requires consent/notice before collection." },
    },
  },
  {
    state: "CO", stateName: "Colorado", last_reviewed: "2025-06-01",
    categories: {
      brain_behavior: { label: "NO_EXTRA", note: "Colorado Privacy Act doesn't single out brain/behavioral research data beyond sensitive data rules." },
      consumer_health: { label: "LIMITED_EXPORT", note: "CPA classifies health data as sensitive; opt-in consent required." },
      reproductive: { label: "LIMITED_EXPORT", note: "Reproductive health data is protected under COAA Act; limits out-of-state disclosure." },
      cannabis: { label: "NO_EXTRA", note: "Legal recreational; no special research data restrictions." },
      minors: { label: "LIMITED_EXPORT", note: "CPA treats minors' data as sensitive; Student Data Transparency and Security Act adds protections." },
      biometric_neuro: { label: "LIMITED_EXPORT", note: "CPA classifies biometric data as sensitive PI; opt-in consent required for processing." },
    },
  },
  {
    state: "MA", stateName: "Massachusetts", last_reviewed: "2025-06-01",
    categories: {
      brain_behavior: { label: "NO_EXTRA", note: "Not clearly addressed beyond HIPAA/general privacy law." },
      consumer_health: { label: "LIMITED_EXPORT", note: "MA Data Privacy Law (201 CMR 17.00) and AG regulations impose strict data security requirements." },
      reproductive: { label: "LIMITED_EXPORT", note: "Shield Act protects reproductive health data from out-of-state legal process." },
      cannabis: { label: "LIMITED_EXPORT", note: "Medical cannabis patient data protected under 935 CMR 501.130; registry data confidential." },
      minors: { label: "LIMITED_EXPORT", note: "Student privacy protected under MA Student Records Regulations (603 CMR 23.00)." },
      biometric_neuro: { label: "NO_EXTRA", note: "No comprehensive biometric privacy law (bills proposed but not enacted)." },
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
