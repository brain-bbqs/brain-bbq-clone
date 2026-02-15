import { MARR_PROJECTS } from "@/data/marr-projects";

function normalize(s: string): string {
  return s.replace(/[^a-zA-Z0-9]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
}

export function generateRdfTurtle(): string {
  const lines: string[] = [];

  // Prefixes
  lines.push("@prefix bbqs: <https://bbqs.dev/ontology#> .");
  lines.push("@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .");
  lines.push("@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .");
  lines.push("@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .");
  lines.push("");

  // BBQS root node
  lines.push("# ========================================");
  lines.push("# BBQS Consortium (Root Node)");
  lines.push("# ========================================");
  lines.push("bbqs:BBQS rdf:type bbqs:Consortium ;");
  lines.push('    rdfs:label "Brain Behavior Quantification and Synchronization" ;');
  lines.push('    bbqs:description "NIH-funded consortium for cross-species behavioral neuroscience" .');
  lines.push("");

  // Collect unique species & features
  const speciesSet = new Set<string>();
  const compFeatures = new Set<string>();
  const algoFeatures = new Set<string>();
  const implFeatures = new Set<string>();

  MARR_PROJECTS.forEach((p) => {
    speciesSet.add(p.species);
    p.computational.forEach((f) => compFeatures.add(f));
    p.algorithmic.forEach((f) => algoFeatures.add(f));
    p.implementation.forEach((f) => implFeatures.add(f));
  });

  // Species nodes
  lines.push("# ========================================");
  lines.push("# Species");
  lines.push("# ========================================");
  speciesSet.forEach((s) => {
    const id = normalize(s);
    lines.push(`bbqs:Species_${id} rdf:type bbqs:Species ;`);
    lines.push(`    rdfs:label "${s}" .`);
  });
  lines.push("");

  // Feature nodes
  lines.push("# ========================================");
  lines.push("# Marr Level Features");
  lines.push("# ========================================");

  const writeFeatures = (features: Set<string>, level: string) => {
    features.forEach((f) => {
      const id = normalize(f);
      lines.push(`bbqs:${level}_${id} rdf:type bbqs:${level}Feature ;`);
      lines.push(`    rdfs:label "${f}" ;`);
      lines.push(`    bbqs:marrLevel "${level}" .`);
    });
  };

  writeFeatures(compFeatures, "Computational");
  writeFeatures(algoFeatures, "Algorithmic");
  writeFeatures(implFeatures, "Implementation");
  lines.push("");

  // Project nodes with relationships
  lines.push("# ========================================");
  lines.push("# Projects");
  lines.push("# ========================================");

  MARR_PROJECTS.forEach((p) => {
    const projId = normalize(p.shortName);
    lines.push(`bbqs:Project_${projId} rdf:type bbqs:Project ;`);
    lines.push(`    rdfs:label "${p.shortName}" ;`);
    lines.push(`    bbqs:grantNumber "${p.id}" ;`);
    lines.push(`    bbqs:principalInvestigator "${p.pi}" ;`);
    lines.push(`    bbqs:studiesSpecies bbqs:Species_${normalize(p.species)} ;`);

    // Link to BBQS
    lines.push(`    bbqs:partOfConsortium bbqs:BBQS ;`);

    // Computational features
    p.computational.forEach((f) => {
      lines.push(`    bbqs:hasComputationalFeature bbqs:Computational_${normalize(f)} ;`);
    });

    // Algorithmic features
    p.algorithmic.forEach((f) => {
      lines.push(`    bbqs:hasAlgorithmicFeature bbqs:Algorithmic_${normalize(f)} ;`);
    });

    // Implementation features
    p.implementation.forEach((f) => {
      lines.push(`    bbqs:hasImplementationFeature bbqs:Implementation_${normalize(f)} ;`);
    });

    // Fix last semicolon to period
    const lastIdx = lines.length - 1;
    lines[lastIdx] = lines[lastIdx].replace(/ ;$/, " .");
    lines.push("");
  });

  // BBQS hasProject links
  lines.push("# ========================================");
  lines.push("# BBQS → Project Links");
  lines.push("# ========================================");
  MARR_PROJECTS.forEach((p) => {
    lines.push(`bbqs:BBQS bbqs:hasProject bbqs:Project_${normalize(p.shortName)} .`);
  });
  lines.push("");

  // Cross-species shared feature relationships
  lines.push("# ========================================");
  lines.push("# Cross-Species Shared Feature Relationships");
  lines.push("# ========================================");

  const speciesList = [...speciesSet];
  for (let i = 0; i < speciesList.length; i++) {
    for (let j = i + 1; j < speciesList.length; j++) {
      const a = MARR_PROJECTS.filter((p) => p.species === speciesList[i]);
      const b = MARR_PROJECTS.filter((p) => p.species === speciesList[j]);

      const aFeatures = new Set<string>();
      const bFeatures = new Set<string>();

      for (const level of ["computational", "algorithmic", "implementation"] as const) {
        a.forEach((p) => p[level].forEach((f) => aFeatures.add(`${level}:${f.toLowerCase()}`)));
        b.forEach((p) => p[level].forEach((f) => bFeatures.add(`${level}:${f.toLowerCase()}`)));
      }

      const shared = [...aFeatures].filter((f) => bFeatures.has(f));
      if (shared.length > 0) {
        const relId = `${normalize(speciesList[i])}_${normalize(speciesList[j])}`;
        lines.push(`bbqs:SharedMethods_${relId} rdf:type bbqs:CrossSpeciesRelationship ;`);
        lines.push(`    bbqs:speciesA bbqs:Species_${normalize(speciesList[i])} ;`);
        lines.push(`    bbqs:speciesB bbqs:Species_${normalize(speciesList[j])} ;`);
        lines.push(`    bbqs:sharedFeatureCount "${shared.length}"^^xsd:integer .`);
      }
    }
  }

  return lines.join("\n");
}

export function generateJsonLd(): object {
  const speciesSet = new Set<string>();
  MARR_PROJECTS.forEach((p) => speciesSet.add(p.species));

  const speciesNodes = [...speciesSet].map((s) => ({
    "@type": "bbqs:Species",
    "@id": `bbqs:Species_${normalize(s)}`,
    "rdfs:label": s,
  }));

  const projectNodes = MARR_PROJECTS.map((p) => ({
    "@type": "bbqs:Project",
    "@id": `bbqs:Project_${normalize(p.shortName)}`,
    "rdfs:label": p.shortName,
    "bbqs:grantNumber": p.id,
    "bbqs:principalInvestigator": p.pi,
    "bbqs:studiesSpecies": { "@id": `bbqs:Species_${normalize(p.species)}` },
    "bbqs:partOfConsortium": { "@id": "bbqs:BBQS" },
    "bbqs:hasComputationalFeature": p.computational.map((f) => ({
      "@type": "bbqs:ComputationalFeature",
      "@id": `bbqs:Computational_${normalize(f)}`,
      "rdfs:label": f,
    })),
    "bbqs:hasAlgorithmicFeature": p.algorithmic.map((f) => ({
      "@type": "bbqs:AlgorithmicFeature",
      "@id": `bbqs:Algorithmic_${normalize(f)}`,
      "rdfs:label": f,
    })),
    "bbqs:hasImplementationFeature": p.implementation.map((f) => ({
      "@type": "bbqs:ImplementationFeature",
      "@id": `bbqs:Implementation_${normalize(f)}`,
      "rdfs:label": f,
    })),
  }));

  return {
    "@context": {
      "bbqs": "https://bbqs.dev/ontology#",
      "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
      "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
      "xsd": "http://www.w3.org/2001/XMLSchema#",
    },
    "@graph": [
      {
        "@type": "bbqs:Consortium",
        "@id": "bbqs:BBQS",
        "rdfs:label": "Brain Behavior Quantification and Synchronization",
        "bbqs:description": "NIH-funded consortium for cross-species behavioral neuroscience",
        "bbqs:hasProject": projectNodes.map((p) => ({ "@id": p["@id"] })),
      },
      ...speciesNodes,
      ...projectNodes,
    ],
  };
}

function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadRdf() {
  downloadBlob(generateRdfTurtle(), "bbqs-knowledge-graph.ttl", "text/turtle");
}

export function downloadJsonLd() {
  const jsonLd = generateJsonLd();
  downloadBlob(JSON.stringify(jsonLd, null, 2), "bbqs-knowledge-graph.jsonld", "application/ld+json");
}
