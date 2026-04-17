/**
 * BBQS Project Questionnaire Schema
 * Source: BBQS_Data_Questionnaire_fields.csv (the official consortium intake form)
 * 
 * Each field maps to either:
 *  - a top-level column on `projects` (study_species, study_human, keywords, website)
 *  - a key inside `projects.metadata` JSONB
 * 
 * Used by:
 *  - ProjectProfile page (privileged editor)
 *  - propose-project-changes edge function (assistant-proposed diffs)
 */

export type FieldType = "text" | "textarea" | "tags" | "boolean" | "link" | "number" | "select";

export interface QuestionnaireField {
  /** Storage key — top-level column or metadata.* key */
  key: string;
  /** Human-readable label shown in the UI */
  label: string;
  /** Optional longer description / help text from the CSV question text */
  help?: string;
  type: FieldType;
  /** For type="select" — fixed options */
  options?: string[];
  /** For type="tags" — suggested controlled-vocabulary tags */
  suggestions?: string[];
  /** True when this is stored as a top-level projects column, not in metadata JSONB */
  topLevel?: boolean;
  /** Counts toward metadata completeness % */
  countsForCompleteness?: boolean;
}

export interface QuestionnaireSection {
  id: string;
  title: string;
  description?: string;
  fields: QuestionnaireField[];
}

// ============================================================================
// SECTIONS
// ============================================================================

export const QUESTIONNAIRE_SECTIONS: QuestionnaireSection[] = [
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "basic",
    title: "Project Basics",
    description: "Public-facing project information.",
    fields: [
      { key: "website", label: "Project Website", type: "link", topLevel: true, countsForCompleteness: true },
      { key: "keywords", label: "Keywords", type: "tags", topLevel: true, countsForCompleteness: true,
        help: "General keywords describing this project." },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "planning",
    title: "Experiment Planning",
    description: "What aspects do you prioritize when planning experiments?",
    fields: [
      { key: "planning_priorities", label: "Planning Priorities", type: "tags",
        suggestions: ["Hypothesis design", "Statistical power", "Data standards", "Reproducibility",
          "Sample size", "Pre-registration", "Data management plan", "Ethics & IRB"],
        help: "Aspects considered/prioritized in the planning of an experiment (vs. addressing during or after data acquisition)." },
      { key: "planning_priorities_other", label: "Other Planning Priorities", type: "textarea" },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "data_types",
    title: "Data Types Collected",
    description: "Which types of data are you collecting for BBQS?",
    fields: [
      { key: "data_types_collected", label: "Data Types", type: "tags", countsForCompleteness: true,
        suggestions: ["Neural recordings", "Behavioral video", "Eye tracking", "Audio",
          "EMG", "Accelerometry", "Hormonal assays", "Genomics", "Imaging", "Self-report"] },
      { key: "data_types_other", label: "Other Data Types", type: "textarea" },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "neural_recording",
    title: "Neural Recording Technologies",
    fields: [
      { key: "use_sensors", label: "Recording Devices / Sensors", type: "tags", countsForCompleteness: true,
        suggestions: ["Neuropixels", "Two-photon microscope", "Miniscope", "fMRI", "EEG", "MEG",
          "Patch clamp", "Tetrode", "Silicon probes", "Fiber photometry", "Wide-field imaging"],
        help: "Which technologies are you using for recording neural activity?" },
      { key: "neural_recording_details", label: "Additional Recording Details", type: "textarea" },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "behavioral_recording",
    title: "Behavioral Recording Technologies",
    fields: [
      { key: "behavioral_recording_tech", label: "Behavioral Tech", type: "tags",
        suggestions: ["Video cameras", "Eye tracking", "Motion capture", "Touchscreen",
          "Joystick", "Head tracking", "Wearables", "Microphones", "Force sensors"] },
      { key: "behavioral_brands", label: "Hardware/Software Brands", type: "textarea",
        help: "e.g., Tobii, EyeLink, OptiTrack, Bonsai, ANY-maze." },
      { key: "behavioral_recording_details", label: "Additional Behavioral Tech Details", type: "textarea" },
      { key: "hand_coding_method", label: "Hand-Coding Method", type: "textarea",
        help: "Do you have a team member make direct observations of behavior and record it manually? If so, how?" },
      { key: "behaviors_of_interest", label: "Behaviors of Interest", type: "tags",
        suggestions: ["Locomotion", "Foraging", "Social interaction", "Decision-making",
          "Vocalization", "Grooming", "Sleep", "Feeding", "Reaching", "Navigation"] },
      { key: "behaviors_details", label: "Behavior Details", type: "textarea" },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "data_size",
    title: "Data Sizes & Volume",
    description: "How much data are you generating per year?",
    fields: [
      { key: "neural_data_size_per_year", label: "Neural Data per Year", type: "text",
        help: "e.g., 1 GB, 5 GB, 1 TB, 1 PB" },
      { key: "neural_data_size_details", label: "Neural Data Size Details", type: "textarea" },
      { key: "behavioral_data_size_per_year", label: "Behavioral Data per Year", type: "text",
        help: "e.g., 1 MB, 100 GB, 1 TB" },
      { key: "behavioral_data_size_details", label: "Behavioral Data Size Details", type: "textarea" },
      { key: "single_unit_upload_size", label: "Size per Unit of Upload", type: "text",
        help: "e.g., 1 TB / participant; 100 GB / session; 20 TB / cohort" },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "standards",
    title: "Data Standards",
    fields: [
      { key: "brain_initiative_standards", label: "BRAIN Initiative Standards Used", type: "tags",
        suggestions: ["NWB", "BIDS", "OME-Zarr", "PsychDS", "DANDI", "OpenNeuro"] },
      { key: "standards_other", label: "Other Standards", type: "textarea" },
      { key: "standards_conversion_tools", label: "Tools Used to Convert to Standards", type: "tags",
        suggestions: ["NWB GUIDE", "PyNWB", "MatNWB", "neuroconv", "dcm2bids", "BIDS Validator"] },
      { key: "conversion_tools_details", label: "Conversion Tool Details", type: "textarea" },
      { key: "standards_lifecycle_stages", label: "Lifecycle Stages Using Standards", type: "tags",
        suggestions: ["Acquisition", "Preprocessing", "Analysis", "Sharing", "Archival"] },
      { key: "standards_usage_description", label: "How Standards Are Used", type: "textarea" },
      { key: "metadata_gaps", label: "Metadata Gaps Not Covered by Standards", type: "textarea",
        help: "What specific aspects of metadata in your projects are not covered in existing standards?" },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "formats",
    title: "Data Formats",
    fields: [
      { key: "neural_data_formats", label: "Neural Data Formats", type: "tags",
        suggestions: ["NWB", "HDF5", "Zarr", "DICOM", "NIfTI", "EDF", "MEF", "Plexon",
          "Open Ephys", "MAT", "binary", "CSV"] },
      { key: "neural_formats_other", label: "Other Neural Formats", type: "textarea" },
      { key: "behavioral_data_formats", label: "Behavioral Data Formats", type: "tags",
        suggestions: ["MP4", "AVI", "CSV", "JSON", "HDF5", "Parquet", "MAT", "PsychDS"] },
      { key: "behavioral_formats_other", label: "Other Behavioral Formats", type: "textarea" },
      { key: "formats_usage_description", label: "How Formats Are Used", type: "textarea" },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "ontologies",
    title: "Terminologies & Ontologies",
    fields: [
      { key: "ontologies_used", label: "Controlled Vocabularies / Ontologies", type: "tags",
        suggestions: ["UBERON", "CHEBI", "GO", "EFO", "MONDO", "NIFSTD", "OBI", "PATO",
          "Cognitive Atlas", "ATLAS Allen Brain", "NCBI Taxonomy"] },
      { key: "ontologies_other", label: "Other Ontologies", type: "textarea" },
      { key: "ontologies_usage", label: "How Ontologies Are Used", type: "textarea" },
      { key: "ontologies_usage_details", label: "Additional Ontology Usage Details", type: "textarea" },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "storage",
    title: "Storage, Sync & Management",
    fields: [
      { key: "data_management_systems", label: "Data Management Systems", type: "tags",
        suggestions: ["DataJoint", "LabKey", "REDCap", "Custom database", "Datalad", "Git LFS"] },
      { key: "data_management_other", label: "Other DMS Details", type: "textarea" },
      { key: "primary_storage", label: "Primary Storage", type: "select",
        options: ["Local lab server", "University HPC", "AWS S3", "Google Cloud", "Azure",
          "Globus / institutional", "EMBER Archive", "Other"] },
      { key: "primary_storage_details", label: "Primary Storage Details", type: "textarea" },
      { key: "uses_backups", label: "Uses Data Backups", type: "boolean" },
      { key: "data_sync_methods", label: "Data Stream Synchronization Methods", type: "tags",
        suggestions: ["TTL pulses", "Network time protocol", "Hardware clock", "Bonsai",
          "OpenSync", "Manual timestamping"] },
      { key: "data_sync_other", label: "Other Sync Details", type: "textarea" },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "feature_detection",
    title: "Feature Detection",
    fields: [
      { key: "neural_feature_detection", label: "Neural Feature Detection Methods", type: "tags",
        suggestions: ["Spike sorting", "ICA", "PCA", "Wavelet decomposition",
          "Template matching", "Deep learning"] },
      { key: "neural_feature_detection_other", label: "Other Neural Feature Methods", type: "textarea" },
      { key: "behavioral_feature_detection", label: "Behavioral Feature Detection Methods", type: "tags",
        suggestions: ["DeepLabCut", "SLEAP", "MoSeq", "B-SOiD", "Manual annotation",
          "Computer vision", "Pose estimation"] },
      { key: "behavioral_feature_detection_other", label: "Other Behavioral Feature Methods", type: "textarea" },
      { key: "feature_detection_software", label: "Feature Detection Software Packages", type: "tags",
        suggestions: ["Kilosort", "MountainSort", "CaImAn", "Suite2p", "DeepLabCut", "SLEAP", "MoSeq"] },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "analysis",
    title: "Analysis Methods & Software",
    fields: [
      { key: "analysis_languages", label: "Programming Languages / Tools", type: "tags",
        suggestions: ["Python", "MATLAB", "R", "Julia", "C++", "Jupyter", "RStudio"] },
      { key: "analysis_languages_other", label: "Other Languages", type: "textarea" },
      { key: "use_analysis_method", label: "Statistical / Computational Methods", type: "tags",
        countsForCompleteness: true,
        suggestions: ["GLM", "Mixed effects", "Bayesian inference", "Dimensionality reduction",
          "Clustering", "Deep learning", "Reinforcement learning", "Granger causality",
          "Information theory", "Time-series analysis"] },
      { key: "analysis_methods_other", label: "Other Methods", type: "textarea" },
      { key: "use_analysis_types", label: "Types of Analyses Performed", type: "tags",
        countsForCompleteness: true,
        suggestions: ["Decoding", "Encoding", "Connectivity", "Behavior classification",
          "State-space modeling", "Latent dynamics", "Spike-triggered averaging"] },
      { key: "analysis_types_other", label: "Other Analysis Types", type: "textarea" },
      { key: "analysis_software", label: "Analysis Software / Packages", type: "tags",
        suggestions: ["scikit-learn", "PyTorch", "TensorFlow", "JAX", "statsmodels",
          "scipy", "numpy", "Brainstorm", "FieldTrip", "FSL", "AFNI", "SPM"] },
      { key: "analysis_software_other", label: "Other Analysis Software", type: "textarea" },
      { key: "analysis_platforms", label: "Platforms / Environments", type: "tags",
        suggestions: ["Local workstation", "University HPC", "AWS", "Google Cloud",
          "Colab", "Brainlife.io", "DANDI Hub", "JupyterHub"] },
      { key: "analysis_platforms_other", label: "Other Platforms", type: "textarea" },
      { key: "reliability_methods", label: "Reliability / Reproducibility Approaches", type: "tags",
        suggestions: ["Cross-validation", "Bootstrap", "Pre-registration", "Open code",
          "Open data", "Containerization", "Workflow managers (Snakemake, Nextflow)",
          "Unit testing"] },
      { key: "reliability_methods_other", label: "Other Reliability Methods", type: "textarea" },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "sharing",
    title: "Data Sharing & EMBER Archive",
    fields: [
      { key: "data_archives", label: "Neuroscience Data Archives Used", type: "tags",
        suggestions: ["DANDI", "OpenNeuro", "EMBER", "BossDB", "NeMO", "Allen Brain Atlas",
          "OSF", "Zenodo", "Figshare"] },
      { key: "data_archives_other", label: "Other Archives", type: "textarea" },
      { key: "other_sharing_methods", label: "Other Sharing / Publishing Methods", type: "tags",
        suggestions: ["GitHub", "Lab website", "Supplementary materials", "Direct request",
          "Preprints with data", "Public S3 bucket"] },
      { key: "other_sharing_details", label: "Sharing Details", type: "textarea" },
      { key: "ember_earliest_date", label: "Earliest EMBER Archive Use Date", type: "text",
        help: "When is the earliest date you desire to utilize EMBER Archive storage?" },
      { key: "ember_data_nature", label: "EMBER Data Nature", type: "textarea",
        help: "Briefly describe the nature of data for which you anticipate utilizing EMBER beyond NIH's data sharing requirements." },
      { key: "release_terms", label: "Release & Sharing Terms", type: "select",
        options: ["Public immediately", "Embargo until publication", "Restricted access",
          "Tiered access", "Not yet decided"] },
      { key: "all_data_public_immediately", label: "All Non-Sensitive Data Public Immediately?", type: "boolean" },
      { key: "restricted_access_scope", label: "Restricted Access Scope & Duration", type: "textarea",
        help: "If not all data can be public, detail the scope and duration of restricted access." },
      { key: "persistent_identifiers", label: "Persistent Identifiers Used", type: "tags",
        suggestions: ["DOI", "ORCID", "RRID", "ARK", "Handle", "ROR"] },
      { key: "persistent_identifiers_usage", label: "How PIDs Are Used", type: "textarea" },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "reuse",
    title: "Data Reuse",
    fields: [
      { key: "reuse_data_origins", label: "Origins of Reused Data", type: "tags",
        suggestions: ["Own previous data", "Collaborator data", "Public archive",
          "Published supplementary data", "Industry data"] },
      { key: "reuse_data_origins_details", label: "Reuse Origin Details", type: "textarea" },
      { key: "reuse_purposes", label: "Purposes of Data Reuse", type: "tags",
        suggestions: ["Validation", "Meta-analysis", "Method benchmarking",
          "Cross-species comparison", "Training ML models", "Replication"] },
      { key: "reuse_purposes_details", label: "Reuse Purpose Details", type: "textarea" },
      { key: "reuse_sources", label: "Reuse Source Archives", type: "tags",
        suggestions: ["DANDI", "OpenNeuro", "Allen Brain Atlas", "NeMO", "OSF",
          "PhysioNet", "UK Biobank", "HCP"] },
      { key: "reuse_sources_other", label: "Other Reuse Sources", type: "textarea" },
      { key: "reuse_challenges", label: "Reuse Challenges", type: "textarea",
        help: "Findability, accessibility, interpretability, quality, completeness — what's hard?" },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "needs",
    title: "Project Needs & Resources",
    fields: [
      { key: "help_needed", label: "Areas Where Help Is Needed", type: "textarea" },
      { key: "resources_to_share", label: "Resources Project Plans to Share", type: "textarea",
        help: "Beyond data — software, instruments, materials, etc." },
      { key: "additional_info", label: "Additional Information", type: "textarea",
        help: "Anything else that would help us understand and serve your project's needs." },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "subjects",
    title: "Study Subjects",
    description: "Species and human subjects information.",
    fields: [
      { key: "study_species", label: "Species Studied", type: "tags", topLevel: true, countsForCompleteness: true,
        help: "Scientific names (e.g., Mus musculus, Danio rerio).",
        suggestions: ["Mus musculus", "Rattus norvegicus", "Danio rerio", "Drosophila melanogaster",
          "Macaca mulatta", "Homo sapiens", "C. elegans", "Octopus", "Songbird"] },
      { key: "study_human", label: "Studies Human Subjects", type: "boolean", topLevel: true },
    ],
  },
];

/**
 * Set of field keys that map to top-level columns on the projects table.
 * Everything else lives in projects.metadata JSONB.
 */
export const TOP_LEVEL_FIELDS = new Set(
  QUESTIONNAIRE_SECTIONS.flatMap((s) => s.fields.filter((f) => f.topLevel).map((f) => f.key))
);

/**
 * Set of field keys that count toward the metadata completeness percentage.
 */
export const COMPLETENESS_FIELDS = QUESTIONNAIRE_SECTIONS
  .flatMap((s) => s.fields.filter((f) => f.countsForCompleteness).map((f) => f.key));

/** Find a field definition by its storage key */
export function findFieldByKey(key: string): QuestionnaireField | undefined {
  for (const section of QUESTIONNAIRE_SECTIONS) {
    const f = section.fields.find((f) => f.key === key);
    if (f) return f;
  }
  return undefined;
}

/** All field keys, for assistant tool-call validation */
export const ALL_FIELD_KEYS = QUESTIONNAIRE_SECTIONS.flatMap((s) => s.fields.map((f) => f.key));
