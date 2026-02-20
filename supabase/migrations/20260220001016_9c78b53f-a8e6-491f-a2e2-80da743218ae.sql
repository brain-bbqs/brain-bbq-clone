-- Add repoUrl and dockerUrl to metadata for software tools

UPDATE resources SET metadata = metadata || '{"repoUrl": "https://github.com/DeepLabCut/DeepLabCut", "dockerUrl": "https://hub.docker.com/r/deeplabcut/deeplabcut"}'::jsonb WHERE id = '4009a1f6-c173-495b-9725-bb51571a3cdf';

UPDATE resources SET metadata = metadata || '{"repoUrl": "https://github.com/TadasBaltrusaitis/OpenFace", "dockerUrl": "https://hub.docker.com/r/algebr/openface"}'::jsonb WHERE id = 'd38cd5f0-0429-4fc0-a9e3-06039719e581';

UPDATE resources SET metadata = metadata || '{"repoUrl": "https://github.com/CMU-Perceptual-Computing-Lab/openpose", "dockerUrl": "https://hub.docker.com/r/cwaffles/openpose"}'::jsonb WHERE id = '529a7b7d-e25c-4d71-b61a-05733ab55f08';

UPDATE resources SET metadata = metadata || '{"repoUrl": "https://github.com/sgoldenlab/simba", "dockerUrl": "https://hub.docker.com/r/sgoldenlab/simba"}'::jsonb WHERE id = 'c7ddfa55-b28b-4143-a94f-ebddaf38bd77';

UPDATE resources SET metadata = metadata || '{"repoUrl": "https://github.com/talmolab/sleap", "dockerUrl": "https://hub.docker.com/r/talmolab/sleap"}'::jsonb WHERE id = '340ce805-e6f8-454a-bb4b-83ef53e0d444';

-- Add repoUrl for non-containerized tools that have GitHub repos
UPDATE resources SET metadata = metadata || '{"repoUrl": "https://github.com/jgraving/DeepPoseKit"}'::jsonb WHERE name = 'DeepPoseKit' AND resource_type = 'software';

UPDATE resources SET metadata = metadata || '{"repoUrl": "https://github.com/DrCoffey/DeepSqueak"}'::jsonb WHERE name = 'DeepSqueak' AND resource_type = 'software';

UPDATE resources SET metadata = metadata || '{"repoUrl": "https://github.com/neuroethology/MARS"}'::jsonb WHERE name = 'MARS' AND resource_type = 'software';

UPDATE resources SET metadata = metadata || '{"repoUrl": "https://github.com/annkennedy/bento"}'::jsonb WHERE name = 'BENTO' AND resource_type = 'software';

UPDATE resources SET metadata = metadata || '{"repoUrl": "https://github.com/dattalab/moseq2-app"}'::jsonb WHERE name = 'MoSeq' AND resource_type = 'software';

UPDATE resources SET metadata = metadata || '{"repoUrl": "https://github.com/open-ephys/plugin-GUI"}'::jsonb WHERE name = 'Open Ephys' AND resource_type = 'software';

UPDATE resources SET metadata = metadata || '{"repoUrl": "https://github.com/sccn/labstreaminglayer"}'::jsonb WHERE name = 'LabStreamingLayer' AND resource_type = 'software';

UPDATE resources SET metadata = metadata || '{"repoUrl": "https://github.com/bonsai-rx/bonsai"}'::jsonb WHERE name = 'Bonsai' AND resource_type = 'software';

UPDATE resources SET metadata = metadata || '{"repoUrl": "https://github.com/talmo/anipose"}'::jsonb WHERE name = 'Anipose' AND resource_type = 'software';

UPDATE resources SET metadata = metadata || '{"repoUrl": "https://github.com/kristinbranson/JAABA"}'::jsonb WHERE name = 'JAABA' AND resource_type = 'software';

UPDATE resources SET metadata = metadata || '{"repoUrl": "https://gitlab.com/polidoro-lab/idtracker.ai"}'::jsonb WHERE name = 'idtracker.ai' AND resource_type = 'software';