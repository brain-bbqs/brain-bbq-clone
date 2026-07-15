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
    theme: "Vision → Behavior Pipeline",
    domains: "A + B",
    seats: [
      { name: "Caleb Kemere", institution: "Rice University", role: "PI (anchor)", domain: "A" },
      { name: "Patrick McGrath", institution: "Georgia Tech", role: "PI", domain: "B" },
      { name: "William Nacci", institution: "Rice University", role: "Postdoc/Grad", domain: "A" },
      { name: "Jared Reiling", institution: "Michigan State University", role: "Postdoc/Grad", domain: "B" },
      { name: "Álvaro Vega-Hidalgo", institution: "University of Michigan", role: "Postdoc/Grad", domain: "A/C" },
      { name: "Wan Chen Lin", institution: "UC Berkeley", role: "Postdoc/Grad", domain: "D" },
      { name: "Crystal Lantz", institution: "NIH BRAIN Initiative", role: "NIH Program", domain: "NIH" },
      { name: "Jyl Boline", institution: "Informed Minds", role: "Project Manager (EMBER)", domain: "ADMIN" },
      { name: "Hongli Wang", institution: "UC Berkeley", role: "Postdoc/Grad", domain: "D" },
    ],
  },
  {
    number: 2,
    theme: "Vision × Neural State Sensing",
    domains: "A + D",
    seats: [
      { name: "Agatha Lenartowicz", institution: "UCLA", role: "PI (anchor)", domain: "A" },
      { name: "Emre Ertin", institution: "Ohio State University", role: "PI", domain: "A" },
      { name: "Yuyi Chang", institution: "Ohio State University", role: "Postdoc/Grad", domain: "A" },
      { name: "Tim Roberts", institution: "CHOP", role: "PI", domain: "D" },
      { name: "John Welsh", institution: "Seattle Children's / U Washington", role: "PI", domain: "D" },
      { name: "Aditya Bhise", institution: "CHOP", role: "Young Investigator", domain: "D" },
      { name: "J. Adam Noah", institution: "Yale School of Medicine", role: "Co-I/Research Staff", domain: "A" },
      { name: "Holly Moore", institution: "NIDA", role: "NIH Program", domain: "NIH" },
      { name: "Rahul Hingorani", institution: "JHU APL", role: "Infra (BARD.CC)", domain: "F" },
      { name: "Luke Bloy", institution: "CHOP", role: "Research Staff", domain: "D" },
      { name: "Fang Yu Chang", institution: "UCLA", role: "Research Staff (virtual)", domain: "A" },
    ],
  },
  {
    number: 3,
    theme: "Encoding & Memory Formation R61s",
    domains: "D — Clinical",
    seats: [
      { name: "Cory Inman", institution: "University of Utah", role: "PI (anchor)", domain: "D" },
      { name: "Alireza Kazemi", institution: "University of Utah", role: "Postdoc/Grad", domain: "D" },
      { name: "Brett Youngerman", institution: "Columbia University", role: "PI", domain: "D" },
      { name: "Kun Zhao", institution: "Columbia University", role: "Postdoc/Grad", domain: "D" },
      { name: "Hongkun Zhu", institution: "University of Chicago", role: "Postdoc/Grad", domain: "D" },
      { name: "Uros Topalovic", institution: "Duke University", role: "Postdoc/Grad", domain: "D" },
      { name: "Joseph Neimat", institution: "University of Louisville", role: "PI", domain: "D" },
      { name: "Karen Kate David", institution: "NIH BRAIN/NINDS", role: "NIH Program", domain: "NIH" },
      { name: "Meaghan Perdue", institution: "UMass Chan Medical School", role: "Infra (EMBER)", domain: "F" },
      { name: "Jack Grinband", institution: "Columbia University", role: "PI", domain: "D" },
      { name: "Nelleke van Wouwe", institution: "University of Louisville", role: "Research Staff (virtual)", domain: "D" },
    ],
  },
  {
    number: 4,
    theme: "Statistical Modeling of Social Behavior",
    domains: "Brainhack · B + D + F",
    seats: [
      { name: "Cheryl Corcoran", institution: "Icahn School of Medicine / Mt Sinai", role: "PI (anchor)", domain: "B" },
      { name: "Muhammad Parvaz", institution: "Icahn School of Medicine / Mt Sinai", role: "PI", domain: "B" },
      { name: "Karmiella Ferster", institution: "Icahn School of Medicine / Mt Sinai", role: "Research Staff", domain: "B" },
      { name: "Adam E. Friedman", institution: "Icahn School of Medicine / Mt Sinai", role: "Research Staff", domain: "B" },
      { name: "Sankaraleengam Alagapan", institution: "Georgia Tech", role: "Co-I", domain: "D" },
      { name: "Niegil Francis Muttath Joseph", institution: "NYU", role: "Research Staff", domain: "C" },
      { name: "Yvonne Bennett", institution: "NIH/NIMH", role: "NIH Program", domain: "NIH" },
      { name: "Yaroslav Halchenko", institution: "Dartmouth / DANDI", role: "Infra (BARD.CC)", domain: "F" },
      { name: "Darrell De Freitas", institution: "University of Pennsylvania", role: "Infra (EMBER)", domain: "F" },
      { name: "Suliman Sharif", institution: "MIT", role: "Organizer / Admin", domain: "ADMIN" },
      { name: "Mengsen Zhang", institution: "Michigan State University", role: "PI (virtual)", domain: "B" },
    ],
  },
  {
    number: 5,
    theme: "Latent States & Adversity Dynamics",
    domains: "B + D",
    seats: [
      { name: "Avniel Ghuman", institution: "University of Pittsburgh", role: "PI (anchor)", domain: "D" },
      { name: "Joshua Jacobs", institution: "University of Chicago", role: "PI", domain: "D" },
      { name: "Chuck Mikell", institution: "Stony Brook", role: "PI", domain: "D" },
      { name: "Sima Mofakham", institution: "Stony Brook University Hospital", role: "PI", domain: "D" },
      { name: "Arish Alreja", institution: "University of Pittsburgh", role: "Postdoc/Grad", domain: "D" },
      { name: "Joshua Wu", institution: "Duke University", role: "Postdoc/Grad", domain: "D" },
      { name: "Jongwoon Kim", institution: "Columbia University", role: "Postdoc/Grad", domain: "D" },
      { name: "Lizzy Ankudowich", institution: "NIMH/BRAIN", role: "NIH Program", domain: "NIH" },
      { name: "Han Yi", institution: "JHU APL", role: "Infra (BARD.CC)", domain: "F" },
      { name: "Satrajit Ghosh", institution: "MIT", role: "PI (EMBER)", domain: "F" },
      { name: "Maryam Shanechi", institution: "University of Southern California", role: "PI (virtual)", domain: "D" },
    ],
  },
  {
    number: 6,
    theme: "Generative Agents & Comparative Intelligence",
    domains: "E",
    seats: [
      { name: "Steve Chang", institution: "Yale University", role: "PI (anchor)", domain: "E" },
      { name: "Anirvan Nandy", institution: "Yale University", role: "PI", domain: "E" },
      { name: "Monika Jadi", institution: "Yale University", role: "PI", domain: "E" },
      { name: "Joy Hirsch", institution: "Yale School of Medicine", role: "PI (bridge to A)", domain: "A+E" },
      { name: "Weikang Shi", institution: "Yale University", role: "Postdoc/Grad", domain: "E" },
      { name: "Taylor Wise", institution: "Yale University", role: "Postdoc/Grad", domain: "E" },
      { name: "Jeffrey Walker", institution: "Yale University", role: "Research Staff", domain: "E" },
      { name: "Farah Nikhath Bader", institution: "NINDS/BRAIN Initiative", role: "NIH Program", domain: "NIH" },
      { name: "Oliver Ruebel", institution: "Lawrence Berkeley National Lab", role: "Infra (EMBER)", domain: "F" },
      { name: "Christina Liu", institution: "NIMH", role: "NIH Program (virtual)", domain: "NIH" },
    ],
  },
  {
    number: 7,
    theme: "Cross-Species Synchronization",
    domains: "Brainhack · Cross-consortium",
    seats: [
      { name: "Cristina Savin", institution: "NYU", role: "PI (anchor)" },
      { name: "Martin Schrimpf", institution: "EPFL", role: "Advisory Board" },
      { name: "Saskia de Vries", institution: "Allen Institute", role: "Advisory Board" },
      { name: "Emily Mackevicius", institution: "Basis Research Institute", role: "Co-I" },
      { name: "Dmitry Batenkov", institution: "Basis Research Institute", role: "Research Staff" },
      { name: "Nishant Rao", institution: "Yale University", role: "Research Staff" },
      { name: "Melissa Kline Struhl", institution: "MIT", role: "Research Staff" },
      { name: "Nader Nikbakht", institution: "MIT", role: "Research Staff", domain: "F" },
      { name: "Ming Zhan", institution: "NIDA/NIH", role: "NIH Program (Bridge)", domain: "NIH" },
      { name: "Dorota Jarecka", institution: "MIT", role: "Infra (EMBER)", domain: "F" },
      { name: "Timothy Brown", institution: "University of Washington School of Medicine", role: "Advisory Board" },
      { name: "Ralph Peterson", institution: "Basis Research Institute", role: "Research Staff / Postdoc (virtual)" },
      { name: "Yi Zuo", institution: "UC Santa Cruz", role: "Co-I (virtual)", domain: "E" },
    ],
  },
  {
    number: 8,
    theme: "Pose Estimation & Behavioral Tracking",
    domains: "Brainhack · B + E",
    seats: [
      { name: "Talmo Pereira", institution: "Salk Institute", role: "PI (anchor — SLEAP)", domain: "B" },
      { name: "Ugne Klibaite", institution: "Harvard University", role: "Research Staff / Postdoc" },
      { name: "Bartul Mimica", institution: "Princeton University", role: "Postdoc/Grad" },
      { name: "Mang Gao", institution: "Northwestern University", role: "Postdoc/Grad" },
      { name: "Sofia Juliani", institution: "Carnegie Mellon University", role: "Postdoc/Grad" },
      { name: "Brendan Ito", institution: "NYU Grossman School of Medicine", role: "Postdoc/Grad", domain: "E" },
      { name: "Jane Wang", institution: "Cornell University", role: "PI/Co-I", domain: "A" },
      { name: "Cody Baker", institution: "Dartmouth College", role: "Infra (BARD.CC)", domain: "F" },
      { name: "Nima Dehghani", institution: "MIT", role: "Infra (BARD.CC)", domain: "F" },
      { name: "Terry Jernigan", institution: "UC San Diego", role: "Consortium Coordinator (ABCD/HBCD) · Pereira collaborator", domain: "B" },
      { name: "Grace Hwang", institution: "NIH/NINDS/BRAIN", role: "NIH Program (virtual)", domain: "NIH" },
    ],
  },
  {
    number: 9,
    theme: "Neural Data Governance & ELSI",
    domains: "F · Policy",
    seats: [
      { name: "Laura Cabrera", institution: "Penn State", role: "PI (anchor — ELSI)", domain: "F" },
      { name: "Jennifer Wagner", institution: "Penn State", role: "Co-I (ELSI)", domain: "F" },
      { name: "Kristofer Bouchard", institution: "UC Berkeley / LBNL", role: "PI (EMBER)", domain: "F" },
      { name: "David Kennedy", institution: "UMass Chan Medical School", role: "PI (EMBER)", domain: "F" },
      { name: "Brock Wester", institution: "JHU APL", role: "PI (BARD.CC)", domain: "F" },
      { name: "Nicole Tregoning", institution: "Johns Hopkins University", role: "Research Staff (BARD.CC)", domain: "F" },
      { name: "Deepa Purushothaman", institution: "Yale University", role: "Postdoc/Grad" },
      { name: "Yankun Xu", institution: "Duke University", role: "Postdoc/Grad", domain: "D" },
      { name: "Tek Raj Chhetri", institution: "MIT", role: "Postdoc/Grad" },
      { name: "Merav Sabri", institution: "NIH/NIDCD", role: "NIH Program (virtual)", domain: "NIH" },
      { name: "Christina Hatch", institution: "NIH/NIDA", role: "NIH Program (virtual)", domain: "NIH" },
    ],
  },
  {
    number: 10,
    theme: "Emerging Methods & Cross-Cutting Tools",
    domains: "Young Investigators",
    seats: [
      { name: "Parastoo Azizeddin", institution: "University of Southern California", role: "Postdoc/Grad", domain: "D" },
      { name: "Yibei Chen", institution: "MIT", role: "Postdoc/Grad" },
      { name: "Thomas Heeps", institution: "University of Florida", role: "Undergraduate" },
      { name: "Yunsoo Kim", institution: "Stony Brook University Hospital", role: "Postdoc/Grad" },
      { name: "Tyler Albarran", institution: "Georgia Tech", role: "Postdoc/Grad" },
      { name: "Tristan Daniel", institution: "Georgia Tech", role: "Postdoc/Grad" },
      { name: "Varun Thvar", institution: "MIT", role: "Visiting Undergrad" },
      { name: "Caleb Scott-Joseph", institution: "University of Pennsylvania", role: "Postdoc/Grad" },
      { name: "Yuan Luo", institution: "NIDA/NIH", role: "NIH Program (virtual)", domain: "NIH" },
      { name: "Eunyoung Kim", institution: "NIH/NIMH/BRAIN", role: "NIH Program (virtual)", domain: "NIH" },
      { name: "Kari Johnson", institution: "NIH", role: "NIH Program (virtual)", domain: "NIH" },
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