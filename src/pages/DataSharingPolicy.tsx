import { useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import type { ColDef } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import "@/styles/ag-grid-theme.css";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DataFlowDiagram } from "@/components/data-policy/DataFlowDiagram";

const versionHistory = [
  { date: "May 22, 2025", step: "Draft proposal V.1", authors: "Laura Y. Cabrera, Jennifer Wagner" },
  { date: "June 9, 2025", step: "Draft proposal V.1 with comments", authors: "" },
  { date: "July 14, 2025", step: "Draft proposal V1.2 with further insights from standards group and EMBER", authors: "" },
  { date: "August 14, 2025", step: "Review and suggestions made by Han and Cody; references to DCAIC as the subject were changed to BBQS (DCAIC/EMBER merely facilitates the sharing of the data by the scientific labs)", authors: "Han Yi, Cody Baker" },
  { date: "September 17, 2025", step: "Draft proposal V2", authors: "Comments from: Han Yi, Melissa Kline-S., Satra Ghosh, Jyl" },
  { date: "Oct 15, 2025", step: "Draft proposal V3", authors: "Laura Y. Cabrera" },
  { date: "Nov 6th, 2025", step: "Draft Proposal V4", authors: "Suliman Sharif" },
  { date: "Dec 14th, 2025", step: "Draft Proposal V5", authors: "Han Yi, Suliman Sharif, Marcia Patchan, Brock A. Wester" },
  { date: "Dec 16th, 2025", step: "Draft Proposal V6", authors: "Laura Y. Cabrera, Suliman Sharif" },
  { date: "Feb 3, 2026", step: "Draft Proposal V7", authors: "Laura Y. Cabrera [feedback from ethics advisory board]" },
  { date: "Feb 11, 2026", step: "Draft Proposal V8", authors: "Suliman Sharif" },
];

const VersionHistoryGrid = () => {
  const defaultColDef = useMemo<ColDef>(() => ({
    sortable: true,
    resizable: true,
    wrapText: true,
    autoHeight: true,
    cellStyle: { lineHeight: "1.5", padding: "8px" },
  }), []);

  const columnDefs = useMemo<ColDef[]>(() => [
    { field: "date", headerName: "Date", width: 160, flex: 0 },
    { field: "step", headerName: "Step", flex: 2, minWidth: 250 },
    {
      field: "authors",
      headerName: "Author(s)",
      flex: 1,
      minWidth: 180,
      valueFormatter: (params) => params.value || "—",
    },
  ], []);

  return (
    <section className="mb-10">
      <h2 className="text-lg font-semibold text-foreground mb-3">Version History</h2>
      <div
        className="ag-theme-alpine rounded-lg border border-border overflow-hidden"
        style={{ height: Math.min(500, versionHistory.length * 52 + 56) }}
      >
        <AgGridReact
          rowData={versionHistory}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          animateRows={true}
          suppressCellFocus={true}
          enableCellTextSelection={true}
          domLayout={versionHistory.length <= 10 ? "autoHeight" : "normal"}
        />
      </div>
    </section>
  );
};

const DataSharingPolicy = () => {
  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-4xl">
      <div className="mb-8">
        <Badge variant="outline" className="mb-3 text-xs">DRAFT — V8</Badge>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Brain Behaviour and Quantification Synchronization Data Sharing Policy
        </h1>
        <p className="text-muted-foreground text-sm">
          Last updated: February 11, 2026
        </p>
      </div>

      {/* Data Flow Visualization */}
      <DataFlowDiagram />

      {/* Version History */}
      <VersionHistoryGrid />

      <Separator className="my-8" />

      {/* Section 1 */}
      <section className="mb-10 space-y-6">
        <h2 className="text-xl font-bold text-foreground">Section 1. Purpose and Scope</h2>

        <div>
          <h3 className="text-lg font-semibold text-foreground mb-2">1.1 Purpose</h3>
          <p className="text-sm text-foreground/90 leading-relaxed">
            The BBQS Data Sharing Policy sets forth expectations for the broad, timely, and responsible sharing of multimodal data generated from BBQS-funded research. Consistent with the NIH Mission and Brain Initiative Goals, this policy promotes open science and collaboration to translate research that improves overall human health<sup>1,2,3</sup>, to the extent such objectives can be achieved in compliance with ethical, legal, and regulatory concerns. This Policy is intended to operate within, and does not override, determinations made by IRBs, institutions, or NIH guidance, all of which supersede any conflicting provisions in this document. For the purposes of this policy, the term 'open' includes both publicly available and registered access data that do not require project-specific authorization; for more specifics, see glossary.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-foreground mb-2">1.2 Scope</h3>
          <p className="text-sm text-foreground/90 leading-relaxed">
            This policy applies broadly to all BBQS-funded activities involving the generation, analysis, use or sharing of research data. Investigators and Institutions participating in BBQS are expected to comply with this policy as a condition of their BBQS-related award documents. Adherence to these requirements supports responsible data stewardship and helps maintain good standing within BBQS and with relevant sponsors. In cases where noncompliance may affect NIH or other sponsor requirements, concerns may be referred to the appropriate program officials and handled in accordance with applicable award terms and federal regulations, including but not limited to 45 CFR 74.62.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-foreground mb-2">1.3 Country and Eligibility Restrictions</h3>
          <p className="text-sm text-foreground/90 leading-relaxed">
            Access to certain datasets, particularly those designated as controlled-access, is subject to all applicable U.S. and international laws, regulations, executive orders, agency policies, and administrative guidance governing the transfer or use of sensitive data, which may include restrictions based on country of affiliation, citizenship, or institutional location (for example, limitations applicable to "countries of concern" as defined in relevant federal rules and policies).
          </p>
          <p className="text-sm text-foreground/90 leading-relaxed mt-3">
            The BBQS will require strong identity verification, which may rely on approved third‑party identity providers consistent with NIH controlled‑access practices before granting access to controlled data. The BBQS Program and EMBER infrastructure have registration, verification, and authorization procedures that will be updated as necessary to reflect these external requirements, and where there is any conflict between this policy and binding governmental directives (such as NIH notices, Department of Justice rules, or executive orders), those external requirements control and may supersede the access provisions in this document.
          </p>
        </div>
      </section>

      <Separator className="my-8" />

      {/* Section 2 */}
      <section className="mb-10 space-y-6">
        <h2 className="text-xl font-bold text-foreground">Section 2. Responsibilities of Investigators for Data Submission</h2>

        <div>
          <h3 className="text-lg font-semibold text-foreground mb-2">2.1 General Data Sharing Policy</h3>
          <p className="text-sm text-foreground/90 leading-relaxed">
            Investigators are encouraged to share their Data Management and Sharing Plan (DMSP) with the Data Coordination and Artificial Intelligence Center (DCAIC) so that planned data handling and sharing practices can be reviewed for consistency with this Policy alignment. The DCAIC may provide feedback or recommendations, including suggested consent language to enable broad data sharing when appropriate, which investigators may choose to incorporate into materials submitted for Institutional Review Board (IRB) review prior to the start of data collection. Templates and example broad consent language are available in the Resources section of this Policy<sup>4</sup>. DMSPs may be used as a convenient reference for how investigators intend to handle and share data within the EMBER repositories and serve as a model for aligning project practices with this Policy.
          </p>
          <p className="text-sm text-foreground/90 leading-relaxed mt-3">
            For research involving human participants or identifiable private information, investigators should work with their IRB or equivalent oversight body to ensure that data collection and sharing comply with legal and ethical requirements, including appropriate informed consent for data sharing and secondary use, and where the institution provides a certification or attestation confirming that data may be shared under specified conditions, investigators should retain this documentation and, when requested, provide it as part of the data submission record. BBQS recognizes that institutions and IRBs may not have standardized attestation forms specific to EMBER. Where additional documentation is needed to confirm that data may be shared under specified conditions, the DCAIC will provide example language or templates that investigators may use in consultation with their IRB or equivalent oversight body. When uploading data or metadata to EMBER-DANDI or EMBERvault, investigators are responsible for ensuring that submissions are consistent with this Policy and applicable institutional approvals, while security controls for EMBER infrastructure and repositories are implemented and maintained by the DCAIC in accordance with appropriate industry and federal standards; the EMBER website will describe any documentation that must be provided at the time of upload and any review steps required before data become publicly accessible or available in controlled-access.
          </p>
          <p className="text-sm text-foreground/90 leading-relaxed mt-3">
            Unless explicitly specified in a given project's Data Management and Sharing Plan, this Policy is intended for human‑generated, human‑ or animal‑subject research data (including associated metadata and documentation) rather than purely synthetic datasets; projects that generate synthetic or simulated data products should clearly label them as such in metadata and, where shared, describe their relationship to underlying research data.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-foreground mb-2">2.2 Legacy Data</h3>
          <p className="text-sm text-foreground/90 leading-relaxed">
            This Policy applies prospectively to data collection and sharing activities initiated after its effective date. For BBQS projects that began data collection prior to the effective date, investigators should make reasonable, good-faith efforts to align ongoing and future data management and sharing practices with this Policy, consistent with existing consent, IRB determinations, and applicable regulations. Where legacy consent language or prior agreements limit data sharing, investigators are encouraged to consult with the DCAIC, their IRB, and relevant program officials to determine appropriate paths forward (for example, restricting use to more protective tiers, seeking IRB-approved recontact or waivers, or documenting justified exceptions).
          </p>
        </div>
      </section>

      <Separator className="my-8" />

      {/* Section 3 */}
      <section className="mb-10 space-y-6">
        <h2 className="text-xl font-bold text-foreground">Section 3: Data Storage and Access</h2>

        <div>
          <h3 className="text-lg font-semibold text-foreground mb-2">3.1 Data Repositories</h3>
          <p className="text-sm text-foreground/90 leading-relaxed">
            The primary basis for determining where BBQS data are stored and how they are governed is whether the data contain protected health information (PHI) or other personally identifiable information (PII), and whether they are subject to the HIPAA Privacy Rule or comparable legal and institutional requirements. Human data that include PHI/PII, or that have not been determined to be de-identified under applicable standards, must be stored in EMBERvault and are governed as identifiable data. Only human data that have been assessed and documented as de-identified under HIPAA or other relevant frameworks, and non-human data that do not contain PII/PHI, may be stored in platforms designated for open or broadly shareable datasets.
          </p>
          <p className="text-sm text-foreground/90 leading-relaxed mt-3">
            In general, investigators are expected to begin preparing data for submission to EMBER repositories early in the project lifecycle and to make good‑faith efforts to submit data in a timely manner relative to data collection and analysis. Recognizing the effort required for curation, standardization, and quality control, specific timelines for submission may vary by project type and will be informed by the requirements in the specific RFA, guidance from the DCAIC and program officials. Given the collaborative nature of BBQS, members of the consortium (consortia users) are expected to make BBQS project data available to other BBQS Consortia members ahead of the timeline for public release (for data in EMBERvault, this requires a request to the DAC which, if granted, will authorize the access request). Data associated with a publication should ordinarily be made available to other authorized users in an EMBER repository no later than the time of acceptance of the first publication that relies substantially on that data, unless more rapid sharing is required by sponsor or journal policies or justified exceptions are approved. Data use may be subject to license terms and access conditions, and users must provide appropriate attribution to EMBER, the DCAIC, and the contributing project in accordance with those terms.
          </p>
          <p className="text-sm text-foreground/90 leading-relaxed mt-3">
            Access by secondary users will follow the applicable access tiers and data use conditions, and all users must provide appropriate attribution to EMBER, the DCAIC, and the contributing project in accordance with the selected license and citation guidance.<sup>5</sup>
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-foreground mb-2">3.2 Data Submission and Sharing</h3>

          <h4 className="text-base font-medium text-foreground mt-4 mb-2">3.2.1 Non-Human Data Sharing</h4>
          <p className="text-sm text-foreground/90 leading-relaxed">
            All non-human multimodal data, including brain function, brain physiology, peripheral nervous system, and associated data, should be shared by depositing them in EMBER-DANDI, consistent with applicable consortium and repository standards. Investigators are encouraged to share both raw data whenever feasible, with sufficient documentation of data provenance and processing to enable others to understand and reuse the data; more detailed expectations for what constitutes "raw" versus "processed" and which stages should be shared will be developed through EMBER/BBQS standards and communicated in separate guidance and templates for Data Management and Sharing Plans (DMSPs). The timing and scope of public data release, including any embargo periods, should be described in each project's DMSP and will be informed by journal and sponsor requirements as well as consortium guidance, rather than fixed deadlines in this Policy.
          </p>

          <h4 className="text-base font-medium text-foreground mt-4 mb-2">3.2.2 Human Data Sharing</h4>
          <p className="text-sm text-foreground/90 leading-relaxed">
            Respect for, and protection of the interests of, research participants are fundamental to BBQS stewardship of human data. The informed consent under which the data were collected is the basis for the submitting institution to determine the appropriateness of data submission to EMBER repositories.
          </p>
          <p className="text-sm text-foreground/90 leading-relaxed mt-3">
            Investigators should submit data and metadata to either EMBER-DANDI or EMBERvault HIPAA-compliant repository, as appropriate. Investigators should also submit any information necessary to interpret the submitted data, such as study protocols, data instruments, and survey tools.
          </p>
          <p className="text-sm text-foreground/90 leading-relaxed mt-3">
            Many projects with human data will generate both identifiable data and non-identifiable data or metadata; in such cases, identifiable data will be stored in EMBERvault and non-identifiable data may be stored in EMBER-DANDI, with access to each governed by the policies and controls of the respective repository to ensure compliance with privacy, consent, and security requirements. The BBQS Program and DCAIC aim to enable tools and services that make it easier to discover and conceptually link related datasets across repositories, but these capabilities will evolve over time and are not guaranteed for all projects or data types.
          </p>
          <p className="text-sm text-foreground/90 leading-relaxed mt-3">
            Before submitting human data to EMBER-DANDI, investigators should ensure that the dataset, in its submitted form, does not contain PHI or other PII under applicable laws and institutional policies, and that sharing is consistent with informed consent, IRB determinations, and any other governing requirements (for example, HIPAA and the Common Rule).
          </p>
          <p className="text-sm text-foreground/90 leading-relaxed mt-3">
            Human datasets that currently include PHI/PII, or that have not been assessed as lacking PHI/PII, must instead be deposited in EMBERvault. Investigators may create and submit de-identified derivatives to EMBER-DANDI once identifiers have been removed or transformed using accepted methods such as HIPAA Safe Harbor or Expert Determination.
          </p>
          <p className="text-sm text-foreground/90 leading-relaxed mt-3">
            Decisions about whether a given human dataset that is claimed to be "de-identified but not publicly shareable" may be hosted in EMBER-DANDI, or whether special handling is required (for example, for identifiable but non‑HIPAA‑covered data such as healthy-volunteer videos), will be made by DCAIC in consultation with the PI and, where appropriate, the IRB or other oversight entities, taking into account consent, risk, and NIH program guidance. In the event of unresolved disagreement regarding repository placement or access tiering for a human dataset, the dataset will default to the more protective repository/tier pending final determination by NIH program officials.
          </p>
          <p className="text-sm text-foreground/90 leading-relaxed mt-3">
            Before submitting data to EMBERvault, investigators must confirm they have selected the appropriate repository. EMBERvault is intended exclusively for human datasets that are subject to the HIPAA Privacy Rule or comparable.
          </p>

          <h4 className="text-base font-medium text-foreground mt-4 mb-2">3.2.2 Data Protection and Access</h4>
          <p className="text-sm text-foreground/90 leading-relaxed">
            protections (for example, because they contain PHI or other direct or indirect identifiers), or for human data with a heightened risk of re-identification or particular sensitivity under applicable laws and institutional policies. Data that does not contain PHI/PII should not be submitted to EMBERvault. Within EMBER‑DANDI, non‑identifiable human and non‑human datasets may be made available either as public‑access data, which can be viewed and downloaded without registration, or as registered‑access data, which require users to create an account, agree to basic terms of use, and log in before accessing datasets. The choice between public and registered access will be based on factors such as residual re‑identification risk, sensitivity of the population or behaviors studied, and applicable consent and institutional requirements; DCAIC will provide guidance and, where necessary, consult with the submitting PI and IRB in determining the appropriate access tier for a given dataset.
          </p>

          <h4 className="text-base font-medium text-foreground mt-4 mb-2">3.2.2.1 Certificate of Confidentiality</h4>
          <p className="text-sm text-foreground/90 leading-relaxed">
            Obtaining a Certificate of Confidentiality (CoC) from NIH may be appropriate for certain EMBERvault submissions that include identifiable, sensitive human data, as an additional protection against compelled disclosure beyond standard regulatory safeguards. When a CoC is in place, the covered institution and investigators are responsible for complying with CoC requirements, including informing participants about the CoC, limiting disclosures as required by subsection 301(d) of the Public Health Service Act, and ensuring that any downstream recipients of identifiable, sensitive information understand that they are also subject to those CoC obligations. CoC status should be recorded in dataset metadata, and the EMBER access workflow should include a click-through acknowledgment in the Data Use Certification or access agreement in which secondary users affirm that they understand the applicable CoC-related restrictions and that subsection 301(d) obligations extend to them.
          </p>
          <p className="text-sm text-foreground/90 leading-relaxed mt-3">
            If the original data were collected under NIH funding and thus covered by a Certificate of Confidentiality, that protection follows the data when they are shared, and secondary recipients are required to uphold the same CoC obligations.
          </p>

          <h4 className="text-base font-medium text-foreground mt-4 mb-2">3.2.2.2 Group‑ and Community‑Level Risks</h4>
          <p className="text-sm text-foreground/90 leading-relaxed">
            Even when data are appropriately de‑identified and all individual privacy and consent requirements are met, sharing brain and behavioral data can still create risks at the level of groups or communities (for example, by reinforcing stigma or misleading generalizations about particular diagnostic categories or demographic groups).
          </p>
          <p className="text-sm text-foreground/90 leading-relaxed mt-3">
            BBQS therefore encourages investigators, institutions, and data users to consider potential group‑level and societal impacts when designing studies, formulating data‑use limitations, and interpreting or disseminating results, and to consult emerging neuroethics guidance and related resources on responsible reuse of brain and behavioral data.
          </p>
          <p className="text-sm text-foreground/90 leading-relaxed mt-3">
            Emerging technologies, including large‑scale machine learning and generative Artificial Intelligence systems, may enable unanticipated inferences or uses of shared brain and behavioral data, particularly when public datasets are combined with other sources. Even when individual re‑identification does not occur, the ingestion of openly available behavioral, audio, or video data into such systems may contribute to downstream applications or narratives that affect individuals or groups in ways that were not anticipated at the time of data collection. BBQS therefore encourages investigators and data users to consider these evolving technological risks when choosing access tiers, formulating Data Use Limitations, and designing secondary analyses.
          </p>

          <h4 className="text-base font-medium text-foreground mt-4 mb-2">3.2.2.3 Ongoing Risk Assessment and Tier Adjustment</h4>
          <p className="text-sm text-foreground/90 leading-relaxed">
            Access tiers and repository placements are based on contemporary assessments of identifiability, sensitivity, and applicable consent and policy constraints, but these factors may change over time as additional data are generated, linked, or combined with other resources, and as analytic technologies evolve. DCAIC may periodically review dataset‑level risk (including potential group‑ and community‑level risks) and, in consultation with the submitting investigators, institutions, and, where appropriate, NIH program officials, may recommend adjustments to repository placement, access tier, or data‑use conditions when warranted. When such changes materially affect access (for example, moving a dataset from public to registered access, or adding new data‑use limitations), EMBER will provide advance notice and a brief justification to registered users and will update associated documentation and metadata to reflect the new conditions.
          </p>

          <h4 className="text-base font-medium text-foreground mt-4 mb-2">3.2.3 Animal Data Sharing</h4>
          <p className="text-sm text-foreground/90 leading-relaxed">
            Nonhuman datasets, including video or other media involving research animals, are generally expected to be shared in EMBER-DANDI; however, investigators may request more restrictive access or an exception from sharing when there is a reasonable concern that public release could materially increase risks such as targeted harassment of research personnel, facilities, or animal subjects, or substantial misrepresentation of the research in ways that could lead to real-world harms. Requests for such restrictions or exceptions must be submitted to the DCAIC.
          </p>
          <p className="text-sm text-foreground/90 leading-relaxed mt-3">
            Although animal datasets are generally expected to be shared in EMBER‑DANDI, investigators should be aware that some animal recordings may incidentally capture humans. In such cases, submitting investigators are responsible for exercising due diligence to ensure that any incidentally captured human individuals are not personally identifiable in the shared version of the dataset (consistent with the No Reidentification (NR) clause), for example by cropping, blurring, or otherwise transforming the material to remove or obscure direct identifiers. Where such transformations are not feasible or would substantially compromise the scientific value of the dataset, the human‑containing portions should be treated as partially releasable data under this Policy and managed using the procedures described in Section 4.2 (for example, by restricting access, segmenting the dataset, or applying additional data‑use limitations).
          </p>

          <h4 className="text-base font-medium text-foreground mt-4 mb-2">3.2.4 Distribution of Data</h4>
          <p className="text-sm text-foreground/90 leading-relaxed">
            Data in EMBER‑DANDI may be made available either as public‑access datasets, which can be viewed and downloaded without creating an account, or as registered‑access datasets, which require users to register, log in, and agree to basic terms of use. Public‑access datasets are limited to materials that have been assessed as de‑identified under applicable standards and judged to pose very low residual risk under the consent, IRB, and policy framework for the originating study; datasets with higher residual risk or additional conditions may instead be placed in the registered‑access tier, which requires account creation but does not involve project‑specific DAC review.
          </p>
          <p className="text-sm text-foreground/90 leading-relaxed mt-3">
            Data in EMBERvault have restricted access and are available for secondary research only after a registered user has obtained authorization through the EMBER access process: prospective users must complete a standardized BBQS registration workflow (including identity verification, required training, and acceptance of a common data use agreement) and then obtain project‑specific approval through review by the DCAIC Data Access Committee in consultation with the submitting principal investigator and, where applicable, the submitting institution, to ensure that any proposed use is consistent with the project's attestation documentation, consent, and other governing requirements.
          </p>

          <h4 className="text-base font-medium text-foreground mt-4 mb-2">3.2.5 Informed Consent</h4>
          <p className="text-sm text-foreground/90 leading-relaxed">
            When determining how to share human research data, PIs and submitting institutions should align their data-sharing decisions with the informed consent under which the data were collected, the relevant DMSP, and any applicable institutional or sponsor guidance. These materials provide the basis for determining the appropriate level of data.
          </p>

          <h4 className="text-base font-medium text-foreground mt-4 mb-2">3.2.6 Attestation Documentation</h4>
          <p className="text-sm text-foreground/90 leading-relaxed">
            BBQS, through DCAIC, will provide standardized documentation and templates for Attestation Documentation. Attestation documentation is intended to streamline, not duplicate, existing compliance obligations by leveraging materials that have already been reviewed and approved by NIH, institutional IRBs, and other oversight bodies. Rather than creating a new, independent review layer, the Attestation formalizes the responsible Institutional Signing Official's<sup>1</sup> confirmation that the submission and sharing plans are consistent with these prior determinations and protections. Specifically, the signing official attests that the submission and sharing plans are consistent with:
          </p>
          <ul className="list-disc list-inside text-sm text-foreground/90 leading-relaxed mt-2 space-y-1 ml-4">
            <li>the IRB‑approved protocol and informed consent;</li>
            <li>any Certificates of Confidentiality or Institutional Certifications applicable to the project; and</li>
            <li>the NIH‑approved Data Management and Sharing Plan (DMSP), including any documented data‑use limitations.</li>
          </ul>

          <h4 className="text-base font-medium text-foreground mt-4 mb-2">3.2.7 Data Withdrawal</h4>
          <p className="text-sm text-foreground/90 leading-relaxed">
            Submitting investigators and their institutions may request removal of data on individual participants from EMBER in the event that a research participant withdraws or changes his or her consent. However, it must be acknowledged that any data that have already been distributed for registered or authorized researchers for secondary use cannot be retrieved or withdrawn.
          </p>
        </div>
      </section>

      <Separator className="my-8" />

      {/* Section 4 */}
      <section className="mb-10 space-y-6">
        <h2 className="text-xl font-bold text-foreground">Section 4. Responsibilities for Investigators Accessing and Using BBQS Data</h2>

        <div>
          <h3 className="text-lg font-semibold text-foreground mb-2">4.1 Data Requests</h3>
          <p className="text-sm text-foreground/90 leading-relaxed">
            Access to human data in EMBERvault is managed through controlled‑access mechanisms, with the DCAIC Data Access Committee (DAC) serving as an advisory and facilitative body that screens and routes access requests rather than acting as an independent regulator. Requests for controlled‑access data are reviewed by the DAC primarily to confirm that the proposed research is consistent with the data use limitations established by the submitting institution through the Attestation document and related governance materials, and to coordinate communication between requesters and data‑submitting investigators when clarification or collaboration is appropriate.
          </p>
          <p className="text-sm text-foreground/90 leading-relaxed mt-3">
            Request for access human data in EMBERvault need to be submitted to the DCAIC DAC rather than directly to individual data‑submitting investigators; DCAIC will notify the PIs when access requests are received and, where appropriate, facilitate communication between requesters and data‑submitting teams for clarification or potential collaboration. DAC decisions are based primarily upon conformance of the proposed research as described in the access request to the data use limitations established by the submitting institution through the Attestation document. DCAIC will accept requests for proposed research uses beginning one month prior to the anticipated data release date. The access period for all controlled-access data is 3 years; at the end of each approved period, data users are able to request extensions based on justified research needs.
          </p>
          <p className="text-sm text-foreground/90 leading-relaxed mt-3">
            Access to human data in EMBER‑DANDI is managed through tiered mechanisms within a fully de‑identified environment: only datasets that have been assessed and documented as lacking PHI/PII under applicable standards may be hosted in EMBER‑DANDI, but they may nonetheless differ in residual re‑identification risk, population sensitivity, or consent‑imposed data‑use limitations. Within this de‑identified space, some datasets are released as open public‑access resources, while others are made available only to registered users or are temporarily embargoed until key publications are complete; in all cases, these tiers are determined based on consent, institutional policies, and risk assessments rather than the presence of direct identifiers.
          </p>
          <p className="text-sm text-foreground/90 leading-relaxed mt-3">
            Requests for access to registered‑tier or embargoed datasets are evaluated primarily to ensure that the proposed use is consistent with the data‑use limitations specified by the contributing institution and any applicable consent or policy constraints, and to facilitate communication between requesters and data‑submitting investigators when clarification, collaboration, or coordinated release is appropriate.
          </p>
          <p className="text-sm text-foreground/90 leading-relaxed mt-3">
            If the original data were collected under NIH funding and thus covered by a Certificate of Confidentiality, that protection follows the data when they are shared, and secondary recipients are required to uphold the same CoC obligations.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-foreground mb-2">4.2 Partially Releasable Data</h3>
          <p className="text-sm text-foreground/90 leading-relaxed">
            Partially releasable datasets, such as those containing de‑identified data or subsets of the full dataset, may require segmentation or selective release based on participant consent and privacy considerations; in these cases, data owners submit a draft dataset and associated metadata to the DAC, which reviews the proposed release for consistency with documented data use limitations and issues an approval, conditional approval (for example, requiring further de‑identification or partial release), or rejection, after which approved datasets are released under the appropriate access conditions once any required modifications are addressed.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-foreground mb-2">4.3 Terms and Conditions for Research Use of Controlled-Access Data</h3>
          <p className="text-sm text-foreground/90 leading-relaxed">
            BBQS, through DCAIC, will make a standardized Data User Code of Conduct and Data Use Certification available for all individuals who access EMBER resources as registered or authorized users, for EMBERvault, and expects investigators and their institutions to ensure that approved users complete any required training before accessing controlled data. For sensitive human data, direct download records will not be permitted; instead, approved users will analyze data within EMBER‑provided secure workspaces or "sandboxes" and may export only approved summary results, derived features, or other non‑disclosive outputs.
          </p>
          <p className="text-sm text-foreground/90 leading-relaxed mt-3">
            DCAIC expects that investigators who are approved to use controlled‑access data will follow applicable NIH and institutional requirements, including security best practices and the terms of the Data Use Certification; serious or repeated violations of these terms may be referred to NIH and the relevant institutions, which may take actions such as suspending data access, requiring remediation, or imposing other measures consistent with federal policy and local governance processes.
          </p>
          <p className="text-sm text-foreground/90 leading-relaxed mt-3">
            All outputs requested for export from EMBER‑vault secure workspaces will undergo a disclosure review by DCAIC or a designated disclosure review panel to confirm that they do not contain direct identifiers and that the residual risk of re‑identification is very small before release.
          </p>
          <p className="text-sm text-foreground/90 leading-relaxed mt-3">
            As part of the Data Use Certification and Code of Conduct, users agree not to employ BBQS data in ways that intentionally target, stigmatize, or otherwise harm identifiable groups or communities, and to consider whether proposed analyses or public communications could reasonably create group‑level harms even in the absence of individual re‑identification.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-foreground mb-2">4.4 Terms and Conditions for Use of Unrestricted-Access Data</h3>
          <p className="text-sm text-foreground/90 leading-relaxed">
            Investigators who download unrestricted‑access data from EMBER‑DANDI should not attempt to identify individual human research participants from whom the data were obtained and should acknowledge, in all oral or written presentations, disclosures, or publications, the specific dataset or applicable accession number and EMBER‑DANDI as the data source. Accessing or using unrestricted-access human-derived data from EMBER-DANDI is conditioned on compliance with the No Reidentification (NR) clause and any associated terms-of-use/notice presented at download or in dataset metadata.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-foreground mb-2">4.5 Policy Violations</h3>
          <p className="text-sm text-foreground/90 leading-relaxed">
            BBQS, through DCAIC, will focus on incident detection, containment, and coordination rather than direct sanctioning. Suspected efforts to reidentify human participants—including attempts by users of unrestricted-access data—will be treated as incidents under this workflow, even where the actor is not a known registered/authorized user. In the event of a suspected or confirmed violation of the Data Use Certification or Code of Conduct, DCAIC will receive and document incident reports, take immediate technical steps within EMBER and EMBERvault to contain the issue where feasible (such as temporarily suspending affected accounts or access paths), promptly notify the relevant submitting institutions and NIH with a concise incident description, and then coordinate with those parties on remediation, follow‑up, and any necessary changes to local policies or infrastructure.
          </p>
          <p className="text-sm text-foreground/90 leading-relaxed mt-3">
            NIH will assess the scope and seriousness of the incident and may require specific corrective and preventive actions. Depending on severity and whether problems are remediated, possible actions include requiring technical or policy fixes and retraining as conditions for continued access, suspending or terminating specific Data Access Requests, revoking access to controlled data, and referring serious or unresolved matters to the institution or relevant oversight bodies.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-foreground mb-2">4.6 License Applicability and Distribution</h3>
          <p className="text-sm text-foreground/90 leading-relaxed">
            All human‑derived data—including imaging, electrophysiological recordings, time‑series, behavioral videos, derived measurements, and annotations—must carry the No Reidentification (NR) clause unless explicitly exempted through the DAC, and multimodal datasets must include documentation describing the linkage across data types, with any reuse required to preserve these documented relationships. For public and unrestricted-access distributions, the NR clause will be presented as a standardized license rider or terms-of-use notice (e.g., via the EMBER portal and/or repository dataset-level metadata) so that it travels with the dataset and is visible at the point of access.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-foreground mb-2">4.7 No Reidentification (NR) Clause</h3>
          <p className="text-sm text-foreground/90 leading-relaxed">
            By accessing, downloading, or using this human-derived dataset (including any derivatives, annotations, or linked materials), you agree not to attempt to identify, contact, or otherwise reidentify any individual participant, and not to facilitate reidentification through linkage with other datasets or sources. You must not use the data to infer identity or disclose information that could reasonably enable identification of an individual, including through publication of small-cell results or release of linkable artifacts where identifiability risk is nontrivial. Suspected or confirmed reidentification attempts or related violations must be reported and will be handled under the BBQS incident workflow, which may include containment actions and notification to NIH and relevant institutions, and may result in restriction or revocation of access where applicable.
          </p>
        </div>
      </section>

      <Separator className="my-8" />

      {/* Section 5 */}
      <section className="mb-10 space-y-4">
        <h2 className="text-xl font-bold text-foreground">Section 5: References</h2>
        <ol className="list-decimal list-inside text-sm text-foreground/90 leading-relaxed space-y-2 ml-2">
          <li>Final NIH Statement on Sharing Research Data. February 26, 2003. See <a href="https://grants.nih.gov/grants/guide/notice-files/NOT-OD-03-032.html" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://grants.nih.gov/grants/guide/notice-files/NOT-OD-03-032.html</a>.</li>
          <li>NIH Intramural Policy on Large Database Sharing. April 5, 2002. See <a href="http://sourcebook.od.nih.gov/ethic-conduct/large-db-sharing.htm" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">http://sourcebook.od.nih.gov/ethic-conduct/large-db-sharing.htm</a>.</li>
          <li>NIH Policy on Sharing of Model Organisms for Biomedical Research. May 7, 2004. See <a href="https://grants.nih.gov/grants/guide/notice-files/NOT-OD-04-042.html" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://grants.nih.gov/grants/guide/notice-files/NOT-OD-04-042.html</a>.</li>
          <li>The Common Rule allows sharing of identifiable data under specific considerations (e.g. <a href="https://www.hhs.gov/ohrp/regulations-and-policy/decision-charts-2018/index.html#c6" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://www.hhs.gov/ohrp/regulations-and-policy/decision-charts-2018/index.html#c6</a>).</li>
          <li>A period for data preparation is anticipated prior to data submission to EMBER, and the appropriate time intervals for that data preparation (or data cleaning) will be subject to the particular data type and project plans. Investigators should work with NIH Program and EMBER for specific guidance.</li>
          <li>De-identified refers to removing information that could be used to associate a dataset or record with a human individual.</li>
          <li>Code of Federal Regulations. Protection of Human Subjects. Definitions. See 45 CFR 46.102(f) at <a href="http://www.hhs.gov/ohrp/humansubjects/guidance/45cfr46.html#46.102" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">http://www.hhs.gov/ohrp/humansubjects/guidance/45cfr46.html#46.102</a>.</li>
          <li>The list of HIPAA identifiers that must be removed is available at 45 CFR 164.514(b)(2). See: <a href="http://www.gpo.gov/fdsys/pkg/CFR-2002-title45-vol1/pdf/CFR-2002-title45-vol1-sec164-514.pdf" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">http://www.gpo.gov/fdsys/pkg/CFR-2002-title45-vol1/pdf/CFR-2002-title45-vol1-sec164-514.pdf</a>.</li>
          <li>Federal Policy for the Protection of Human Subjects (Common Rule). 45 CFR Part 46. See <a href="http://www.hhs.gov/ohrp/humansubjects/commonrule/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">http://www.hhs.gov/ohrp/humansubjects/commonrule/</a>.</li>
          <li>For additional information about Certificates of Confidentiality, see <a href="https://grants.nih.gov/grants/policy/co" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://grants.nih.gov/grants/policy/co</a>.</li>
          <li>Confidentiality Certificate. HG-2009-01. Issued to the National Center for Biotechnology Information, National Library of Medicine, NIH.</li>
          <li>Presidential Commission for the Study of Bioethical Issues. Anticipate and Communicate: Ethical Management of Incidental and Secondary Findings in the Clinical, Research, and Direct-to-Consumer Contexts. December 2013. See <a href="http://bioethics.gov/node/3183" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">http://bioethics.gov/node/3183</a>.</li>
          <li>An Institutional Signing Official is generally a senior official at an institution who is credentialed through NIH eRA Commons system and is authorized to enter the institution into a legally binding contract and sign on behalf of an investigator who has submitted data or a data access request to NIH.</li>
          <li>For guidance on clearly communicating inappropriate data uses, see NIH Points to Consider in Drafting Effective Data Use Limitation Statements, <a href="http://gwas.nih.gov/pdf/NIH_PTC_in_Drafting_DUL_Statements.pdf" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">http://gwas.nih.gov/pdf/NIH_PTC_in_Drafting_DUL_Statements.pdf</a>.</li>
          <li>For guidance see, <a href="https://www.researchallofus.org/faq/data-user-code-of-conduct/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://www.researchallofus.org/faq/data-user-code-of-conduct/</a></li>
          <li>For guidance see, <a href="https://nda.nih.gov/ndapublicweb/Documents/NDA+Data+Access+Request+DUC+FINAL.pdf" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://nda.nih.gov/ndapublicweb/Documents/NDA+Data+Access+Request+DUC+FINAL.pdf</a></li>
        </ol>
      </section>

      <Separator className="my-8" />

      {/* Glossary */}
      <section className="mb-10 space-y-4">
        <h2 className="text-xl font-bold text-foreground">Glossary</h2>
        <dl className="text-sm text-foreground/90 leading-relaxed space-y-4">
          <div>
            <dt className="font-semibold text-foreground">"Controlled Access Data"</dt>
            <dd className="ml-4">Data that require a Data Use Certification or institutional approval before access is granted.</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">Data Access Tiers</dt>
            <dd className="ml-4">Data access tiers are distinguished from one another predominantly by access requirements and the type of the included data. Requirements for logging or tracking user activity may apply independently of access level.</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground ml-4">Public Tier</dt>
            <dd className="ml-8">A data tier containing only summary statistics and aggregate information about the BBQS participant cohort. The Public Tier can be accessed by anyone; it does not require Authorized Data User credentials or logging into EMBER registry. However, users may be required to log into the EMBER registry for download or tracking purposes, even though no specific authorization is needed to view the data.</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground ml-4">Registered Tier</dt>
            <dd className="ml-8">A data tier containing a limited set of individual-level participant data–including data from electronic health records, wearables, and surveys, as well as physical measurements taken at the time of participant enrollment–that are subjected to a greater level of privacy-preserving generalization and obfuscation than data in the Controlled Tier. The Registered Tier can only be accessed by Registered Data Users who log in to the EMBER registry.</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground ml-4">Controlled Tier</dt>
            <dd className="ml-8">A data tier containing more granular, minimally obfuscated individual-level participant data. The Controlled Tier includes additional, more sensitive data elements, that build upon those available in the Registered Tier. Controlled Tier access requires Authorized Data Users to log in to and interact with the data through the EMBER Workbench.</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">DCAIC Data Access Committee</dt>
            <dd className="ml-4">A trusted advisory body comprised by selected BBQS members that can facilitate discussions around data sharing.</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">DUL (Data Use Limitation)</dt>
            <dd className="ml-4">Limitations placed on the use of data based on consent, ethics, or legal restrictions.</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">DUA (Data Use Agreement)</dt>
            <dd className="ml-4">A contractual agreement outlining the terms under which data may be accessed or used.</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">EMBER</dt>
            <dd className="ml-4">The official BBQS data registry.</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">EMBER-DANDI</dt>
            <dd className="ml-4">Open access data store for EMBER with embargo function.</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">EMBERvault</dt>
            <dd className="ml-4">HIPAA-compliant storage for storing PII/PHI on EMBER.</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">HIPAA Safe Harbor de-identification method</dt>
            <dd className="ml-4">A HIPAA de-identification method that involves removing 18 specific identifiers from datasets.</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">HIPAA Expert Determination de-identification method</dt>
            <dd className="ml-4">A HIPAA-approved alternative method of de-identification where a person with appropriate knowledge of and experience with generally accepted statistical and scientific principles determines that health information is not individually identifiable health information.</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">Identifiable Private Information (IPI)</dt>
            <dd className="ml-4">Private information for which the identity of the subject is or may readily be ascertained by the investigator or associated with the information (45 CFR § 46.102).</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">Identifiable, Sensitive Information</dt>
            <dd className="ml-4">Information that is about an individual and that is gathered or used during the course of research, and A) through which an individual is identified; or B) for which there is at least a very small risk, as determined by current scientific practices or statistical methods, that some combination of the information, a request for the information, and other available data sources could be used to deduce the identity of an individual (adapted from 42 U.S.C. § 241(d)(4)).</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">Institutional Certification</dt>
            <dd className="ml-4">A formal document provided by a submitting investigator and a signing official at the investigator's institution confirming that multimodal data submitted to EMBER is consistent with this policy, informed consent of the original study participants. It also states whether research use limitation is deemed necessary.</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">No Reidentification (NR) Clause</dt>
            <dd className="ml-4">A policy restriction that prohibits any effort to reidentify individuals from de-identified data.</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">Open Access Data</dt>
            <dd className="ml-4">Data that are publicly accessible without additional approval or agreements, and that adheres to specific standards to ensure maximum accessibility and usability (e.g. machine-readable format, and provided under an open license).</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">Open Sharing</dt>
            <dd className="ml-4">Involves data that can be freely used, reused and redistributed with minimal restrictions.</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">Personal Identifying Information (PII)</dt>
            <dd className="ml-4">Information that can be used to distinguish or trace the identity of an individual (e.g., name, Social Security number, biometric records, etc.), either alone, or when combined with other personal or identifying information that is linked or linkable to a specific individual (2 CFR § 200.1).</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">Public Access Data</dt>
            <dd className="ml-4">Refers to data that is freely available for anyone to access.</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">Protected Health Information (PHI)</dt>
            <dd className="ml-4">Individually identifiable health information that is transmitted by electronic media, maintained in electronic media, or transmitted or maintained in any other form or medium (45 CFR § 160.103).</dd>
          </div>
        </dl>

        <h3 className="text-lg font-semibold text-foreground mt-6 mb-2">User Types</h3>
        <dl className="text-sm text-foreground/90 leading-relaxed space-y-3 ml-2">
          <div>
            <dt className="font-semibold text-foreground">Public User</dt>
            <dd className="ml-4">A user that can access de-identified (meta)data in EMBER-DANDI without registration.</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">Registered User</dt>
            <dd className="ml-4">A user that has created an EMBER account and log in, they can access and use (meta)data in EMBER-DANDI. These users can request access to EMBERvault data after authentication.</dd>
          </div>
          <div>
            <dt className="font-semibold text-foreground">Authorized Users</dt>
            <dd className="ml-4">Registered users that have been granted access to EMBERvault.</dd>
          </div>
        </dl>
      </section>

      <Separator className="my-8" />

      {/* Resources */}
      <section className="mb-10 space-y-4">
        <h2 className="text-xl font-bold text-foreground">Resources</h2>
        <p className="text-sm text-foreground/90 font-medium">Examples of Broad Consent templates:</p>
        <ul className="list-disc list-inside text-sm text-foreground/90 leading-relaxed space-y-1 ml-4">
          <li>Attachment C - August 2, 2017</li>
          <li>Open Brain Consent</li>
          <li>Brainlife EZGov</li>
          <li>Lookit Community IRB and Legal Information</li>
          <li>All of Us Consent Process</li>
          <li>All of Us Consent to Join</li>
        </ul>
      </section>
    </div>
  );
};

export default DataSharingPolicy;
