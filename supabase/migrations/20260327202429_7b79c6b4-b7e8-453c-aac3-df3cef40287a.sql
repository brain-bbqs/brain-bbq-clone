-- Allow public read access to funding_opportunities
DROP POLICY IF EXISTS "Authenticated users can view funding opportunities" ON funding_opportunities;
CREATE POLICY "Anyone can view funding opportunities" ON funding_opportunities FOR SELECT TO public USING (true);