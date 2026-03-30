import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface PaperExtraction {
  id: string;
  filename: string;
  status: string;
  title: string | null;
  doi: string | null;
  extracted_metadata: {
    authors?: string;
    grant_numbers?: string[];
    orcids?: string[];
    study_species?: string[];
    use_sensors?: string[];
    use_approaches?: string[];
    produce_data_modality?: string[];
    produce_data_type?: string[];
    use_analysis_method?: string[];
    use_analysis_types?: string[];
    develope_software_type?: string[];
    develope_hardware_type?: string[];
    keywords?: string[];
    [key: string]: any;
  };
}

export interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

export type ExtractionStep = "idle" | "reading" | "uploading" | "extracting" | "done";

export function usePaperExtractor() {
  const [extraction, setExtraction] = useState<PaperExtraction | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionStep, setExtractionStep] = useState<ExtractionStep>("idle");
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const { toast } = useToast();

  const uploadAndExtract = useCallback(async (file: File) => {
    setIsExtracting(true);
    setExtractionStep("reading");
    setChatMessages([]);
    setExtraction(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in to use the Paper Extractor.");

      // Read PDF as base64 (PDFs are binary, can't use .text())
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);

      setExtractionStep("uploading");

      // Create extraction record
      const { data: record, error: insertErr } = await supabase
        .from("paper_extractions")
        .insert({
          user_id: user.id,
          filename: file.name,
          status: "processing",
        })
        .select()
        .single();

      if (insertErr) throw insertErr;

      // Upload file to storage
      const storagePath = `${user.id}/${record.id}/${file.name}`;
      await supabase.storage.from("paper-uploads").upload(storagePath, file);

      // Update storage path
      await supabase
        .from("paper_extractions")
        .update({ storage_path: storagePath })
        .eq("id", record.id);

      setExtractionStep("extracting");

      // Call extraction edge function
      const { data, error } = await supabase.functions.invoke("paper-extract", {
        body: { action: "extract", pdf_base64: base64, extraction_id: record.id },
      });

      if (error) throw error;

      setExtractionStep("done");
      setExtraction({
        id: record.id,
        filename: file.name,
        status: "completed",
        ...data.extraction,
      });

      toast({ title: "Extraction complete", description: `Extracted metadata from ${file.name}` });
    } catch (err: any) {
      console.error("Extraction error:", err);
      setExtractionStep("idle");
      toast({ title: "Extraction failed", description: err.message, variant: "destructive" });
    } finally {
      setIsExtracting(false);
    }
  }, [toast]);

  const sendChat = useCallback(async (content: string) => {
    if (!extraction || !content.trim()) return;

    const userMsg: ChatMsg = { role: "user", content: content.trim() };
    setChatMessages(prev => [...prev, userMsg]);
    setIsChatLoading(true);

    try {
      const allMessages = [...chatMessages, userMsg].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const { data, error } = await supabase.functions.invoke("paper-extract", {
        body: { action: "chat", messages: allMessages, extraction_id: extraction.id },
      });

      if (error) throw error;

      const assistantMsg: ChatMsg = {
        role: "assistant",
        content: data.reply || "I couldn't process that.",
      };
      setChatMessages(prev => [...prev, assistantMsg]);

      // If fields were updated, refresh extraction
      if (data.field_updates && Object.keys(data.field_updates).length > 0) {
        setExtraction(prev => prev ? { ...prev, ...data.field_updates } : prev);
      }
    } catch (err: any) {
      setChatMessages(prev => [
        ...prev,
        { role: "assistant", content: `Error: ${err.message}` },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  }, [extraction, chatMessages]);

  const clearAll = useCallback(() => {
    setExtraction(null);
    setChatMessages([]);
    setExtractionStep("idle");
  }, []);

  return {
    extraction,
    isExtracting,
    extractionStep,
    chatMessages,
    isChatLoading,
    uploadAndExtract,
    sendChat,
    clearAll,
  };
}
