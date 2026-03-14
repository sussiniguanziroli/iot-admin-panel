import React, { useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
  ReactFlow, Background, Controls, MiniMap,
  BackgroundVariant, ReactFlowProvider, Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useDashboard } from '../context/DashboardContext';
import { usePermissions } from '../../../shared/hooks/usePermissions';
import SchemNode from './SchemNode';
import FlowEdge from './FlowEdge';
import NodeSidePanel from './NodeSidePanel';
import AddNodeModal from './AddNodeModal';
import { getDeviceConfig } from './deviceRegistry';
import { Maximize2, Loader2 } from 'lucide-react';

const nodeTypes = { schemNode: SchemNode };
const edgeTypes = { flowEdge: FlowEdge };

const defaultEdgeOptions = {
  type: 'flowEdge',
  data: { hasFlow: false, flowColor: '#22d3ee' },
};

const connectionLineStyle = {
  stroke: '#3b82f6',
  strokeWidth: 2,
  strokeDasharray: '6 3',
};

const SNAP_GRID = [160, 160];

const SchematicCanvas = forwardRef(({ onRequestAddNode }, ref) => {
  const {
    diagramNodes, diagramEdges,
    onNodesChange, onEdgesChange, onConnect,
    isEditMode, machines, loadingData, addMachine, updateEdge,
  } = useDashboard();
  const { can } = usePermissions();

  const [selectedMachineId, setSelectedMachineId]   = useState(null);
  const [selectedDeviceType, setSelectedDeviceType] = useState('generic');
  const [isPanelOpen, setIsPanelOpen]               = useState(false);
  const [isAddModalOpen, setIsAddModalOpen]          = useState(false);
  const [rfInstance, setRfInstance]                  = useState(null);

  useImperativeHandle(ref, () => ({
    openAddModal:  () => setIsAddModalOpen(true),
    fitView:       () => rfInstance?.fitView({ padding: 0.3, duration: 400 }),
  }));

  const onNodeClick = useCallback((_, node) => {
    setSelectedMachineId(node.data.machineId);
    setSelectedDeviceType(node.data.deviceType || 'generic');
    setIsPanelOpen(true);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedMachineId(null);
    setIsPanelOpen(false);
  }, []);

  const onEdgeClick = useCallback((_, edge) => {
    if (!isEditMode || !can.editDashboard) return;
    updateEdge(edge.id, { hasFlow: !edge.data?.hasFlow });
  }, [isEditMode, can.editDashboard, updateEdge]);

  const selectedMachine = machines.find(m => m.id === selectedMachineId) || null;

  const miniMapNodeColor = useCallback((node) => {
    const cfg = getDeviceConfig(node.data?.deviceType);
    return cfg.color;
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', backgroundColor: '#020617' }}>
      <ReactFlow
        nodes={diagramNodes}
        edges={diagramEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onEdgeClick={onEdgeClick}
        onInit={setRfInstance}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesDraggable={isEditMode && can.editDashboard}
        nodesConnectable={isEditMode && can.editDashboard}
        edgesReconnectable={isEditMode && can.editDashboard}
        elementsSelectable
        snapToGrid
        snapGrid={SNAP_GRID}
        deleteKeyCode={isEditMode && can.editDashboard ? 'Delete' : null}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionLineStyle={connectionLineStyle}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={160} size={2} color="#1e293b" />

        <Controls showInteractive={false} style={{ bottom: 24, left: 16 }} />

        <MiniMap
          nodeColor={miniMapNodeColor}
          maskColor="rgba(2,6,23,0.8)"
          style={{
            backgroundColor: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: 12,
            bottom: 24,
            right: 16,
          }}
          zoomable
          pannable
        />

        <Panel position="bottom-left" style={{ bottom: 72, left: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => rfInstance?.fitView({ padding: 0.3, duration: 400 })}
              title="Ajustar vista"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 34, height: 34, borderRadius: 10, cursor: 'pointer', border: 'none',
                backgroundColor: '#1e293b', color: '#64748b',
                outline: '1px solid #334155', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#334155'; e.currentTarget.style.color = '#e2e8f0'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#1e293b'; e.currentTarget.style.color = '#64748b'; }}
            >
              <Maximize2 size={14} />
            </button>

            {loadingData && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', backgroundColor: '#1e293b', borderRadius: 10, outline: '1px solid #334155' }}>
                <Loader2 size={13} style={{ color: '#3b82f6', animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Sincronizando...</span>
              </div>
            )}

            {isEditMode && can.editDashboard && (
              <div style={{
                padding: '6px 10px', borderRadius: 10,
                backgroundColor: '#1e293b', outline: '1px solid #334155',
                fontSize: 10, fontWeight: 600, color: '#475569', whiteSpace: 'nowrap',
              }}>
                Click en arista → toggle flujo
              </div>
            )}
          </div>
        </Panel>

        {diagramNodes.length === 0 && !loadingData && (
          <Panel position="top-center">
            <div style={{ marginTop: 120, textAlign: 'center', pointerEvents: 'none' }}>
              <p style={{ color: '#1e293b', fontSize: 13, fontWeight: 700, margin: 0 }}>
                {isEditMode
                  ? 'Usá "+ Nodo" en la barra superior para comenzar el esquema'
                  : 'No hay nodos configurados'}
              </p>
            </div>
          </Panel>
        )}
      </ReactFlow>

      <NodeSidePanel
        isOpen={isPanelOpen}
        machine={selectedMachine}
        deviceType={selectedDeviceType}
        onClose={() => { setIsPanelOpen(false); setSelectedMachineId(null); }}
      />

      <AddNodeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={(name, devType) => { addMachine(name, devType); setIsAddModalOpen(false); }}
      />

      <style>{`
        @keyframes spin     { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes flowDash { to   { stroke-dashoffset: -28; } }
      `}</style>
    </div>
  );
});

SchematicCanvas.displayName = 'SchematicCanvas';

const SchematicView = forwardRef((props, ref) => (
  <ReactFlowProvider>
    <SchematicCanvas ref={ref} {...props} />
  </ReactFlowProvider>
));

SchematicView.displayName = 'SchematicView';
export default SchematicView;