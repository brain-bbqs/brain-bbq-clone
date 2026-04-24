-- Replace the existing investigator UPDATE policy so that it allows
-- admins/curators (Tier 1 & Tier 2) to edit any investigator record,
-- in addition to the investigator themselves (Tier 3 self-edit).

DROP POLICY IF EXISTS "Users can update own investigator" ON public.investigators;

CREATE POLICY "Owners admins and curators can update investigators"
ON public.investigators
FOR UPDATE
TO authenticated
USING (
  public.user_owns_investigator(auth.uid(), id)
  OR public.is_curator_or_admin(auth.uid())
)
WITH CHECK (
  public.user_owns_investigator(auth.uid(), id)
  OR public.is_curator_or_admin(auth.uid())
);