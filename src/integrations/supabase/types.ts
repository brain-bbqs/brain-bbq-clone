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
      access_requests: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          globus_name: string | null
          globus_subject: string | null
          id: string
          institution: string | null
          message: string | null
          requested_role: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          globus_name?: string | null
          globus_subject?: string | null
          id?: string
          institution?: string | null
          message?: string | null
          requested_role?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          globus_name?: string | null
          globus_subject?: string | null
          id?: string
          institution?: string | null
          message?: string | null
          requested_role?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
          path?: string
          section?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_clicks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_pageviews: {
        Row: {
          created_at: string
          id: string
          organization_id: string | null
          path: string
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id?: string | null
          path: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string | null
          path?: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_pageviews_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          content: string
          created_at: string
          id: string
          is_external_link: boolean
          link: string | null
          link_text: string | null
          organization_id: string | null
          posted_by: string | null
          resource_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_external_link?: boolean
          link?: string | null
          link_text?: string | null
          organization_id?: string | null
          posted_by?: string | null
          resource_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_external_link?: boolean
          link?: string | null
          link_text?: string | null
          organization_id?: string | null
          posted_by?: string | null
          resource_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_audit_log: {
        Row: {
          attempted_email: string | null
          created_at: string
          error_reason: string
          globus_name: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
        }
        Insert: {
          attempted_email?: string | null
          created_at?: string
          error_reason: string
          globus_name?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
        }
        Update: {
          attempted_email?: string | null
          created_at?: string
          error_reason?: string
          globus_name?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
        }
        Relationships: []
      }
      curation_audit_log: {
        Row: {
          action: Database["public"]["Enums"]["curation_action"]
          actor_email: string | null
          actor_id: string | null
          after_value: Json | null
          before_value: Json | null
          created_at: string
          entity_id: string | null
          entity_type: Database["public"]["Enums"]["curation_entity_type"]
          field_name: string | null
          grant_number: string | null
          id: string
          investigator_id: string | null
          is_revert: boolean
          project_id: string | null
          resource_id: string | null
          reverted_at: string | null
          reverted_by: string | null
          reverted_from_audit_id: string | null
          source: string
        }
        Insert: {
          action: Database["public"]["Enums"]["curation_action"]
          actor_email?: string | null
          actor_id?: string | null
          after_value?: Json | null
          before_value?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: Database["public"]["Enums"]["curation_entity_type"]
          field_name?: string | null
          grant_number?: string | null
          id?: string
          investigator_id?: string | null
          is_revert?: boolean
          project_id?: string | null
          resource_id?: string | null
          reverted_at?: string | null
          reverted_by?: string | null
          reverted_from_audit_id?: string | null
          source?: string
        }
        Update: {
          action?: Database["public"]["Enums"]["curation_action"]
          actor_email?: string | null
          actor_id?: string | null
          after_value?: Json | null
          before_value?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: Database["public"]["Enums"]["curation_entity_type"]
          field_name?: string | null
          grant_number?: string | null
          id?: string
          investigator_id?: string | null
          is_revert?: boolean
          project_id?: string | null
          resource_id?: string | null
          reverted_at?: string | null
          reverted_by?: string | null
          reverted_from_audit_id?: string | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "curation_audit_log_reverted_from_audit_id_fkey"
            columns: ["reverted_from_audit_id"]
            isOneToOne: false
            referencedRelation: "curation_audit_log"
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
          validation_checks: Json | null
          validation_status: string | null
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
          validation_checks?: Json | null
          validation_status?: string | null
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
          validation_checks?: Json | null
          validation_status?: string | null
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
      entity_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          parent_id: string | null
          resource_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          parent_id?: string | null
          resource_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          resource_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "entity_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_comments_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_suggestions: {
        Row: {
          created_at: string
          description: string | null
          github_issue_number: number | null
          github_issue_url: string | null
          id: string
          organization_id: string | null
          status: string
          submitted_by: string | null
          submitted_by_email: string | null
          title: string
          updated_at: string
          votes: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          github_issue_number?: number | null
          github_issue_url?: string | null
          id?: string
          organization_id?: string | null
          status?: string
          submitted_by?: string | null
          submitted_by_email?: string | null
          title: string
          updated_at?: string
          votes?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          github_issue_number?: number | null
          github_issue_url?: string | null
          id?: string
          organization_id?: string | null
          status?: string
          submitted_by?: string | null
          submitted_by_email?: string | null
          title?: string
          updated_at?: string
          votes?: number
        }
        Relationships: [
          {
            foreignKeyName: "feature_suggestions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_votes: {
        Row: {
          created_at: string
          suggestion_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          suggestion_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          suggestion_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_votes_suggestion_id_fkey"
            columns: ["suggestion_id"]
            isOneToOne: false
            referencedRelation: "feature_suggestions"
            referencedColumns: ["id"]
          },
        ]
      }
      funding_opportunities: {
        Row: {
          activity_code: string | null
          announcement_type: string | null
          budget_ceiling: number | null
          budget_floor: number | null
          created_at: string
          due_dates: Json | null
          eligible_activity_codes: string[] | null
          expiration_date: string | null
          fon: string
          id: string
          notes: string | null
          open_date: string | null
          participating_orgs: string[] | null
          posted_date: string | null
          purpose: string | null
          relevance_tags: string[] | null
          status: string
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          activity_code?: string | null
          announcement_type?: string | null
          budget_ceiling?: number | null
          budget_floor?: number | null
          created_at?: string
          due_dates?: Json | null
          eligible_activity_codes?: string[] | null
          expiration_date?: string | null
          fon: string
          id?: string
          notes?: string | null
          open_date?: string | null
          participating_orgs?: string[] | null
          posted_date?: string | null
          purpose?: string | null
          relevance_tags?: string[] | null
          status?: string
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          activity_code?: string | null
          announcement_type?: string | null
          budget_ceiling?: number | null
          budget_floor?: number | null
          created_at?: string
          due_dates?: Json | null
          eligible_activity_codes?: string[] | null
          expiration_date?: string | null
          fon?: string
          id?: string
          notes?: string | null
          open_date?: string | null
          participating_orgs?: string[] | null
          posted_date?: string | null
          purpose?: string | null
          relevance_tags?: string[] | null
          status?: string
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      grant_investigators: {
        Row: {
          grant_id: string | null
          investigator_id: string
          role: string
          role_source: string
        }
        Insert: {
          grant_id?: string | null
          investigator_id: string
          role?: string
          role_source?: string
        }
        Update: {
          grant_id?: string | null
          investigator_id?: string
          role?: string
          role_source?: string
        }
        Relationships: [
          {
            foreignKeyName: "grant_investigators_grant_id_fkey"
            columns: ["grant_id"]
            isOneToOne: false
            referencedRelation: "grants"
            referencedColumns: ["id"]
          },
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
          pending_role: Database["public"]["Enums"]["app_role"] | null
          profile_url: string | null
          research_areas: string[] | null
          resource_id: string | null
          role: string | null
          scholar_id: string | null
          secondary_emails: string[] | null
          skills: string[] | null
          updated_at: string
          user_id: string | null
          working_groups: string[] | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          orcid?: string | null
          pending_role?: Database["public"]["Enums"]["app_role"] | null
          profile_url?: string | null
          research_areas?: string[] | null
          resource_id?: string | null
          role?: string | null
          scholar_id?: string | null
          secondary_emails?: string[] | null
          skills?: string[] | null
          updated_at?: string
          user_id?: string | null
          working_groups?: string[] | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          orcid?: string | null
          pending_role?: Database["public"]["Enums"]["app_role"] | null
          profile_url?: string | null
          research_areas?: string[] | null
          resource_id?: string | null
          role?: string | null
          scholar_id?: string | null
          secondary_emails?: string[] | null
          skills?: string[] | null
          updated_at?: string
          user_id?: string | null
          working_groups?: string[] | null
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
      jobs: {
        Row: {
          application_url: string | null
          contact_email: string | null
          contact_name: string | null
          created_at: string
          department: string | null
          description: string | null
          expires_at: string | null
          id: string
          institution: string
          is_active: boolean
          job_type: string
          location: string | null
          organization_id: string | null
          posted_by: string | null
          resource_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          application_url?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          department?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          institution: string
          is_active?: boolean
          job_type?: string
          location?: string | null
          organization_id?: string | null
          posted_by?: string | null
          resource_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          application_url?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          department?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          institution?: string
          is_active?: boolean
          job_type?: string
          location?: string | null
          organization_id?: string | null
          posted_by?: string | null
          resource_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_resource_id_fkey"
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
      projects: {
        Row: {
          created_at: string
          grant_id: string | null
          grant_number: string
          id: string
          keywords: string[] | null
          last_edited_by: string | null
          metadata: Json | null
          metadata_completeness: number | null
          organization_id: string | null
          resource_id: string | null
          study_human: boolean | null
          study_species: string[] | null
          updated_at: string
          website: string | null
        }
        Insert: {
          created_at?: string
          grant_id?: string | null
          grant_number: string
          id?: string
          keywords?: string[] | null
          last_edited_by?: string | null
          metadata?: Json | null
          metadata_completeness?: number | null
          organization_id?: string | null
          resource_id?: string | null
          study_human?: boolean | null
          study_species?: string[] | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          created_at?: string
          grant_id?: string | null
          grant_number?: string
          id?: string
          keywords?: string[] | null
          last_edited_by?: string | null
          metadata?: Json | null
          metadata_completeness?: number | null
          organization_id?: string | null
          resource_id?: string | null
          study_human?: boolean | null
          study_species?: string[] | null
          updated_at?: string
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
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
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
      resources: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          external_url: string | null
          id: string
          metadata: Json | null
          name: string
          organization_id: string | null
          resource_type: Database["public"]["Enums"]["resource_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          external_url?: string | null
          id?: string
          metadata?: Json | null
          name: string
          organization_id?: string | null
          resource_type: Database["public"]["Enums"]["resource_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          external_url?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          organization_id?: string | null
          resource_type?: Database["public"]["Enums"]["resource_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
      security_audit_results: {
        Row: {
          created_at: string
          drift_detected: boolean
          findings: Json
          findings_count: number
          id: string
          notified: boolean
          policy_snapshot: Json
          scan_type: string
          tables_scanned: number
        }
        Insert: {
          created_at?: string
          drift_detected?: boolean
          findings?: Json
          findings_count?: number
          id?: string
          notified?: boolean
          policy_snapshot?: Json
          scan_type?: string
          tables_scanned?: number
        }
        Update: {
          created_at?: string
          drift_detected?: boolean
          findings?: Json
          findings_count?: number
          id?: string
          notified?: boolean
          policy_snapshot?: Json
          scan_type?: string
          tables_scanned?: number
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
      state_privacy_rules: {
        Row: {
          categories: Json
          created_at: string
          id: string
          last_reviewed: string
          scan_status: string
          sources: Json | null
          state: string
          state_name: string
          updated_at: string
        }
        Insert: {
          categories?: Json
          created_at?: string
          id?: string
          last_reviewed?: string
          scan_status?: string
          sources?: Json | null
          state: string
          state_name: string
          updated_at?: string
        }
        Update: {
          categories?: Json
          created_at?: string
          id?: string
          last_reviewed?: string
          scan_status?: string
          sources?: Json | null
          state?: string
          state_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_alerts: {
        Row: {
          created_at: string
          details: Json | null
          email_sent: boolean
          email_sent_at: string | null
          error_code: string
          fingerprint: string
          first_seen_at: string
          github_issue_number: number | null
          github_issue_url: string | null
          id: string
          last_seen_at: string
          message: string
          occurrence_count: number
          resolved: boolean
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          source: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          details?: Json | null
          email_sent?: boolean
          email_sent_at?: string | null
          error_code: string
          fingerprint: string
          first_seen_at?: string
          github_issue_number?: number | null
          github_issue_url?: string | null
          id?: string
          last_seen_at?: string
          message: string
          occurrence_count?: number
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          source: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          details?: Json | null
          email_sent?: boolean
          email_sent_at?: string | null
          error_code?: string
          fingerprint?: string
          first_seen_at?: string
          github_issue_number?: number | null
          github_issue_url?: string | null
          id?: string
          last_seen_at?: string
          message?: string
          occurrence_count?: number
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          source?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_jobs: {
        Row: {
          application_url: string | null
          created_at: string | null
          department: string | null
          description: string | null
          expires_at: string | null
          id: string | null
          institution: string | null
          is_active: boolean | null
          job_type: string | null
          location: string | null
          organization_id: string | null
          resource_id: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          application_url?: string | null
          created_at?: string | null
          department?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string | null
          institution?: string | null
          is_active?: boolean | null
          job_type?: string | null
          location?: string | null
          organization_id?: string | null
          resource_id?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          application_url?: string | null
          created_at?: string | null
          department?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string | null
          institution?: string | null
          is_active?: boolean | null
          job_type?: string | null
          location?: string | null
          organization_id?: string | null
          resource_id?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      decrement_vote_count: {
        Args: { _suggestion_id: string }
        Returns: undefined
      }
      email_is_consortium_member: { Args: { _email: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_vote_count: {
        Args: { _suggestion_id: string }
        Returns: undefined
      }
      is_curator_or_admin: { Args: { _user_id: string }; Returns: boolean }
      revert_curation_change: { Args: { _audit_id: string }; Returns: Json }
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
      user_can_edit_grant_roster: {
        Args: { _grant_id: string; _user_id: string }
        Returns: boolean
      }
      user_can_edit_project: {
        Args: { _grant_number: string; _user_id: string }
        Returns: boolean
      }
      user_can_revert_audit: {
        Args: { _audit_id: string; _user_id: string }
        Returns: boolean
      }
      user_owns_investigator: {
        Args: { _investigator_id: string; _user_id: string }
        Returns: boolean
      }
      user_owns_resource: {
        Args: { _resource_id: string; _user_id: string }
        Returns: boolean
      }
      user_shares_grant_with_investigator: {
        Args: { _editor_id: string; _target_investigator_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "member" | "curator"
      curation_action: "create" | "update" | "delete"
      curation_entity_type:
        | "project_metadata"
        | "team_roster"
        | "pending_change_decision"
        | "investigator"
        | "entity_comment"
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
        | "job"
        | "announcement"
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
      app_role: ["admin", "member", "curator"],
      curation_action: ["create", "update", "delete"],
      curation_entity_type: [
        "project_metadata",
        "team_roster",
        "pending_change_decision",
        "investigator",
        "entity_comment",
      ],
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
        "job",
        "announcement",
      ],
    },
  },
} as const
