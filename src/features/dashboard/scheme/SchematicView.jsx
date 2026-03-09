import React, { useState, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  ReactFlowProvider,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useDashboard } from '../context/DashboardContext';
import { usePermissions } from '../../../shared/hooks/usePermissions';
import SchemNode from './SchemNode';
import NodeSidePanel from './NodeSidePanel';
import AddNodeModal from './AddNodeModal';
import { getDeviceConfig } from './deviceRegistry';
import { Plus, Maximize2, Lock, Unlock, Loader2 } from 'lucide-react';

const nodeTypes = { schemNode: SchemNode };

const defaultEdgeOptions = {
  type: 'smoothstep',
  style: { stroke: '#334155', strokeWidth: 2 },
  animated: false,
};

const connectionLineStyle = {
  stroke: '#3b82f6',
  strokeWidth: 2,
  strokeDasharray: '6 3',
};

const SchematicCanvas = () => {
  const {
    diagramNodes, diagramEdges,
    onNodesChange, onEdgesChange, onConnect,
    isEditMode, toggleEditMode,
    machines, loadingData, addMachine,
  } = useDashboard();
  const { can } = usePermissions();

  const [selectedMachineId, setSelectedMachineId]   = useState(null);
  const [selectedDeviceType, setSelectedDeviceType] = useState('generic');
  const [isPanelOpen, setIsPanelOpen]               = useState(false);
  const [isAddModalOpen, setIsAddModalOpen]          = useState(false);
  const [rfInstance, setRfInstance]                  = useState(null);

  const onNodeClick = useCallback((_, node) => {
    setSelectedMachineId(node.data.machineId);
    setSelectedDeviceType(node.data.deviceType || 'generic');
    setIsPanelOpen(true);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedMachineId(null);
    setIsPanelOpen(false);
  }, []);

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
        onInit={setRfInstance}
        nodeTypes={nodeTypes}
        nodesDraggable={isEditMode && can.editDashboard}
        nodesConnectable={isEditMode && can.editDashboard}
        edgesReconnectable={isEditMode && can.editDashboard}
        elementsSelectable
        deleteKeyCode={isEditMode && can.editDashboard ? 'Delete' : null}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionLineStyle={connectionLineStyle}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={28}
          size={1}
          color="#1e293b"
        />

        <Controls
          showInteractive={false}
          style={{ bottom: 24, left: 16 }}
        />

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

        <Panel position="top-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {can.editDashboard && (
              <button
                onClick={toggleEditMode}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 12, fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                  backgroundColor: isEditMode ? '#f97316' : '#1e293b',
                  color: isEditMode ? '#fff' : '#94a3b8',
                  boxShadow: isEditMode ? '0 4px 16px rgba(249,115,22,0.3)' : 'none',
                  outline: isEditMode ? 'none' : '1px solid #334155',
                }}
              >
                {isEditMode
                  ? <><Unlock size={13} /> Editando</>
                  : <><Lock    size={13} /> Bloqueado</>
                }
              </button>
            )}

            {isEditMode && can.editDashboard && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 12, fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', border: 'none',
                  backgroundColor: '#1d4ed8', color: '#fff',
                  boxShadow: '0 4px 16px rgba(29,78,216,0.35)',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2563eb'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#1d4ed8'}
              >
                <Plus size={13} />
                Nodo
              </button>
            )}

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
          </div>
        </Panel>

        {diagramNodes.length === 0 && !loadingData && (
          <Panel position="top-center">
            <div style={{ marginTop: 80, textAlign: 'center', pointerEvents: 'none' }}>
              <p style={{ color: '#1e293b', fontSize: 13, fontWeight: 700, margin: 0 }}>
                {isEditMode ? 'Hacé clic en "+ Nodo" para comenzar el esquema' : 'No hay nodos configurados'}
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
    </div>
  );
};

const SchematicView = () => (
  <ReactFlowProvider>
    <SchematicCanvas />
  </ReactFlowProvider>
);

export default SchematicView;