/**
 * Normalize a name to Title Case.
 * Handles ALL CAPS names like "CHERYL MARY CORCORAN" → "Cheryl Mary Corcoran"
 * and "LAST, FIRST M." → "First M. Last"
 */
export const normalizePiName = (name: string): string => {
  if (!name) return name;

  // If name is in "LAST, FIRST MIDDLE" format, reorder to "First Middle Last"
  const commaParts = name.split(",").map((s) => s.trim()).filter(Boolean);
  let fullName = name;
  if (commaParts.length === 2) {
    fullName = `${commaParts[1]} ${commaParts[0]}`;
  }

  // Title-case each word, handling edge cases
  return fullName
    .split(/\s+/)
    .map((word) => {
      if (!word) return word;
      // Keep Roman numerals uppercase (II, III, IV)
      if (/^[IVXLC]+$/.test(word) && word.length <= 4) return word;
      // Keep initials like "W." or "C." as-is but capitalize
      if (/^[A-Za-z]\.?$/.test(word)) return word.charAt(0).toUpperCase() + word.slice(1);
      // Standard title case
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
};

/**
 * Build a Google Scholar search URL for a PI.
 * Google Scholar reliably deep-links to search results, unlike NIH Reporter.
 */
export const nihReporterPiUrl = (piName: string): string => {
  return `https://scholar.google.com/scholar?q=author:"${encodeURIComponent(piName)}"`;
};

/**
 * Build a Google search URL to find a PI's university profile.
 */
export const piProfileSearchUrl = (piName: string, institution?: string): string => {
  const query = institution
    ? `${piName} ${institution} faculty profile`
    : `${piName} faculty profile`;
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
};
