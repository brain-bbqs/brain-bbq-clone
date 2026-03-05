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

// Extract last names for fuzzy matching against investigator display names
const chairLastNames = new Set(
  WG_CHAIRS.map((c) => c.name.split(" ").pop()!.toLowerCase())
);

/**
 * Check if a display name matches a working group chair.
 * Uses both full-name exact match and last-name match with first-initial check.
 */
export function isWorkingGroupChair(displayName: string): boolean {
  const lower = displayName.toLowerCase().trim();
  // Exact full name match
  if (WG_CHAIRS.some((c) => c.name.toLowerCase() === lower)) return true;
  // Last name match + first letter check
  const parts = lower.split(/[,\s]+/).filter(Boolean);
  for (const chair of WG_CHAIRS) {
    const chairParts = chair.name.toLowerCase().split(" ");
    const chairLast = chairParts[chairParts.length - 1];
    const chairFirst = chairParts[0];
    if (
      parts.some((p) => p === chairLast) &&
      parts.some((p) => p.startsWith(chairFirst[0]))
    ) {
      return true;
    }
  }
  return false;
}

export function getAllWorkingGroupChairNames(): Set<string> {
  return new Set(WG_CHAIRS.map((c) => c.name.toLowerCase()));
}

export { WG_CHAIRS };
