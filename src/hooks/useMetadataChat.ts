import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { showUndoableToast } from "@/lib/curation-audit";

export interface ProjectCandidate {
  grant_number: string;
  title: string;
  pi?: string;
  institution?: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  /** When set, this assistant message offers project candidates for the user to select. */
  candidates?: ProjectCandidate[];
  /** When set, this assistant message proposes adding a new grant from NIH RePORTER. */
  proposeAddGrant?: string;
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
  conversationId: string | null;
  lastProposed: boolean;
}

interface UseMetadataChatOptions {
  /** "apply" (default): chat mutates project metadata directly.
   *  "propose": chat writes suggestions to pending_changes for team review. */
  mode?: "apply" | "propose";
}

export function useMetadataChat(grantNumber: string | null, options: UseMetadataChatOptions = {}) {
  const { mode = "apply" } = options;
  const { user, session } = useAuth();
  const [state, setState] = useState<MetadataChatState>({
    messages: [],
    isLoading: false,
    completeness: 0,
    fieldsUpdated: [],
    lastValidation: null,
    conversationId: null,
    lastProposed: false,
  });
  const loadedGrantRef = useRef<string | null>(null);

  // Load existing conversation when grant changes
  useEffect(() => {
    if (!grantNumber || !user) {
      setState(prev => ({ ...prev, messages: [], conversationId: null, completeness: 0, fieldsUpdated: [], lastValidation: null }));
      loadedGrantRef.current = null;
      return;
    }

    if (loadedGrantRef.current === grantNumber) return;
    loadedGrantRef.current = grantNumber;

    const loadConversation = async () => {
      const { data: convos } = await supabase
        .from("chat_conversations")
        .select("id")
        .eq("user_id", user.id)
        .eq("title", `metadata:${grantNumber}`)
        .order("updated_at", { ascending: false })
        .limit(1);

      if (convos && convos.length > 0) {
        const convoId = convos[0].id;
        const { data: msgs } = await supabase
          .from("chat_messages")
          .select("role, content")
          .eq("conversation_id", convoId)
          .order("created_at", { ascending: true });

        setState(prev => ({
          ...prev,
          conversationId: convoId,
          messages: (msgs || []).map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
        }));
      } else {
        setState(prev => ({ ...prev, conversationId: null, messages: [] }));
      }
    };

    loadConversation();
  }, [grantNumber, user]);

  /** Load a specific conversation by ID (used by history sidebar) */
  const loadConversationById = useCallback(async (conversationId: string, forGrantNumber: string) => {
    if (!user) return;

    loadedGrantRef.current = forGrantNumber;

    const { data: msgs } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    setState(prev => ({
      ...prev,
      conversationId,
      messages: (msgs || []).map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
      completeness: 0,
      fieldsUpdated: [],
      lastValidation: null,
    }));
  }, [user]);

  const ensureConversation = useCallback(async (): Promise<string | null> => {
    if (!user || !session || !grantNumber) return null;
    if (state.conversationId) return state.conversationId;

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();

    const { data, error } = await supabase
      .from("chat_conversations")
      .insert({
        user_id: user.id,
        title: `metadata:${grantNumber}`,
        organization_id: profile?.organization_id || null,
      })
      .select("id")
      .single();

    if (error || !data) {
      console.error("Failed to create conversation:", error);
      return null;
    }

    setState(prev => ({ ...prev, conversationId: data.id }));
    return data.id;
  }, [user, session, grantNumber, state.conversationId]);

  const persistMessage = useCallback(async (
    conversationId: string,
    role: "user" | "assistant",
    content: string,
  ) => {
    if (!user || !session) return;

    const { error: insertError } = await supabase.from("chat_messages").insert({
      conversation_id: conversationId,
      user_id: user.id,
      role,
      content,
      model: role === "assistant" ? "google/gemini-3-flash-preview" : null,
    });

    if (insertError) {
      console.error("Failed to persist chat message:", insertError);
      throw insertError;
    }

    const { error: updateError } = await supabase
      .from("chat_conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);

    if (updateError) {
      console.error("Failed to update conversation timestamp:", updateError);
      throw updateError;
    }
  }, [user, session]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const userMsg: ChatMessage = { role: "user", content: content.trim() };
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMsg],
      isLoading: true,
      lastValidation: null,
    }));

    // ── Pre-selection mode: no project chosen yet → route through assistant-router ──
    if (!grantNumber) {
      try {
        const apiMessages = [...state.messages, userMsg].map(m => ({ role: m.role, content: m.content }));
        const { data, error } = await supabase.functions.invoke("assistant-router", {
          body: { messages: apiMessages },
        });
        if (error) throw error;
        const assistantMsg: ChatMessage = {
          role: "assistant",
          content: data?.reply || "I'm not sure how to help with that yet.",
          candidates: Array.isArray(data?.candidates) && data.candidates.length > 0 ? data.candidates : undefined,
          proposeAddGrant: data?.intent === "add_grant" ? data?.grant_number : undefined,
        };
        setState(prev => ({
          ...prev,
          messages: [...prev.messages, assistantMsg],
          isLoading: false,
        }));
      } catch (err: any) {
        console.error("assistant-router error:", err);
        setState(prev => ({
          ...prev,
          messages: [...prev.messages, { role: "assistant", content: `Error: ${err.message || "Something went wrong."}` }],
          isLoading: false,
        }));
      }
      return;
    }

    // ── Project-selected mode: existing metadata-chat flow ──
    if (!user || !session) {
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, {
          role: "assistant" as const,
          content: `Please sign in on this URL to use the metadata assistant. I need a live session before I can save chat history for **${grantNumber}**.`,
        }],
        isLoading: false,
      }));
      return;
    }

    try {
      const convoId = await ensureConversation();
      if (convoId) await persistMessage(convoId, "user", content.trim());

      const apiMessages = [...state.messages, userMsg].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const { data, error } = await supabase.functions.invoke("metadata-chat", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          messages: apiMessages,
          grant_number: grantNumber,
          mode,
          conversation_id: convoId,
        },
      });

      if (error) throw error;

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: data.reply || "I couldn't process that. Could you rephrase?",
      };

      if (convoId) await persistMessage(convoId, "assistant", assistantMsg.content);

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMsg],
        isLoading: false,
        completeness: data.metadata_completeness ?? prev.completeness,
        fieldsUpdated: data.fields_updated?.length ? data.fields_updated : prev.fieldsUpdated,
        lastValidation: data.validation ?? null,
        lastProposed: !!data.proposed,
      }));

      // If chat applied edits directly (not propose mode), surface an Undo toast
      // tied to the most recent audit row.
      if (!data.proposed && Array.isArray(data.audit_ids) && data.audit_ids.length > 0) {
        const fieldCount = data.fields_updated?.length ?? data.audit_ids.length;
        showUndoableToast({
          title: `${fieldCount} field${fieldCount === 1 ? "" : "s"} updated by assistant`,
          description: "Click Undo to revert the last change.",
          auditId: data.audit_ids[data.audit_ids.length - 1],
        });
      }
    } catch (err: any) {
      console.error("metadata-chat error:", err);
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, { role: "assistant", content: `Error: ${err.message || "Something went wrong."}` }],
        isLoading: false,
      }));
    }
  }, [grantNumber, user, session, state.messages, ensureConversation, persistMessage, mode]);

  const clearChat = useCallback(async () => {
    if (state.conversationId && user) {
      await supabase
        .from("chat_conversations")
        .delete()
        .eq("id", state.conversationId);
    }
    loadedGrantRef.current = null;
    setState({
      messages: [],
      isLoading: false,
      completeness: 0,
      fieldsUpdated: [],
      lastValidation: null,
      conversationId: null,
      lastProposed: false,
    });
  }, [state.conversationId, user]);

  /** Delete a conversation by ID (used by history sidebar) */
  const deleteConversation = useCallback(async (conversationId: string) => {
    if (!user) return;
    await supabase
      .from("chat_conversations")
      .delete()
      .eq("id", conversationId);

    // If it's the active one, clear state
    if (conversationId === state.conversationId) {
      loadedGrantRef.current = null;
      setState({
        messages: [],
        isLoading: false,
        completeness: 0,
        fieldsUpdated: [],
        lastValidation: null,
        conversationId: null,
        lastProposed: false,
      });
    }
  }, [user, state.conversationId]);

  /** Append a passive assistant message (no LLM call). Useful for system status updates. */
  const appendAssistantMessage = useCallback((content: string) => {
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, { role: "assistant", content }],
      isLoading: false,
    }));
  }, []);

  return {
    messages: state.messages,
    isLoading: state.isLoading,
    completeness: state.completeness,
    fieldsUpdated: state.fieldsUpdated,
    lastValidation: state.lastValidation,
    conversationId: state.conversationId,
    lastProposed: state.lastProposed,
    sendMessage,
    clearChat,
    loadConversationById,
    deleteConversation,
    appendAssistantMessage,
  };
}
