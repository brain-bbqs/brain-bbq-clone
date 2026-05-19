export type QuizCategory =
  | "Repository & Access"
  | "Consent & Oversight"
  | "Privacy & Controls";

export interface QuizQuestion {
  id: string;
  category: QuizCategory;
  shortLabel: string;
  prompt: string;
  yesMeans: string;
  noMeans: string;
}

export const DATA_POLICY_QUIZ: QuizQuestion[] = [
  {
    id: "q1_single_hipaa_default",
    category: "Repository & Access",
    shortLabel: "Single HIPAA-grade default vs split repositories",
    prompt:
      "Should all human data, even if de-identified, default into a HIPAA-grade controlled system like EMBERvault rather than being split between EMBER-DANDI (de-identified) and EMBERvault (identifiable)?",
    yesMeans: "Cautious: one controlled tier for all human data.",
    noMeans: "Tiered: split de-identified vs identifiable across repositories.",
  },
  {
    id: "q2_open_by_default",
    category: "Repository & Access",
    shortLabel: "Open by default vs cautious by default",
    prompt:
      "Should de-identified human datasets that meet HIPAA / Expert Determination standards be publicly downloadable without login, instead of requiring at least registered-user access?",
    yesMeans: "Open: public download for qualifying de-identified data.",
    noMeans: "Cautious: require registration even for de-identified data.",
  },
  {
    id: "q3_consortium_priority",
    category: "Repository & Access",
    shortLabel: "Consortium priority vs immediate public release",
    prompt:
      "Should BBQS consortia members have early access to datasets before they are released to the wider research community?",
    yesMeans: "Consortium-first window before public release.",
    noMeans: "Equal access for everyone from day one.",
  },
  {
    id: "q4_embargo_beyond_first_paper",
    category: "Repository & Access",
    shortLabel: "Embargoes vs immediate sharing on publication",
    prompt:
      "Should data contributors be allowed to keep datasets embargoed beyond first-paper acceptance if they want more time to publish follow-up analyses?",
    yesMeans: "Allow extended embargoes for follow-up work.",
    noMeans: "Release on first-paper acceptance, no extensions.",
  },
  {
    id: "q5_broad_consent_expected",
    category: "Consent & Oversight",
    shortLabel: "Broad consent expectation",
    prompt:
      "Should BBQS expect future human studies to use broad consent language that explicitly enables secondary data sharing, even if that makes some IRBs or investigators less comfortable?",
    yesMeans: "Expect broad consent across the consortium.",
    noMeans: "Leave consent scope fully to local IRBs.",
  },
  {
    id: "q6_institutional_attestation",
    category: "Consent & Oversight",
    shortLabel: "Institutional attestation vs centralized re-review",
    prompt:
      "Should BBQS rely mainly on institutional signing officials' attestations (IRB-approved protocol, DMSP, etc.) rather than adding its own independent ethics review layer for every dataset?",
    yesMeans: "Trust institutional attestations as primary control.",
    noMeans: "Add a BBQS-level ethics review on top.",
  },
  {
    id: "q7_legacy_alignment_required",
    category: "Consent & Oversight",
    shortLabel: "Legacy data alignment burden",
    prompt:
      "Should investigators with legacy datasets be required (not just encouraged) to re-contact participants or seek waivers to align older studies with this data-sharing policy when feasible?",
    yesMeans: "Required: actively align legacy data to the new policy.",
    noMeans: "Optional: encourage but do not mandate.",
  },
  {
    id: "q8_no_reidentification_clause",
    category: "Privacy & Controls",
    shortLabel: "Strict No-Reidentification clause for all human-derived data",
    prompt:
      "Should every human-derived dataset, including heavily aggregated or synthetic derivatives, be covered by a mandatory No-Reidentification clause that legally / contractually forbids any re-identification attempts?",
    yesMeans: "Mandatory No-Reidentification clause everywhere.",
    noMeans: "Apply only to identifiable or higher-risk tiers.",
  },
  {
    id: "q9_secure_workbench_only",
    category: "Privacy & Controls",
    shortLabel: "Secure workbench only vs direct downloads for controlled data",
    prompt:
      "Should users of sensitive human data only be allowed to analyze data inside EMBER secure workspaces, with export limited to reviewed summary outputs (no direct raw-data download)?",
    yesMeans: "Workbench-only with reviewed exports.",
    noMeans: "Allow vetted users to download raw controlled data.",
  },
  {
    id: "q10_active_tier_reassessment",
    category: "Privacy & Controls",
    shortLabel: "Active tier re-assessment over time",
    prompt:
      "Should the DCAIC have authority to move existing datasets to more restrictive tiers later (for example, from public to registered or controlled access) as re-identification risks or social-group harms evolve?",
    yesMeans: "DCAIC can re-tier datasets as risks evolve.",
    noMeans: "Initial tier is fixed once dataset is released.",
  },
];
