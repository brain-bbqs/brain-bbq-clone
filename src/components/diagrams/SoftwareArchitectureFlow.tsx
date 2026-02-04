import { useCallback } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const initialNodes: Node[] = [
  // Frontend Layer
  {
    id: 'frontend',
    type: 'default',
    position: { x: 250, y: 0 },
    data: { label: '🖥️ React Frontend' },
    style: { 
      background: 'hsl(229 50% 25%)', 
      color: 'white', 
      border: '2px solid hsl(38 90% 50%)',
      borderRadius: '8px',
      padding: '10px 20px',
      fontWeight: 600,
      width: 180,
    },
  },
  {
    id: 'tanstack',
    type: 'default',
    position: { x: 80, y: 80 },
    data: { label: 'TanStack Query' },
    style: { 
      background: 'hsl(229 50% 20%)', 
      color: 'hsl(220 20% 80%)', 
      border: '1px solid hsl(229 30% 40%)',
      borderRadius: '6px',
      fontSize: '12px',
      padding: '6px 12px',
    },
  },
  {
    id: 'router',
    type: 'default',
    position: { x: 250, y: 80 },
    data: { label: 'React Router' },
    style: { 
      background: 'hsl(229 50% 20%)', 
      color: 'hsl(220 20% 80%)', 
      border: '1px solid hsl(229 30% 40%)',
      borderRadius: '6px',
      fontSize: '12px',
      padding: '6px 12px',
    },
  },
  {
    id: 'aggrid',
    type: 'default',
    position: { x: 400, y: 80 },
    data: { label: 'AG Grid' },
    style: { 
      background: 'hsl(229 50% 20%)', 
      color: 'hsl(220 20% 80%)', 
      border: '1px solid hsl(229 30% 40%)',
      borderRadius: '6px',
      fontSize: '12px',
      padding: '6px 12px',
    },
  },

  // Supabase Layer
  {
    id: 'supabase',
    type: 'default',
    position: { x: 250, y: 180 },
    data: { label: '⚡ Supabase' },
    style: { 
      background: 'hsl(153 60% 30%)', 
      color: 'white', 
      border: '2px solid hsl(153 60% 50%)',
      borderRadius: '8px',
      padding: '10px 20px',
      fontWeight: 600,
      width: 180,
    },
  },
  {
    id: 'edge-functions',
    type: 'default',
    position: { x: 80, y: 260 },
    data: { label: 'Edge Functions' },
    style: { 
      background: 'hsl(153 40% 20%)', 
      color: 'hsl(153 30% 80%)', 
      border: '1px solid hsl(153 30% 40%)',
      borderRadius: '6px',
      fontSize: '12px',
      padding: '6px 12px',
    },
  },
  {
    id: 'postgres',
    type: 'default',
    position: { x: 250, y: 260 },
    data: { label: 'PostgreSQL' },
    style: { 
      background: 'hsl(153 40% 20%)', 
      color: 'hsl(153 30% 80%)', 
      border: '1px solid hsl(153 30% 40%)',
      borderRadius: '6px',
      fontSize: '12px',
      padding: '6px 12px',
    },
  },
  {
    id: 'auth',
    type: 'default',
    position: { x: 400, y: 260 },
    data: { label: 'Auth + RLS' },
    style: { 
      background: 'hsl(153 40% 20%)', 
      color: 'hsl(153 30% 80%)', 
      border: '1px solid hsl(153 30% 40%)',
      borderRadius: '6px',
      fontSize: '12px',
      padding: '6px 12px',
    },
  },

  // External APIs
  {
    id: 'external',
    type: 'default',
    position: { x: 250, y: 360 },
    data: { label: '🌐 External APIs' },
    style: { 
      background: 'hsl(38 80% 35%)', 
      color: 'white', 
      border: '2px solid hsl(38 90% 50%)',
      borderRadius: '8px',
      padding: '10px 20px',
      fontWeight: 600,
      width: 180,
    },
  },
  {
    id: 'nih',
    type: 'default',
    position: { x: 80, y: 440 },
    data: { label: 'NIH Reporter' },
    style: { 
      background: 'hsl(38 60% 25%)', 
      color: 'hsl(38 30% 80%)', 
      border: '1px solid hsl(38 40% 50%)',
      borderRadius: '6px',
      fontSize: '12px',
      padding: '6px 12px',
    },
  },
  {
    id: 'icite',
    type: 'default',
    position: { x: 250, y: 440 },
    data: { label: 'iCite' },
    style: { 
      background: 'hsl(38 60% 25%)', 
      color: 'hsl(38 30% 80%)', 
      border: '1px solid hsl(38 40% 50%)',
      borderRadius: '6px',
      fontSize: '12px',
      padding: '6px 12px',
    },
  },
  {
    id: 'github',
    type: 'default',
    position: { x: 400, y: 440 },
    data: { label: 'GitHub API' },
    style: { 
      background: 'hsl(38 60% 25%)', 
      color: 'hsl(38 30% 80%)', 
      border: '1px solid hsl(38 40% 50%)',
      borderRadius: '6px',
      fontSize: '12px',
      padding: '6px 12px',
    },
  },
];

const initialEdges: Edge[] = [
  // Frontend connections
  { id: 'e1', source: 'frontend', target: 'tanstack', animated: true, style: { stroke: 'hsl(229 50% 50%)' } },
  { id: 'e2', source: 'frontend', target: 'router', animated: true, style: { stroke: 'hsl(229 50% 50%)' } },
  { id: 'e3', source: 'frontend', target: 'aggrid', animated: true, style: { stroke: 'hsl(229 50% 50%)' } },
  
  // Frontend to Supabase
  { id: 'e4', source: 'frontend', target: 'supabase', animated: true, style: { stroke: 'hsl(38 90% 50%)', strokeWidth: 2 } },
  
  // Supabase connections
  { id: 'e5', source: 'supabase', target: 'edge-functions', animated: true, style: { stroke: 'hsl(153 50% 50%)' } },
  { id: 'e6', source: 'supabase', target: 'postgres', animated: true, style: { stroke: 'hsl(153 50% 50%)' } },
  { id: 'e7', source: 'supabase', target: 'auth', animated: true, style: { stroke: 'hsl(153 50% 50%)' } },
  
  // Supabase to External
  { id: 'e8', source: 'supabase', target: 'external', animated: true, style: { stroke: 'hsl(38 90% 50%)', strokeWidth: 2 } },
  
  // External API connections
  { id: 'e9', source: 'external', target: 'nih', animated: true, style: { stroke: 'hsl(38 60% 50%)' } },
  { id: 'e10', source: 'external', target: 'icite', animated: true, style: { stroke: 'hsl(38 60% 50%)' } },
  { id: 'e11', source: 'external', target: 'github', animated: true, style: { stroke: 'hsl(38 60% 50%)' } },
];

export default function SoftwareArchitectureFlow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className="h-[520px] w-full rounded-lg border border-border overflow-hidden bg-background">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="hsl(229 30% 30%)" />
        <Controls className="bg-card border-border" />
      </ReactFlow>
    </div>
  );
}
