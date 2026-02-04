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
  // Developer Input
  {
    id: 'developer',
    type: 'default',
    position: { x: 20, y: 150 },
    data: { label: '👤 Developer' },
    style: { 
      background: 'hsl(229 50% 25%)', 
      color: 'white', 
      border: '2px solid hsl(229 50% 50%)',
      borderRadius: '8px',
      padding: '10px 16px',
      fontWeight: 600,
    },
  },

  // Lovable AI
  {
    id: 'lovable',
    type: 'default',
    position: { x: 180, y: 50 },
    data: { label: '💜 Lovable AI' },
    style: { 
      background: 'hsl(280 60% 35%)', 
      color: 'white', 
      border: '2px solid hsl(280 60% 55%)',
      borderRadius: '8px',
      padding: '10px 16px',
      fontWeight: 600,
    },
  },
  {
    id: 'lovable-frontend',
    type: 'default',
    position: { x: 150, y: 0 },
    data: { label: 'Frontend Gen' },
    style: { 
      background: 'hsl(280 40% 25%)', 
      color: 'hsl(280 30% 80%)', 
      border: '1px solid hsl(280 30% 45%)',
      borderRadius: '6px',
      fontSize: '11px',
      padding: '4px 10px',
    },
  },
  {
    id: 'lovable-backend',
    type: 'default',
    position: { x: 260, y: 0 },
    data: { label: 'Backend Gen' },
    style: { 
      background: 'hsl(280 40% 25%)', 
      color: 'hsl(280 30% 80%)', 
      border: '1px solid hsl(280 30% 45%)',
      borderRadius: '6px',
      fontSize: '11px',
      padding: '4px 10px',
    },
  },

  // GitHub Copilot
  {
    id: 'copilot',
    type: 'default',
    position: { x: 180, y: 250 },
    data: { label: '🤖 GitHub Copilot' },
    style: { 
      background: 'hsl(210 80% 35%)', 
      color: 'white', 
      border: '2px solid hsl(210 80% 55%)',
      borderRadius: '8px',
      padding: '10px 16px',
      fontWeight: 600,
    },
  },
  {
    id: 'copilot-fix',
    type: 'default',
    position: { x: 150, y: 310 },
    data: { label: 'Bug Fixes' },
    style: { 
      background: 'hsl(210 60% 25%)', 
      color: 'hsl(210 30% 80%)', 
      border: '1px solid hsl(210 40% 45%)',
      borderRadius: '6px',
      fontSize: '11px',
      padding: '4px 10px',
    },
  },
  {
    id: 'copilot-refactor',
    type: 'default',
    position: { x: 260, y: 310 },
    data: { label: 'Refactoring' },
    style: { 
      background: 'hsl(210 60% 25%)', 
      color: 'hsl(210 30% 80%)', 
      border: '1px solid hsl(210 40% 45%)',
      borderRadius: '6px',
      fontSize: '11px',
      padding: '4px 10px',
    },
  },

  // Codebase
  {
    id: 'codebase',
    type: 'default',
    position: { x: 380, y: 150 },
    data: { label: '📁 Codebase' },
    style: { 
      background: 'hsl(153 60% 30%)', 
      color: 'white', 
      border: '2px solid hsl(153 60% 50%)',
      borderRadius: '8px',
      padding: '10px 16px',
      fontWeight: 600,
    },
  },

  // Self-Healing Loop
  {
    id: 'monitor',
    type: 'default',
    position: { x: 520, y: 50 },
    data: { label: '👁️ Monitor' },
    style: { 
      background: 'hsl(38 80% 35%)', 
      color: 'white', 
      border: '2px solid hsl(38 90% 50%)',
      borderRadius: '8px',
      padding: '8px 14px',
      fontWeight: 600,
    },
  },
  {
    id: 'detect',
    type: 'default',
    position: { x: 620, y: 110 },
    data: { label: '🔍 Detect' },
    style: { 
      background: 'hsl(38 80% 35%)', 
      color: 'white', 
      border: '2px solid hsl(38 90% 50%)',
      borderRadius: '8px',
      padding: '8px 14px',
      fontWeight: 600,
    },
  },
  {
    id: 'diagnose',
    type: 'default',
    position: { x: 620, y: 190 },
    data: { label: '🩺 Diagnose' },
    style: { 
      background: 'hsl(38 80% 35%)', 
      color: 'white', 
      border: '2px solid hsl(38 90% 50%)',
      borderRadius: '8px',
      padding: '8px 14px',
      fontWeight: 600,
    },
  },
  {
    id: 'fix',
    type: 'default',
    position: { x: 520, y: 250 },
    data: { label: '🔧 Fix' },
    style: { 
      background: 'hsl(38 80% 35%)', 
      color: 'white', 
      border: '2px solid hsl(38 90% 50%)',
      borderRadius: '8px',
      padding: '8px 14px',
      fontWeight: 600,
    },
  },

  // NeuroMCP
  {
    id: 'neuromcp',
    type: 'default',
    position: { x: 520, y: 350 },
    data: { label: '🧠 NeuroMCP' },
    style: { 
      background: 'linear-gradient(135deg, hsl(280 60% 35%), hsl(210 80% 35%))', 
      color: 'white', 
      border: '2px solid hsl(280 60% 55%)',
      borderRadius: '8px',
      padding: '10px 16px',
      fontWeight: 600,
    },
  },
  {
    id: 'brainkb',
    type: 'default',
    position: { x: 620, y: 400 },
    data: { label: '📊 BrainKB' },
    style: { 
      background: 'hsl(280 40% 25%)', 
      color: 'hsl(280 30% 80%)', 
      border: '1px solid hsl(280 30% 45%)',
      borderRadius: '6px',
      fontSize: '12px',
      padding: '6px 12px',
    },
  },
];

const initialEdges: Edge[] = [
  // Developer to AI tools
  { id: 'e1', source: 'developer', target: 'lovable', animated: true, style: { stroke: 'hsl(280 50% 50%)', strokeWidth: 2 } },
  { id: 'e2', source: 'developer', target: 'copilot', animated: true, style: { stroke: 'hsl(210 70% 50%)', strokeWidth: 2 } },
  
  // Lovable sub-components
  { id: 'e3', source: 'lovable', target: 'lovable-frontend', style: { stroke: 'hsl(280 40% 50%)' } },
  { id: 'e4', source: 'lovable', target: 'lovable-backend', style: { stroke: 'hsl(280 40% 50%)' } },
  
  // Copilot sub-components
  { id: 'e5', source: 'copilot', target: 'copilot-fix', style: { stroke: 'hsl(210 50% 50%)' } },
  { id: 'e6', source: 'copilot', target: 'copilot-refactor', style: { stroke: 'hsl(210 50% 50%)' } },
  
  // AI tools to codebase
  { id: 'e7', source: 'lovable', target: 'codebase', animated: true, style: { stroke: 'hsl(153 50% 50%)', strokeWidth: 2 } },
  { id: 'e8', source: 'copilot', target: 'codebase', animated: true, style: { stroke: 'hsl(153 50% 50%)', strokeWidth: 2 } },
  
  // Self-healing loop
  { id: 'e9', source: 'codebase', target: 'monitor', animated: true, style: { stroke: 'hsl(38 80% 50%)', strokeWidth: 2 } },
  { id: 'e10', source: 'monitor', target: 'detect', animated: true, style: { stroke: 'hsl(38 80% 50%)', strokeWidth: 2 } },
  { id: 'e11', source: 'detect', target: 'diagnose', animated: true, style: { stroke: 'hsl(38 80% 50%)', strokeWidth: 2 } },
  { id: 'e12', source: 'diagnose', target: 'fix', animated: true, style: { stroke: 'hsl(38 80% 50%)', strokeWidth: 2 } },
  { id: 'e13', source: 'fix', target: 'codebase', animated: true, style: { stroke: 'hsl(38 80% 50%)', strokeWidth: 2 } },
  
  // NeuroMCP
  { id: 'e14', source: 'codebase', target: 'neuromcp', animated: true, style: { stroke: 'hsl(280 50% 50%)', strokeWidth: 2 } },
  { id: 'e15', source: 'neuromcp', target: 'brainkb', animated: true, style: { stroke: 'hsl(280 40% 50%)' } },
];

export default function AgenticFrameworkFlow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className="h-[480px] w-full rounded-lg border border-border overflow-hidden bg-background">
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
