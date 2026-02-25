import { Navigate } from "react-router-dom";

// Knowledge Graph Explorer now lives at /metadata-assistant
export default function KnowledgeGraph() {
  return <Navigate to="/metadata-assistant" replace />;
}
