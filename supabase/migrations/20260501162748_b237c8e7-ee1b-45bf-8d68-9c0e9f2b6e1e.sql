
-- Allow admins and curators to delete invited investigators (those with no linked auth user)
CREATE POLICY "Admins and curators can delete unlinked investigators"
ON public.investigators
FOR DELETE
TO authenticated
USING (
  user_id IS NULL AND public.is_curator_or_admin(auth.uid())
);
