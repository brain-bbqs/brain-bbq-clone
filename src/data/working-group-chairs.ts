// Centralized list of working group chair names for cross-referencing
const WG_CHAIRS: { name: string; group: string }[] = [
  { name: "Kristofer Bouchard", group: "WG-Analytics" },
  { name: "Han Yi", group: "WG-Analytics" },
  { name: "Alireza Kazemi", group: "WG-Devices" },
  { name: "Uros Topalovic", group: "WG-Devices" },
  { name: "Laura Cabrera", group: "WG-ELSI" },
  { name: "Oliver Ruebel", group: "WG-Standards" },
  { name: "Melissa Kline Struhl", group: "WG-Standards" },
];

export function getAllWorkingGroupChairNames(): Set<string> {
  return new Set(WG_CHAIRS.map((c) => c.name.toLowerCase()));
}

export { WG_CHAIRS };
