export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          context_sources: Json | null
          conversation_id: string
          created_at: string
          id: string
          latency_ms: number | null
          model: string | null
          role: string
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          content: string
          context_sources?: Json | null
          conversation_id: string
          created_at?: string
          id?: string
          latency_ms?: number | null
          model?: string | null
          role: string
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          content?: string
          context_sources?: Json | null
          conversation_id?: string
          created_at?: string
          id?: string
          latency_ms?: number | null
          model?: string | null
          role?: string
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      community_mcp_servers: {
        Row: {
          approved_at: string | null
          author: string
          description: string
          github_url: string | null
          id: string
          name: string
          pip_package: string | null
          species: string[] | null
          status: string
          submitted_at: string
          submitted_by: string | null
          tools: string[]
          transport: string
          url: string
        }
        Insert: {
          approved_at?: string | null
          author: string
          description: string
          github_url?: string | null
          id?: string
          name: string
          pip_package?: string | null
          species?: string[] | null
          status?: string
          submitted_at?: string
          submitted_by?: string | null
          tools?: string[]
          transport?: string
          url: string
        }
        Update: {
          approved_at?: string | null
          author?: string
          description?: string
          github_url?: string | null
          id?: string
          name?: string
          pip_package?: string | null
          species?: string[] | null
          status?: string
          submitted_at?: string
          submitted_by?: string | null
          tools?: string[]
          transport?: string
          url?: string
        }
        Relationships: []
      }
      knowledge_embeddings: {
        Row: {
          content: string
          created_at: string
          embedding: string | null
          id: string
          metadata: Json | null
          source_id: string
          source_type: string
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          source_id: string
          source_type: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          source_id?: string
          source_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      ner_entities: {
        Row: {
          context_sentences: Json | null
          created_at: string
          embedding: string | null
          entity: string
          entity_id: string
          extraction_id: string
          id: string
          judge_scores: Json | null
          label: string
          marr_level: string
          marr_level_name: string
          marr_rationale: string | null
          ontology_id: string | null
          ontology_label: string | null
          paper_location: Json | null
          remarks: Json | null
        }
        Insert: {
          context_sentences?: Json | null
          created_at?: string
          embedding?: string | null
          entity: string
          entity_id: string
          extraction_id: string
          id?: string
          judge_scores?: Json | null
          label: string
          marr_level: string
          marr_level_name: string
          marr_rationale?: string | null
          ontology_id?: string | null
          ontology_label?: string | null
          paper_location?: Json | null
          remarks?: Json | null
        }
        Update: {
          context_sentences?: Json | null
          created_at?: string
          embedding?: string | null
          entity?: string
          entity_id?: string
          extraction_id?: string
          id?: string
          judge_scores?: Json | null
          label?: string
          marr_level?: string
          marr_level_name?: string
          marr_rationale?: string | null
          ontology_id?: string | null
          ontology_label?: string | null
          paper_location?: Json | null
          remarks?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ner_entities_extraction_id_fkey"
            columns: ["extraction_id"]
            isOneToOne: false
            referencedRelation: "ner_extractions"
            referencedColumns: ["id"]
          },
        ]
      }
      ner_extractions: {
        Row: {
          abstract: string | null
          created_at: string
          doi: string | null
          error_message: string | null
          extracted_by: string | null
          extraction_date: string
          grant_number: string | null
          id: string
          paper_id: string
          paper_title: string
          pmid: string | null
          schema_version: string
          status: string
          updated_at: string
        }
        Insert: {
          abstract?: string | null
          created_at?: string
          doi?: string | null
          error_message?: string | null
          extracted_by?: string | null
          extraction_date?: string
          grant_number?: string | null
          id?: string
          paper_id: string
          paper_title: string
          pmid?: string | null
          schema_version?: string
          status?: string
          updated_at?: string
        }
        Update: {
          abstract?: string | null
          created_at?: string
          doi?: string | null
          error_message?: string | null
          extracted_by?: string | null
          extraction_date?: string
          grant_number?: string | null
          id?: string
          paper_id?: string
          paper_title?: string
          pmid?: string | null
          schema_version?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      search_entities_by_similarity: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          context_sentences: Json
          entity: string
          id: string
          label: string
          marr_level: string
          ontology_id: string
          similarity: number
        }[]
      }
      search_knowledge_embeddings: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          metadata: Json
          similarity: number
          source_id: string
          source_type: string
          title: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
