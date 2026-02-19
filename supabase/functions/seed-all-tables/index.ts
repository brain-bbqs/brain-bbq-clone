import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// MARR_PROJECTS data for skills/research_areas enrichment
const MARR_PROJECTS = [
  { id: "R34DA059510", pi: "Eva Dyer", species: "Cichlid", computational: ["Multi-animal social behavior quantification","Species differentiation","Hierarchical social structure"], algorithmic: ["Pose estimation","Object detection","Feature extraction","Graph modeling","Self-supervised learning","Dimensionality reduction"], implementation: ["DeepLabCut","Computer vision networks","PCA","UMAP"] },
  { id: "R34DA059509", pi: "Pulkit Grover", species: "Mouse", computational: ["Behavioral segmentation","Stress response quantification","Gut-brain axis"], algorithmic: ["Pose estimation","Physiological signal analysis","Active learning","Multimodal classification"], implementation: ["SLEAP","KiloSort3","A-SOID","Neuropixels"] },
  { id: "R34DA059513", pi: "Dan Sanes", species: "Gerbil", computational: ["Vocal attribution in multi-animal environments","Social communication","Neural-behavioral coupling"], algorithmic: ["Pose estimation","Source localization","Deep learning","Signal processing","Encoding models","Decoding models"], implementation: ["SLEAP","DeepSqueak","Python","Wireless neural recorders"] },
  { id: "R34DA059507", pi: "Firooz Aflatouni", species: "Cowbird", computational: ["Multi-animal social behavior quantification","Social communication","Social network analysis"], algorithmic: ["Pose estimation","Object detection","Source localization","Social network analysis","Dimensionality reduction"], implementation: ["Computer vision networks","RFID","Machine learning","PCA","UMAP"] },
  { id: "R34DA059718", pi: "Nancy Padilla Coreano", species: "Mouse", computational: ["Social behavior motif discovery","Autonomic-behavioral coupling"], algorithmic: ["Pose estimation","Physiological signal analysis","Deep learning","Hierarchical clustering","Dimensionality reduction","Dynamical systems modeling"], implementation: ["So-Mo","Multimodal autoencoder","Neural networks","PCA","UMAP"] },
  { id: "R34DA059506", pi: "Timothy Dunn", species: "Rats/Mice", computational: ["3D social behavior quantification","Multi-animal pose reconstruction"], algorithmic: ["Pose estimation","Deep learning","Behavioral segmentation","Dimensionality reduction","Bayesian inference","Dynamical systems modeling"], implementation: ["Deep neural network (3D)","Python","PCA","UMAP"] },
  { id: "R34DA059512", pi: "Timothy Dunn", species: "Mouse", computational: ["Ecological behavior quantification","Prey capture kinematics","Disease phenotyping"], algorithmic: ["Pose estimation","Deep learning","3D reconstruction"], implementation: ["Convolutional neural network","Python","Multi-camera sync"] },
  { id: "R34DA059716", pi: "Cheryl Corcoran", species: "Human", computational: ["Interpersonal synchrony","Emotion recognition","Social communication"], algorithmic: ["Facial expression analysis","EEG hyperscanning","Signal processing","Network analysis","Correlation analysis"], implementation: ["PRAAT","OpenSmile","HUME-AI","Tobii Glasses","EEG"] },
  { id: "R34DA059723", pi: "Gordon Shepherd", species: "Mouse", computational: ["Fine motor coordination","Sub-movement assembly","Oromanual behavior"], algorithmic: ["Pose estimation","Physiological signal analysis","EMG analysis"], implementation: ["DeepLabCut","EMG recording","Intranasal thermistor"] },
  { id: "R34DA059514", pi: "Caleb Kemere", species: "Sheep", computational: ["Collective behavior quantification","Internal state dynamics","Field neuroscience"], algorithmic: ["Signal processing","Dimensionality reduction","Dynamical systems modeling","Behavioral prediction"], implementation: ["Python","GPS","Wireless neural (implanted)","SpikeGadgets"] },
  { id: "R34DA059500", pi: "Katherine Nagel", species: "Zebrafish/Fly", computational: ["Navigation in complex environments","Stimulus-guided behavior","Neural activity mapping"], algorithmic: ["Pose estimation","Neural activity modeling","Physical modeling"], implementation: ["Bioluminescent indicators","Real-time tracking","Custom apparatus"] },
  { id: "R34DA061984", pi: "Mansi Srivastava", species: "Acoel Worm", computational: ["Organism-environment interaction","Regeneration behavior"], algorithmic: ["Pose estimation","Behavioral segmentation","Synchronization","Dimensionality reduction"], implementation: ["DeepLabCut","SLEAP","Cellpose"] },
  { id: "R34DA061924", pi: "Mengsen Zhang", species: "Ferret", computational: ["Multi-scale neural-behavioral mapping","Social interaction dynamics"], algorithmic: ["Pose estimation","Topological time series analysis","Network analysis","Cross-scale mapping","Dimensionality reduction","Dynamical systems modeling"], implementation: ["DeepLabCut","Accelerometers","Electrophysiology"] },
  { id: "R34DA061925", pi: "Shelly Flagel", species: "Capuchin Monkey", computational: ["Wild primate behavior quantification","Automated field data collection","Social communication"], algorithmic: ["Deep learning","Pose estimation","Bayesian inference","Network analysis"], implementation: ["Visual DL (individual ID)","Vocal DL","Smart testing stations"] },
  { id: "R61MH135106", pi: "Nanthia Suthana", species: "Human", computational: ["Stress response quantification","Approach-avoidance behavior","Neural-peripheral coupling"], algorithmic: ["Signal processing","Decoding models","Dimensionality reduction","Dynamical systems modeling"], implementation: ["iEEG","Cortisol wearable","VR/AR","PCA","UMAP"] },
  { id: "R61MH135405", pi: "Joshua Jacobs", species: "Human", computational: ["Anxiety-memory state prediction","Ecological momentary assessment","Neural-behavioral coupling"], algorithmic: ["Deep learning","Facial expression analysis","Physiological signal analysis","Signal processing","Encoding models","Decoding models","Bayesian inference"], implementation: ["BCI2000","iEEG","Empatica EmbracePlus","NLP","Deep learning models"] },
  { id: "R61MH135407", pi: "Maryam Shanechi", species: "Human", computational: ["Mental state estimation","Emotion recognition","Neural-behavioral coupling"], algorithmic: ["Deep learning","Facial expression analysis","Physiological signal analysis","Multimodal classification"], implementation: ["iEEG","Wearable skin-like sensor","Multimodal RNN","Virtual conversational agents"] },
  { id: "R61MH138966", pi: "Christopher Rozell", species: "Human", computational: ["Effort-based decision making","Brain-body interaction modeling"], algorithmic: ["Latent variable modeling","Dynamical systems modeling","Multimodal classification"], implementation: ["VR/AR","Deep brain stimulation","iEEG"] },
  { id: "R61MH138713", pi: "Agatha Lenartowicz", species: "Human", computational: ["Attention state modeling","Privacy-preserving sensing"], algorithmic: ["Physiological signal analysis","Encoding models","Decoding models","Deep learning","Network analysis","Signal processing"], implementation: ["EEG","LiDAR","Millimeter wave sensing"] },
  { id: "1U01DA063534", pi: "Steve Chang", species: "Marmoset", computational: ["Multi-animal social behavior quantification","Cooperation and competition modeling"], algorithmic: ["Reinforcement learning","Dynamic Bayesian networks","Dynamical systems modeling","Encoding models","Decoding models","Network analysis"], implementation: ["Multi-agent RL","RNN","Musculoskeletal models"] },
  { id: "R34DA062119", pi: "Linda Wilbrecht", species: "Mouse", computational: ["Adolescent decision-making","Reward learning","Behavioral flexibility"], algorithmic: ["Reinforcement learning","Bayesian inference","Pose estimation","Behavioral segmentation"], implementation: ["DeepLabCut","Two-photon imaging","Neuropixels"] },
  { id: "U24MH136628", pi: "Satrajit Ghosh", species: "Multi-species", computational: ["Data infrastructure","Standardization","FAIR data sharing"], algorithmic: ["Data engineering","Metadata standards","Pipeline orchestration"], implementation: ["ReproSchema","Datalad","BIDS"] },
  { id: "R61MH135109", pi: "Cory Inman", species: "Human", computational: ["Memory enhancement","Neural stimulation","Emotional memory"], algorithmic: ["Deep learning","Signal processing","Encoding models","Decoding models"], implementation: ["iEEG","Direct brain stimulation","Machine learning"] },
  { id: "R61MH135114", pi: "John Welsh", species: "Human", computational: ["Movement disorder phenotyping","Cerebellar function"], algorithmic: ["Pose estimation","Signal processing","EMG analysis"], implementation: ["Wearable sensors","EMG","Motion capture"] },
  { id: "R24MH136632", pi: "Brock Wester", species: "Multi-species", computational: ["Data infrastructure","Neural data standards"], algorithmic: ["Data engineering","Metadata standards"], implementation: ["NWB","DANDI","Cloud infrastructure"] },
  { id: "R61MH138705", pi: "Joy Hirsch", species: "Human", computational: ["Social neuroscience","Interpersonal synchrony","Neural coupling"], algorithmic: ["Signal processing","Network analysis","Correlation analysis"], implementation: ["fNIRS","EEG","Hyperscanning"] },
];

// Helper: normalize name for matching
const nameKey = (name: string): string =>
  name.replace(/[,.\-]/g, " ").split(/\s+/).map(s => s.toLowerCase().trim()).filter(Boolean).sort().join(" ");

// Find MARR project by grant number (strip leading digits and trailing suffixes)
function findMarrProject(grantNumber: string) {
  // Try exact match first
  let found = MARR_PROJECTS.find(p => grantNumber.includes(p.id) || p.id.includes(grantNumber));
  if (found) return found;
  
  // Strip version suffix (e.g., "5R34DA059509-02" -> "R34DA059509")
  const core = grantNumber.replace(/^\d+/, "").replace(/-\d+$/, "");
  found = MARR_PROJECTS.find(p => p.id === core || core.includes(p.id) || p.id.includes(core));
  return found || null;
}

// Find MARR projects by PI name
function findMarrProjectsByPi(piName: string) {
  const key = nameKey(piName);
  return MARR_PROJECTS.filter(p => {
    const pKey = nameKey(p.pi);
    // Check if last names match and first name starts similarly
    const keyParts = key.split(" ");
    const pParts = pKey.split(" ");
    return keyParts.some(k => pParts.includes(k)) && keyParts.length > 0;
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const stats = {
      investigators: { inserted: 0, skipped: 0 },
      organizations: { inserted: 0, skipped: 0 },
      grants: { inserted: 0, skipped: 0 },
      publications: { inserted: 0, skipped: 0 },
      software_tools: { inserted: 0, skipped: 0 },
      grant_investigators: { inserted: 0, skipped: 0 },
      investigator_organizations: { inserted: 0, skipped: 0 },
    };

    // 1. Read all cached grant data
    const { data: cachedGrants, error: cacheErr } = await supabase
      .from("nih_grants_cache")
      .select("grant_number, data");
    
    if (cacheErr) throw new Error(`Cache read error: ${cacheErr.message}`);
    if (!cachedGrants || cachedGrants.length === 0) {
      return new Response(
        JSON.stringify({ error: "No cached grant data found. Run nih-grants?action=refresh first." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${cachedGrants.length} cached grants...`);

    // Track created entities to avoid duplicates
    const orgMap = new Map<string, string>(); // org name -> org id
    const investigatorMap = new Map<string, string>(); // name key -> investigator id
    const pubMap = new Map<string, string>(); // pmid -> publication id

    // 2. Process each grant
    for (const cached of cachedGrants) {
      const g = cached.data as any;
      const grantNumber = cached.grant_number;
      const marr = findMarrProject(grantNumber);

      // --- ORGANIZATION ---
      const orgName = g.institution || "Unknown";
      if (orgName !== "Unknown" && !orgMap.has(orgName.toLowerCase())) {
        const { data: existingOrg } = await supabase
          .from("organizations")
          .select("id")
          .ilike("name", orgName)
          .maybeSingle();

        if (existingOrg) {
          orgMap.set(orgName.toLowerCase(), existingOrg.id);
          stats.organizations.skipped++;
        } else {
          const { data: newOrg, error: orgErr } = await supabase
            .from("organizations")
            .insert({ name: orgName })
            .select("id")
            .single();
          
          if (!orgErr && newOrg) {
            orgMap.set(orgName.toLowerCase(), newOrg.id);
            stats.organizations.inserted++;
          }
        }
      }

      // --- GRANT ---
      const { data: existingGrant } = await supabase
        .from("grants")
        .select("id")
        .eq("grant_number", grantNumber)
        .maybeSingle();

      let grantId: string;
      if (existingGrant) {
        grantId = existingGrant.id;
        stats.grants.skipped++;
      } else {
        const { data: newGrant, error: grantErr } = await supabase
          .from("grants")
          .insert({
            grant_number: grantNumber,
            title: g.title || "Unknown",
            abstract: g.abstract || null,
            award_amount: g.awardAmount || null,
            fiscal_year: g.fiscalYear || null,
            nih_link: g.nihLink || null,
          })
          .select("id")
          .single();

        if (grantErr || !newGrant) {
          console.error(`Failed to insert grant ${grantNumber}:`, grantErr);
          continue;
        }
        grantId = newGrant.id;
        stats.grants.inserted++;
      }

      // --- INVESTIGATORS from piDetails ---
      const piDetails: any[] = g.piDetails || [];
      for (const pi of piDetails) {
        const fullName = pi.fullName?.trim();
        if (!fullName) continue;
        const nk = nameKey(fullName);

        if (!investigatorMap.has(nk)) {
          const { data: existingInv } = await supabase
            .from("investigators")
            .select("id")
            .or(`name.ilike.%${pi.lastName}%`)
            .limit(20);

          // Find by name key match
          const match = existingInv?.find(inv => {
            // We need the name to compare, but we only have id. Let's search differently.
            return false;
          });

          // Just check if exact name exists
          const { data: exactMatch } = await supabase
            .from("investigators")
            .select("id, name")
            .ilike("name", fullName)
            .maybeSingle();

          if (exactMatch) {
            investigatorMap.set(nk, exactMatch.id);
            stats.investigators.skipped++;
          } else {
            // Gather skills & research areas from all MARR projects this PI is on
            const piMarrProjects = MARR_PROJECTS.filter(p => {
              const pKey = nameKey(p.pi);
              return nk === pKey || 
                nk.split(" ").some(part => pKey.includes(part) && part.length > 2);
            });

            // Also check if this PI's grant matches a MARR project
            if (marr && !piMarrProjects.find(p => p.id === marr.id)) {
              // Check if this PI is the main PI of the MARR project
              if (pi.isContactPi && nameKey(marr.pi) !== nk) {
                // Not the MARR PI, skip adding MARR data
              } else if (nameKey(marr.pi) === nk) {
                piMarrProjects.push(marr);
              }
            }

            const skills = [...new Set(piMarrProjects.flatMap(p => p.algorithmic))];
            const researchAreas = [...new Set(piMarrProjects.flatMap(p => p.computational))];

            const { data: newInv, error: invErr } = await supabase
              .from("investigators")
              .insert({
                name: fullName,
                profile_url: pi.profileId ? `https://reporter.nih.gov/search/results?pi_id=${pi.profileId}` : null,
                skills: skills.length > 0 ? skills : null,
                research_areas: researchAreas.length > 0 ? researchAreas : null,
              })
              .select("id")
              .single();

            if (!invErr && newInv) {
              investigatorMap.set(nk, newInv.id);
              stats.investigators.inserted++;
            } else {
              console.error(`Failed to insert investigator ${fullName}:`, invErr);
              continue;
            }
          }
        }

        const invId = investigatorMap.get(nk);
        if (!invId) continue;

        // --- GRANT_INVESTIGATORS junction ---
        const { data: existingGI } = await supabase
          .from("grant_investigators")
          .select("investigator_id")
          .eq("investigator_id", invId)
          .eq("grant_number", grantNumber)
          .maybeSingle();

        if (!existingGI) {
          const role = pi.isContactPi ? "contact_pi" : "co_pi";
          const { error: giErr } = await supabase
            .from("grant_investigators")
            .insert({ investigator_id: invId, grant_number: grantNumber, role });
          
          if (!giErr) stats.grant_investigators.inserted++;
        } else {
          stats.grant_investigators.skipped++;
        }

        // --- INVESTIGATOR_ORGANIZATIONS junction ---
        const orgId = orgMap.get(orgName.toLowerCase());
        if (orgId) {
          const { data: existingIO } = await supabase
            .from("investigator_organizations")
            .select("investigator_id")
            .eq("investigator_id", invId)
            .eq("organization_id", orgId)
            .maybeSingle();

          if (!existingIO) {
            const { error: ioErr } = await supabase
              .from("investigator_organizations")
              .insert({ investigator_id: invId, organization_id: orgId });
            
            if (!ioErr) stats.investigator_organizations.inserted++;
          } else {
            stats.investigator_organizations.skipped++;
          }
        }
      }

      // --- PUBLICATIONS ---
      const pubs: any[] = g.publications || [];
      for (const pub of pubs) {
        const pmid = String(pub.pmid);
        if (!pmid || pubMap.has(pmid)) continue;

        const { data: existingPub } = await supabase
          .from("publications")
          .select("id")
          .eq("pmid", pmid)
          .maybeSingle();

        if (existingPub) {
          pubMap.set(pmid, existingPub.id);
          stats.publications.skipped++;
          continue;
        }

        // Format authors
        let authorsStr = "";
        if (typeof pub.authors === "string") {
          authorsStr = pub.authors;
        } else if (Array.isArray(pub.authors)) {
          authorsStr = pub.authors.map((a: any) => a.fullName || `${a.firstName} ${a.lastName}`).join(", ");
        }

        const { data: newPub, error: pubErr } = await supabase
          .from("publications")
          .insert({
            pmid,
            title: pub.title || "Unknown",
            year: pub.year || null,
            journal: pub.journal || null,
            authors: authorsStr || null,
            citations: pub.citations || 0,
            rcr: pub.rcr || 0,
            doi: pub.doi || null,
            pubmed_link: pub.pubmedLink || `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
          })
          .select("id")
          .single();

        if (!pubErr && newPub) {
          pubMap.set(pmid, newPub.id);
          stats.publications.inserted++;
        } else {
          console.error(`Failed to insert publication ${pmid}:`, pubErr);
        }
      }
    }

    // 3. Populate software_tools from resources table
    const { data: softwareResources } = await supabase
      .from("resources")
      .select("*")
      .eq("resource_type", "software");

    if (softwareResources) {
      for (const r of softwareResources) {
        const meta = r.metadata as any || {};
        const { data: existing } = await supabase
          .from("software_tools")
          .select("id")
          .eq("name", r.name)
          .maybeSingle();

        if (existing) {
          stats.software_tools.skipped++;
          continue;
        }

        const { error: stErr } = await supabase
          .from("software_tools")
          .insert({
            name: r.name,
            description: r.description,
            repo_url: r.external_url,
            language: meta.implementation || null,
            resource_id: r.id,
          });

        if (!stErr) stats.software_tools.inserted++;
        else console.error(`Failed to insert software tool ${r.name}:`, stErr);
      }
    }

    console.log("Seed complete:", JSON.stringify(stats));

    return new Response(
      JSON.stringify({ success: true, stats }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Seed error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
