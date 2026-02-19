
-- Add missing resource_type enum values
ALTER TYPE public.resource_type ADD VALUE IF NOT EXISTS 'benchmark';
ALTER TYPE public.resource_type ADD VALUE IF NOT EXISTS 'ml_model';
