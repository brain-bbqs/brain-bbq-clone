
-- Update all 26 BBQS project metadata from MARR-aligned YAML

-- 1. R34DA059510
UPDATE public.projects SET
  study_species = ARRAY['Social species with male displays'],
  use_approaches = ARRAY['Multi-animal observation', 'Environmental context manipulation'],
  use_sensors = ARRAY['Cameras'],
  produce_data_modality = ARRAY['Video / Optical', 'Behavioral tracking'],
  produce_data_type = ARRAY['Video frames', 'Continuous kinematic time-series'],
  use_analysis_types = ARRAY['State estimation', 'Contextual influence modeling'],
  use_analysis_method = ARRAY['Computer vision tracking', 'High-dimensional state modeling'],
  keywords = ARRAY['Social reproduction', 'Hierarchical status', 'Computer vision', 'Conspecifics'],
  study_human = false,
  metadata = jsonb_build_object(
    'marr_l1_ethological_goal', 'Social reproductive behaviors, navigation of hierarchical status, and collective conspecific interactions within an evolutionary context.',
    'marr_l2_algorithmic_function', 'High-dimensional contextual influence modeling; tracking state changes triggered by environmental cues.',
    'marr_l3_implementational_hardware', 'Custom behavioral arena capable of mimicking natural environments with multiple conspecifics.',
    'data_analysis_approach', 'Creating computer vision and tracking tools to monitor large numbers of conspecifics simultaneously. Building models to isolate and quantify how environmental contexts causally influence state changes.',
    'cross_project_synergy', 'Evolutionary modeling of social states can serve as a baseline for the primate AI Forest (R34DA061925).',
    'target_species_domain', 'Social species with male displays',
    'devices', jsonb_build_object('sensor', ARRAY['Cameras'], 'data_acquisition_modalities', ARRAY['Multi-animal video recording'], 'behavioral_rigs', ARRAY['Custom behavioral arena mimicking natural environments'])
  ),
  metadata_completeness = 73,
  updated_at = now()
WHERE grant_number = 'R34DA059510';

-- 2. R34DA059509
UPDATE public.projects SET
  use_approaches = ARRAY['Active learning behavioral quantification', 'Physiological state mapping'],
  use_sensors = ARRAY['Multidimensional physiological sensors'],
  produce_data_modality = ARRAY['Behavioral tracking', 'Physiological', 'Neural'],
  produce_data_type = ARRAY['Continuous multidimensional time-series'],
  use_analysis_types = ARRAY['Active learning', 'State-dependent modeling'],
  use_analysis_method = ARRAY['Dynamic sampling algorithms'],
  keywords = ARRAY['Active learning', 'Physiological monitoring', 'Adaptive behavior', 'State-dependent'],
  metadata = jsonb_build_object(
    'marr_l1_ethological_goal', 'Adaptive behavior and state-dependent physiological responses.',
    'marr_l2_algorithmic_function', 'Active learning algorithms for behavioral quantification; mapping physiological state to behavioral output.',
    'marr_l3_implementational_hardware', 'Multidimensional physiological sensors synchronized with behavioral tracking.',
    'data_analysis_approach', 'Using active learning frameworks to dynamically sample and quantify behavior based on real-time physiological and neural monitoring.',
    'cross_project_synergy', 'Active learning loops can optimize the continuous monitoring models required in R61MH135405 (CAMERA platform).',
    'target_species_domain', 'Requires Verification',
    'devices', jsonb_build_object('sensor', ARRAY['Multidimensional physiological sensors'], 'data_acquisition_modalities', ARRAY['Synchronized behavioral and physiological monitoring'])
  ),
  metadata_completeness = 64,
  updated_at = now()
WHERE grant_number = 'R34DA059509';

-- 3. R34DA059513
UPDATE public.projects SET
  use_approaches = ARRAY['Naturalistic social observation', 'Multimodal fusion', 'Acoustic monitoring'],
  use_sensors = ARRAY['Microphone arrays', 'Behavioral cameras'],
  produce_data_modality = ARRAY['Audio / Acoustic', 'Video / Behavioral', 'Neural'],
  produce_data_type = ARRAY['Acoustic waveforms', 'Video frames', 'Neural time-series'],
  use_analysis_types = ARRAY['Source separation', 'Multimodal alignment', 'Dimensionality reduction'],
  use_analysis_method = ARRAY['Computational attribution (Cocktail party problem solving)'],
  keywords = ARRAY['Vocalizations', 'Source separation', 'Multimodal fusion', 'Cocktail party problem'],
  study_human = false,
  metadata = jsonb_build_object(
    'marr_l1_ethological_goal', 'Vocal communication and social signaling within naturalistic environments.',
    'marr_l2_algorithmic_function', 'Computational source separation (attribution) and multimodal data fusion.',
    'marr_l3_implementational_hardware', 'Microphone arrays, continuous neural recordings, and behavioral cameras in naturalistic arenas.',
    'data_analysis_approach', 'Fusing acoustic data with physical tracking to solve the cocktail party problem of attributing specific vocalizations to individual interacting animals while simultaneously mapping neural responses.',
    'cross_project_synergy', 'The source attribution algorithms developed here are highly translatable to the gregarious songbird smart aviary (R34DA059507).',
    'target_species_domain', 'Requires Verification',
    'devices', jsonb_build_object('sensor', ARRAY['Microphone arrays', 'Behavioral cameras'], 'data_acquisition_modalities', ARRAY['Acoustic recording', 'Video tracking', 'Continuous neural recording'], 'behavioral_rigs', ARRAY['Naturalistic arenas'])
  ),
  metadata_completeness = 73,
  updated_at = now()
WHERE grant_number = 'R34DA059513';

-- 4. R34DA059507
UPDATE public.projects SET
  study_species = ARRAY['Gregarious Songbirds'],
  use_approaches = ARRAY['3D environment tracking', 'Flocking dynamics observation'],
  use_sensors = ARRAY['Distributed computer vision arrays', 'Microphones'],
  produce_data_modality = ARRAY['Video / Optical', 'Audio', 'Neural'],
  produce_data_type = ARRAY['3D Kinematics', 'Acoustic sequences', 'Neural spike trains'],
  use_analysis_types = ARRAY['3D Multi-agent tracking', 'Neural sequence modeling'],
  use_analysis_method = ARRAY['Computer vision spatial transformations', 'Keypoint extraction'],
  keywords = ARRAY['Smart aviary', '3D tracking', 'Songbirds', 'Flocking dynamics', 'Neural sequence'],
  study_human = false,
  metadata = jsonb_build_object(
    'marr_l1_ethological_goal', 'Complex social interactions, flocking dynamics, and vocal communication in a 3D environment.',
    'marr_l2_algorithmic_function', '3D multi-agent tracking algorithms and neural sequence modeling.',
    'marr_l3_implementational_hardware', 'Smart aviary equipped with distributed computer vision arrays and wireless neural loggers.',
    'data_analysis_approach', 'Deploying an instrumented aviary to seamlessly track 3D kinematics and vocalizations of multiple birds, linking these high-dimensional behaviors to underlying neural circuit dynamics.',
    'cross_project_synergy', '3D kinematic tracking in the aviary translates directly to the AI Forest for wild primates (R34DA061925).',
    'target_species_domain', 'Gregarious Songbirds',
    'devices', jsonb_build_object('sensor', ARRAY['Distributed computer vision arrays', 'Microphones'], 'data_acquisition_modalities', ARRAY['Wireless data logging', 'Multi-camera 3D tracking'], 'behavioral_rigs', ARRAY['Smart Aviary'], 'electrophysiology_setup', ARRAY['Wireless neural loggers'])
  ),
  metadata_completeness = 82,
  updated_at = now()
WHERE grant_number = 'R34DA059507';

-- 5. R34DA059718
UPDATE public.projects SET
  use_approaches = ARRAY['Biological rhythm monitoring', 'Social interaction observation'],
  use_sensors = ARRAY['High-resolution cameras', 'Physiological sensors'],
  produce_data_modality = ARRAY['Physiological (Autonomic)', 'Neural (Oscillations)', 'Video / Behavioral'],
  produce_data_type = ARRAY['Continuous physiological time-series', 'Behavioral motifs'],
  use_analysis_types = ARRAY['Behavioral segmentation', 'Topological mapping'],
  use_analysis_method = ARRAY['Time-series dimensionality reduction'],
  keywords = ARRAY['Biological rhythms', 'Social motifs', 'Autonomic', 'Behavioral segmentation'],
  study_human = false,
  metadata = jsonb_build_object(
    'marr_l1_ethological_goal', 'Generation and regulation of resilient social behaviors and rhythmic interaction motifs.',
    'marr_l2_algorithmic_function', 'Time-series behavioral segmentation; topological mapping of biological rhythms.',
    'marr_l3_implementational_hardware', 'Neural and physiological recording devices combined with high-resolution behavioral tracking.',
    'data_analysis_approach', 'Quantifying how intrinsic biological rhythms dictate the onset, duration, and resilience of specific social behavioral motifs.',
    'cross_project_synergy', 'Pairs elegantly with the human autonomic rhythm tracking in R61MH135106 for cross-species modeling of internal states.',
    'target_species_domain', 'Requires Verification',
    'devices', jsonb_build_object('sensor', ARRAY['High-resolution cameras', 'Physiological sensors'], 'data_acquisition_modalities', ARRAY['Physiological rhythm recording', 'Video tracking'])
  ),
  metadata_completeness = 64,
  updated_at = now()
WHERE grant_number = 'R34DA059718';

-- 6. R34DA059506
UPDATE public.projects SET
  use_approaches = ARRAY['Deep phenotyping', 'Social interaction tracking'],
  use_sensors = ARRAY['Multi-camera arrays'],
  produce_data_modality = ARRAY['Video / Optical'],
  produce_data_type = ARRAY['Raw pixels', 'Continuous 3D kinematic latents'],
  use_analysis_types = ARRAY['3D tracking', 'Phenotypic analysis'],
  use_analysis_method = ARRAY['Non-linear spatial transformations', 'Computer vision', '3D keypoint extraction'],
  keywords = ARRAY['3D tracking', 'Deep phenotyping', 'Computer vision', 'Keypoint extraction'],
  metadata = jsonb_build_object(
    'marr_l1_ethological_goal', 'Precise physical execution of social behaviors and deep phenotyping.',
    'marr_l2_algorithmic_function', '3D keypoint extraction and non-linear spatial transformations.',
    'marr_l3_implementational_hardware', 'Multi-camera 3D arrays.',
    'data_analysis_approach', 'Utilizing advanced computer vision to extract deep 3D phenotypic markers during social interactions, transforming raw pixel data into continuous kinematic latents.',
    'cross_project_synergy', 'Can serve as a foundational validation dataset for EMBER (R24MH136632) behavioral ontologies (NBO).',
    'target_species_domain', 'Requires Verification',
    'devices', jsonb_build_object('sensor', ARRAY['Multi-camera arrays'], 'data_acquisition_modalities', ARRAY['High-resolution 3D video capture'])
  ),
  metadata_completeness = 64,
  updated_at = now()
WHERE grant_number = 'R34DA059506';

-- 7. R34DA059512
UPDATE public.projects SET
  study_species = ARRAY['Rodents'],
  use_approaches = ARRAY['High-throughput screening', 'Dynamic environment navigation'],
  use_sensors = ARRAY['3D cameras'],
  produce_data_modality = ARRAY['Video / Optical'],
  produce_data_type = ARRAY['3D kinematic trajectories'],
  use_analysis_types = ARRAY['Dynamic state estimation', 'Statistical behavioral modeling'],
  use_analysis_method = ARRAY['Computer vision', 'High-throughput 3D measurement algorithms'],
  keywords = ARRAY['High-throughput', '3D measurement', 'Rodent', 'Dynamic environment', 'Kinematics'],
  study_human = false,
  metadata = jsonb_build_object(
    'marr_l1_ethological_goal', 'Navigation and survival in physically dynamic, changing environments.',
    'marr_l2_algorithmic_function', 'High-throughput 3D kinematics and dynamic state estimation.',
    'marr_l3_implementational_hardware', 'Dynamic behavioral arenas with 3D tracking capabilities.',
    'data_analysis_approach', 'Scaling up ethological observation to high-throughput levels while maintaining 3D spatial resolution.',
    'cross_project_synergy', 'Algorithmic approaches for managing dynamic environments can directly aid the human real-world spatial navigation models (R61MH135106).',
    'target_species_domain', 'Rodents',
    'devices', jsonb_build_object('sensor', ARRAY['3D cameras'], 'data_acquisition_modalities', ARRAY['High-throughput video arrays'], 'behavioral_rigs', ARRAY['Dynamic behavioral arenas'])
  ),
  metadata_completeness = 82,
  updated_at = now()
WHERE grant_number = 'R34DA059512';

-- 8. R34DA059716
UPDATE public.projects SET
  study_species = ARRAY['Humans'],
  use_approaches = ARRAY['Dyadic conversation (virtual and in-person)', 'Hyperscanning'],
  use_sensors = ARRAY['EEG caps', 'Cameras', 'Microphones'],
  produce_data_modality = ARRAY['Neural (EEG)', 'Video (Facial expressions, gestures)', 'Audio (Speech rates)'],
  produce_data_type = ARRAY['EEG time-series', 'Video frames', 'Acoustic sequences'],
  use_analysis_types = ARRAY['Temporal pattern analysis', 'Interpersonal synchrony measurement'],
  use_analysis_method = ARRAY['Multimodal alignment algorithms', 'Time-series reduction'],
  keywords = ARRAY['Dyadic conversation', 'Hyperscanning', 'Turn-taking', 'EEG', 'Multimodal synchronization'],
  study_human = true,
  metadata = jsonb_build_object(
    'marr_l1_ethological_goal', 'Social communication, dyadic interpersonal synchronization, and turn-taking.',
    'marr_l2_algorithmic_function', 'Temporal pattern analysis and multimodal alignment.',
    'marr_l3_implementational_hardware', 'Pilot EEG hyperscanning, multimodal communication trackers.',
    'data_analysis_approach', 'Quantifying and analyzing temporal patterns of multimodal communication during face-to-face and remote dyadic interactions.',
    'cross_project_synergy', 'Compare EEG hyperscanning pipelines with Marmoset multi-agent RNN models (1U01DA063534) to isolate conserved algorithms of turn-taking.',
    'target_species_domain', 'Humans',
    'devices', jsonb_build_object('sensor', ARRAY['EEG caps', 'Cameras', 'Microphones'], 'data_acquisition_modalities', ARRAY['Hyperscanning', 'Audio-visual recording'], 'behavioral_rigs', ARRAY['Virtual interaction setup', 'Face-to-face seating'], 'electrophysiology_setup', ARRAY['Pilot EEG hyperscanning'])
  ),
  metadata_completeness = 91,
  updated_at = now()
WHERE grant_number = 'R34DA059716';

-- 9. R34DA059723
UPDATE public.projects SET
  study_species = ARRAY['Freely moving animals'],
  use_approaches = ARRAY['Foraging observation', 'Fine motor manipulation analysis'],
  use_sensors = ARRAY['High-speed macro cameras'],
  produce_data_modality = ARRAY['Video / Optical (High-speed)', 'Neural'],
  produce_data_type = ARRAY['High-speed video frames', 'Neural time-series'],
  use_analysis_types = ARRAY['Fine-grained kinematic tracking', 'Sensorimotor integration analysis'],
  use_analysis_method = ARRAY['Micro-behavioral synchronization', 'Computer vision tracking'],
  keywords = ARRAY['Oromanual', 'Food-handling', 'Foraging', 'Kinematics', 'Sensorimotor'],
  study_human = false,
  metadata = jsonb_build_object(
    'marr_l1_ethological_goal', 'Foraging, food acquisition, and fine motor manipulation.',
    'marr_l2_algorithmic_function', 'Fine-grained kinematic tracking and sensorimotor integration modeling.',
    'marr_l3_implementational_hardware', 'High-speed macro cameras; continuous neural recordings.',
    'data_analysis_approach', 'Isolating the rapid, complex kinematics of oromanual food handling and syncing these micro-behaviors with neural streams.',
    'cross_project_synergy', 'Oromanual kinematics can provide an isolated, high-resolution test case for the Embodied Musculoskeletal Frameworks being built in 1U01DA063534.',
    'target_species_domain', 'Freely moving animals',
    'devices', jsonb_build_object('sensor', ARRAY['High-speed macro cameras'], 'data_acquisition_modalities', ARRAY['High frame-rate video', 'Continuous electrophysiology'], 'behavioral_rigs', ARRAY['Freely moving enclosures'])
  ),
  metadata_completeness = 82,
  updated_at = now()
WHERE grant_number = 'R34DA059723';

-- 10. R34DA059514
UPDATE public.projects SET
  study_species = ARRAY['Sheep'],
  use_approaches = ARRAY['Field observation', 'Agricultural herd tracking'],
  use_sensors = ARRAY['Head-mounted visual sensors (Cameras)'],
  produce_data_modality = ARRAY['Video / Optical (Egocentric)', 'Neural'],
  produce_data_type = ARRAY['High-resolution spatiotemporal matrices', 'Neural spike data'],
  use_analysis_types = ARRAY['Collective behavior modeling', '3D herd kinematics'],
  use_analysis_method = ARRAY['Non-linear spatial transformations', 'Egocentric computer vision analysis'],
  keywords = ARRAY['Sheep', 'Collective behavior', 'Herd navigation', 'Head-mounted sensors'],
  study_human = false,
  metadata = jsonb_build_object(
    'marr_l1_ethological_goal', 'Complex collective behavior and herd navigation in naturalistic field environments.',
    'marr_l2_algorithmic_function', 'Non-linear spatial transformations and 3D kinematics in a herd context.',
    'marr_l3_implementational_hardware', 'Head-mounted visual sensors, robust freely-moving neural recordings.',
    'data_analysis_approach', 'Leveraging existing agricultural sheep herds to acquire high-resolution spatiotemporal measurements.',
    'cross_project_synergy', 'Hardware constraints (L3) and spatial transformation algorithms (L2) can inform primate or human real-world navigation studies (R61MH135106).',
    'target_species_domain', 'Sheep',
    'devices', jsonb_build_object('sensor', ARRAY['Head-mounted visual sensors (Cameras)'], 'data_acquisition_modalities', ARRAY['Mobile egocentric video logging', 'Wireless electrophysiology'], 'behavioral_rigs', ARRAY['Naturalistic field environments / Pastures'], 'electrophysiology_setup', ARRAY['Robust freely-moving neural recording implants'])
  ),
  metadata_completeness = 82,
  updated_at = now()
WHERE grant_number = 'R34DA059514';

-- 11. R34DA059500
UPDATE public.projects SET
  study_species = ARRAY['Genetic Species'],
  use_approaches = ARRAY['Spatial navigation tasks', 'Virtual reality or freely behaving optical imaging'],
  use_sensors = ARRAY['Microscopes (Multi-photon or miniaturized)'],
  produce_data_modality = ARRAY['Optical Neural Imaging', 'Behavioral tracking'],
  produce_data_type = ARRAY['Large-scale population fluorescence signals', 'Locomotor trajectories'],
  use_analysis_types = ARRAY['Sensory-to-motor transformation mapping', 'Population dynamics'],
  use_analysis_method = ARRAY['State-space modeling'],
  keywords = ARRAY['Optical imaging', 'Genetic species', 'Spatial navigation', 'State-space modeling'],
  study_human = false,
  metadata = jsonb_build_object(
    'marr_l1_ethological_goal', 'Spatial navigation and integration of environmental cues into behavioral outputs.',
    'marr_l2_algorithmic_function', 'State-space modeling linking whole-brain optical dynamics to locomotor intent.',
    'marr_l3_implementational_hardware', 'Advanced optical imaging in freely behaving or virtual reality setups.',
    'data_analysis_approach', 'Utilizing transformative optical imaging to capture large-scale neural population dynamics simultaneously with precise behavioral tracking.',
    'cross_project_synergy', 'Provides the highest-resolution Level 3 data to validate the broader navigation algorithms used in larger mammals.',
    'target_species_domain', 'Genetic Species',
    'devices', jsonb_build_object('sensor', ARRAY['Microscopes (Multi-photon or miniaturized)'], 'data_acquisition_modalities', ARRAY['Optical imaging', 'Locomotor tracking'], 'behavioral_rigs', ARRAY['Freely behaving arenas', 'Virtual Reality (VR) setups'])
  ),
  metadata_completeness = 82,
  updated_at = now()
WHERE grant_number = 'R34DA059500';

-- 12. R34DA061984
UPDATE public.projects SET
  study_species = ARRAY['New Model System'],
  use_approaches = ARRAY['Sensory ecology observation', 'Pipeline establishment'],
  use_sensors = ARRAY['Novel environmental sensing arrays'],
  produce_data_modality = ARRAY['Environmental sensing', 'Neural', 'Behavioral'],
  produce_data_type = ARRAY['Multimodal environmental variables', 'Neural signals'],
  use_analysis_types = ARRAY['Ecological modeling', 'Sensory processing'],
  use_analysis_method = ARRAY['Generalized tracking algorithms'],
  keywords = ARRAY['Organism-environment', 'New model system', 'Sensory ecology'],
  study_human = false,
  metadata = jsonb_build_object(
    'marr_l1_ethological_goal', 'Organism-environment interactions; sensory ecology.',
    'marr_l2_algorithmic_function', 'Ecological modeling and sensory processing algorithms.',
    'marr_l3_implementational_hardware', 'Novel environmental sensing arrays and neural interfacing adapted for the specific model system.',
    'data_analysis_approach', 'Establishing baseline behavioral and neural quantification pipelines for an entirely new model organism.',
    'cross_project_synergy', 'Testing BARD.CC and EMBER ability to handle completely novel metadata schemas and ontologies.',
    'target_species_domain', 'New Model System',
    'devices', jsonb_build_object('sensor', ARRAY['Novel environmental sensing arrays'], 'data_acquisition_modalities', ARRAY['Customized interaction tracking'], 'behavioral_rigs', ARRAY['Species-specific custom rigs'])
  ),
  metadata_completeness = 82,
  updated_at = now()
WHERE grant_number = 'R34DA061984';

-- 13. R34DA061924
UPDATE public.projects SET
  study_species = ARRAY['Interacting Animals'],
  use_approaches = ARRAY['Multi-scale social tracking', 'Phase transition induction'],
  use_sensors = ARRAY['Multi-animal cameras', 'Scalable arrays'],
  produce_data_modality = ARRAY['Neural', 'Behavioral', 'Social metadata'],
  produce_data_type = ARRAY['Micro-scale neural spikes', 'Macro-scale social network graphs'],
  use_analysis_types = ARRAY['Phase transition analysis', 'Complex systems mapping'],
  use_analysis_method = ARRAY['Multi-scale dynamic systems modeling', 'Time-series dimensionality reduction'],
  keywords = ARRAY['Dynamic transitions', 'Social scales', 'Complex systems', 'Phase transitions'],
  study_human = false,
  metadata = jsonb_build_object(
    'marr_l1_ethological_goal', 'Social phase transitions, group cohesion, and hierarchical dynamics.',
    'marr_l2_algorithmic_function', 'Multi-scale dynamic systems modeling; Phase transition analysis.',
    'marr_l3_implementational_hardware', 'Scalable neural and behavioral arrays for multi-animal cohorts.',
    'data_analysis_approach', 'Applying complex systems theory to map how micro-scale neural events trigger macro-scale behavioral and social state transitions.',
    'cross_project_synergy', 'Strong theoretical overlap with the Multi-Agent Dynamics of 1U01DA063534; algorithms can be directly compared.',
    'target_species_domain', 'Interacting Animals',
    'devices', jsonb_build_object('sensor', ARRAY['Multi-animal cameras', 'Scalable arrays'], 'data_acquisition_modalities', ARRAY['Synchronized multi-animal telemetry'], 'behavioral_rigs', ARRAY['Cohort arenas'], 'electrophysiology_setup', ARRAY['Scalable neural arrays'])
  ),
  metadata_completeness = 82,
  updated_at = now()
WHERE grant_number = 'R34DA061924';

-- 14. R34DA061925
UPDATE public.projects SET
  study_species = ARRAY['Wild Primates'],
  use_approaches = ARRAY['Wild ecological observation', 'Unobtrusive monitoring'],
  use_sensors = ARRAY['Environmental camera networks'],
  produce_data_modality = ARRAY['Video / Optical', 'Environmental / Meteorological'],
  produce_data_type = ARRAY['Wild-environment video frames'],
  use_analysis_types = ARRAY['Robust feature extraction', 'Complex behavioral trait identification'],
  use_analysis_method = ARRAY['Computer vision spatial transformations', 'Edge-deployed ML models'],
  keywords = ARRAY['AI Forest', 'Wild primates', 'Computer vision', 'Edge computing', 'Ecological factors'],
  study_human = false,
  metadata = jsonb_build_object(
    'marr_l1_ethological_goal', 'Survival, foraging, and social navigation in unstructured, wild ecological environments.',
    'marr_l2_algorithmic_function', 'Wild-environment computer vision; robust behavioral feature extraction from noisy backgrounds.',
    'marr_l3_implementational_hardware', 'Unobtrusive environmental camera networks (AI Forest), edge-computing nodes.',
    'data_analysis_approach', 'Deploying AI at the edge in wild environments to track complex behavioral traits.',
    'cross_project_synergy', 'The ultimate test of Behavior-First observation. Data pipelines here will stress-test the laboratory-derived algorithms of 1U01DA063534.',
    'target_species_domain', 'Wild Primates',
    'devices', jsonb_build_object('sensor', ARRAY['Environmental camera networks'], 'data_acquisition_modalities', ARRAY['Remote video tracking', 'Edge processing'], 'behavioral_rigs', ARRAY['Natural unstructured wild environments (AI Forest)'])
  ),
  metadata_completeness = 82,
  updated_at = now()
WHERE grant_number = 'R34DA061925';

-- 15. R34DA062119
UPDATE public.projects SET
  study_species = ARRAY['Developmental Models'],
  use_approaches = ARRAY['Longitudinal tracking', 'Multi-site standardized protocol implementation'],
  produce_data_modality = ARRAY['Behavioral', 'Neural'],
  produce_data_type = ARRAY['Longitudinal multi-site datasets'],
  use_analysis_types = ARRAY['Ontogeny analysis', 'Experience-dependent adaptation modeling'],
  use_analysis_method = ARRAY['Cross-site harmonization algorithms', 'Longitudinal data modeling'],
  keywords = ARRAY['International Development Project', 'Ontogeny', 'Harmonization', 'Longitudinal'],
  metadata = jsonb_build_object(
    'marr_l1_ethological_goal', 'Ontogeny; experience-dependent adaptation and neurodevelopment across the lifespan.',
    'marr_l2_algorithmic_function', 'Longitudinal data modeling; standardized cross-site harmonization algorithms.',
    'marr_l3_implementational_hardware', 'Standardized multi-site recording equipment.',
    'data_analysis_approach', 'Creating standardized protocols and computational pipelines to ensure data recorded across international sites can be seamlessly merged.',
    'cross_project_synergy', 'Fundamentally aligned with BARD.CC (U24MH136628) and EMBER (R24MH136632) regarding data standardization.',
    'target_species_domain', 'Developmental Models',
    'devices', jsonb_build_object('sensor', ARRAY['Standardized equipment'], 'data_acquisition_modalities', ARRAY['Multi-site standardized recording'], 'behavioral_rigs', ARRAY['Standardized across international sites'])
  ),
  metadata_completeness = 64,
  updated_at = now()
WHERE grant_number = 'R34DA062119';

-- 16. R61MH135106 - INSERT new project
INSERT INTO public.projects (grant_number, grant_id, study_species, use_approaches, use_sensors, produce_data_modality, produce_data_type, use_analysis_types, use_analysis_method, keywords, study_human, metadata, metadata_completeness)
VALUES (
  'R61MH135106',
  'f360f02e-1328-4961-ae43-80cb53e0fd8c',
  ARRAY['Humans'],
  ARRAY['Freely moving spatial navigation', 'Biomarker synchronization'],
  ARRAY['Wearable biochemical sensors', 'Wearable biophysical trackers'],
  ARRAY['Neural (iEEG/single-neuron)', 'Biochemical (Cortisol, Epinephrine)', 'Biophysical (Heart rate, Movement)'],
  ARRAY['Neural time-series', 'Continuous peripheral biomarkers'],
  ARRAY['Approach-avoidance modeling', 'Peripheral-central signal integration'],
  ARRAY['State estimation', 'Evidence accumulation algorithms'],
  ARRAY['Approach-avoidance', 'Spatial navigation', 'iEEG', 'Biomarkers', 'Freely moving'],
  true,
  jsonb_build_object(
    'marr_l1_ethological_goal', 'Approach-avoidance behavior during real-world spatial navigation.',
    'marr_l2_algorithmic_function', 'State estimation and evidence accumulation integrating autonomic and central neural signals.',
    'marr_l3_implementational_hardware', 'Deep brain recordings (single-neuron or iEEG), wearable sensors for biochemical markers and biophysical signals.',
    'data_analysis_approach', 'Fusing deep brain recordings with wearable sensors to investigate the neural and peripheral mechanisms of approach-avoidance behaviors.',
    'cross_project_synergy', 'Provides human L3 validation for Behavioral Segmentation models utilizing autonomic rhythms (e.g., R34DA059718).',
    'target_species_domain', 'Humans',
    'devices', jsonb_build_object('sensor', ARRAY['Wearable biochemical sensors', 'Wearable biophysical trackers'], 'data_acquisition_modalities', ARRAY['Mobile biomarker monitoring', 'Ambulatory neural recording'], 'behavioral_rigs', ARRAY['Real-world freely moving environments'], 'electrophysiology_setup', ARRAY['Deep brain recordings (single-neuron or iEEG)'])
  ),
  91
);

-- 17. R61MH135109 - INSERT new project
INSERT INTO public.projects (grant_number, grant_id, study_species, use_approaches, use_sensors, produce_data_modality, produce_data_type, use_analysis_types, use_analysis_method, develope_software_type, keywords, study_human, metadata, metadata_completeness)
VALUES (
  'R61MH135109',
  'a63204f7-ba0b-4b02-801b-d8e12ff96a46',
  ARRAY['Humans (Epilepsy Patients)'],
  ARRAY['Naturalistic daily life monitoring', 'Autobiographical memory assessment'],
  ARRAY['Wearable AV cameras', 'GPS trackers', 'Physiological sensors', 'Smartphones'],
  ARRAY['Neural (Intracranial EEG)', 'Audio-Visual', 'Physiological', 'Spatial (GPS)'],
  ARRAY['Continuous multimodal sensor streams', 'iEEG time-series'],
  ARRAY['Episodic chunking', 'Memory encoding analysis'],
  ARRAY['Contextual alignment of unstructured data with neural spikes'],
  ARRAY['CAPTURE custom smartphone application'],
  ARRAY['Autobiographical memory', 'CAPTURE app', 'iEEG', 'Wearables', 'Real-world spaces'],
  true,
  jsonb_build_object(
    'marr_l1_ethological_goal', 'Autobiographical memory formation in naturalistic daily environments.',
    'marr_l2_algorithmic_function', 'Contextual encoding and episodic chunking logic.',
    'marr_l3_implementational_hardware', 'CAPTURE custom smartphone application, wearable audio-visual, physiological, and GPS sensors alongside invasive intracranial neural recordings.',
    'data_analysis_approach', 'Uses a custom smartphone application synchronized with wearable sensors and invasive intracranial neural recordings in epilepsy patients.',
    'cross_project_synergy', 'Unstructured GPS/AV data ingestion pipeline could serve as a stress test for BARD.CC federation capabilities.',
    'target_species_domain', 'Humans (Epilepsy Patients)',
    'devices', jsonb_build_object('sensor', ARRAY['Wearable AV cameras', 'GPS trackers', 'Physiological sensors', 'Smartphones'], 'data_acquisition_modalities', ARRAY['Smartphone-app synchronization', 'Ambulatory iEEG telemetry'], 'behavioral_rigs', ARRAY['Real-world spaces (out-of-lab)'], 'electrophysiology_setup', ARRAY['Invasive intracranial EEG (iEEG)'])
  ),
  91
);

-- 18. R61MH135114 - INSERT new project
INSERT INTO public.projects (grant_number, grant_id, study_species, use_approaches, use_sensors, produce_data_modality, produce_data_type, use_analysis_types, use_analysis_method, keywords, study_human, metadata, metadata_completeness)
VALUES (
  'R61MH135114',
  '2d983700-1330-4541-98f2-56372bbc2f12',
  ARRAY['Humans (Pediatric)'],
  ARRAY['Neurodevelopmental screening', 'High-movement tolerance scanning'],
  ARRAY['Optically Pumped Magnetometers', 'Movement trackers'],
  ARRAY['Neural (OPM-MEG)', 'Kinematic (Movement tracking)'],
  ARRAY['Magnetoencephalography waveforms', 'Body tracking coordinates'],
  ARRAY['Source localization', 'Motion artifact correction'],
  ARRAY['Dynamic movement compensation algorithms'],
  ARRAY['OPM-MEG', 'Pediatric', 'Intellectual disability', 'Motion tracking', 'Artifact removal'],
  true,
  jsonb_build_object(
    'marr_l1_ethological_goal', 'Motor control and cognitive function in neurodevelopmental contexts.',
    'marr_l2_algorithmic_function', 'Motion artifact removal algorithms; robust source localization in moving subjects.',
    'marr_l3_implementational_hardware', 'Optically Pumped Magnetometers (OPM-MEG) integrated with precise movement tracking.',
    'data_analysis_approach', 'Utilizing advanced tracking to dynamically correct for head and body movements during OPM-MEG recordings.',
    'cross_project_synergy', 'Motion-correction algorithms from OPM-MEG can inform artifact rejection pipelines for mobile EEG/iEEG projects.',
    'target_species_domain', 'Humans (Pediatric / Clinical)',
    'devices', jsonb_build_object('sensor', ARRAY['Optically Pumped Magnetometers', 'Movement trackers'], 'data_acquisition_modalities', ARRAY['Integrated MEG-kinematic recording'], 'behavioral_rigs', ARRAY['Pediatric-friendly scanning environments'], 'electrophysiology_setup', ARRAY['OPM-MEG helmet/arrays'])
  ),
  91
);

-- 19. R61MH135405
UPDATE public.projects SET
  study_species = ARRAY['Humans'],
  use_approaches = ARRAY['Ecological momentary assessment (EMA)', 'Real-world continuous measurement'],
  use_sensors = ARRAY['Integrated wearables', 'Contextual sensors'],
  produce_data_modality = ARRAY['Physiological (Wearables)', 'Contextual / Environmental', 'Self-report (EMA)'],
  produce_data_type = ARRAY['Continuous multimodal streams', 'Survey metrics'],
  use_analysis_types = ARRAY['Predictive state modeling', 'Anxiety/Memory correlation'],
  use_analysis_method = ARRAY['Context-aware machine learning'],
  develope_software_type = ARRAY['CAMERA Platform'],
  keywords = ARRAY['CAMERA Platform', 'Anxiety', 'Memory State', 'Ecological Assessment', 'Continuous Measurement'],
  study_human = true,
  metadata = jsonb_build_object(
    'marr_l1_ethological_goal', 'Navigation of ecological stressors; regulation of anxiety and episodic memory.',
    'marr_l2_algorithmic_function', 'Continuous state prediction models; context-aware machine learning.',
    'marr_l3_implementational_hardware', 'The CAMERA Platform (integrated wearables, contextual sensors, ecological momentary assessment).',
    'data_analysis_approach', 'Fusing continuous multimodal data from the CAMERA platform to predict shifts in anxiety and memory states.',
    'cross_project_synergy', 'CAMERA platform algorithms can be cross-pollinated with the CAPTURE app used in R61MH135109.',
    'target_species_domain', 'Humans',
    'devices', jsonb_build_object('sensor', ARRAY['Integrated wearables', 'Contextual sensors'], 'data_acquisition_modalities', ARRAY['Continuous ambulatory recording', 'Smartphone EMA'], 'behavioral_rigs', ARRAY['Ecological / Natural environments'])
  ),
  metadata_completeness = 91,
  updated_at = now()
WHERE grant_number = 'R61MH135405';

-- 20. R61MH135407
UPDATE public.projects SET
  study_species = ARRAY['Humans'],
  use_approaches = ARRAY['Mental state decoding', 'Multimodal sensing integration'],
  use_sensors = ARRAY['Novel sensing suites'],
  produce_data_modality = ARRAY['Neural', 'Physiological', 'Behavioral'],
  produce_data_type = ARRAY['Continuous fused multivariate time-series'],
  use_analysis_types = ARRAY['Mental state decoding', 'Latent factor extraction'],
  use_analysis_method = ARRAY['Dynamical modeling of nonlinear latents', 'Advanced ML'],
  keywords = ARRAY['Mental states', 'Nonlinear latent factors', 'Multimodal sensing', 'Machine learning'],
  study_human = true,
  metadata = jsonb_build_object(
    'marr_l1_ethological_goal', 'Internal state regulation and behavioral adaptation.',
    'marr_l2_algorithmic_function', 'Dynamical modeling of nonlinear latent factors; advanced ML for mental state decoding.',
    'marr_l3_implementational_hardware', 'Novel multimodal neural and physiological sensing suites.',
    'data_analysis_approach', 'Employing advanced dynamical modeling to extract nonlinear latent factors from a fusion of neural, physiological, and behavioral streams.',
    'cross_project_synergy', 'The extraction of nonlinear latents maps directly to the continuous latent extraction algorithms used in Marmoset models (1U01DA063534).',
    'target_species_domain', 'Humans',
    'devices', jsonb_build_object('sensor', ARRAY['Novel sensing suites'], 'data_acquisition_modalities', ARRAY['Multimodal synchronized logging'])
  ),
  metadata_completeness = 82,
  updated_at = now()
WHERE grant_number = 'R61MH135407';

-- 21. R61MH138966
UPDATE public.projects SET
  study_species = ARRAY['Humans'],
  use_approaches = ARRAY['Physical exertion paradigms', 'Effort-based decision tasks'],
  use_sensors = ARRAY['Kinematic trackers', 'Physiological monitors'],
  produce_data_modality = ARRAY['Neural', 'Kinematic (Body signals)', 'Physiological'],
  produce_data_type = ARRAY['Biomechanics', 'Neural time-series'],
  use_analysis_types = ARRAY['Neuroeconomic correlation', 'Brain-body interaction modeling'],
  use_analysis_method = ARRAY['Computational algorithms of effort and reward'],
  keywords = ARRAY['Effort-based decision making', 'Brain-body interactions', 'Physical exertion', 'Neuroeconomics'],
  study_human = true,
  metadata = jsonb_build_object(
    'marr_l1_ethological_goal', 'Effort-based decision making; resource allocation and cost-benefit analysis.',
    'marr_l2_algorithmic_function', 'Neuroeconomic modeling; computational algorithms of effort and reward.',
    'marr_l3_implementational_hardware', 'Multimodal platform capturing simultaneous brain and body signals during physical exertion.',
    'data_analysis_approach', 'Quantifying physical kinematics and physiological strain and correlating these variables with real-time neural data.',
    'cross_project_synergy', 'Directly relates to the basic science of foraging and resource allocation seen in animal models.',
    'target_species_domain', 'Humans',
    'devices', jsonb_build_object('sensor', ARRAY['Kinematic trackers', 'Physiological monitors'], 'data_acquisition_modalities', ARRAY['Simultaneous brain-body platform'], 'behavioral_rigs', ARRAY['Physical exertion stations'])
  ),
  metadata_completeness = 82,
  updated_at = now()
WHERE grant_number = 'R61MH138966';

-- 22. R61MH138713
UPDATE public.projects SET
  study_species = ARRAY['Humans'],
  use_approaches = ARRAY['Privacy-preserving naturalistic tracking', 'Attention state monitoring'],
  use_sensors = ARRAY['LiDAR', 'Millimeter wave (mmWave) sensors', 'Physiological sensors'],
  produce_data_modality = ARRAY['Neural (EEG)', 'Physiological', 'Spatial (LiDAR/mmWave)'],
  produce_data_type = ARRAY['Point clouds', 'Oscillatory EEG time-series'],
  use_analysis_types = ARRAY['Attention state decoding', 'Environmental monitoring correlation'],
  use_analysis_method = ARRAY['Sensor fusion algorithms'],
  keywords = ARRAY['LiDAR', 'Millimeter wave', 'Attention states', 'Neural oscillations', 'Privacy-preserving'],
  study_human = true,
  metadata = jsonb_build_object(
    'marr_l1_ethological_goal', 'Vigilance, attention allocation, and environmental monitoring.',
    'marr_l2_algorithmic_function', 'Sensor fusion algorithms bridging oscillatory dynamics with spatial tracking.',
    'marr_l3_implementational_hardware', 'Privacy-preserving LiDAR, millimeter wave (mmWave) sensing, neural oscillation recorders (EEG).',
    'data_analysis_approach', 'Fusing highly spatial, privacy-preserving environmental sensing with internal state monitors to track attention state fluctuations.',
    'cross_project_synergy', 'The use of mmWave and LiDAR represents a novel L3 hardware approach that could be adapted for tracking behavior in visually occluded animal environments.',
    'target_species_domain', 'Humans',
    'devices', jsonb_build_object('sensor', ARRAY['LiDAR', 'Millimeter wave (mmWave) sensors', 'Physiological sensors'], 'data_acquisition_modalities', ARRAY['Environmental scanning', 'Ambulatory EEG'], 'behavioral_rigs', ARRAY['Natural contexts'], 'electrophysiology_setup', ARRAY['Neural oscillation recorders (EEG)'])
  ),
  metadata_completeness = 91,
  updated_at = now()
WHERE grant_number = 'R61MH138713';

-- 23. R61MH138705 - INSERT new project
INSERT INTO public.projects (grant_number, grant_id, study_species, use_approaches, use_sensors, produce_data_modality, produce_data_type, use_analysis_types, use_analysis_method, keywords, study_human, metadata, metadata_completeness)
VALUES (
  'R61MH138705',
  '53f43452-8aad-457f-a2a6-8e94bb81192d',
  ARRAY['Humans'],
  ARRAY['Live face-to-face dyadic interaction', 'Micro-dynamic quantification'],
  ARRAY['High-resolution facial tracking arrays (Cameras)'],
  ARRAY['Video (Facial)', 'Neural'],
  ARRAY['Facial kinematics', 'Neural time-series'],
  ARRAY['Neural synchronization analysis', 'Social coupling mapping'],
  ARRAY['Real-time facial keypoint extraction', 'Non-linear spatial transformations'],
  ARRAY['Face-to-face interactions', 'Facial keypoint extraction', 'Social coupling', 'Micro-dynamics'],
  true,
  jsonb_build_object(
    'marr_l1_ethological_goal', 'Live social interaction, facial communication, and empathy.',
    'marr_l2_algorithmic_function', 'Real-time facial keypoint extraction and neural synchronization analysis.',
    'marr_l3_implementational_hardware', 'High-resolution facial tracking arrays synchronized with neural monitoring.',
    'data_analysis_approach', 'Quantifying the micro-dynamics of live face-to-face behavior and mapping these kinematics to real-time neural correlates.',
    'cross_project_synergy', 'Strong methodological overlap with the Interpersonal dyadic conversation project (R34DA059716) and the marmoset social dynamics project (1U01DA063534).',
    'target_species_domain', 'Humans',
    'devices', jsonb_build_object('sensor', ARRAY['High-resolution facial tracking arrays (Cameras)'], 'data_acquisition_modalities', ARRAY['Synchronous face-brain capture'], 'behavioral_rigs', ARRAY['Face-to-face interaction environments'])
  ),
  91
);

-- 24. 1U01DA063534
UPDATE public.projects SET
  study_species = ARRAY['Marmosets'],
  use_approaches = ARRAY['Naturalistic cooperation and competition tasks', 'Multi-agent interaction'],
  use_sensors = ARRAY['Motion capture/Cameras'],
  produce_data_modality = ARRAY['Behavioral (Musculoskeletal tracking)', 'Neural'],
  produce_data_type = ARRAY['Continuous latents', 'Physical interaction kinematics'],
  use_analysis_types = ARRAY['Latent factor extraction', 'Probabilistic reasoning', 'Agent-based simulation'],
  use_analysis_method = ARRAY['Multi-Agent Recurrent Neural Networks (RNNs)', 'Dynamic Bayesian Networks'],
  keywords = ARRAY['Marmosets', 'Cooperation', 'Competition', 'Recurrent Neural Networks', 'Embodied framework'],
  study_human = false,
  metadata = jsonb_build_object(
    'marr_l1_ethological_goal', 'Multi-agent social dynamics, cooperative foraging, and navigation of physical constraints.',
    'marr_l2_algorithmic_function', 'Multi-Agent Recurrent Neural Networks (RNNs) for extracting continuous latents; Dynamic Bayesian Networks for probabilistic reasoning; Embodied Agent-Based Models.',
    'marr_l3_implementational_hardware', 'Neural arrays synchronized with musculoskeletal physical tracking.',
    'data_analysis_approach', 'Extracting continuous low-dimensional latents from neural and behavioral data to predict social interactions.',
    'cross_project_synergy', 'Algorithmic extraction of social latents can be directly translated to human dyadic interaction models.',
    'target_species_domain', 'Marmosets',
    'devices', jsonb_build_object('sensor', ARRAY['Motion capture/Cameras'], 'data_acquisition_modalities', ARRAY['Synchronous neural and musculoskeletal logging'], 'behavioral_rigs', ARRAY['Naturalistic primate arenas'])
  ),
  metadata_completeness = 82,
  updated_at = now()
WHERE grant_number = '1U01DA063534';

-- 25. U24MH136628 - INSERT new project
INSERT INTO public.projects (grant_number, grant_id, study_species, use_approaches, produce_data_modality, produce_data_type, use_analysis_types, use_analysis_method, develope_software_type, keywords, study_human, metadata, metadata_completeness)
VALUES (
  'U24MH136628',
  'f959e79e-ab2b-4ba1-b12d-2a34b8e637ca',
  ARRAY['All Species'],
  ARRAY['Data coordination', 'Infrastructure development', 'Ontology building'],
  ARRAY['Multi-modal (Aggregated across consortium)'],
  ARRAY['JSON metadata', 'Knowledge Graphs', 'Federated structured data'],
  ARRAY['Data harmonization', 'Cross-species isomorphism mapping'],
  ARRAY['Federated machine learning pipelines', 'StructSense 2.0 extraction'],
  ARRAY['BrainKB', 'StructSense 2.0', 'Neuro Model Context Protocols'],
  ARRAY['BARD.CC', 'Federated ML', 'Data Coordinating Center', 'BrainKB', 'Infrastructure'],
  true,
  jsonb_build_object(
    'marr_l1_ethological_goal', 'Consortium scalability and cross-species translation.',
    'marr_l2_algorithmic_function', 'Federated ML/AI infrastructure, knowledge graphs (BrainKB), and metadata harmonization pipelines.',
    'marr_l3_implementational_hardware', 'Cloud-based ecosystems, distributed compute clusters.',
    'data_analysis_approach', 'Developing cloud-based data ecosystems and federated machine learning pipelines.',
    'cross_project_synergy', 'Serves as the foundational computational hardware (L3) and architectural logic (L2) for the entire BBQS network.',
    'target_species_domain', 'All Species (Infrastructure)',
    'devices', jsonb_build_object('sensor', ARRAY['N/A'], 'data_acquisition_modalities', ARRAY['Cloud ingestion', 'Federated APIs'])
  ),
  82
);

-- 26. R24MH136632 - INSERT new project
INSERT INTO public.projects (grant_number, grant_id, study_species, use_approaches, produce_data_modality, produce_data_type, use_analysis_types, use_analysis_method, develope_software_type, keywords, study_human, website, metadata, metadata_completeness)
VALUES (
  'R24MH136632',
  'f6f0e459-9673-4f74-af3b-c667884aa729',
  ARRAY['All Species'],
  ARRAY['Data archiving', 'Ontology standardization'],
  ARRAY['Multi-modal (Aggregated across consortium)'],
  ARRAY['Standardized schema files (e.g., NWB, BIDS)'],
  ARRAY['Schema harmonization', 'Ontology mapping'],
  ARRAY['Data curation protocols', 'JSON validation'],
  ARRAY['NWB', 'BIDS', 'NBO', 'HED'],
  ARRAY['EMBER', 'Data Archive', 'NWB', 'Ontologies', 'Reproducibility'],
  true,
  'Visit EMBER via the Brain-Behavior Data Archive portal',
  jsonb_build_object(
    'marr_l1_ethological_goal', 'Scientific reproducibility and unified mechanism discovery.',
    'marr_l2_algorithmic_function', 'Unified ontologies (NBO, HED, NWB) and data schema mapping.',
    'marr_l3_implementational_hardware', 'Hybrid data archive, secure cloud-based sandboxes.',
    'data_analysis_approach', 'Ingesting, curating, and harmonizing highly technical neural and behavioral data using rigorous JSON schemas.',
    'cross_project_synergy', 'Directly partners with BARD.CC. EMBER structures the data; BARD computes on it.',
    'target_species_domain', 'All Species (Infrastructure)',
    'devices', jsonb_build_object('sensor', ARRAY['N/A'], 'data_acquisition_modalities', ARRAY['Data archive uploads'])
  ),
  82
);
