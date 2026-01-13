import Header from "@/components/Header";
import ProjectCard from "@/components/ProjectCard";

const r34Projects = [
  {
    grantNumber: "R34DA059510",
    title: "A modeling framework and arena for measuring contextual influences of behavior",
    link: "https://reporter.nih.gov/search/lVXfsunpaUqfmTQW0jRXmA/project-details/10786801",
    pis: [
      { name: "Dyer, Eva", email: "evadyer@gatech.edu" },
      { name: "McGrath, Patrick T", email: "patrick.mcgrath@biology.gatech.edu", isContact: true },
    ],
    institutions: "Georgia Institute of Technology",
    description: "Social behaviors are essential for survival and reproduction. They also evolve quite rapidly and can vary even among closely related species. Traditionally, social behaviors are very difficult to study because of the complexity of their input, requiring conspecifics to trigger aggressive, cooperative, parental, or reproductive behaviors. Additionally, contextual data is important, such as hierarchical status and environmental factors can also play a role. This grant will propose to create a behavioral arena capable of mimicking natural environments that are required for social reproductive behaviors, including interactions between a large number of conspecifics, environmental factors such as male displays, and contextual data such as hierarchical status between various males. Tools will be created to track animals in this arena and build a computational frame work to measure and compare social behavioral dynamics. This work will utilize Lake Malawi cichlids, a powerful evolutionary model for identification of genes and neural circuit changes associated with differences in behavior. This project will generate new tools and datasets for modeling social behaviors, paving the way for a large-scale R01.",
    youtubeId: "MaA-DtQvqig",
  },
  {
    grantNumber: "R34DA059509",
    title: "Behavioral quantification through active learning and multidimensional physiological monitoring",
    link: "https://reporter.nih.gov/search/9wx4cEt5ske-A88YXC9tyA/project-details/10786800",
    pis: [
      { name: "Grover, Pulkit", email: "pgrover@andrew.cmu.edu" },
      { name: "Kuang, Zheng", email: "zhengkua@andrew.cmu.edu" },
      { name: "Rubin, Jonathan E", email: "jonrubin@pitt.edu" },
      { name: "Yttri, Eric", email: "eyttri@andrew.cmu.edu", isContact: true },
    ],
    institutions: "Carnegie Mellon University, University of Pittsburgh",
    description: "Naturalistic contexts provide the opportunity to study the brain and behavior in response to the ethological problems an animal is evolutionarily designed to solve. We seek to expand the capabilities of our current behavioral segmentation approaches to provide a more precise and comprehensive account of behavior. By incorporating recent innovations in machine learning, segmentation approaches that can account for behavioral dynamics at multiple timescales, and increased breadth in the sampling modalities used to classify behaviors, we will create a toolkit that our team and others can make use of to quantify complex, spontaneous behaviors. We will implement an analysis pipeline to capture and make use of patterns of mouse body position, vocalizations, and arousal states. We also aim to capitalize on recent insights into the role of the gut-brain axis in shaping behavior.",
    youtubeId: "HSftxi1jjnQ",
  },
  {
    grantNumber: "R34DA059513",
    title: "Computational attribution and fusion of vocalizations, social behavior, and neural recordings in a naturalistic environment",
    link: "https://reporter.nih.gov/search/rGFBDprnTkuFAoKdn5poIQ/project-details/10786899",
    pis: [
      { name: "Sanes, Dan Harvey", email: "dhs1@nyu.edu", isContact: true },
      { name: "Schneider, David Michael", email: "david.schneider@nyu.edu" },
      { name: "Williams, Alexander Henry", email: "ahwillia@stanford.edu" },
    ],
    institutions: "New York University",
    description: "Social vocalizations and movement-generated sounds often provide pivotal knowledge about an animal's identity, location, or state, yet most studies of natural behavior fail to integrate acoustic information with simultaneous recordings of high-dimensional neural activity and behavioral dynamics. This proposal will develop novel experimental and computational methods to attribute vocal and non-vocal sounds to individuals in a naturalistic, acoustically complex, multi-animal environment. By integrating this rich acoustic information with simultaneous video and wireless neural recordings, we seek to predict auditory cortical responses to auditory cues, as a function of social context and individual identity within the family.",
    youtubeId: "B9KeJtfWnoI",
  },
  {
    grantNumber: "R34DA059507",
    title: "Development of a smart aviary to probe neural dynamics of complex social behaviors in a gregarious songbird",
    link: "https://reporter.nih.gov/search/8oyFUGQ1mUW_hivhx91O7A/project-details/10786687",
    pis: [
      { name: "Aflatouni, Firooz", email: "firooz@seas.upenn.edu" },
      { name: "Balasubramanian, Vijay", email: "vijay@physics.upenn.edu" },
      { name: "Daniilidis, Kostas", email: "kostas@cis.upenn.edu" },
      { name: "Schmidt, Marc F", email: "marcschm@sas.upenn.edu", isContact: true },
    ],
    institutions: "University of Pennsylvania",
    description: "The nervous system of social species has evolved to perceive and evaluate signals within a social context. Social information therefore must impact how the brain processes information, yet little is still known about how the brain integrates social information to produce actions in a social context. Here we propose to study the brown-headed cowbird (Molothrus ater), a highly gregarious songbird species whose social behavior has been well studied and where vocal and non-vocal communication signals form a central and critical component of its social system.",
    youtubeId: "n4FWn-C7soc",
  },
  {
    grantNumber: "R34DA059718",
    title: "Harnessing biological rhythms for a resilient social motif generator",
    link: "https://reporter.nih.gov/search/O078sWhnFkaeTno7iDSyBw/project-details/10797723",
    pis: [
      { name: "Padilla Coreano, Nancy", email: "npadillacoreano@ufl.edu", isContact: true },
      { name: "Saxena, Shreya", email: "shreya.saxena@yale.edu" },
      { name: "Wesson, Daniel W", email: "danielwesson@ufl.edu" },
    ],
    institutions: "University of Florida, Yale University",
    description: "How does the brain enable social interactions? The study of social behavior in non-human animals has long relied on coarse behavioral metrics like time spent interacting with another animal or simply the numbers of interactions. The research objective of this Brain Initiative proposal is to develop semi-supervised artificial intelligence methods that result in a hierarchical multi-timescale model of social behavioral motifs directly from video, breathing, heart rate, and movement data via a head-mounted accelerometer.",
    youtubeId: "hkFxcOOYQCs",
  },
  {
    grantNumber: "R34DA059506",
    title: "High-resolution 3D tracking of social behaviors for deep phenotypic analysis",
    link: "https://reporter.nih.gov/search/t8WADFOb80WhM891u1bwgg/project-details/10786685",
    pis: [
      { name: "Dunn, Timothy William", email: "timothy.dunn@duke.edu", isContact: true },
      { name: "Olveczky, Bence P", email: "olveczky@fas.harvard.edu" },
    ],
    institutions: "Duke University, Harvard University",
    description: "The aim of this proposal is to plan for and deliver a proof-of-concept solution for an innovative and easy-to-use experimental platform for measuring and quantifying social behaviors in animal models. To capture kinematic details of whole-body movement during social behaviors requires novel solutions for dealing with the inevitable occlusions that results from social interactions.",
  },
  {
    grantNumber: "R34DA059512",
    title: "High-throughput, high-resolution 3D measurement of ethologically relevant rodent behavior in a dynamic environment",
    link: "https://reporter.nih.gov/search/KBKLXTA2UEOKMLhYCQIvZg/project-details/10786883",
    pis: [
      { name: "Dunn, Timothy William", email: "timothy.dunn@duke.edu", isContact: true },
      { name: "Field, Gregory Darin", email: "greg.d.field@gmail.com" },
      { name: "Tadross, Michael R", email: "michael.tadross@duke.edu" },
    ],
    institutions: "Duke University",
    description: "The aim of this proposal is to develop an innovative new system, including hardware assemblies and machine learning algorithms, for continuous, high-resolution 3D quantification of behavioral and eliciting stimulus dynamics in a natural mouse prey capture paradigm.",
    youtubeId: "ZkcWHpCSxBY",
  },
  {
    grantNumber: "R34DA059716",
    title: "Interpersonal behavioral synchrony in virtual and in-person dyadic conversation",
    link: "https://reporter.nih.gov/search/PkNqY-ET0kW0D3SfO6MoLA/project-details/10797870",
    pis: [
      { name: "Corcoran, Cheryl Mary", email: "cheryl.corcoran@mssm.edu", isContact: true },
      { name: "Grinband, Jack", email: "jg2269@cumc.columbia.edu" },
      { name: "Parvaz, Muhammad Adeel", email: "muhammad.parvaz@mssm.edu" },
    ],
    institutions: "Icahn School of Medicine at Mount Sinai, Columbia University",
    description: "Human dyadic social communication entails a rich repertoire of expression, including not only face expression (and gaze), but also acoustics (prosody and pauses) turn-taking, gestures and language. This planning proposal for tool development entails several key activities, beginning with the convening of a diverse multidisciplinary team of experts from various fields.",
    youtubeId: "KqGUlUjEi1I",
  },
  {
    grantNumber: "R34DA059723",
    title: "Multimodal behavioral analysis of oromanual food-handling in freely moving animals",
    link: "https://reporter.nih.gov/search/5Wc6Oe9LGk6OglJVMNeRKw/project-details/10795435",
    pis: [
      { name: "Shepherd, Gordon M", email: "g-shepherd@northwestern.edu", isContact: true },
    ],
    institutions: "Northwestern University",
    description: "Oromanual food-handling – in which the hands and forelimbs work in a coordinated manner with the mouth and jaw to manipulate and consume a food item – is a fundamental behavior common to many rodent species as well as primates. The overall objective is to develop new experimental and analytical paradigms for recording food-handling behavior with high spatiotemporal resolution in freely moving animals.",
    youtubeId: "0ZzUiG_UxnU",
  },
  {
    grantNumber: "R34DA059514",
    title: "Towards High-Resolution Neuro-Behavioral Quantification of Sheep in the Field to Study Complex Social Behaviors",
    link: "https://reporter.nih.gov/search/5Wc6Oe9LGk6OglJVMNeRKw/project-details/10786956",
    pis: [
      { name: "Kemere, Caleb", email: "caleb.kemere@rice.edu", isContact: true },
    ],
    institutions: "Rice University",
    description: "Social animals, including humans, engage in complex collective behaviors in the field. We propose to develop a paradigm for acquiring high resolution (in space and time) measurements of individual herd members, including head-mounted devices to sense their visual sensorium.",
    youtubeId: "fEmt-34_POg",
  },
  {
    grantNumber: "R34DA059500",
    title: "Transformative Optical Imaging of Brain & Behavior in Navigating Genetic Species",
    link: "https://reporter.nih.gov/search/ftmhALHbiUCuSoFidVtlvQ/project-details/10786461",
    pis: [
      { name: "Nagel, Katherine", email: "katherine.nagel@nyumc.org" },
      { name: "Schoppik, David", email: "david.schoppik@nyulangone.org", isContact: true },
      { name: "Shaner, Nathan Christopher", email: "ncshaner@ucsd.edu" },
      { name: "Wang, Jane", email: "zw24@cornell.edu" },
    ],
    institutions: "New York University School of Medicine, University of California San Diego, Cornell University",
    description: "Our long-term goal is to define general principles that connect neuronal activity to unconstrained behaviors in natural sensory environments. Achieving this goal will require the development of new tools to quantitatively compare behavior across species in complex environments and to monitor neural activity in freely moving animals.",
    youtubeId: "r2glKpA6Iw4",
  },
  {
    grantNumber: "R34DA061984",
    title: "Quantifying organism-environment interactions in a new model system for neuroscience",
    link: "https://reporter.nih.gov/search/hFek-6yOaEGZoxZ7-YsjoA/project-details/11036699",
    pis: [
      { name: "Srivastava, Mansi", email: "mansi@oeb.harvard.edu", isContact: true },
    ],
    institutions: "Harvard University",
    description: "Naturalistic contexts provide the opportunity to study the brain and behavior in response to the ethological problems an animal is evolutionarily designed to solve. We seek to expand the capabilities of our current behavioral segmentation approaches to provide a more precise and comprehensive account of behavior.",
  },
  {
    grantNumber: "R34DA061924",
    title: "Mapping dynamic transitions across neural, behavioral, and social scales in interacting animals",
    link: "https://reporter.nih.gov/search/43F4LUV9IUK_i8S55hrndA/project-details/11035335",
    pis: [
      { name: "Frohlich, Flavio", email: "flavio_frohlich@med.unc.edu" },
      { name: "Zhang, Mengsen", email: "mengsen@msu.edu", isContact: true },
    ],
    institutions: "Michigan State University, University of North Carolina at Chapel Hill",
    description: "The main objective of this project is to develop a computational-experimental framework to construct multiscale models of naturalistic social interaction connecting the spiking dynamics of neurons, brain oscillations, body movements, and macroscopic behavioral states.",
  },
  {
    grantNumber: "R34DA061925",
    title: "Building an \"AI Forest\" to identify the social and environmental factors underlying complex behavioral traits in wild primates",
    link: "https://reporter.nih.gov/search/ExyDubmq-06Qzj272RAFyQ/project-details/11035427",
    pis: [
      { name: "Flagel, Shelly Beth", email: "sflagel@med.umich.edu", isContact: true },
      { name: "Beehner, Jacinta", email: "jbeehner@umich.edu" },
      { name: "Benitez, Marcela Eugenia", email: "marcela.benitez@emory.edu" },
    ],
    institutions: "University of Michigan at Ann Arbor",
    description: "Here, the rich neurobiological understanding that has been obtained from captive animals will be leveraged to assess individual differences in motivated behavior that derive from social and/or environmental adversity (or advantage) in a natural environment. This project will lay the groundwork for an Artificial Intelligence (AI) Forest that will transform our ability to study these animals as they develop, live, and die in their natural environment.",
  },
  {
    grantNumber: "R34DA062119",
    title: "The International Development Project (IDP): An international collaboration for the standardized study of experience-dependent brain and behavioral development",
    link: "https://reporter.nih.gov/search/Rzi0zieKH0GZuG8lIsQy7Q/project-details/11045432",
    pis: [
      { name: "Wilbrecht, Linda E.", email: "wilbrecht@berkeley.edu", isContact: true },
    ],
    institutions: "University of California, Berkeley",
    description: "It is increasingly clear that experience of adversity including poverty, trauma, and other stressors during childhood can enhance risk for mental and physical health problems later in life. Here we propose to initiate a team science effort, the Adversity and Resilience Consortium (ARC), to address these challenges.",
  },
];

const r61r33Projects = [
  {
    grantNumber: "R61MH135106",
    title: "Synchronized neuronal and peripheral biomarker recordings in freely moving humans",
    link: "https://reporter.nih.gov/search/iYWuFLFKV02NMxjmWYBzoA/project-details/10792386",
    pis: [
      { name: "Suthana, Nanthia A", email: "nsuthana@mednet.ucla.edu", isContact: true },
    ],
    institutions: "University of California, Los Angeles",
    description: "Recent technological advancements have allowed for single-neuron and intracranial electroencephalographic (iEEG) recordings in freely moving humans. The proposed project will develop a novel platform that enables simultaneous single-neuron or iEEG, biochemical (cortisol, epinephrine), and biophysical (heart rate, skin conductance, and body and eye movements) activity to be recorded in freely moving human participants.",
    youtubeId: "mk94g6Q3Wfc",
  },
  {
    grantNumber: "R61MH135109",
    title: "Capturing Autobiographical memory formation in People moving Through real-world spaces Using synchronized wearables and intracranial Recordings of EEG",
    link: "https://reporter.nih.gov/search/d5uHWn4kKEmuyUDa6pyaNg/project-details/10792324",
    pis: [
      { name: "Inman, Cory Shields", email: "cory.inman@psych.utah.edu", isContact: true },
    ],
    institutions: "University of Utah",
    description: "This project aims to unlock the potential of combining wearable mobile recording devices, such as smartphones with continuous audio-visual, accelerometry, GPS, subjective report, autonomic physiology, and wearable eye tracking recordings, with precisely synchronized intracranial neural recordings during real-world behaviors.",
    youtubeId: "U3NI1GoKWlY",
  },
  {
    grantNumber: "R61MH135114",
    title: "Integrated movement tracking for pediatric OPM-MEG studies of intellectual disability",
    link: "https://reporter.nih.gov/search/OyGvzxrwu0mcaz0ainOjYw/project-details/10792146",
    pis: [
      { name: "Welsh, John P", email: "jpwelsh@uw.edu", isContact: true },
      { name: "Roberts, Timothy P", email: "robertstim@chop.edu" },
    ],
    institutions: "Seattle Children's Hospital, Children's Hospital of Philadelphia",
    description: "This R61/R33 project will develop an advanced technology for non-invasive recording of whole-brain physiology with synchronized video-tracking of movement for use in children with intellectual disability and will use it to elucidate the brain-circuit electrophysiology of intellectual development.",
    youtubeId: "5iO5Z2OdP58",
  },
  {
    grantNumber: "R61MH135405",
    title: "Developing the Context-Aware Multimodal Ecological Research and Assessment (CAMERA) Platform for Continuous Measurement and Prediction of Anxiety and Memory State",
    link: "https://reporter.nih.gov/search/mVgOCnwbrEKKmaPwBpSCqQ/project-details/10801782",
    pis: [
      { name: "Jacobs, Joshua", email: "joshua.jacobs@columbia.edu", isContact: true },
      { name: "Ortiz, Jorge", email: "jorge.ortiz@rutgers.edu" },
      { name: "Widge, Alik S", email: "awidge@umn.edu" },
      { name: "Youngerman, Brett E", email: "bey2103@cumc.columbia.edu" },
    ],
    institutions: "Columbia University Health Sciences, Rutgers University, University of Minnesota-Twin Cities",
    description: "This project seeks to develop the CAMERA (Context-Aware Multimodal Ecological Research and Assessment) platform, a state-of-the-art open multimodal hardware/software system for measuring human brain–behavior relationships.",
    youtubeId: "o7JEJvQqAmI",
  },
  {
    grantNumber: "R61MH135407",
    title: "Novel multimodal neural, physiological, and behavioral sensing and machine learning for mental states",
    link: "https://reporter.nih.gov/search/asKY5_5QYEehWfAu-Lbsiw/project-details/10800578",
    pis: [
      { name: "Shanechi, Maryam", email: "shanechi@usc.edu", isContact: true },
    ],
    institutions: "University of Southern California",
    description: "This project focuses on developing novel multimodal neural, physiological, and behavioral sensing combined with machine learning approaches for understanding and predicting mental states.",
  },
  {
    grantNumber: "R61MH138700",
    title: "Creating a scalable, integrated, portable technology to track the neural, physiological, and behavioral bases of inattention during learning",
    link: "https://reporter.nih.gov/project-details/11035335",
    pis: [
      { name: "Grammer, Jennie K.", email: "jgrammer@seis.ucla.edu" },
      { name: "Lenartowicz, Agatha", email: "alenarto@mednet.ucla.edu", isContact: true },
    ],
    institutions: "University of California, Los Angeles",
    description: "The objective of this R61/33 proposal is to develop an integrated, portable sensor suite for concurrent recording of neural activity, physiological arousal, motor signals, and physical interactions in social environments.",
  },
  {
    grantNumber: "R61MH138705",
    title: "Neural and Behavioral Correlates of Live Face-to-Face Interactions",
    link: "https://reporter.nih.gov/project-details/11036754",
    pis: [
      { name: "Hirsch, Joy", email: "joy.hirsch@yale.edu", isContact: true },
    ],
    institutions: "Yale University",
    description: "We address this knowledge gap here by proposing to establish a Social Interaction Suite (SIS) of synchronized neural and behavioral tools designed for measurements of cognitive networks associated with processing facial cues and their correlated behaviors exchanged in live social interactions.",
  },
];

const u01Projects = [
  {
    grantNumber: "1U01DA063534",
    title: "Toward comprehensive models of naturalistic cooperation and competition in primates",
    link: "https://reporter.nih.gov/search/SW6ZTlsVAk-Crx5u2nxIig/project-details/11206385",
    pis: [
      { name: "Chang, Steve W. C.", email: "steve.chang@yale.edu", isContact: true },
      { name: "Jadi, Monika P.", email: "monika.jadi@yale.edu" },
      { name: "Nandy, Anirvan S.", email: "anirvan.nandy@yale.edu" },
      { name: "Saxena, Shreya", email: "shreya.saxena@yale.edu" },
    ],
    institutions: "Yale University",
    description: "The flexible ability to work together for mutual benefits while competing against others for limited resources is a hallmark of advanced social cognition. The first major goal of this proposal is to simultaneously and continuously collect multidimensional biobehavioral measurements, both action-based and internal state-based, during naturalistic cooperative and competitive interactions between freely moving marmosets.",
  },
];

const u24Projects = [
  {
    grantNumber: "U24MH136628",
    title: "BBQS AI Resource and Data Coordinating Center (BARD.CC)",
    link: "https://reporter.nih.gov/search/NfCIRcP5c0eqWjzBvOjD_g/project-details/10888562",
    pis: [
      { name: "Ghosh, Satrajit", email: "satra@mit.edu", isContact: true },
      { name: "Cabrera, Laura", email: "lcabrera@psu.edu" },
      { name: "Kennedy, David N", email: "David.Kennedy@umassmed.edu" },
    ],
    institutions: "Massachusetts Institute of Technology, Penn State, UMass Chan Medical School",
    description: "Understanding the complex relationship between brain activity and behavior is one of the most exciting and challenging pursuits in neuroscience. The proposed BBQS AI Resource and Data Coordinating Center (BARD.CC) aims to facilitate innovative research in this area by managing, sharing, and harnessing the power of vast amounts of data and machine learning resources.",
    youtubeId: "SY5eT9EJljw",
  },
];

const r24Projects = [
  {
    grantNumber: "R24MH136632",
    title: "Ecosystem for Multi-modal Brain-behavior Experimentation and Research (EMBER)",
    link: "https://reporter.nih.gov/search/WmrQyaKHvkSe5KZfddP37w/project-details/10888659",
    pis: [
      { name: "Wester, Brock A", email: "Brock.Wester@jhuapl.edu", isContact: true },
    ],
    institutions: "Johns Hopkins University (Applied Physics Laboratory)",
    description: "Here, we propose the Ecosystem for Multi-modal Brain-behavior Experimentation and Research (EMBER), a data archive specifically tailored to serve the unique needs of the Brain Behavior Quantification and Synchronization (BBQS) research community.",
    youtubeId: "SF1FJCZ4hvs",
  },
];

const Projects = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="px-6 py-8 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-8">Projects</h1>

        {/* R34 Projects */}
        <section className="mb-12">
          <h3 className="text-xl font-semibold text-foreground mb-6">
            R34 (NIH Planning Grant Program) Projects
          </h3>
          <div className="space-y-4">
            {r34Projects.map((project) => (
              <ProjectCard key={project.grantNumber} {...project} />
            ))}
          </div>
        </section>

        {/* R61/R33 Projects */}
        <section className="mb-12">
          <h3 className="text-xl font-semibold text-foreground mb-6">
            R61/R33 (Translational Neural Devices) Projects
          </h3>
          <div className="space-y-4">
            {r61r33Projects.map((project) => (
              <ProjectCard key={project.grantNumber} {...project} />
            ))}
          </div>
        </section>

        {/* U01 Projects */}
        <section className="mb-12">
          <h3 className="text-xl font-semibold text-foreground mb-6">
            U01 (Cooperative Agreements) Projects
          </h3>
          <div className="space-y-4">
            {u01Projects.map((project) => (
              <ProjectCard key={project.grantNumber} {...project} />
            ))}
          </div>
        </section>

        {/* U24 Projects */}
        <section className="mb-12">
          <h3 className="text-xl font-semibold text-foreground mb-6">
            U24 Data Coordination and AI Center (DCAIC)
          </h3>
          <div className="space-y-4">
            {u24Projects.map((project) => (
              <ProjectCard key={project.grantNumber} {...project} />
            ))}
          </div>
        </section>

        {/* R24 Projects */}
        <section className="mb-12">
          <h3 className="text-xl font-semibold text-foreground mb-6">
            R24 Data repository
          </h3>
          <div className="space-y-4">
            {r24Projects.map((project) => (
              <ProjectCard key={project.grantNumber} {...project} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Projects;
