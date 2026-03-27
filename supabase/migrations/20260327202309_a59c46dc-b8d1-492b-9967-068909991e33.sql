-- Insert funding announcements into funding_opportunities
INSERT INTO funding_opportunities (fon, title, purpose, activity_code, url, status, expiration_date, due_dates, relevance_tags, notes)
VALUES
  ('RFA-NS-26-011',
   'BRAIN Initiative: Integrated Teams for Behavioral Circuit Plasticity (iTeamBCP) (RM1)',
   'Solicits teams of 3-6 PDs/PIs to understand how the nervous system gives rise to mental experience and behavior, integrating circuit, in vivo recordings, and behavioral analyses.',
   'RM1',
   'https://simpler.grants.gov/opportunity/ffe98704-96a8-4f41-a32b-49edd0409006',
   'open',
   '2027-06-16',
   '[{"date": "2026-06-16", "type": "estimated"}]'::jsonb,
   ARRAY['BRAIN Initiative', 'circuits', 'behavior'],
   'Contact BRAINCircuits@nih.gov to learn more.'),

  ('RFA-DA-27-004',
   'Theories, Models and Methods for Complex Brain Data Analysis (R01)',
   'Supports theories, computational models, and analytical methods that advance quantitative understanding of brain function across scales.',
   'R01',
   'https://grants.nih.gov/grants/guide/rfa-files/RFA-DA-27-004.html',
   'open',
   '2027-10-06',
   '[{"date": "2026-10-06", "type": "standard"}]'::jsonb,
   ARRAY['BRAIN Initiative', 'computational', 'theory', 'methods'],
   'Contact BRAINTheoriesFOA@mail.nih.gov with questions.'),

  ('RFA-NS-27-001',
   'BRAIN Initiative: Technology Integration and Dissemination (U24)',
   'Supports research resource grants for integrating and disseminating BRAIN-funded technologies.',
   'U24',
   'https://www.grants.gov/search-results-detail/358859',
   'open',
   '2027-06-10',
   '[{"date": "2026-06-10", "type": "standard"}]'::jsonb,
   ARRAY['BRAIN Initiative', 'technology', 'dissemination'],
   'Contact BRAIN_Dissemination@mail.nih.gov ideally one month before due date.'),

  ('RFA-NS-25-018',
   'BRAIN Initiative: New Tools for Neural Recording and Modulation (R01)',
   'Supports proof-of-concept development of new tools and approaches for recording and modulating neural activity.',
   'R01',
   'https://grants.nih.gov/grants/guide/rfa-files/RFA-NS-25-018.html',
   'open',
   '2027-06-15',
   '[{"date": "2026-06-15", "type": "standard"}]'::jsonb,
   ARRAY['BRAIN Initiative', 'tools', 'recording', 'modulation'],
   'Contact BRAIN-FOAs@nih.gov with questions about program fit.'),

  ('NOT-MH-25-155',
   'NeuroAI Highlighted Topic: BRAIN Data Knowledgebase Ecosystem and NeuroAI Integration',
   'NIH Highlighted Topic identifying the BRAIN Initiative interests in NeuroAI. Submit through a parent announcement (e.g., R01, R21) to an NIH Institute or Center that partners with BRAIN. Submit by Cycle II receipt dates, May 25 through August 12. After submitting, notify BRAIN-KB-NeuroAI@nih.gov with your application ID.',
   'R01/R21',
   'https://grants.nih.gov/funding/find-a-fit-for-your-research/highlighted-topics/18',
   'open',
   '2026-09-29',
   '[{"date": "2026-05-25", "type": "Cycle II start"}, {"date": "2026-08-12", "type": "Cycle II end"}]'::jsonb,
   ARRAY['BRAIN Initiative', 'NeuroAI', 'knowledgebase', 'highlighted topic'],
   'This is a Highlighted Topic, not a standalone FOA. Expires September 29, 2026.');

-- Delete funding announcements from announcements table
DELETE FROM announcements WHERE id IN (
  '7d2ff0b3-e1f6-4f61-9b11-db97a592b7fd',
  'cd4914dc-3094-4d30-a3a8-ba55c84963c0',
  '29c94add-6d10-4918-92a7-f9dc0d98eff3',
  '22e9d06f-f91e-401a-a674-6dc6d0150845',
  'd4de6126-1113-469f-81d0-57f5c5187104'
);