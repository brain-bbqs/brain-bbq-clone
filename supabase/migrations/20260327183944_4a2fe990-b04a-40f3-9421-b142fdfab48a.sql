DO $$
DECLARE
  -- Org IDs (existing or to-be-created)
  v_org_minnesota uuid;
  v_org_uab uuid;
  v_org_memphis uuid;
  v_org_unc uuid;
  v_org_ucla uuid;
  v_org_ucsd uuid;
  v_org_yale uuid;
  v_org_chop uuid;
  v_org_umass uuid;
  v_org_pennstate uuid;
BEGIN
  -- Get existing orgs
  SELECT id INTO v_org_ucla FROM organizations WHERE upper(name) = 'UNIVERSITY OF CALIFORNIA LOS ANGELES' LIMIT 1;
  SELECT id INTO v_org_yale FROM organizations WHERE upper(name) = 'YALE UNIVERSITY' LIMIT 1;

  -- Create missing orgs
  INSERT INTO organizations (name) VALUES ('UNIVERSITY OF MINNESOTA') RETURNING id INTO v_org_minnesota;
  INSERT INTO organizations (name) VALUES ('UNIVERSITY OF ALABAMA AT BIRMINGHAM') RETURNING id INTO v_org_uab;
  INSERT INTO organizations (name) VALUES ('UNIVERSITY OF MEMPHIS') RETURNING id INTO v_org_memphis;
  INSERT INTO organizations (name) VALUES ('UNIV OF NORTH CAROLINA CHAPEL HILL') RETURNING id INTO v_org_unc;
  INSERT INTO organizations (name) VALUES ('UNIVERSITY OF CALIFORNIA, SAN DIEGO') RETURNING id INTO v_org_ucsd;
  INSERT INTO organizations (name) VALUES ('CHILDREN''S HOSP OF PHILADELPHIA') RETURNING id INTO v_org_chop;
  INSERT INTO organizations (name) VALUES ('UNIV OF MASSACHUSETTS MED SCH WORCESTER') RETURNING id INTO v_org_umass;
  INSERT INTO organizations (name) VALUES ('PENNSYLVANIA STATE UNIVERSITY') RETURNING id INTO v_org_pennstate;

  -- 1. Alik S. Widge: COLUMBIA -> UNIVERSITY OF MINNESOTA
  DELETE FROM investigator_organizations WHERE investigator_id = '49d73b8e-c794-48f5-8155-19e2bde865a4';
  INSERT INTO investigator_organizations (investigator_id, organization_id) VALUES ('49d73b8e-c794-48f5-8155-19e2bde865a4', v_org_minnesota);

  -- 2. David Michael Schneider: NYU -> UAB
  DELETE FROM investigator_organizations WHERE investigator_id = 'b72ab0cc-17a1-4559-8817-8616a8ae05b0';
  INSERT INTO investigator_organizations (investigator_id, organization_id) VALUES ('b72ab0cc-17a1-4559-8817-8616a8ae05b0', v_org_uab);

  -- 3. Emre Ertin: UCLA -> UNIVERSITY OF MEMPHIS
  DELETE FROM investigator_organizations WHERE investigator_id = 'c1d2de7f-8272-455a-ac4a-6235ac278cb8';
  INSERT INTO investigator_organizations (investigator_id, organization_id) VALUES ('c1d2de7f-8272-455a-ac4a-6235ac278cb8', v_org_memphis);

  -- 4. Flavio Frohlich: MICHIGAN STATE -> UNC
  DELETE FROM investigator_organizations WHERE investigator_id = 'db3664dc-fbc1-4f65-9822-5871d92e905a';
  INSERT INTO investigator_organizations (investigator_id, organization_id) VALUES ('db3664dc-fbc1-4f65-9822-5871d92e905a', v_org_unc);

  -- 5. Gregory Darin Field: DUKE -> UCLA
  DELETE FROM investigator_organizations WHERE investigator_id = '0363e75e-d8c2-4af8-96a6-4534c9de52ff';
  INSERT INTO investigator_organizations (investigator_id, organization_id) VALUES ('0363e75e-d8c2-4af8-96a6-4534c9de52ff', v_org_ucla);

  -- 6. Nathan Christopher Shaner: NYU MED -> UCSD
  DELETE FROM investigator_organizations WHERE investigator_id = 'dc1a0c02-8697-4c88-83a3-721e0a1ce6e5';
  INSERT INTO investigator_organizations (investigator_id, organization_id) VALUES ('dc1a0c02-8697-4c88-83a3-721e0a1ce6e5', v_org_ucsd);

  -- 7. Shreya Saxena: U FLORIDA -> YALE
  DELETE FROM investigator_organizations WHERE investigator_id = '5ffdcb2e-b5c1-4c13-81ed-ccec5f1b5e2e';
  INSERT INTO investigator_organizations (investigator_id, organization_id) VALUES ('5ffdcb2e-b5c1-4c13-81ed-ccec5f1b5e2e', v_org_yale);

  -- 8. Timothy P Roberts: SEATTLE CHILDREN'S -> CHOP
  DELETE FROM investigator_organizations WHERE investigator_id = 'c513c629-cc53-4b42-9902-54322bc96d61';
  INSERT INTO investigator_organizations (investigator_id, organization_id) VALUES ('c513c629-cc53-4b42-9902-54322bc96d61', v_org_chop);

  -- 9. David Nelson Kennedy: MIT -> UMass Worcester
  DELETE FROM investigator_organizations WHERE investigator_id = '188573e1-1a28-4b53-b95c-985c955feadd';
  INSERT INTO investigator_organizations (investigator_id, organization_id) VALUES ('188573e1-1a28-4b53-b95c-985c955feadd', v_org_umass);

  -- 10. Laura Yenisa Cabrera Trujillo: MIT -> Penn State
  DELETE FROM investigator_organizations WHERE investigator_id = '0d08421a-2cff-41c7-a0d7-24a8ff40d4cc';
  INSERT INTO investigator_organizations (investigator_id, organization_id) VALUES ('0d08421a-2cff-41c7-a0d7-24a8ff40d4cc', v_org_pennstate);
END $$;