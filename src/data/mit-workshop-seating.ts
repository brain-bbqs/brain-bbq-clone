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
      { name: "Caleb Kemere", institution: "Rice University", role: "PI", domain: "A", grants: "R34DA059514" },
      { name: "William Nacci", institution: "Rice University", role: "Postdoc/Grad", domain: "A", grants: "R34DA059514" },
      { name: "Jane Wang", institution: "Cornell University", role: "PI/Co-I", domain: "A", grants: "R34DA059500" },
      { name: "Patrick McGrath", institution: "Georgia Tech", role: "PI", domain: "B", grants: "R34DA059510" },
      { name: "Jared Reiling", institution: "Michigan State University", role: "Postdoc/Grad", domain: "B", grants: "R34DA061984_Frohlich" },
      { name: "Álvaro Vega-Hidalgo", institution: "University of Michigan", role: "Postdoc/Grad", domain: "A/C", grants: "R34DA061925" },
      { name: "Crystal Lantz", institution: "NIH BRAIN Initiative", role: "NIH Staff", domain: "NIH" },
      ...OPEN(3),
    ],
  },
  {
    number: 2,
    theme: "Kinematics × Neural State Sensing",
    domains: "A + D",
    seats: [
      { name: "Agatha Lenartowicz", institution: "UCLA", role: "PI", domain: "A", grants: "R61MH138713" },
      { name: "Emre Ertin", institution: "Ohio State University", role: "PI", domain: "A", grants: "R61MH138713" },
      { name: "Yuyi Chang", institution: "Ohio State University", role: "Postdoc/Grad", domain: "A", grants: "R61MH138713" },
      { name: "Tim Roberts", institution: "CHOP", role: "PI", domain: "D", grants: "R61MH135114" },
      { name: "John Welsh", institution: "Seattle Children's / U Washington", role: "PI", domain: "D", grants: "R61MH135114" },
      { name: "Aditya Bhise", institution: "CHOP", role: "Postdoc/Grad (Young Inv.)", domain: "D", grants: "R61MH135114" },
      { name: "Holly Moore", institution: "NIDA", role: "NIH Staff", domain: "NIH" },
      ...OPEN(3),
    ],
  },
  {
    number: 3,
    theme: "Neural Encoding & Memory Formation",
    domains: "D — Clinical R61s",
    seats: [
      { name: "Cory Inman", institution: "University of Utah", role: "PI", domain: "D", grants: "R61MH135109" },
      { name: "Alireza Kazemi", institution: "University of Utah", role: "Postdoc/Grad", domain: "D", grants: "R61MH135109" },
      { name: "Brett Youngerman", institution: "Columbia University", role: "PI", domain: "D", grants: "R61MH135405" },
      { name: "Hongkun Zhu", institution: "University of Chicago", role: "Postdoc/Grad", domain: "D", grants: "R61MH135405", dietary: "Plant-based" },
      { name: "Kun Zhao", institution: "Columbia University", role: "Postdoc/Grad", domain: "D", grants: "R61MH135405" },
      { name: "Uros Topalovic", institution: "Duke University", role: "Postdoc/Grad", domain: "D", grants: "R61MH135106" },
      { name: "Karen Kate David", institution: "NIH BRAIN/NINDS", role: "NIH Staff", domain: "NIH", dietary: "Kosher" },
      ...OPEN(3),
    ],
  },
  {
    number: 4,
    theme: "Vocalizations, Social Synchrony & Behavior",
    domains: "C + B + D",
    seats: [
      { name: "Niegil Joseph", institution: "NYU", role: "Research Staff", domain: "C", grants: "U01_Sanes_audio, R34DA059513" },
      { name: "Cheryl Corcoran", institution: "Icahn School of Medicine / Mt Sinai", role: "PI", domain: "B", grants: "R34DA059716" },
      { name: "Karmiella Ferster", institution: "Icahn School of Medicine / Mt Sinai", role: "Research Staff", domain: "B", grants: "R34DA059716", dietary: "Tree Nut Allergy" },
      { name: "Brendan Ito", institution: "NYU Grossman School of Medicine", role: "Postdoc/Grad", domain: "E", grants: "U01_Froemke" },
      { name: "Sankaraleengam Alagapan", institution: "Georgia Tech", role: "Co-I", domain: "D", grants: "R61MH138966" },
      { name: "Wan Chen Lin", institution: "UC Berkeley", role: "Postdoc/Grad", domain: "D", grants: "R34DA062119" },
      { name: "Yvonne Bennett", institution: "NIH/NIMH", role: "NIH Staff", domain: "NIH" },
      ...OPEN(3),
    ],
  },
  {
    number: 5,
    theme: "Generative Agents & Comparative Intelligence",
    domains: "E + D",
    seats: [
      { name: "Steve Chang", institution: "Yale University", role: "PI", domain: "E", grants: "U01DA063534" },
      { name: "Taylor Wise", institution: "Yale University", role: "Postdoc/Grad", domain: "E", grants: "U01DA063534" },
      { name: "Weikang Shi", institution: "Yale University", role: "Postdoc/Grad", domain: "E", grants: "U01DA063534" },
      { name: "Jeffrey Walker", institution: "Yale University", role: "Research Staff", domain: "E", grants: "U01DA063534" },
      { name: "Joy Hirsch", institution: "Yale School of Medicine", role: "PI", domain: "A+E", grants: "U01DA063534, R61MH138705" },
      { name: "J. Adam Noah", institution: "Yale School of Medicine", role: "Co-I/Research Staff", domain: "A", grants: "R61MH138705" },
      { name: "Ming Zhan", institution: "NIDA/NIH", role: "NIH Staff (Bridge)", domain: "F+NIH", grants: "R24MH136632, U24MH136628" },
      ...OPEN(3),
    ],
  },
  {
    number: 6,
    theme: "Latent States, Adversity & Behavioral Dynamics",
    domains: "B + D",
    seats: [
      { name: "Brock Wester", institution: "JHU APL", role: "PI/Co-I", domain: "F", grants: "R24MH136632, U24MH136628" },
      { name: "Han Yi", institution: "JHU APL", role: "Co-I", domain: "F", grants: "R24MH136632, U24MH136628" },
      { name: "Cody Baker", institution: "Dartmouth College", role: "Research Staff", domain: "F", grants: "R24MH136632" },
      { name: "Yaroslav Halchenko", institution: "Dartmouth / DANDI", role: "Co-I", domain: "F", grants: "R24MH136632" },
      { name: "Yibei Chen", institution: "MIT", role: "Postdoc/Grad", domain: "F", grants: "U24MH136628" },
      { name: "Nader Nikbakht", institution: "MIT", role: "Research Staff", domain: "F", grants: "U24MH136628" },
      ...OPEN(4),
    ],
  },
  {
    number: 7,
    theme: "BBQS Data Infrastructure & Harmonization",
    domains: "F — BARD.CC + EMBER",
    seats: [
      { name: "Laura Cabrera", institution: "Penn State", role: "PI", domain: "F", grants: "U24MH136628" },
      { name: "Jennifer Wagner", institution: "Penn State", role: "Co-I", domain: "F", grants: "U24MH136628" },
      { name: "Kristofer Bouchard", institution: "UC Berkeley", role: "PI", domain: "F", grants: "U24MH136628" },
      { name: "Oliver Ruebel", institution: "Lawrence Berkeley National Lab", role: "Co-I", domain: "F", grants: "U24MH136628", dietary: "Vegetarian" },
      { name: "Meaghan Perdue", institution: "UMass Chan Medical School", role: "Postdoc/Grad", domain: "F", grants: "U24MH136628", dietary: "Vegetarian" },
      { name: "Rahul Hingorani", institution: "JHU APL", role: "Research Staff", domain: "F", grants: "R24MH136632" },
      { name: "Jyl Boline", institution: "Informed Minds", role: "Project Manager", domain: "ADMIN", grants: "U24MH136628" },
      ...OPEN(3),
    ],
  },
  {
    number: 8,
    theme: "Cross-Consortium Integration — Floating Bridge",
    domains: "NIH + All Domains",
    seats: OPEN(10),
  },
  {
    number: 9,
    theme: "Young Investigators & Open Discussion",
    domains: "All Domains",
    seats: OPEN(10),
  },
];

export const TABLE_COUNT = SEATING_PLAN.length;
export const SEATS_PER_TABLE = 10;
export const TOTAL_SEATS = TABLE_COUNT * SEATS_PER_TABLE;
export const FILLED_SEATS = SEATING_PLAN.reduce(
  (sum, t) => sum + t.seats.filter((s) => s.name !== "Open seat").length,
  0,
);