INSERT INTO nih_grants_cache (grant_number, data, updated_at)
VALUES (
  '1R61MH138612',
  '{
    "grantNumber": "1R61MH138612-01",
    "title": "SeeMe: A multimodal behavioral-electrophysiological tool for real-time detection of consciousness",
    "abstract": "",
    "contactPi": "MOFAKHAM, SIMA",
    "allPis": "Sima Mofakham, Chuck Mikell, Petar Djuric",
    "piDetails": [
      {"fullName": "Sima Mofakham", "lastName": "Mofakham", "firstName": "Sima", "profileId": null, "isContactPi": true},
      {"fullName": "Chuck Mikell", "lastName": "Mikell", "firstName": "Chuck", "profileId": null, "isContactPi": false},
      {"fullName": "Petar Djuric", "lastName": "Djuric", "firstName": "Petar", "profileId": null, "isContactPi": false}
    ],
    "institution": "Unknown",
    "fiscalYear": 2025,
    "awardAmount": 0,
    "nihLink": "https://reporter.nih.gov/project-details/1R61MH138612-01",
    "publications": [],
    "publicationCount": 0
  }'::jsonb,
  now()
)
ON CONFLICT (grant_number) DO UPDATE SET data = EXCLUDED.data, updated_at = now();