-- Add missing domains for all consortium institutions
-- Also fix Northwestern which is incorrectly mapped to uchicago.edu

-- First, add NYU domain to the correct NYU org (the non-medical school one has no domain)
INSERT INTO allowed_domains (domain, organization_id) VALUES
  ('cmu.edu', '73bc00d3-cf54-4fc4-9c8b-3881c0750029'),
  ('duke.edu', 'fbb9db19-0aab-4b25-9365-df7153e89ce6'),
  ('mssm.edu', '3507ce41-101a-4355-8e52-5d81be529b1f'),
  ('icahn.mssm.edu', '3507ce41-101a-4355-8e52-5d81be529b1f'),
  ('msu.edu', '7925ff3b-fad9-4658-93d8-d07dcf8bd54f'),
  ('northwestern.edu', '3799574f-88f3-48ca-8d5f-4a958a3a71e1'),
  ('rice.edu', '3b18a233-3a4e-4460-8111-a75f12a311f3'),
  ('seattlechildrens.org', 'b281ce24-1b40-4cf7-80cf-f98366f169b9'),
  ('ucla.edu', 'b06776b3-5e7b-445c-88f1-43dddfd811bd'),
  ('ufl.edu', '0c0fdb42-ae07-49a3-8bc6-7cb4d5bae64f'),
  ('umich.edu', 'ae02b333-f088-412a-bcf4-f7f468ebfcd1'),
  ('usc.edu', 'b97d5476-32cc-49eb-97f5-7401bf0530c4'),
  ('utah.edu', 'd0834b7c-cc90-45c0-9733-e0a110731245')
ON CONFLICT DO NOTHING;