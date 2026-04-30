
-- 1) Add the new columns
ALTER TABLE public.access_requests
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS institution text;

-- 2) Public can submit requests (anon + authenticated)
DROP POLICY IF EXISTS "Anyone can submit access requests" ON public.access_requests;
CREATE POLICY "Anyone can submit access requests"
ON public.access_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (
  status = 'pending'
  AND char_length(coalesce(email, '')) BETWEEN 3 AND 255
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND char_length(coalesce(full_name, '')) <= 200
  AND char_length(coalesce(institution, '')) <= 200
  AND char_length(coalesce(message, '')) <= 2000
);

-- 3) Replace admin-only view/update policies with curator-or-admin
DROP POLICY IF EXISTS "Admins can view access requests" ON public.access_requests;
CREATE POLICY "Curators and admins can view access requests"
ON public.access_requests
FOR SELECT
TO authenticated
USING (public.is_curator_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update access requests" ON public.access_requests;
CREATE POLICY "Curators and admins can update access requests"
ON public.access_requests
FOR UPDATE
TO authenticated
USING (public.is_curator_or_admin(auth.uid()))
WITH CHECK (public.is_curator_or_admin(auth.uid()));
