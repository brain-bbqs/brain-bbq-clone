-- Add 'job' and 'announcement' to the resource_type enum
ALTER TYPE public.resource_type ADD VALUE IF NOT EXISTS 'job';
ALTER TYPE public.resource_type ADD VALUE IF NOT EXISTS 'announcement';

-- Add resource_id column to announcements table
ALTER TABLE public.announcements
ADD COLUMN IF NOT EXISTS resource_id uuid REFERENCES public.resources(id);
