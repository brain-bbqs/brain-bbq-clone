ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS theme_preference text NOT NULL DEFAULT 'system'
CHECK (theme_preference IN ('light','dark','system'));