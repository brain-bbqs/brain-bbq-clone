
-- Add organization_id to projects and resources for full multi-tenant scoping
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

ALTER TABLE public.resources
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

-- Ensure all FK constraints exist (idempotent with IF NOT EXISTS pattern)
-- We use DO blocks to check before adding since ALTER TABLE ADD CONSTRAINT has no IF NOT EXISTS

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'allowed_domains_organization_id_fkey') THEN
    ALTER TABLE public.allowed_domains ADD CONSTRAINT allowed_domains_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'analytics_clicks_organization_id_fkey') THEN
    ALTER TABLE public.analytics_clicks ADD CONSTRAINT analytics_clicks_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'analytics_pageviews_organization_id_fkey') THEN
    ALTER TABLE public.analytics_pageviews ADD CONSTRAINT analytics_pageviews_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'announcements_organization_id_fkey') THEN
    ALTER TABLE public.announcements ADD CONSTRAINT announcements_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'announcements_resource_id_fkey') THEN
    ALTER TABLE public.announcements ADD CONSTRAINT announcements_resource_id_fkey FOREIGN KEY (resource_id) REFERENCES public.resources(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chat_conversations_organization_id_fkey') THEN
    ALTER TABLE public.chat_conversations ADD CONSTRAINT chat_conversations_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chat_messages_conversation_id_fkey') THEN
    ALTER TABLE public.chat_messages ADD CONSTRAINT chat_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.chat_conversations(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'entity_comments_resource_id_fkey') THEN
    ALTER TABLE public.entity_comments ADD CONSTRAINT entity_comments_resource_id_fkey FOREIGN KEY (resource_id) REFERENCES public.resources(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'entity_comments_parent_id_fkey') THEN
    ALTER TABLE public.entity_comments ADD CONSTRAINT entity_comments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.entity_comments(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'feature_suggestions_organization_id_fkey') THEN
    ALTER TABLE public.feature_suggestions ADD CONSTRAINT feature_suggestions_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'feature_votes_suggestion_id_fkey') THEN
    ALTER TABLE public.feature_votes ADD CONSTRAINT feature_votes_suggestion_id_fkey FOREIGN KEY (suggestion_id) REFERENCES public.feature_suggestions(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'grant_investigators_grant_id_fkey') THEN
    ALTER TABLE public.grant_investigators ADD CONSTRAINT grant_investigators_grant_id_fkey FOREIGN KEY (grant_id) REFERENCES public.grants(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'grant_investigators_investigator_id_fkey') THEN
    ALTER TABLE public.grant_investigators ADD CONSTRAINT grant_investigators_investigator_id_fkey FOREIGN KEY (investigator_id) REFERENCES public.investigators(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'grants_resource_id_fkey') THEN
    ALTER TABLE public.grants ADD CONSTRAINT grants_resource_id_fkey FOREIGN KEY (resource_id) REFERENCES public.resources(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'investigator_organizations_investigator_id_fkey') THEN
    ALTER TABLE public.investigator_organizations ADD CONSTRAINT investigator_organizations_investigator_id_fkey FOREIGN KEY (investigator_id) REFERENCES public.investigators(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'investigator_organizations_organization_id_fkey') THEN
    ALTER TABLE public.investigator_organizations ADD CONSTRAINT investigator_organizations_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'investigators_resource_id_fkey') THEN
    ALTER TABLE public.investigators ADD CONSTRAINT investigators_resource_id_fkey FOREIGN KEY (resource_id) REFERENCES public.resources(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'jobs_organization_id_fkey') THEN
    ALTER TABLE public.jobs ADD CONSTRAINT jobs_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'jobs_resource_id_fkey') THEN
    ALTER TABLE public.jobs ADD CONSTRAINT jobs_resource_id_fkey FOREIGN KEY (resource_id) REFERENCES public.resources(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'knowledge_embeddings_resource_id_fkey') THEN
    ALTER TABLE public.knowledge_embeddings ADD CONSTRAINT knowledge_embeddings_resource_id_fkey FOREIGN KEY (resource_id) REFERENCES public.resources(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'organizations_resource_id_fkey') THEN
    ALTER TABLE public.organizations ADD CONSTRAINT organizations_resource_id_fkey FOREIGN KEY (resource_id) REFERENCES public.resources(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_organization_id_fkey') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_publications_project_id_fkey') THEN
    ALTER TABLE public.project_publications ADD CONSTRAINT project_publications_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_publications_publication_id_fkey') THEN
    ALTER TABLE public.project_publications ADD CONSTRAINT project_publications_publication_id_fkey FOREIGN KEY (publication_id) REFERENCES public.publications(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_resources_project_id_fkey') THEN
    ALTER TABLE public.project_resources ADD CONSTRAINT project_resources_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_resources_resource_id_fkey') THEN
    ALTER TABLE public.project_resources ADD CONSTRAINT project_resources_resource_id_fkey FOREIGN KEY (resource_id) REFERENCES public.resources(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_metadata_grant_id_fkey') THEN
    ALTER TABLE public.projects ADD CONSTRAINT project_metadata_grant_id_fkey FOREIGN KEY (grant_id) REFERENCES public.grants(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_resource_id_fkey') THEN
    ALTER TABLE public.projects ADD CONSTRAINT projects_resource_id_fkey FOREIGN KEY (resource_id) REFERENCES public.resources(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_organization_id_fkey') THEN
    ALTER TABLE public.projects ADD CONSTRAINT projects_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'resources_organization_id_fkey') THEN
    ALTER TABLE public.resources ADD CONSTRAINT resources_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'publications_resource_id_fkey') THEN
    ALTER TABLE public.publications ADD CONSTRAINT publications_resource_id_fkey FOREIGN KEY (resource_id) REFERENCES public.resources(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'resource_links_source_id_fkey') THEN
    ALTER TABLE public.resource_links ADD CONSTRAINT resource_links_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.resources(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'resource_links_target_id_fkey') THEN
    ALTER TABLE public.resource_links ADD CONSTRAINT resource_links_target_id_fkey FOREIGN KEY (target_id) REFERENCES public.resources(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'software_tools_resource_id_fkey') THEN
    ALTER TABLE public.software_tools ADD CONSTRAINT software_tools_resource_id_fkey FOREIGN KEY (resource_id) REFERENCES public.resources(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'species_resource_id_fkey') THEN
    ALTER TABLE public.species ADD CONSTRAINT species_resource_id_fkey FOREIGN KEY (resource_id) REFERENCES public.resources(id);
  END IF;
END $$;

-- Create indexes for the new organization_id columns
CREATE INDEX IF NOT EXISTS idx_projects_organization_id ON public.projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_resources_organization_id ON public.resources(organization_id);
