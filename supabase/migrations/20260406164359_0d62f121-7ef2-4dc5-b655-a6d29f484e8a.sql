-- Insert organization
INSERT INTO organizations (id, name) 
VALUES ('a1b2c3d4-0001-4000-8000-000000000001', 'State University of New York at Stony Brook')
ON CONFLICT DO NOTHING;

-- Insert resource for investigator
INSERT INTO resources (id, name, resource_type, description)
VALUES ('a1b2c3d4-0002-4000-8000-000000000001', 'Sima Mofakham', 'investigator', 'PI for SeeMe consciousness detection project')
ON CONFLICT DO NOTHING;

-- Insert investigator
INSERT INTO investigators (id, name, resource_id)
VALUES ('a1b2c3d4-0003-4000-8000-000000000001', 'Sima Mofakham', 'a1b2c3d4-0002-4000-8000-000000000001')
ON CONFLICT DO NOTHING;

-- Link investigator to organization
INSERT INTO investigator_organizations (investigator_id, organization_id)
VALUES ('a1b2c3d4-0003-4000-8000-000000000001', 'a1b2c3d4-0001-4000-8000-000000000001')
ON CONFLICT DO NOTHING;

-- Link investigator to grant as contact PI
INSERT INTO grant_investigators (investigator_id, grant_id, role)
VALUES ('a1b2c3d4-0003-4000-8000-000000000001', '5b4792e0-23e7-4591-9f10-570bffcf8a66', 'contact_pi')
ON CONFLICT DO NOTHING;

-- Insert resource for grant and link it
INSERT INTO resources (id, name, resource_type, description)
VALUES ('a1b2c3d4-0004-4000-8000-000000000001', 'SeeMe: A multimodal behavioral-electrophysiological tool for real-time detection of consciousness', 'grant', 'R61 grant for consciousness detection in brain injury patients')
ON CONFLICT DO NOTHING;

UPDATE grants SET resource_id = 'a1b2c3d4-0004-4000-8000-000000000001' WHERE id = '5b4792e0-23e7-4591-9f10-570bffcf8a66' AND resource_id IS NULL;