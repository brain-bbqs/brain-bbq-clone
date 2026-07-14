
ALTER TABLE public.investigators
  ADD COLUMN IF NOT EXISTS birthday date,
  ADD COLUMN IF NOT EXISTS zodiac_sign text;

CREATE OR REPLACE FUNCTION public.derive_zodiac(_d date)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN _d IS NULL THEN NULL
    WHEN (extract(month from _d)=3  AND extract(day from _d)>=21) OR (extract(month from _d)=4  AND extract(day from _d)<=19) THEN 'Aries'
    WHEN (extract(month from _d)=4  AND extract(day from _d)>=20) OR (extract(month from _d)=5  AND extract(day from _d)<=20) THEN 'Taurus'
    WHEN (extract(month from _d)=5  AND extract(day from _d)>=21) OR (extract(month from _d)=6  AND extract(day from _d)<=20) THEN 'Gemini'
    WHEN (extract(month from _d)=6  AND extract(day from _d)>=21) OR (extract(month from _d)=7  AND extract(day from _d)<=22) THEN 'Cancer'
    WHEN (extract(month from _d)=7  AND extract(day from _d)>=23) OR (extract(month from _d)=8  AND extract(day from _d)<=22) THEN 'Leo'
    WHEN (extract(month from _d)=8  AND extract(day from _d)>=23) OR (extract(month from _d)=9  AND extract(day from _d)<=22) THEN 'Virgo'
    WHEN (extract(month from _d)=9  AND extract(day from _d)>=23) OR (extract(month from _d)=10 AND extract(day from _d)<=22) THEN 'Libra'
    WHEN (extract(month from _d)=10 AND extract(day from _d)>=23) OR (extract(month from _d)=11 AND extract(day from _d)<=21) THEN 'Scorpio'
    WHEN (extract(month from _d)=11 AND extract(day from _d)>=22) OR (extract(month from _d)=12 AND extract(day from _d)<=21) THEN 'Sagittarius'
    WHEN (extract(month from _d)=12 AND extract(day from _d)>=22) OR (extract(month from _d)=1  AND extract(day from _d)<=19) THEN 'Capricorn'
    WHEN (extract(month from _d)=1  AND extract(day from _d)>=20) OR (extract(month from _d)=2  AND extract(day from _d)<=18) THEN 'Aquarius'
    ELSE 'Pisces'
  END;
$$;

CREATE OR REPLACE FUNCTION public.set_zodiac_from_birthday()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.zodiac_sign := public.derive_zodiac(NEW.birthday);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_zodiac ON public.investigators;
CREATE TRIGGER trg_set_zodiac
BEFORE INSERT OR UPDATE OF birthday ON public.investigators
FOR EACH ROW EXECUTE FUNCTION public.set_zodiac_from_birthday();

-- Backfill any existing birthdays (no-op if none set)
UPDATE public.investigators SET birthday = birthday WHERE birthday IS NOT NULL;
