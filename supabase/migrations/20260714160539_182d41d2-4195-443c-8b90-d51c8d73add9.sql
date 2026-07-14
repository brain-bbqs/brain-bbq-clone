DROP TRIGGER IF EXISTS trg_set_zodiac ON public.investigators;
DROP FUNCTION IF EXISTS public.set_zodiac_from_birthday();
DROP FUNCTION IF EXISTS public.derive_zodiac(date);
ALTER TABLE public.investigators DROP COLUMN IF EXISTS birthday;
ALTER TABLE public.investigators DROP COLUMN IF EXISTS zodiac_sign;