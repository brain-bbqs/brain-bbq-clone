import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import Index from "./pages/Index";
import Projects from "./pages/Projects";
import SFN2025 from "./pages/SFN2025";
import WorkingGroups from "./pages/WorkingGroups";
import Resources from "./pages/Resources";
import Announcements from "./pages/Announcements";
import Roadmap from "./pages/Roadmap";
import Auth from "./pages/Auth";
import NeuroMCP from "./pages/NeuroMCP";
import ConsortiaHistory from "./pages/ConsortiaHistory";
import Publications from "./pages/Publications";
import About from "./pages/About";
import MetadataAssistant from "./pages/MetadataAssistant";
import DataProvenance from "./pages/DataProvenance";
import PrincipalInvestigators from "./pages/PrincipalInvestigators";
import KnowledgeGraph from "./pages/KnowledgeGraph";
import DataSharingPolicy from "./pages/DataSharingPolicy";
import McpDocs from "./pages/McpDocs";
import McpTutorial from "./pages/McpTutorial";
import McpRegistry from "./pages/McpRegistry";
import Species from "./pages/Species";
import Tutorials from "./pages/Tutorials";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import DataProvenanceDocs from "./pages/DataProvenanceDocs";
import SelfAutonomyDocs from "./pages/SelfAutonomyDocs";
import FeatureSuggestions from "./pages/FeatureSuggestions";
import DandiAssistant from "./pages/DandiAssistant";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<About />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/sfn-2025" element={<SFN2025 />} />
              <Route path="/working-groups" element={<WorkingGroups />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/announcements" element={<Announcements />} />
              <Route path="/roadmap" element={<Roadmap />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/neuromcp" element={<NeuroMCP />} />
              <Route path="/consortia-history" element={<ConsortiaHistory />} />
              <Route path="/publications" element={<Publications />} />
              <Route path="/investigators" element={<PrincipalInvestigators />} />
              <Route path="/knowledge-graph" element={<KnowledgeGraph />} />
              <Route path="/data-sharing-policy" element={<DataSharingPolicy />} />
              <Route path="/mcp-docs" element={<McpDocs />} />
              <Route path="/mcp-tutorial" element={<McpTutorial />} />
              <Route path="/species" element={<Species />} />
              
              <Route path="/metadata-assistant" element={<MetadataAssistant />} />
              <Route path="/dandi-assistant" element={<DandiAssistant />} />
              <Route path="/tutorials" element={<Tutorials />} />
              <Route path="/data-provenance" element={<DataProvenance />} />
              <Route path="/profile" element={<Profile />} />
              {/* Data Provenance Docs and Self-Autonomy Docs removed */}
              <Route path="/suggest-feature" element={<FeatureSuggestions />} />
              {/* Redirects from old separate pages */}
              <Route path="/datasets" element={<Navigate to="/resources" replace />} />
              <Route path="/benchmarks" element={<Navigate to="/resources" replace />} />
              <Route path="/ml-models" element={<Navigate to="/resources" replace />} />
              <Route path="/protocols" element={<Navigate to="/resources" replace />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
