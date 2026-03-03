
DO $$
DECLARE
  new_resource_id uuid;
BEGIN
  INSERT INTO public.resources (name, resource_type, description, external_url, metadata)
  VALUES (
    'fastplotlib',
    'software',
    'Open source GPU-accelerated scientific plotting library built on next-gen wgpu & pygfx technologies. Enables fast and interactive visualization of large-scale high-dimensional & multi-modal neural data, integrating into every step of the analysis pipeline — from real-time data acquisition, calcium imaging, multi-electrode electrophysiology recordings, and behavior analysis. Supports human-in-the-loop analysis systems for data processing and model exploration.',
    'https://github.com/fastplotlib/fastplotlib',
    jsonb_build_object(
      'repoUrl', 'https://github.com/fastplotlib/fastplotlib',
      'implementation', 'Python',
      'category', 'Software',
      'contributors', jsonb_build_array(
        jsonb_build_object('name', 'Kushal Kolar', 'email', 'kushalkolar@gmail.com', 'affiliation', 'NYU'),
        jsonb_build_object('name', 'Caitlin Lewis', 'email', 'caitlin.lewis@duke.edu', 'affiliation', 'Duke University')
      )
    )
  )
  RETURNING id INTO new_resource_id;

  INSERT INTO public.software_tools (name, description, repo_url, language, license, resource_id)
  VALUES (
    'fastplotlib',
    'Open source GPU-accelerated scientific plotting library built on wgpu & pygfx. Supports real-time data acquisition visualization, calcium imaging, multi-electrode electrophysiology, and behavior analysis with human-in-the-loop capabilities.',
    'https://github.com/fastplotlib/fastplotlib',
    'Python',
    'Open Source',
    new_resource_id
  );
END $$;
