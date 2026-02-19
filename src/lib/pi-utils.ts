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
 * Build a Google Scholar author profile search URL for a PI.
 * Links to the profiles search page which lists matching author profiles.
 */
export const piProfileUrl = (piName: string): string => {
  return `https://scholar.google.com/citations?view_op=search_authors&mauthors=${encodeURIComponent(piName)}`;
};

/**
 * Known institution URL map — maps normalized institution names to their websites.
 */
const INSTITUTION_URLS: Record<string, string> = {
  "yale university": "https://www.yale.edu",
  "columbia university health sciences": "https://www.cuimc.columbia.edu",
  "columbia university": "https://www.columbia.edu",
  "new york university": "https://www.nyu.edu",
  "new york university school of medicine": "https://med.nyu.edu",
  "duke university": "https://www.duke.edu",
  "rice university": "https://www.rice.edu",
  "johns hopkins university": "https://www.jhu.edu",
  "university of california los angeles": "https://www.ucla.edu",
  "university of florida": "https://www.ufl.edu",
  "university of pennsylvania": "https://www.upenn.edu",
  "university of washington": "https://www.washington.edu",
  "university of michigan": "https://umich.edu",
  "university of chicago": "https://www.uchicago.edu",
  "university of california san diego": "https://www.ucsd.edu",
  "university of california berkeley": "https://www.berkeley.edu",
  "university of california san francisco": "https://www.ucsf.edu",
  "university of california davis": "https://www.ucdavis.edu",
  "university of minnesota": "https://twin-cities.umn.edu",
  "university of pittsburgh": "https://www.pitt.edu",
  "university of virginia": "https://www.virginia.edu",
  "university of north carolina chapel hill": "https://www.unc.edu",
  "university of wisconsin madison": "https://www.wisc.edu",
  "university of southern california": "https://www.usc.edu",
  "university of colorado": "https://www.colorado.edu",
  "university of maryland": "https://www.umd.edu",
  "university of iowa": "https://uiowa.edu",
  "university of oregon": "https://www.uoregon.edu",
  "university of rochester": "https://www.rochester.edu",
  "massachusetts institute of technology": "https://www.mit.edu",
  "stanford university": "https://www.stanford.edu",
  "harvard university": "https://www.harvard.edu",
  "california institute of technology": "https://www.caltech.edu",
  "georgia institute of technology": "https://www.gatech.edu",
  "cornell university": "https://www.cornell.edu",
  "princeton university": "https://www.princeton.edu",
  "brown university": "https://www.brown.edu",
  "emory university": "https://www.emory.edu",
  "northwestern university": "https://www.northwestern.edu",
  "washington university in st. louis": "https://wustl.edu",
  "carnegie mellon university": "https://www.cmu.edu",
  "baylor college of medicine": "https://www.bcm.edu",
  "icahn school of medicine at mount sinai": "https://icahn.mssm.edu",
  "mount sinai school of medicine": "https://icahn.mssm.edu",
  "cold spring harbor laboratory": "https://www.cshl.edu",
  "allen institute": "https://alleninstitute.org",
  "allen institute for brain science": "https://alleninstitute.org",
  "salk institute": "https://www.salk.edu",
  "janelia research campus": "https://www.janelia.org",
  "boston university": "https://www.bu.edu",
  "vanderbilt university": "https://www.vanderbilt.edu",
  "utah state higher education system--university of utah": "https://www.utah.edu",
  "university of utah": "https://www.utah.edu",
  "rutgers university": "https://www.rutgers.edu",
  "pennsylvania state university": "https://www.psu.edu",
  "ohio state university": "https://www.osu.edu",
  "purdue university": "https://www.purdue.edu",
  "university of texas at austin": "https://www.utexas.edu",
  "national institutes of health": "https://www.nih.gov",
  "weill cornell medicine": "https://weill.cornell.edu",
};

/**
 * Get the URL for an institution. Uses a known mapping first,
 * falls back to a DuckDuckGo redirect (which doesn't block like Google).
 */
export const institutionUrl = (institution: string): string => {
  const normalized = institution.toLowerCase().replace(/[^a-z0-9\s.-]/g, "").trim();

  // Check exact match
  if (INSTITUTION_URLS[normalized]) return INSTITUTION_URLS[normalized];

  // Check partial match (e.g., "UNIVERSITY OF CALIFORNIA LOS ANGELES" matches)
  for (const [key, url] of Object.entries(INSTITUTION_URLS)) {
    if (normalized.includes(key) || key.includes(normalized)) return url;
  }

  // Fallback: DuckDuckGo "I'm Feeling Lucky" equivalent
  return `https://duckduckgo.com/?q=!ducky+${encodeURIComponent(institution + " official site")}`;
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
