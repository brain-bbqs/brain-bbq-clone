-- Insert project metadata for the grant
INSERT INTO projects (grant_number, grant_id, study_species, study_human, keywords)
VALUES (
  '1R61MH138612',
  '5b4792e0-23e7-4591-9f10-570bffcf8a66',
  ARRAY['Homo sapiens'],
  true,
  ARRAY['Consciousness', 'Brain Injury', 'Electrophysiology', 'Motor Behavior', 'Real-time Detection']
)
ON CONFLICT DO NOTHING;