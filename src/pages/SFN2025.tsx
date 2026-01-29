import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

const SFN2025 = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="px-6 py-8 max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-foreground mb-4">Join BBQS at SFN 2025!</h1>
        
        <h3 className="text-xl text-muted-foreground mb-2">Society for Neuroscience Annual Meeting</h3>
        <p className="text-lg font-semibold text-foreground mb-4">November 15-19, 2025 • San Diego Convention Center, San Diego, CA</p>
        
        <p className="text-muted-foreground mb-8">
          The Brain Behavior Quantification and Synchronization (BBQS) Initiative will have a major presence at this year's Society for Neuroscience Annual Meeting. Connect with our researchers, explore cutting-edge tools, and learn about the latest developments in brain-behavior research.
        </p>

        <Separator className="my-8" />

        {/* Quick Info */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">📍 Quick Info</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>What</TableHead>
                <TableHead>When/Where</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-semibold">Dates</TableCell>
                <TableCell>November 15-19, 2025</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">Location</TableCell>
                <TableCell>San Diego Convention Center, San Diego, CA</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">BBQS Networking</TableCell>
                <TableCell>Monday, Nov 17 • 12:00-2:00 PM • Near Convention Center</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold">Booths</TableCell>
                <TableCell>#3830 (EMBER/BossDB) • #3831 (DANDI/NWB)</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </section>

        <Separator className="my-8" />

        {/* Schedule at a Glance */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">📊 Schedule at a Glance</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Day</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Event</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-semibold"><a href="#sunday" className="text-primary hover:underline">Sun, Nov 16</a></TableCell>
                <TableCell>10:15-10:30 AM</TableCell>
                <TableCell>Nanosymposium Talk</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold"><a href="#sunday" className="text-primary hover:underline">Sun, Nov 16</a></TableCell>
                <TableCell>2:00-4:30 PM</TableCell>
                <TableCell>Minisymposium</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold"><a href="#monday" className="text-primary hover:underline">Mon, Nov 17</a></TableCell>
                <TableCell>8:00-12:00 PM</TableCell>
                <TableCell>Poster Session</TableCell>
              </TableRow>
              <TableRow className="bg-primary/10">
                <TableCell className="font-semibold"><a href="#monday" className="text-primary hover:underline">Mon, Nov 17</a></TableCell>
                <TableCell className="font-bold">12:00-2:00 PM</TableCell>
                <TableCell className="font-bold">BBQS Networking</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold"><a href="#tuesday" className="text-primary hover:underline">Tue, Nov 18</a></TableCell>
                <TableCell>8:00-12:00 PM</TableCell>
                <TableCell>Poster/Nano Sessions</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold"><a href="#tuesday" className="text-primary hover:underline">Tue, Nov 18</a></TableCell>
                <TableCell>1:00-5:00 PM</TableCell>
                <TableCell>Poster Session</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold"><a href="#wednesday" className="text-primary hover:underline">Wed, Nov 19</a></TableCell>
                <TableCell>8:00-12:00 PM</TableCell>
                <TableCell>Poster Session</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold"><a href="#wednesday" className="text-primary hover:underline">Wed, Nov 19</a></TableCell>
                <TableCell>1:00-5:00 PM</TableCell>
                <TableCell>Poster Session</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <p className="text-muted-foreground mt-4"><strong>Total:</strong> 12+ presentations across 4 days</p>
          <p className="text-sm text-muted-foreground italic">Click on any day to jump to detailed schedule</p>
        </section>

        <Separator className="my-8" />

        {/* Booths */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">🏢 Visit Our Booths</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Booth #3830: EMBER & BossDB</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Learn about the <strong>Ecosystem for Multi-modal Brain-behavior Experimentation and Research</strong> (EMBER) and the <strong>Block Object Storage Service Database</strong> (BossDB).</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Booth #3831: DANDI & NWB</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Explore the <strong>Distributed Archives for Neurophysiology Data Integration</strong> (DANDI) and <strong>Neurodata Without Borders</strong> (NWB) standards.</p>
                <p className="text-sm text-muted-foreground italic mt-2">Stop by for BBQS-specific meet & greet times!</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator className="my-8" />

        {/* Schedule of Events */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">📅 Schedule of Events</h2>

          {/* Sunday */}
          <div id="sunday" className="mb-8">
            <h3 className="text-xl font-bold text-foreground mb-4 border-b border-border pb-2">Sunday, November 16</h3>
            
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg">10:15 AM - 10:30 AM | Nanosymposium Talk</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-semibold">NANO011.10 • Neural dynamics during real-world wayfinding in humans</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li><strong>Time:</strong> 10:15 AM - 10:30 AM</li>
                  <li><strong>Location:</strong> SDCC Room 25A</li>
                  <li><strong>Presenter:</strong> Cory Inman (University of Utah)</li>
                  <li><strong>Keywords:</strong> Electrophysiology, Wearable Recordings, Memory, Emotion, Navigation</li>
                  <li><strong>Grant:</strong> R61 (Inman)</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg">1:00 PM - 1:15 PM | Nanosymposium Talk</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-semibold">NANO017 • Neural population dynamics during naturalistic versus task-related behavior</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li><strong>Time:</strong> 1:00 PM - 1:15 PM</li>
                  <li><strong>Location:</strong> SDCC Room 24A</li>
                  <li><strong>Presenters:</strong> P. Middlebrooks, A. Eagle, M. A. Nicholas, A. Hsu, E. A. Yttri</li>
                  <li><strong>Institutions:</strong> Carnegie Mellon University, Pittsburgh, PA</li>
                  <li><strong>Session:</strong> Motor Planning and Execution: Behavior and Neurophysiology</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg">2:00 PM - 4:30 PM | Minisymposium</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-semibold">Emerging Experimental Approaches to Probe Conserved Neurobehavioral Mechanisms Underlying Affiliative and Antagonistic Social Behaviors</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li><strong>Organizer:</strong> Farah Bader</li>
                  <li>Multiple speakers exploring social behavior mechanisms across species</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Monday */}
          <div id="monday" className="mb-8">
            <h3 className="text-xl font-bold text-foreground mb-4 border-b border-border pb-2">Monday, November 17</h3>
            
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg">8:00 AM - 12:00 PM | Poster Session</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-semibold">PSTR197.03 • Towards multi-timescale neural dynamics inference</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li><strong>Presenter:</strong> Lulu Gong (Yale University)</li>
                    <li><strong>Grant:</strong> R34 (Padilla Coreano, Saxena, Wesson)</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold">PSTR198 • Ten years of NWB: past, present, and future of standardization in neurophysiology</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li><strong>Presenters:</strong> Ryan Ly, Oliver Ruebel (Lawrence Berkeley National Lab)</li>
                    <li><strong>Keywords:</strong> NWB, Neurophysiology, DANDI, Data standards, Electrophysiology, Behavior</li>
                    <li><strong>Grant:</strong> U24 BARD.CC (Ghosh, Cabrera, Kennedy)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg">9:00 AM - 10:00 AM | Special Lecture</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-semibold">LEC11 • From Foraging to Flashbacks: The Neural Basis of Spatial Memory and Mental Time Travel</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li><strong>Time:</strong> 9:00 AM - 10:00 AM</li>
                  <li><strong>Location:</strong> SDCC Ballroom 20</li>
                  <li><strong>Speaker:</strong> Nanthia Suthana</li>
                  <li><strong>Description:</strong> Findings from human intracranial recordings focusing on the hippocampus and related regions to reveal how neural activity during real-world navigation and memory recall underlies both memory function and its pathological disruptions</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="mb-4 border-primary">
              <CardHeader className="bg-primary/10">
                <CardTitle className="text-lg">12:00 PM - 2:00 PM | BBQS Networking Event</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-semibold">BBQS Informal Gathering</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li><strong>Location:</strong> Near Convention Center</li>
                  <li>Join fellow BBQS researchers for networking and discussion!</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Tuesday */}
          <div id="tuesday" className="mb-8">
            <h3 className="text-xl font-bold text-foreground mb-4 border-b border-border pb-2">Tuesday, November 18</h3>
            
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg">8:00 AM - 12:00 PM | Morning Sessions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-semibold">NANO035 • Neural dynamics of social evidence accumulation in cooperative interactions of freely moving marmosets</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li><strong>Presenter:</strong> Weikang Shi (Yale University)</li>
                    <li><strong>Keywords:</strong> Dorsomedial prefrontal cortex, Naturalistic, Strategic interaction</li>
                    <li><strong>Grant:</strong> U01 (Chang, Jadi, Nandy, Saxena)</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold">PSTR301.11 • Understanding social cooperation in rats with multi-agent reinforcement learning</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li><strong>Presenter:</strong> Amelia Johnson (Yale University)</li>
                    <li><strong>Keywords:</strong> Cooperation, Computational modeling</li>
                    <li><strong>Grant:</strong> U01 (Chang, Jadi, Nandy, Saxena)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg">1:00 PM - 5:00 PM | Afternoon Session</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-semibold">PP9 • Physiological states and mPFC circuit dynamics track social valence, familiarity, and rank in mice</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li><strong>Presenter:</strong> Sequoia Smith (University of Florida)</li>
                  <li><strong>Keywords:</strong> Systems neuroscience, Medial prefrontal cortex</li>
                  <li><strong>Grant:</strong> R34 (Padilla Coreano, Saxena, Wesson)</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Wednesday */}
          <div id="wednesday" className="mb-8">
            <h3 className="text-xl font-bold text-foreground mb-4 border-b border-border pb-2">Wednesday, November 19</h3>
            
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg">8:00 AM - 12:00 PM | Morning Sessions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-semibold">PSTR090 • Topological data analysis reveals stable relative postural states during social interaction between freely moving animals</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li><strong>Presenters:</strong> Jared Reiling, Mengsen Zhang (Michigan State University)</li>
                  <li><strong>Keywords:</strong> Computation, Social Behavior, Dynamics</li>
                  <li><strong>Grant:</strong> R34 (Frohlich, Zhang)</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg">1:00 PM - 5:00 PM | Afternoon Sessions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="font-semibold">PSTR477.18 • EMBER: Towards a living resource for neurophysiological and behavioral data</p>
                  <p className="text-xs text-muted-foreground italic">Full Title: Ecosystem for multi-modal brain-behavior experimentation and research (EMBER): Towards a living resource for neurophysiological and behavioral data storage, harmonization, dissemination, and analysis</p>
                  <ul className="text-sm text-muted-foreground space-y-1 mt-2">
                    <li><strong>Presenters:</strong> Nicole Tregoning, Brock Wester (JHU Applied Physics Laboratory)</li>
                    <li><strong>Keywords:</strong> Computational, Social behavior, Data archive</li>
                    <li><strong>Grant:</strong> R24 EMBER (Wester)</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold">The Ecosystem of Standards in Neuroscience: Which Ones Are For You?</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li><strong>Presenters:</strong> Oliver Ruebel, Brock Wester</li>
                    <li><strong>Keywords:</strong> Data, Standards, Ecosystem, Community</li>
                    <li><strong>Grants:</strong> U24 BARD.CC, R24 EMBER</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold">Multimodal analysis of intracranial neural data from DBS patients with psychiatric disorders</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li><strong>Presenters:</strong> Brock Wester and team (JHU Applied Physics Laboratory)</li>
                    <li><strong>Keywords:</strong> Data, Analysis, DBS, Behavior</li>
                    <li><strong>Grants:</strong> U24 BARD.CC, R24 EMBER</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold">Integration and development of AI/ML and analytical tools for the Data Ecosystem</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li><strong>Presenters:</strong> Rahul Hingorani, Talmo Pereira, Brock Wester</li>
                    <li><strong>Keywords:</strong> Data, Analysis, Tool Integration, AI, Behavior</li>
                    <li><strong>Grants:</strong> U24 BARD.CC, R24 EMBER</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator className="my-8" />

        {/* Presentations by Research Theme */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">🔬 Presentations by Research Theme</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Data & AI Tool Developments</h3>
              
              <h4 className="text-lg font-medium text-foreground mb-2">Standards & Infrastructure</h4>
              <ul className="text-muted-foreground space-y-2 mb-4">
                <li><strong>Ten years of NWB</strong> (Mon 8-12 PM, PSTR198) — <em>Ryan Ly, Oliver Ruebel</em></li>
                <li><strong>The Ecosystem of Standards in Neuroscience</strong> (Wed 1-5 PM) — <em>Oliver Ruebel, Brock Wester</em></li>
                <li><strong>EMBER Living Resource</strong> (Wed 1-5 PM, PSTR477.18) — <em>Nicole Tregoning, Brock Wester</em></li>
                <li><strong>AI/ML Tool Integration</strong> (Wed 1-5 PM) — <em>Rahul Hingorani, Talmo Pereira</em></li>
                <li><strong>Psych-DS: FAIR data standard</strong> — <em>Melissa Kline Struhl (MIT)</em></li>
              </ul>

              <h4 className="text-lg font-medium text-foreground mb-2">Computational Methods</h4>
              <ul className="text-muted-foreground space-y-2">
                <li><strong>Multi-timescale neural dynamics inference</strong> (Mon 8-12 PM, PSTR197.03) — <em>Lulu Gong</em></li>
                <li><strong>Topological data analysis in social interaction</strong> (Wed 8-12 PM, PSTR090) — <em>Jared Reiling, Mengsen Zhang</em></li>
                <li><strong>Multi-agent reinforcement learning</strong> (Tue 8-12 PM, PSTR301.11) — <em>Amelia Johnson</em></li>
                <li><strong>Multimodal DBS data analysis</strong> (Wed 1-5 PM) — <em>Brock Wester</em></li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Animal Behavioral Studies</h3>
              
              <h4 className="text-lg font-medium text-foreground mb-2">Social Behavior Research</h4>
              <ul className="text-muted-foreground space-y-2">
                <li><strong>Neural dynamics in cooperating marmosets</strong> (Tue 8-12 AM, NANO035) — <em>Weikang Shi</em></li>
                <li><strong>Social cooperation in rats</strong> (Tue 8-12 AM, PSTR301.11) — <em>Amelia Johnson</em></li>
                <li><strong>mPFC dynamics in social contexts</strong> (Tue 1-5 PM, PP9) — <em>Sequoia Smith</em></li>
                <li><strong>Postural states during social interaction</strong> (Wed 8-12 PM, PSTR090) — <em>Jared Reiling</em></li>
                <li><strong>Neural population dynamics</strong> — <em>Eric Yttri (CMU)</em></li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Human Behavioral Studies</h3>
              
              <h4 className="text-lg font-medium text-foreground mb-2">Clinical & Cognitive Neuroscience</h4>
              <ul className="text-muted-foreground space-y-2">
                <li><strong>Real-world wayfinding and navigation</strong> (Sun 10:15 AM, NANO011.10) — <em>Cory Inman</em></li>
                <li><strong>Metabolic cost monitoring in ACC</strong> — <em>Tyler Albarran (Georgia Tech)</em></li>
                <li><strong>DBS treatment response tracking</strong> — <em>Elif Ceren Fitoz (Georgia Tech)</em></li>
                <li><strong>CAMERA: Ecological research</strong> — <em>Josh Jacobs, Brett Youngerman (Columbia)</em></li>
                <li><strong>Effort-based decision making</strong> — <em>Vivek Anand (Georgia Tech)</em></li>
                <li><strong>Muscle fatigue perception</strong> — <em>Camilla May (Georgia Tech)</em></li>
                <li><strong>Visual attention during navigation</strong> — <em>Alireza Kazemi (Utah)</em></li>
              </ul>
            </div>
          </div>
        </section>

        <Separator className="my-8" />

        {/* Participating BBQS Projects */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">🤝 Participating BBQS Projects</h2>
          
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>U24: BARD.CC</CardTitle>
                <p className="text-sm text-muted-foreground">AI Resource and Data Coordinating Center</p>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li><strong>PIs:</strong> Satrajit Ghosh, Laura Cabrera, David N. Kennedy</li>
                  <li><strong>Focus:</strong> NWB standardization, Standards ecosystem</li>
                  <li><strong>Booth:</strong> #3831 (DANDI/NWB)</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>R24: EMBER</CardTitle>
                <p className="text-sm text-muted-foreground">Ecosystem for Multi-modal Brain-behavior Experimentation</p>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li><strong>PI:</strong> Brock A. Wester</li>
                  <li><strong>Focus:</strong> Data ecosystem, AI/ML tools, Standards</li>
                  <li><strong>Booth:</strong> #3830 (shared with BossDB)</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>U01: Primates Study</CardTitle>
                <p className="text-sm text-muted-foreground">Naturalistic Cooperation and Competition in Primates</p>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li><strong>MPIs:</strong> Chang, Jadi, Nandy, Saxena</li>
                  <li><strong>Focus:</strong> Marmoset cooperation, Rat cooperation modeling</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>R34: Dynamic Transitions</CardTitle>
                <p className="text-sm text-muted-foreground">Dynamic Transitions Across Neural, Behavioral, and Social Scales</p>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li><strong>PIs:</strong> Flavio Frohlich, Mengsen Zhang</li>
                  <li><strong>Focus:</strong> Topological data analysis</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>R34: Social Motif Generator</CardTitle>
                <p className="text-sm text-muted-foreground">Biological Rhythms for Resilient Social Motif Generator</p>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li><strong>PIs:</strong> Nancy Padilla Coreano, Shreya Saxena, Daniel W. Wesson</li>
                  <li><strong>Focus:</strong> mPFC circuit dynamics in social contexts</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>R61: Neural Oscillations</CardTitle>
                <p className="text-sm text-muted-foreground">Neural Oscillations and Privacy-Preserving Sensing</p>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li><strong>PIs:</strong> Ertin, Grammer, Agatha Lenartowicz</li>
                  <li><strong>Focus:</strong> Attention tracking using privacy-preserving sensing technology</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>R61: Memory Formation</CardTitle>
                <p className="text-sm text-muted-foreground">Capturing Autobiographical Memory Formation</p>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li><strong>PI:</strong> Cory Shields Inman</li>
                  <li><strong>Focus:</strong> Real-world wayfinding and navigation</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>R61: DBS Research</CardTitle>
                <p className="text-sm text-muted-foreground">Subcallosal Cingulate DBS Research</p>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li><strong>PI:</strong> Christopher Rozell</li>
                  <li><strong>Focus:</strong> Clinical studies on effort, decision-making, treatment response</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator className="my-8" />

        {/* Connect with BBQS Researchers */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">🔗 Connect with BBQS Researchers</h2>
          
          <h3 className="text-lg font-semibold text-foreground mb-2">SfN Special Linking Groups</h3>
          <p className="text-muted-foreground mb-4">Use these codes in the SfN abstract submission system to find and connect with BBQS researchers:</p>
          
          <ul className="text-muted-foreground space-y-1 mb-4">
            <li><strong>Animal Studies:</strong> <code className="bg-secondary px-2 py-0.5 rounded">ShamrockPlum</code></li>
            <li><strong>Human Studies:</strong> <code className="bg-secondary px-2 py-0.5 rounded">BrassMango</code></li>
            <li><strong>Data & AI Tools:</strong> <code className="bg-secondary px-2 py-0.5 rounded">RedDenim</code></li>
          </ul>
          <p className="text-sm text-muted-foreground italic">Use the Special Linking Group Report in the abstract submission site to find related research groups.</p>
        </section>

        <Separator className="my-8" />

        {/* Connect with BBQS */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">🤝 Connect with BBQS</h2>
          
          <h3 className="text-lg font-semibold text-foreground mb-2">At SfN 2025</h3>
          <ul className="text-muted-foreground space-y-1 mb-4">
            <li><strong>Visit our booths:</strong> #3830 (EMBER/BossDB) and #3831 (DANDI/NWB)</li>
            <li><strong>Join the Monday networking event:</strong> Nov 17, 12:00-2:00 PM near Convention Center</li>
            <li><strong>Connect through SfN linking groups:</strong> Use codes ShamrockPlum, BrassMango, or RedDenim</li>
          </ul>

          <h3 className="text-lg font-semibold text-foreground mb-2">Questions?</h3>
          <p className="text-muted-foreground mb-4">Contact us at <a href="mailto:admin@brain-bbqs.org" className="text-primary hover:underline">admin@brain-bbqs.org</a></p>

          <h3 className="text-lg font-semibold text-foreground mb-2">Learn More</h3>
          <ul className="text-muted-foreground space-y-1">
            <li><a href="https://www.sfn.org/meetings/neuroscience-2025" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">SfN Meeting Website</a></li>
            <li><a href="/projects" className="text-primary hover:underline">BBQS Projects</a></li>
            <li><a href="#" className="text-primary hover:underline">BBQS Resources</a></li>
          </ul>
        </section>

        <Separator className="my-8" />

        {/* Additional Notes */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">📝 Additional Notes</h2>
          
          <h3 className="text-lg font-semibold text-foreground mb-2">Presentation Materials</h3>
          <p className="text-muted-foreground mb-4">Most presenters have agreed to share their talks and posters. Check back after the conference for links to materials.</p>
        </section>

        <Separator className="my-8" />

        <footer className="text-center text-muted-foreground text-sm">
          <p className="italic">Page last updated: November 2025</p>
          <p className="mt-2 font-semibold">Looking forward to seeing you in San Diego!</p>
        </footer>
      </div>
    </div>
  );
};

export default SFN2025;