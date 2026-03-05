import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ValidationCheck {
  protocol: string;
  field: string;
  status: "pass" | "warning" | "fail";
  message: string;
  suggestions?: string[];
}

export interface ValidationResult {
  overall_status: "approved" | "needs_review" | "rejected";
  summary: { total_checks: number; passed: number; warnings: number; failed: number };
  protocols_run: string[];
  checks: ValidationCheck[];
}

interface MetadataChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  completeness: number;
  fieldsUpdated: string[];
  lastValidation: ValidationResult | null;
}

export function useMetadataChat(grantNumber: string | null) {
  const [state, setState] = useState<MetadataChatState>({
    messages: [],
    isLoading: false,
    completeness: 0,
    fieldsUpdated: [],
    lastValidation: null,
  });
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    if (!grantNumber || !content.trim()) return;

    const userMsg: ChatMessage = { role: "user", content: content.trim() };
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMsg],
      isLoading: true,
      lastValidation: null,
    }));

    try {
      const apiMessages = [...state.messages, userMsg].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const { data, error } = await supabase.functions.invoke("metadata-chat", {
        body: { messages: apiMessages, grant_number: grantNumber },
      });

      if (error) throw error;

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: data.reply || "I couldn't process that. Could you rephrase?",
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMsg],
        isLoading: false,
        completeness: data.metadata_completeness ?? prev.completeness,
        fieldsUpdated: data.fields_updated?.length ? data.fields_updated : prev.fieldsUpdated,
        lastValidation: data.validation ?? null,
      }));
    } catch (err: any) {
      console.error("metadata-chat error:", err);
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, { role: "assistant", content: `Error: ${err.message || "Something went wrong."}` }],
        isLoading: false,
      }));
    }
  }, [grantNumber, state.messages]);

  const clearChat = useCallback(() => {
    setState({ messages: [], isLoading: false, completeness: 0, fieldsUpdated: [], lastValidation: null });
  }, []);

  return {
    messages: state.messages,
    isLoading: state.isLoading,
    completeness: state.completeness,
    fieldsUpdated: state.fieldsUpdated,
    lastValidation: state.lastValidation,
    sendMessage,
    clearChat,
  };
}
