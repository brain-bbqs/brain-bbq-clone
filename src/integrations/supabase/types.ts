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
      allowed_domains: {
        Row: {
          created_at: string
          domain: string
          id: string
          organization_id: string
        }
        Insert: {
          created_at?: string
          domain: string
          id?: string
          organization_id: string
        }
        Update: {
          created_at?: string
          domain?: string
          id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "allowed_domains_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_clicks: {
        Row: {
          created_at: string
          element_href: string | null
          element_tag: string | null
          element_text: string | null
          id: string
          path: string
          section: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          element_href?: string | null
          element_tag?: string | null
          element_text?: string | null
          id?: string
          path: string
          section?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          element_href?: string | null
          element_tag?: string | null
          element_text?: string | null
          id?: string
          path?: string
          section?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      analytics_pageviews: {
        Row: {
          created_at: string
          id: string
          path: string
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          path: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          path?: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
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
      edit_history: {
        Row: {
          chat_context: Json | null
          created_at: string
          edited_by: string
          field_name: string
          grant_number: string
          id: string
          new_value: Json | null
          old_value: Json | null
          project_id: string | null
        }
        Insert: {
          chat_context?: Json | null
          created_at?: string
          edited_by?: string
          field_name: string
          grant_number: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          project_id?: string | null
        }
        Update: {
          chat_context?: Json | null
          created_at?: string
          edited_by?: string
          field_name?: string
          grant_number?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "edit_history_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      grant_investigators: {
        Row: {
          grant_number: string
          investigator_id: string
          role: string
        }
        Insert: {
          grant_number: string
          investigator_id: string
          role?: string
        }
        Update: {
          grant_number?: string
          investigator_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "grant_investigators_investigator_id_fkey"
            columns: ["investigator_id"]
            isOneToOne: false
            referencedRelation: "investigators"
            referencedColumns: ["id"]
          },
        ]
      }
      grants: {
        Row: {
          abstract: string | null
          award_amount: number | null
          created_at: string
          fiscal_year: number | null
          grant_number: string
          id: string
          nih_link: string | null
          resource_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          abstract?: string | null
          award_amount?: number | null
          created_at?: string
          fiscal_year?: number | null
          grant_number: string
          id?: string
          nih_link?: string | null
          resource_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          abstract?: string | null
          award_amount?: number | null
          created_at?: string
          fiscal_year?: number | null
          grant_number?: string
          id?: string
          nih_link?: string | null
          resource_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grants_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      investigator_organizations: {
        Row: {
          investigator_id: string
          organization_id: string
        }
        Insert: {
          investigator_id: string
          organization_id: string
        }
        Update: {
          investigator_id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investigator_organizations_investigator_id_fkey"
            columns: ["investigator_id"]
            isOneToOne: false
            referencedRelation: "investigators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investigator_organizations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      investigators: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          orcid: string | null
          profile_url: string | null
          research_areas: string[] | null
          resource_id: string | null
          scholar_id: string | null
          skills: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          orcid?: string | null
          profile_url?: string | null
          research_areas?: string[] | null
          resource_id?: string | null
          scholar_id?: string | null
          skills?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          orcid?: string | null
          profile_url?: string | null
          research_areas?: string[] | null
          resource_id?: string | null
          scholar_id?: string | null
          skills?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "investigators_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_embeddings: {
        Row: {
          content: string
          created_at: string
          embedding: string | null
          id: string
          metadata: Json | null
          resource_id: string | null
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
          resource_id?: string | null
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
          resource_id?: string | null
          source_id?: string
          source_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_embeddings_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      nih_grants_cache: {
        Row: {
          created_at: string
          data: Json
          grant_id: string | null
          grant_number: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data: Json
          grant_id?: string | null
          grant_number: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: Json
          grant_id?: string | null
          grant_number?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nih_grants_cache_grant_id_fkey"
            columns: ["grant_id"]
            isOneToOne: false
            referencedRelation: "grants"
            referencedColumns: ["id"]
          },
        ]
      }
      nih_grants_sync_log: {
        Row: {
          completed_at: string | null
          error_message: string | null
          grants_updated: number | null
          id: string
          started_at: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          grants_updated?: number | null
          id?: string
          started_at?: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          grants_updated?: number | null
          id?: string
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          resource_id: string | null
          url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          resource_id?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          resource_id?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          organization_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          organization_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          organization_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      project_publications: {
        Row: {
          created_at: string
          project_id: string
          publication_id: string
        }
        Insert: {
          created_at?: string
          project_id: string
          publication_id: string
        }
        Update: {
          created_at?: string
          project_id?: string
          publication_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_publications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_publications_publication_id_fkey"
            columns: ["publication_id"]
            isOneToOne: false
            referencedRelation: "publications"
            referencedColumns: ["id"]
          },
        ]
      }
      project_resources: {
        Row: {
          created_at: string
          project_id: string
          relationship: string
          resource_id: string
        }
        Insert: {
          created_at?: string
          project_id: string
          relationship?: string
          resource_id: string
        }
        Update: {
          created_at?: string
          project_id?: string
          relationship?: string
          resource_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_resources_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_resources_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          collaborators: Json | null
          created_at: string
          develope_hardware_type: string[] | null
          develope_software_type: string[] | null
          grant_id: string | null
          grant_number: string
          id: string
          keywords: string[] | null
          last_edited_by: string | null
          metadata: Json | null
          metadata_completeness: number | null
          presentations: Json | null
          produce_data_modality: string[] | null
          produce_data_type: string[] | null
          related_project_ids: string[] | null
          study_human: boolean | null
          study_species: string[] | null
          updated_at: string
          use_analysis_method: string[] | null
          use_analysis_types: string[] | null
          use_approaches: string[] | null
          use_sensors: string[] | null
          website: string | null
        }
        Insert: {
          collaborators?: Json | null
          created_at?: string
          develope_hardware_type?: string[] | null
          develope_software_type?: string[] | null
          grant_id?: string | null
          grant_number: string
          id?: string
          keywords?: string[] | null
          last_edited_by?: string | null
          metadata?: Json | null
          metadata_completeness?: number | null
          presentations?: Json | null
          produce_data_modality?: string[] | null
          produce_data_type?: string[] | null
          related_project_ids?: string[] | null
          study_human?: boolean | null
          study_species?: string[] | null
          updated_at?: string
          use_analysis_method?: string[] | null
          use_analysis_types?: string[] | null
          use_approaches?: string[] | null
          use_sensors?: string[] | null
          website?: string | null
        }
        Update: {
          collaborators?: Json | null
          created_at?: string
          develope_hardware_type?: string[] | null
          develope_software_type?: string[] | null
          grant_id?: string | null
          grant_number?: string
          id?: string
          keywords?: string[] | null
          last_edited_by?: string | null
          metadata?: Json | null
          metadata_completeness?: number | null
          presentations?: Json | null
          produce_data_modality?: string[] | null
          produce_data_type?: string[] | null
          related_project_ids?: string[] | null
          study_human?: boolean | null
          study_species?: string[] | null
          updated_at?: string
          use_analysis_method?: string[] | null
          use_analysis_types?: string[] | null
          use_approaches?: string[] | null
          use_sensors?: string[] | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_metadata_grant_id_fkey"
            columns: ["grant_id"]
            isOneToOne: false
            referencedRelation: "grants"
            referencedColumns: ["id"]
          },
        ]
      }
      publications: {
        Row: {
          author_orcids: Json | null
          authors: string | null
          citations: number | null
          created_at: string
          doi: string | null
          id: string
          journal: string | null
          keywords: string[] | null
          pmid: string | null
          pubmed_link: string | null
          rcr: number | null
          resource_id: string | null
          title: string
          year: number | null
        }
        Insert: {
          author_orcids?: Json | null
          authors?: string | null
          citations?: number | null
          created_at?: string
          doi?: string | null
          id?: string
          journal?: string | null
          keywords?: string[] | null
          pmid?: string | null
          pubmed_link?: string | null
          rcr?: number | null
          resource_id?: string | null
          title: string
          year?: number | null
        }
        Update: {
          author_orcids?: Json | null
          authors?: string | null
          citations?: number | null
          created_at?: string
          doi?: string | null
          id?: string
          journal?: string | null
          keywords?: string[] | null
          pmid?: string | null
          pubmed_link?: string | null
          rcr?: number | null
          resource_id?: string | null
          title?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "publications_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_links: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          relationship: string
          source_id: string
          target_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          relationship?: string
          source_id: string
          target_id: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          relationship?: string
          source_id?: string
          target_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_links_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_links_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          created_at: string
          description: string | null
          external_url: string | null
          id: string
          metadata: Json | null
          name: string
          resource_type: Database["public"]["Enums"]["resource_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          external_url?: string | null
          id?: string
          metadata?: Json | null
          name: string
          resource_type: Database["public"]["Enums"]["resource_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          external_url?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          resource_type?: Database["public"]["Enums"]["resource_type"]
          updated_at?: string
        }
        Relationships: []
      }
      search_queries: {
        Row: {
          created_at: string
          id: string
          mode: string
          query: string
          results_count: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          mode?: string
          query: string
          results_count?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          mode?: string
          query?: string
          results_count?: number | null
        }
        Relationships: []
      }
      software_tools: {
        Row: {
          created_at: string
          description: string | null
          docs_url: string | null
          id: string
          language: string | null
          license: string | null
          name: string
          repo_url: string | null
          resource_id: string | null
          updated_at: string
          version: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          docs_url?: string | null
          id?: string
          language?: string | null
          license?: string | null
          name: string
          repo_url?: string | null
          resource_id?: string | null
          updated_at?: string
          version?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          docs_url?: string | null
          id?: string
          language?: string | null
          license?: string | null
          name?: string
          repo_url?: string | null
          resource_id?: string | null
          updated_at?: string
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "software_tools_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      species: {
        Row: {
          common_name: string | null
          created_at: string
          id: string
          metadata: Json | null
          name: string
          resource_id: string | null
          taxonomy_class: string | null
          taxonomy_family: string | null
          taxonomy_genus: string | null
          taxonomy_order: string | null
          updated_at: string
        }
        Insert: {
          common_name?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          name: string
          resource_id?: string | null
          taxonomy_class?: string | null
          taxonomy_family?: string | null
          taxonomy_genus?: string | null
          taxonomy_order?: string | null
          updated_at?: string
        }
        Update: {
          common_name?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          name?: string
          resource_id?: string | null
          taxonomy_class?: string | null
          taxonomy_family?: string | null
          taxonomy_genus?: string | null
          taxonomy_order?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "species_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      taxonomies: {
        Row: {
          category: string
          created_at: string
          id: string
          label: string | null
          metadata: Json | null
          parent_value: string | null
          value: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          label?: string | null
          metadata?: Json | null
          parent_value?: string | null
          value: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          label?: string | null
          metadata?: Json | null
          parent_value?: string | null
          value?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
      user_can_edit_project: {
        Args: { _grant_number: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      resource_type:
        | "investigator"
        | "organization"
        | "grant"
        | "publication"
        | "software"
        | "tool"
        | "dataset"
        | "protocol"
        | "benchmark"
        | "ml_model"
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
    Enums: {
      resource_type: [
        "investigator",
        "organization",
        "grant",
        "publication",
        "software",
        "tool",
        "dataset",
        "protocol",
        "benchmark",
        "ml_model",
      ],
    },
  },
} as const
