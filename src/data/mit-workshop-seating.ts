export type Seat = {
  name: string;
  institution?: string;
  role?: string;
  domain?: string;
  grants?: string;
  dietary?: string;
};

export type SeatingTable = {
  number: number;
  theme: string;
  domains: string;
  seats: Seat[]; // length 10 (fill with placeholders)
};

const OPEN = (n = 1): Seat[] =>
  Array.from({ length: n }, () => ({ name: "Open seat" }));

export const SEATING_PLAN: SeatingTable[] = [
  {
    number: 1,
    theme: "Behavioral primitives across species",
    domains: "Cross-species · Modeling",
    seats: [
      { name: "Caleb Kemere", institution: "Rice University", role: "PI (anchor — sheep)" },
      { name: "William Nacci", institution: "Rice University", role: "Postdoc/Grad" },
      { name: "Steve Chang", institution: "Yale University", role: "PI (NHP)" },
      { name: "Sofia Juliani", institution: "Carnegie Mellon University", role: "Postdoc/Grad (Yttri — mouse)" },
      { name: "Jane Wang", institution: "Cornell University", role: "PI/Co-I (Schoppik & Nagel)" },
      { name: "Brendan Ito", institution: "NYU Grossman School of Medicine", role: "Postdoc/Grad (Froemke)" },
      { name: "Niegil Francis Muttath Joseph", institution: "NYU", role: "Research Staff (Froemke)" },
      { name: "Ming Zhan", institution: "NIDA/NIH", role: "NIH Program (Bridge)" },
      { name: "Crystal Lantz", institution: "NIH BRAIN Initiative", role: "NIH Program" },
      { name: "Jyl Boline", institution: "Informed Minds", role: "Project Manager (EMBER)" },
    ],
  },
  {
    number: 2,
    theme: "One pose representation for all?",
    domains: "Pose · Standards",
    seats: [
      { name: "Talmo Pereira", institution: "Salk Institute", role: "PI (anchor — SLEAP)" },
      { name: "Patrick McGrath", institution: "Georgia Tech", role: "PI (cichlid fish)" },
      { name: "Uros Topalovic", institution: "Duke University", role: "Postdoc/Grad (Dunn — 3D pose)" },
      { name: "Mang Gao", institution: "Northwestern University", role: "Postdoc/Grad (Shepherd)" },
      { name: "Álvaro Vega-Hidalgo", institution: "University of Michigan", role: "Postdoc/Grad (wild primates)" },
      { name: "John Welsh", institution: "Seattle Children's / U Washington", role: "PI (pediatric OPM-MEG)" },
      { name: "Agatha Lenartowicz", institution: "UCLA", role: "PI (LiDAR/mmWave)" },
      { name: "Emre Ertin", institution: "Ohio State University", role: "PI (LiDAR/mmWave)" },
      { name: "Farah Nikhath Bader", institution: "NINDS/BRAIN Initiative", role: "NIH Program" },
    ],
  },
  {
    number: 3,
    theme: "From keypoints to constructs",
    domains: "Pose · Modeling",
    seats: [
      { name: "Joy Hirsch", institution: "Yale School of Medicine", role: "PI (anchor — fNIRS)" },
      { name: "J. Adam Noah", institution: "Yale School of Medicine", role: "Co-I/Research Staff (Hirsch)" },
      { name: "Jared Reiling", institution: "Michigan State University", role: "Postdoc/Grad (Zhang & Frohlich)" },
      { name: "Thomas Heeps", institution: "University of Florida", role: "Undergraduate (Padilla-Coreano)" },
      { name: "Sima Mofakham", institution: "Stony Brook University Hospital", role: "PI (SeeMe)" },
      { name: "Chuck Mikell", institution: "Stony Brook", role: "PI (SeeMe)" },
      { name: "Bartul Mimica", institution: "Princeton University", role: "Postdoc/Grad" },
      { name: "Yvonne Bennett", institution: "NIH/NIMH", role: "NIH Program" },
    ],
  },
  {
    number: 4,
    theme: "Foundation models for behavior — accelerant or homogenizer?",
    domains: "Cross-species · Modeling",
    seats: [
      { name: "Nima Dehghani", institution: "MIT", role: "PI (anchor — BARD.CC)" },
      { name: "Rahul Hingorani", institution: "JHU APL", role: "Infra (BARD.CC)" },
      { name: "Han Yi", institution: "JHU APL", role: "Infra (BARD.CC)" },
      { name: "Sankaraleengam Alagapan", institution: "Georgia Tech", role: "Co-I (Rozell — HORMES)" },
      { name: "Parastoo Azizeddin", institution: "University of Southern California", role: "Postdoc/Grad (Shanechi)" },
      { name: "Anirvan Nandy", institution: "Yale University", role: "PI (Chang lab)" },
      { name: "Monika Jadi", institution: "Yale University", role: "PI (Chang lab)" },
      { name: "Karen Kate David", institution: "NIH BRAIN/NINDS", role: "NIH Program" },
      { name: "Suliman Sharif", institution: "MIT", role: "Organizer / Admin" },
    ],
  },
  {
    number: 5,
    theme: "Synchrony from neurons to groups",
    domains: "Cross-species · Modeling",
    seats: [
      { name: "Avniel Ghuman", institution: "University of Pittsburgh", role: "PI (anchor — 24/7 iEEG)" },
      { name: "Arish Alreja", institution: "University of Pittsburgh", role: "Postdoc/Grad" },
      { name: "Cheryl Corcoran", institution: "Icahn School of Medicine / Mt Sinai", role: "PI (dyadic conversation)" },
      { name: "Muhammad Parvaz", institution: "Icahn School of Medicine / Mt Sinai", role: "PI" },
      { name: "Karmiella Ferster", institution: "Icahn School of Medicine / Mt Sinai", role: "Research Staff" },
      { name: "Adam E. Friedman", institution: "Icahn School of Medicine / Mt Sinai", role: "Research Staff" },
      { name: "Weikang Shi", institution: "Yale University", role: "Postdoc/Grad (Chang)" },
      { name: "Taylor Wise", institution: "Yale University", role: "Postdoc/Grad (Chang)" },
      { name: "Lizzy Ankudowich", institution: "NIMH/BRAIN", role: "NIH Program" },
    ],
  },
  {
    number: 6,
    theme: "Acoustics as a first-class modality",
    domains: "Cross-species · Sound + Pose",
    seats: [
      { name: "Darrell De Freitas", institution: "University of Pennsylvania", role: "Infra (EMBER — Schmidt aviary)" },
      { name: "Melissa Kline Struhl", institution: "MIT", role: "Research Staff" },
      { name: "Nader Nikbakht", institution: "MIT", role: "Research Staff" },
      { name: "Nishant Rao", institution: "Yale University", role: "Research Staff" },
      { name: "Emily Mackevicius", institution: "Basis Research Institute", role: "Co-I" },
      { name: "Dmitry Batenkov", institution: "Basis Research Institute", role: "Research Staff" },
      { name: "Oliver Ruebel", institution: "Lawrence Berkeley National Lab", role: "Infra (EMBER)" },
      { name: "Holly Moore", institution: "NIDA", role: "NIH Program" },
    ],
  },
  {
    number: 7,
    theme: "Standardization vs. ecological validity",
    domains: "Cross-species · Standards",
    seats: [
      { name: "Wan Chen Lin", institution: "UC Berkeley", role: "Postdoc/Grad (anchor — Wilbrecht IDP)" },
      { name: "Tim Roberts", institution: "CHOP", role: "PI (Welsh)" },
      { name: "Aditya Bhise", institution: "CHOP", role: "Young Investigator (Welsh)" },
      { name: "Tyler Albarran", institution: "Georgia Tech", role: "Postdoc/Grad (McGrath)" },
      { name: "Tristan Daniel", institution: "Georgia Tech", role: "Postdoc/Grad (McGrath)" },
      { name: "Cristina Savin", institution: "NYU", role: "PI (advisory)" },
      { name: "Martin Schrimpf", institution: "EPFL", role: "Advisory Board" },
      { name: "Saskia de Vries", institution: "Allen Institute", role: "Advisory Board" },
    ],
  },
  {
    number: 8,
    theme: "What is ground truth for social behavior?",
    domains: "Pose · Modeling",
    seats: [
      { name: "Cody Baker", institution: "Dartmouth College", role: "Infra (anchor — BARD.CC)" },
      { name: "Ugne Klibaite", institution: "Harvard University", role: "Research Staff / Postdoc (Srivastava)" },
      { name: "Yankun Xu", institution: "Duke University", role: "Postdoc/Grad (Dunn)" },
      { name: "Jeffrey Walker", institution: "Yale University", role: "Research Staff" },
      { name: "Deepa Purushothaman", institution: "Yale University", role: "Postdoc/Grad" },
      { name: "Yibei Chen", institution: "MIT", role: "Postdoc/Grad" },
      { name: "Yaroslav Halchenko", institution: "Dartmouth / DANDI", role: "Infra (BARD.CC)" },
      { name: "Nicole Tregoning", institution: "Johns Hopkins University", role: "Research Staff (BARD.CC)" },
    ],
  },
  {
    number: 9,
    theme: "Sharing the hard stuff: video, embargo, sensitivity",
    domains: "Data · Ethics",
    seats: [
      { name: "Kristofer Bouchard", institution: "UC Berkeley / LBNL", role: "PI (anchor — EMBER)" },
      { name: "David Kennedy", institution: "UMass Chan Medical School", role: "PI (EMBER)" },
      { name: "Meaghan Perdue", institution: "UMass Chan Medical School", role: "Infra (EMBER)" },
      { name: "Satrajit Ghosh", institution: "MIT", role: "PI (EMBER)" },
      { name: "Yuyi Chang", institution: "Ohio State University", role: "Postdoc/Grad (Lenartowicz/Ertin)" },
      { name: "Yunsoo Kim", institution: "Stony Brook University Hospital", role: "Postdoc/Grad (Mofakham)" },
      { name: "Tek Raj Chhetri", institution: "MIT", role: "Postdoc/Grad" },
      { name: "Laura Cabrera", institution: "Penn State", role: "PI (ELSI)" },
      { name: "Jennifer Wagner", institution: "Penn State", role: "Co-I (ELSI)" },
    ],
  },
  {
    number: 10,
    theme: "Credit, incentives, and the tool-heavy lab",
    domains: "Community · Incentives",
    seats: [
      { name: "Cory Inman", institution: "University of Utah", role: "PI (anchor — CAPTURE)" },
      { name: "Alireza Kazemi", institution: "University of Utah", role: "Postdoc/Grad" },
      { name: "Brett Youngerman", institution: "Columbia University", role: "PI (CAMERA)" },
      { name: "Joshua Jacobs", institution: "University of Chicago", role: "PI (CAMERA)" },
      { name: "Kun Zhao", institution: "Columbia University", role: "Postdoc/Grad" },
      { name: "Jongwoon Kim", institution: "Columbia University", role: "Postdoc/Grad" },
      { name: "Hongkun Zhu", institution: "University of Chicago", role: "Postdoc/Grad" },
      { name: "Joseph Neimat", institution: "University of Louisville", role: "PI" },
      { name: "Brock Wester", institution: "JHU APL", role: "PI (BARD.CC)" },
    ],
  },
];

export const TABLE_COUNT = SEATING_PLAN.length;
export const SEATS_PER_TABLE = 9;
export const TOTAL_SEATS = TABLE_COUNT * SEATS_PER_TABLE;
export const FILLED_SEATS = SEATING_PLAN.reduce(
  (sum, t) => sum + t.seats.filter((s) => s.name !== "Open seat").length,
  0,
);