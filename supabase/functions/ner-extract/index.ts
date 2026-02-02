import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const NER_SYSTEM_PROMPT = `You are a specialized Named Entity Recognition (NER) system for neuroscience research papers. Your task is to extract entities from paper abstracts and classify them according to Marr's three levels of analysis:

## Marr's Levels:
- **L1 (Computational)**: What is the goal of the computation? What problem is being solved? Examples: visual perception, motor control, memory encoding, decision making, attention allocation.
- **L2 (Algorithmic)**: How is the computation performed? What representations and algorithms are used? Examples: Bayesian inference, reinforcement learning, predictive coding, neural network architectures, coding schemes.
- **L3 (Implementational)**: How is it physically realized? What neural structures implement the computation? Examples: brain regions (cortex, hippocampus), cell types (pyramidal neurons), neurotransmitters, circuits.

## Entity Labels to Extract:
- ANATOMICAL_REGION: Brain regions, structures (L3)
- CELL_TYPE: Neuron types, glial cells (L3)
- NEUROTRANSMITTER: Chemical messengers (L3)
- CIRCUIT: Neural pathways, connections (L3)
- COGNITIVE_FUNCTION: Mental processes, behaviors (L1)
- COMPUTATIONAL_PRINCIPLE: Algorithms, theories (L2)
- MEASUREMENT_TECHNIQUE: Methods, tools (L3)
- DISEASE_CONDITION: Disorders, pathologies (L3)

## Output Format:
Return a JSON object with this structure:
{
  "entities": [
    {
      "entity": "exact text from abstract",
      "label": "ENTITY_LABEL",
      "marr_level": "L1" | "L2" | "L3",
      "marr_level_name": "computational" | "algorithmic" | "implementational",
      "ontology_id": "UBERON:XXXXX or CL:XXXXX or GO:XXXXX if known, otherwise null",
      "ontology_label": "standard ontology term if known",
      "marr_rationale": "Brief explanation of why this level",
      "context_sentence": "The sentence containing this entity",
      "paper_location": "abstract",
      "judge_score": 0.0-1.0 confidence score
    }
  ]
}

Be thorough but precise. Only extract entities that are clearly scientific terms. Provide ontology IDs when you're confident (UBERON for anatomy, CL for cells, GO for functions).`;

interface ExtractionRequest {
  pmid: string;
  title: string;
  abstract: string;
  grant_number?: string;
  doi?: string;
}

interface ExtractedEntity {
  entity: string;
  label: string;
  marr_level: string;
  marr_level_name: string;
  ontology_id: string | null;
  ontology_label: string | null;
  marr_rationale: string;
  context_sentence: string;
  paper_location: string;
  judge_score: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const papers: ExtractionRequest[] = body.papers || [];

    if (papers.length === 0) {
      return new Response(
        JSON.stringify({ error: "No papers provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${papers.length} papers for NER extraction`);

    const results = [];

    for (const paper of papers) {
      try {
        // Check if already extracted
        const { data: existing } = await supabase
          .from("ner_extractions")
          .select("id, status")
          .eq("pmid", paper.pmid)
          .single();

        let extractionId: string;

        if (existing) {
          extractionId = existing.id;
          // Update status to processing
          await supabase
            .from("ner_extractions")
            .update({ status: "processing", error_message: null })
            .eq("id", extractionId);
          
          // Delete old entities for re-extraction
          await supabase
            .from("ner_entities")
            .delete()
            .eq("extraction_id", extractionId);
        } else {
          // Create new extraction record
          const { data: newExtraction, error: insertError } = await supabase
            .from("ner_extractions")
            .insert({
              paper_id: `PMID:${paper.pmid}`,
              pmid: paper.pmid,
              doi: paper.doi || null,
              paper_title: paper.title,
              abstract: paper.abstract,
              grant_number: paper.grant_number || null,
              status: "processing",
              extracted_by: user.id,
            })
            .select("id")
            .single();

          if (insertError) {
            console.error(`Error creating extraction record for ${paper.pmid}:`, insertError);
            results.push({ pmid: paper.pmid, success: false, error: insertError.message });
            continue;
          }
          extractionId = newExtraction.id;
        }

        // Call Lovable AI for NER extraction
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: NER_SYSTEM_PROMPT },
              {
                role: "user",
                content: `Extract entities from this paper:\n\nTitle: ${paper.title}\n\nAbstract: ${paper.abstract}`,
              },
            ],
            temperature: 0.1,
          }),
        });

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text();
          console.error(`AI API error for ${paper.pmid}:`, aiResponse.status, errorText);
          
          await supabase
            .from("ner_extractions")
            .update({ status: "failed", error_message: `AI API error: ${aiResponse.status}` })
            .eq("id", extractionId);
          
          results.push({ pmid: paper.pmid, success: false, error: `AI API error: ${aiResponse.status}` });
          continue;
        }

        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content;

        if (!content) {
          await supabase
            .from("ner_extractions")
            .update({ status: "failed", error_message: "Empty AI response" })
            .eq("id", extractionId);
          
          results.push({ pmid: paper.pmid, success: false, error: "Empty AI response" });
          continue;
        }

        // Parse JSON from response (handle markdown code blocks)
        let parsedEntities: { entities: ExtractedEntity[] };
        try {
          const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                           content.match(/```\s*([\s\S]*?)\s*```/) ||
                           [null, content];
          const jsonStr = jsonMatch[1] || content;
          parsedEntities = JSON.parse(jsonStr.trim());
        } catch (parseError) {
          console.error(`JSON parse error for ${paper.pmid}:`, parseError);
          await supabase
            .from("ner_extractions")
            .update({ status: "failed", error_message: "Failed to parse AI response" })
            .eq("id", extractionId);
          
          results.push({ pmid: paper.pmid, success: false, error: "Failed to parse AI response" });
          continue;
        }

        // Insert entities
        const entities = parsedEntities.entities || [];
        const entityRecords = entities.map((e, idx) => ({
          extraction_id: extractionId,
          entity_id: `entity:${paper.pmid}:${idx}`,
          entity: e.entity,
          label: e.label,
          marr_level: e.marr_level,
          marr_level_name: e.marr_level_name,
          ontology_id: e.ontology_id,
          ontology_label: e.ontology_label,
          marr_rationale: e.marr_rationale,
          context_sentences: [e.context_sentence],
          paper_location: [e.paper_location || "abstract"],
          judge_scores: [e.judge_score || 0.8],
          remarks: [`Extracted by Lovable AI on ${new Date().toISOString()}`],
        }));

        if (entityRecords.length > 0) {
          const { error: entityError } = await supabase
            .from("ner_entities")
            .insert(entityRecords);

          if (entityError) {
            console.error(`Error inserting entities for ${paper.pmid}:`, entityError);
          }
        }

        // Mark as completed
        await supabase
          .from("ner_extractions")
          .update({ status: "completed" })
          .eq("id", extractionId);

        results.push({ 
          pmid: paper.pmid, 
          success: true, 
          entity_count: entities.length,
          extraction_id: extractionId
        });

        console.log(`Extracted ${entities.length} entities from ${paper.pmid}`);

        // Small delay between papers to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (paperError) {
        console.error(`Error processing paper ${paper.pmid}:`, paperError);
        results.push({ 
          pmid: paper.pmid, 
          success: false, 
          error: paperError instanceof Error ? paperError.message : "Unknown error" 
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const totalEntities = results.reduce((sum, r) => sum + (r.entity_count || 0), 0);

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        summary: {
          processed: papers.length,
          successful: successCount,
          failed: papers.length - successCount,
          total_entities: totalEntities
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("NER extraction error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
