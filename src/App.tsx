import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import Index from "./pages/Index";
import Projects from "./pages/Projects";
import SFN2025 from "./pages/SFN2025";
import WorkingGroups from "./pages/WorkingGroups";
import Resources from "./pages/Resources";
import Announcements from "./pages/Announcements";
import Roadmap from "./pages/Roadmap";
import Assertions from "./pages/Assertions";
import Evidence from "./pages/Evidence";
import Auth from "./pages/Auth";
import NeuroMCP from "./pages/NeuroMCP";
import DesignDocs from "./pages/DesignDocs";
import Publications from "./pages/Publications";
import NotFound from "./pages/NotFound";

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
              <Route path="/projects" element={<Projects />} />
              <Route path="/sfn-2025" element={<SFN2025 />} />
              <Route path="/working-groups" element={<WorkingGroups />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/announcements" element={<Announcements />} />
              <Route path="/roadmap" element={<Roadmap />} />
              <Route path="/assertions" element={<Assertions />} />
              <Route path="/evidence" element={<Evidence />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/neuromcp" element={<NeuroMCP />} />
              <Route path="/design-docs" element={<DesignDocs />} />
              <Route path="/publications" element={<Publications />} />
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
