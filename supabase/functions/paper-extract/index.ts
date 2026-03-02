import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── LinkML enum values for structured extraction ──
const LINKML_ENUMS = {
  sensors: [
    "video cameras","neuropixels","thermal cameras","ultrasonic microphones",
    "RNA sequencing","heart rate sensors","eye tracker","infrared cameras",
    "wireless neural","IMU","microphones","RFID","respiration sensors",
    "accelerometer","EEG","EDA","plethsymography","intranasal thermistor",
    "EMG","GPS","neuroimaging sensors","iEEG","motion tracking",
    "cortisol wearable","epinephrine wearable","optically pumped magnetometers",
    "smartphone camera","skin temperature sensor",
  ],
  data_modalities: [
    "visual","neural","audio","molecular","kinematic","physiological","spatial","biochemical",
  ],
  approaches: [
    "pose estimation","object detection","feature extraction","behavior tracking",
    "graph modeling","self-supervised learning","physiological signal analysis",
    "speech analysis","source localization","deep learning","social network analysis",
    "clustering","facial expression analysis","EEG hyperscanning","emotion estimation",
    "correlation analysis","EMG tracking","neural activity modeling","stress analysis",
    "approach-avoidance modeling","augmented reality","virtual reality",
    "spatial navigation tracking","magnetometry","coherence analysis","memory analysis",
    "emotion correlation","ecological momentary assessment","mental state estimation",
    "multimodal analysis",
  ],
  data_analysis_method: [
    "Statistical analysis","Signal processing","Dimensionality reduction",
    "Dynamical systems modeling","Encoding models","Decoding models",
    "Correlation analysis","Regression models","Time-frequency analysis",
    "Bayesian inference","Network analysis","Other",
  ],
  software_type: [
    "Analysis","Behavioral quantification","Behavioral segmentation","Prediction",
    "Benchmark","Temporal data","Computer vision","ML model","End product",
    "Tracking","Regression model","VR/AR","Encoding","Synchronization",
    "Feature detection","Dimensionality reduction","Pose estimation",
  ],
  collected_data_type: [
    "Neural data","Behavioral data","Cognitive performance data",
    "Environmental data","Social interaction data","Wearable sensor data",
    "Physiological data","Biochemical data","Self-report data","Genetic data",
  ],
};

// ── Regex-based extractors ──
function extractWithRegex(text: string) {
  const grantPattern = /\b[A-Z]\d{2}[A-Z]{2}\d{6}\b/g;
  const orcidPattern = /\b\d{4}-\d{4}-\d{4}-\d{3}[\dX]\b/g;
  const doiPattern = /\b10\.\d{4,9}\/[^\s]+/g;

  const grants = [...new Set(text.match(grantPattern) || [])];
  const orcids = [...new Set(text.match(orcidPattern) || [])];
  const dois = [...new Set((text.match(doiPattern) || []).map(d => d.replace(/[.,;)\]]+$/, "")))];

  // Species detection from common neuroscience species
  const speciesPatterns: Record<string, RegExp> = {
    "Mus musculus": /\b(mice|mouse|mus musculus|murine)\b/i,
    "Rattus norvegicus": /\b(rats?|rattus norvegicus)\b/i,
    "Homo sapiens": /\b(humans?|homo sapiens|participants?|subjects?|patients?)\b/i,
    "Danio rerio": /\b(zebrafish|danio rerio)\b/i,
    "Drosophila melanogaster": /\b(drosophila|fruit fl(y|ies))\b/i,
    "Macaca mulatta": /\b(macaque|rhesus|macaca mulatta)\b/i,
    "Caenorhabditis elegans": /\b(c\.?\s*elegans|caenorhabditis elegans|nematode)\b/i,
    "Gryllus bimaculatus": /\b(cricket|gryllus)\b/i,
  };

  const species: string[] = [];
  for (const [name, pattern] of Object.entries(speciesPatterns)) {
    if (pattern.test(text)) species.push(name);
  }

  return { grant_numbers: grants, orcids, dois, study_species: species };
}

// ── LLM extraction via Lovable AI ──
async function extractWithLLM(text: string, apiKey: string) {
  const truncated = text.slice(0, 12000); // Stay within token limits

  const systemPrompt = `You are a neuroscience paper metadata extractor. Extract structured metadata from academic papers aligned to the BBQS LinkML schema.

Return a JSON object with these fields (use only values from the provided enums when applicable):

- title: string (paper title)
- authors: string (comma-separated author names)
- use_sensors: array from [${LINKML_ENUMS.sensors.join(", ")}]
- use_approaches: array from [${LINKML_ENUMS.approaches.join(", ")}]
- produce_data_modality: array from [${LINKML_ENUMS.data_modalities.join(", ")}]
- produce_data_type: array from [${LINKML_ENUMS.collected_data_type.join(", ")}]
- use_analysis_method: array from [${LINKML_ENUMS.data_analysis_method.join(", ")}]
- use_analysis_types: array (free-text analysis descriptions)
- develope_software_type: array from [${LINKML_ENUMS.software_type.join(", ")}]
- develope_hardware_type: array (free-text)
- keywords: array of 5-10 relevant keywords

Only return values you are confident about. Use empty arrays for uncertain fields. Return ONLY valid JSON, no markdown.`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Extract metadata from this paper text:\n\n${truncated}` },
      ],
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`AI gateway error: ${response.status} - ${err}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  return content ? JSON.parse(content) : {};
}

// ── Chat refinement ──
async function chatRefine(
  messages: Array<{ role: string; content: string }>,
  currentExtraction: Record<string, unknown>,
  apiKey: string,
) {
  const systemPrompt = `You are a neuroscience metadata assistant helping refine extracted paper metadata. 
The current extraction is: ${JSON.stringify(currentExtraction)}

Available LinkML enum values:
- sensors: ${LINKML_ENUMS.sensors.join(", ")}
- approaches: ${LINKML_ENUMS.approaches.join(", ")}
- data_modalities: ${LINKML_ENUMS.data_modalities.join(", ")}
- data_types: ${LINKML_ENUMS.collected_data_type.join(", ")}
- analysis_methods: ${LINKML_ENUMS.data_analysis_method.join(", ")}

Help the user refine the extraction. When they ask to add/remove/change entities, respond with updated values.
If you update fields, include a JSON block in your response like: \`\`\`json\n{"field_updates": {"field_name": ["new", "values"]}}\n\`\`\`
Otherwise just discuss naturally.`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`AI gateway error: ${response.status} - ${err}`);
  }

  const data = await response.json();
  const reply = data.choices?.[0]?.message?.content || "";

  // Try to extract field updates from the response
  let fieldUpdates: Record<string, unknown> = {};
  const jsonMatch = reply.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      fieldUpdates = parsed.field_updates || {};
    } catch { /* ignore parse errors */ }
  }

  return { reply, field_updates: fieldUpdates };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiKey = Deno.env.get("LOVABLE_API_KEY")!;

    const authHeader = req.headers.get("authorization");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const anonClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader || "" } } },
    );
    const { data: { user } } = await anonClient.auth.getUser();

    const body = await req.json();
    const { action } = body;

    if (action === "extract") {
      const { pdf_base64, extraction_id } = body;
      if (!pdf_base64 || !extraction_id) {
        return new Response(JSON.stringify({ error: "pdf_base64 and extraction_id required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Decode base64 PDF to bytes, then extract readable text
      const binaryStr = atob(pdf_base64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      // Extract printable text from PDF binary (simple text extraction)
      const rawText = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
      // Pull text between BT/ET markers and parenthesized strings
      const textChunks: string[] = [];
      // Method 1: Extract parenthesized text strings from PDF
      const parenRegex = /\(([^)]{2,})\)/g;
      let m: RegExpExecArray | null;
      while ((m = parenRegex.exec(rawText)) !== null) {
        const cleaned = m[1]
          .replace(/\\n/g, " ")
          .replace(/\\r/g, " ")
          .replace(/\\\\/g, "\\")
          .replace(/\\([()])/g, "$1")
          .trim();
        if (cleaned.length > 1 && /[a-zA-Z]/.test(cleaned)) {
          textChunks.push(cleaned);
        }
      }
      const text = textChunks.join(" ").replace(/\s+/g, " ").trim();

      if (!text || text.length < 50) {
        // Fallback: just grab all printable ASCII runs
        const printableRuns = rawText.match(/[a-zA-Z0-9 .,;:!?()\-'"\/]{10,}/g) || [];
        const fallbackText = printableRuns.join(" ").slice(0, 30000);
        if (fallbackText.length < 50) {
          return new Response(JSON.stringify({ error: "Could not extract readable text from this PDF. Try a text-based (non-scanned) PDF." }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        // Use fallback text
        var extractedText = fallbackText;
      } else {
        var extractedText = text.slice(0, 30000);
      }

      // Rule-based extraction
      const regexResults = extractWithRegex(extractedText);

      // LLM extraction
      const llmResults = await extractWithLLM(extractedText, openaiKey);

      // Merge: regex results take priority for structured identifiers
      const merged = {
        title: llmResults.title || null,
        authors: llmResults.authors || null,
        doi: regexResults.dois[0] || null,
        grant_numbers: regexResults.grant_numbers,
        orcids: regexResults.orcids,
        study_species: [
          ...new Set([...regexResults.study_species, ...(llmResults.study_species || [])]),
        ],
        use_sensors: llmResults.use_sensors || [],
        use_approaches: llmResults.use_approaches || [],
        produce_data_modality: llmResults.produce_data_modality || [],
        produce_data_type: llmResults.produce_data_type || [],
        use_analysis_method: llmResults.use_analysis_method || [],
        use_analysis_types: llmResults.use_analysis_types || [],
        develope_software_type: llmResults.develope_software_type || [],
        develope_hardware_type: llmResults.develope_hardware_type || [],
        keywords: llmResults.keywords || [],
      };

      // Update extraction record
      const { error: updateErr } = await supabase
        .from("paper_extractions")
        .update({
          ...merged,
          raw_text: extractedText.slice(0, 50000),
          status: "completed",
          extracted_metadata: { regex: regexResults, llm: llmResults },
        })
        .eq("id", extraction_id);

      if (updateErr) throw updateErr;

      return new Response(JSON.stringify({ extraction: merged }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "chat") {
      const { messages, extraction_id } = body;
      if (!messages || !extraction_id) {
        return new Response(JSON.stringify({ error: "messages and extraction_id required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get current extraction
      const { data: extraction } = await supabase
        .from("paper_extractions")
        .select("*")
        .eq("id", extraction_id)
        .single();

      const currentData = {
        title: extraction?.title,
        study_species: extraction?.study_species,
        use_sensors: extraction?.use_sensors,
        use_approaches: extraction?.use_approaches,
        produce_data_modality: extraction?.produce_data_modality,
        produce_data_type: extraction?.produce_data_type,
        use_analysis_method: extraction?.use_analysis_method,
        keywords: extraction?.keywords,
      };

      const result = await chatRefine(messages, currentData, openaiKey);

      // If there are field updates, apply them
      if (Object.keys(result.field_updates).length > 0) {
        await supabase
          .from("paper_extractions")
          .update(result.field_updates)
          .eq("id", extraction_id);
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("paper-extract error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
