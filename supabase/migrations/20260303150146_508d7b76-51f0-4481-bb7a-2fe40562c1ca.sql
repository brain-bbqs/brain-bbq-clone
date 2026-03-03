
-- Seed Bouchard postdoc positions (no posted_by since Chris doesn't have an account yet)
INSERT INTO public.jobs (title, institution, department, location, job_type, description, contact_name, contact_email, posted_by_email, is_active)
VALUES
  (
    'Organoid Intelligence through Control of Neural Population Dynamics (FBC_PD)',
    'UC Berkeley / LBNL',
    'Computational Biosciences Group, Scientific Data Division & Helen Wills Neuroscience Institute',
    'Berkeley, CA',
    'postdoc',
    'Fully-funded postdoctoral position in organoid intelligence through control of neural population dynamics. Join the Neural Systems and Machine Learning Lab at UC Berkeley and Lawrence Berkeley National Laboratory.',
    'Kristofer E. Bouchard',
    'kebouchard@lbl.gov',
    'kebouchard@lbl.gov',
    true
  ),
  (
    'Theoretical Understanding of Distributed Neural Population Dynamics (Theory_PD)',
    'UC Berkeley / LBNL',
    'Computational Biosciences Group, Scientific Data Division & Redwood Center for Theoretical Neuroscience',
    'Berkeley, CA',
    'postdoc',
    'Fully-funded postdoctoral position focused on theoretical understanding of distributed neural population dynamics. Join the Neural Systems and Machine Learning Lab at UC Berkeley and Lawrence Berkeley National Laboratory.',
    'Kristofer E. Bouchard',
    'kebouchard@lbl.gov',
    'kebouchard@lbl.gov',
    true
  );
