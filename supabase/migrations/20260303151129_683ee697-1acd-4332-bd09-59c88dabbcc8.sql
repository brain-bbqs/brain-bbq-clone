
-- Seed CIRTA doctoral and postdoctoral job postings
INSERT INTO public.jobs (title, institution, department, location, job_type, description, contact_email, application_url)
VALUES
(
  'Canada Impact+ Doctoral Research Training Award ($40K/yr, 3 years)',
  'McGill University',
  'Graduate and Postdoctoral Studies',
  'Montreal, QC, Canada',
  'phd',
  'The Canada Impact+ Research Training Awards (CIRTA) is a targeted, one-time initiative to recruit international or returning Canadian doctoral students to Canada. Funded by CIHR, NSERC, and SSHRC. Award value: $40,000/year for 3 years (600 awards across Canada, 30 allocated to McGill). Priority areas include: Advanced digital technologies (AI, quantum, cybersecurity), Health/biotechnology, Clean technology, Environment/climate resilience, Food/water security, Democratic/community resilience, Manufacturing/advanced materials, and Defense/dual-use technologies. McGill Faculty members (supervisors) identify and nominate incoming doctoral students for Fall 2026.',
  'Graduatefunding.gps@mcgill.ca',
  'https://www.mcgill.ca'
),
(
  'Canada Impact+ Postdoctoral Research Training Award ($70K/yr, 2 years)',
  'McGill University',
  'Graduate and Postdoctoral Studies',
  'Montreal, QC, Canada',
  'postdoc',
  'The Canada Impact+ Research Training Awards (CIRTA) is a targeted, one-time initiative to recruit international or returning Canadian postdoctoral researchers to Canada. Funded by CIHR, NSERC, and SSHRC. Award value: $70,000/year for 2 years (400 awards across Canada, 17 allocated to McGill). Priority areas include: Advanced digital technologies (AI, quantum, cybersecurity), Health/biotechnology, Clean technology, Environment/climate resilience, Food/water security, Democratic/community resilience, Manufacturing/advanced materials, and Defense/dual-use technologies. All eligible nominees in McGill''s institutional submission are expected to receive the award.',
  'Graduatefunding.gps@mcgill.ca',
  'https://www.mcgill.ca'
);
