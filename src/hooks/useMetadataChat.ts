import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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
  conversationId: string | null;
}

export function useMetadataChat(grantNumber: string | null) {
  const { user } = useAuth();
  const [state, setState] = useState<MetadataChatState>({
    messages: [],
    isLoading: false,
    completeness: 0,
    fieldsUpdated: [],
    lastValidation: null,
    conversationId: null,
  });
  const abortRef = useRef<AbortController | null>(null);
  const loadedGrantRef = useRef<string | null>(null);

  // Load existing conversation when grant changes
  useEffect(() => {
    if (!grantNumber || !user) {
      setState(prev => ({ ...prev, messages: [], conversationId: null, completeness: 0, fieldsUpdated: [], lastValidation: null }));
      loadedGrantRef.current = null;
      return;
    }

    // Avoid reloading if same grant
    if (loadedGrantRef.current === grantNumber) return;
    loadedGrantRef.current = grantNumber;

    const loadConversation = async () => {
      // Find existing conversation for this user + grant
      const { data: convos } = await supabase
        .from("chat_conversations")
        .select("id")
        .eq("user_id", user.id)
        .eq("title", `metadata:${grantNumber}`)
        .order("updated_at", { ascending: false })
        .limit(1);

      if (convos && convos.length > 0) {
        const convoId = convos[0].id;
        // Load messages
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

  const ensureConversation = useCallback(async (): Promise<string | null> => {
    if (!user || !grantNumber) return null;

    if (state.conversationId) return state.conversationId;

    // Create new conversation
    const { data, error } = await supabase
      .from("chat_conversations")
      .insert({
        user_id: user.id,
        title: `metadata:${grantNumber}`,
        organization_id: null, // Will be set by profile lookup below
      })
      .select("id")
      .single();

    if (error || !data) {
      console.error("Failed to create conversation:", error);
      return null;
    }

    // Try to set organization_id from user's profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.organization_id) {
      await supabase
        .from("chat_conversations")
        .update({ organization_id: profile.organization_id })
        .eq("id", data.id);
    }

    setState(prev => ({ ...prev, conversationId: data.id }));
    return data.id;
  }, [user, grantNumber, state.conversationId]);

  const persistMessage = useCallback(async (
    conversationId: string,
    role: "user" | "assistant",
    content: string,
  ) => {
    if (!user) return;
    await supabase.from("chat_messages").insert({
      conversation_id: conversationId,
      user_id: user.id,
      role,
      content,
      model: role === "assistant" ? "google/gemini-3-flash-preview" : null,
    });

    // Touch conversation updated_at
    await supabase
      .from("chat_conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);
  }, [user]);

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
      // Ensure we have a conversation record
      const convoId = await ensureConversation();

      // Persist user message
      if (convoId) {
        await persistMessage(convoId, "user", content.trim());
      }

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

      // Persist assistant message
      if (convoId) {
        await persistMessage(convoId, "assistant", assistantMsg.content);
      }

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
      const errorContent = `Error: ${err.message || "Something went wrong."}`;
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, { role: "assistant", content: errorContent }],
        isLoading: false,
      }));
    }
  }, [grantNumber, state.messages, ensureConversation, persistMessage]);

  const clearChat = useCallback(async () => {
    // Delete the conversation from the DB if it exists
    if (state.conversationId && user) {
      // Messages will remain but conversation is effectively abandoned
      // We just create a fresh one next time
      await supabase
        .from("chat_conversations")
        .delete()
        .eq("id", state.conversationId);
    }

    loadedGrantRef.current = null; // Allow reload
    setState({
      messages: [],
      isLoading: false,
      completeness: 0,
      fieldsUpdated: [],
      lastValidation: null,
      conversationId: null,
    });
  }, [state.conversationId, user]);

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
