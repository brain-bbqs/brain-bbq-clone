INSERT INTO public.resources (name, resource_type, description, external_url, metadata)
VALUES (
  'Lightning Pose',
  'software',
  'Markerless pose estimation tool for neuroscience, published in Nature Methods (2024). Supports single-view and multi-view, single-animal pose estimation with a GUI for multi-view labeling. Developed by Liam Paninski''s lab at Columbia University Zuckerman Institute.',
  'https://lightning-pose.readthedocs.io/',
  jsonb_build_object(
    'repoUrl', 'https://github.com/paninski-lab/lightning-pose',
    'version', '',
    'implementation', 'Python',
    'algorithm', 'Markerless pose estimation tool for neuroscience, published in Nature Methods (2024). Supports single-view and multi-view, single-animal pose estimation with a new GUI for multi-view labeling and viewing.',
    'computational', 'Deep Learning',
    'species', 'Multiple',
    'mcpStatus', 'not-started',
    'containerized', false,
    'category', 'Software'
  )
);