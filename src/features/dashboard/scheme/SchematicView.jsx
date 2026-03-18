import React, { useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
  ReactFlow, Background, Controls, MiniMap,
  BackgroundVariant, ReactFlowProvider, Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useDashboard }    from '../context/DashboardContext';
import { usePermissions }  from '../../../shared/hooks/usePermissions';
import SchemNode           from './SchemNode';
import FlowEdge            from './FlowEdge';
import BusbarNode          from './BusbarNode';
import InlineSymbolNode    from './InlineSymbolNode';
import NodeSidePanel       from './NodeSidePanel';
import AddNodeModal        from './AddNodeModal';
import AddSymbolModal      from './AddSymbolModal';
import { getDeviceConfig } from './deviceRegistry';
import { Maximize2, Loader2, Plus, Layers } from 'lucide-react';

// ── Tipos registrados ──────────────────────────────────────────────────────────
const nodeTypes = {
  schemNode:        SchemNode,
  busbarNode:       BusbarNode,
  inlineSymbolNode: InlineSymbolNode,
};

const edgeTypes = { flowEdge: FlowEdge };

const defaultEdgeOptions = {
  type: 'flowEdge',
  data: { hasFlow: false, flowColor: '#22d3ee' },
};

const connectionLineStyle = {
  stroke:        '#3b82f6',
  strokeWidth:    2,
  strokeLinecap: 'square',
};

const SNAP_GRID = [5, 5];

// ─────────────────────────────────────────────────────────────────────────────
const SchematicCanvas = forwardRef((props, ref) => {
  const {
    diagramNodes, diagramEdges,
    onNodesChange, onEdgesChange, onConnect,
    isEditMode, machines, loadingData,
    addMachine, updateEdge, addInlineSymbol,
  } = useDashboard();
  const { can } = usePermissions();

  const [selectedMachineId,  setSelectedMachineId]  = useState(null);
  const [selectedDeviceType, setSelectedDeviceType] = useState('generic');
  const [isPanelOpen,        setIsPanelOpen]        = useState(false);
  const [isAddModalOpen,     setIsAddModalOpen]     = useState(false);
  const [isSymbolModalOpen,  setIsSymbolModalOpen]  = useState(false);
  const [rfInstance,         setRfInstance]         = useState(null);

  // ── Ref API expuesta al padre (Dashboard / SchematicView wrapper) ──────────
  useImperativeHandle(ref, () => ({
    openAddModal:    () => setIsAddModalOpen(true),
    openSymbolModal: () => setIsSymbolModalOpen(true),
    fitView:         () => rfInstance?.fitView({ padding: 0.3, duration: 400 }),
  }));

  // ── Click en nodo ─────────────────────────────────────────────────────────
  const onNodeClick = useCallback((_, node) => {
    // InlineSymbolNode y BusbarNode no abren panel lateral
    if (node.type === 'inlineSymbolNode') return;
    if (node.type === 'busbarNode')       return;

    const cfg = getDeviceConfig(node.data?.deviceType);
    if (!cfg.interactive) return;

    setSelectedMachineId(node.data.machineId);
    setSelectedDeviceType(node.data.deviceType ?? 'generic');
    setIsPanelOpen(true);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedMachineId(null);
    setIsPanelOpen(false);
  }, []);

  // ── Click en arista: toggle flujo ────────────────────────────────────────
  const onEdgeClick = useCallback((_, edge) => {
    if (!isEditMode || !can.editDashboard) return;
    updateEdge(edge.id, { hasFlow: !edge.data?.hasFlow });
  }, [isEditMode, can.editDashboard, updateEdge]);

  const selectedMachine  = machines.find(m => m.id === selectedMachineId) ?? null;

  const miniMapNodeColor = useCallback((node) => {
    if (node.type === 'busbarNode')       return node.data?.busbarColor ?? '#94a3b8';
    if (node.type === 'inlineSymbolNode') return '#334155';
    return getDeviceConfig(node.data?.deviceType).color;
  }, []);

  // ── Handler para guardar símbolo inline ──────────────────────────────────
  const handleSaveSymbol = useCallback((symbolType, label, rotation) => {
    addInlineSymbol(symbolType, label, rotation);
    setIsSymbolModalOpen(false);
  }, [addInlineSymbol]);

  // ── Handler para guardar nodo ─────────────────────────────────────────────
  const handleSaveNode = useCallback((name, devType) => {
    addMachine(name, devType);
    setIsAddModalOpen(false);
  }, [addMachine]);

  return (
    <div style={{
      width:           '100%',
      height:          '100%',
      position:        'relative',
      backgroundColor: '#020617',
    }}>
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
        connectionLineType="step"
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.1}
        maxZoom={3}
        proOptions={{ hideAttribution: true }}
      >
        {/* ── Fondo de puntos estilo CAD ─────────────────────────────── */}
        <Background
          variant={BackgroundVariant.Dots}
          gap={5}
          size={1.2}
          color="#111d2a"
        />

        {/* ── Controles de zoom ─────────────────────────────────────── */}
        <Controls
          showInteractive={false}
          style={{ bottom: 24, left: 16 }}
        />

        {/* ── Minimapa ──────────────────────────────────────────────── */}
        <MiniMap
          nodeColor={miniMapNodeColor}
          maskColor="rgba(2,6,23,0.82)"
          style={{
            backgroundColor: '#0a1220',
            border:          '1px solid #1a2741',
            borderRadius:     12,
            bottom:           24,
            right:            16,
          }}
          zoomable
          pannable
        />

        {/* ── Panel inferior izquierdo ──────────────────────────────── */}
        <Panel position="bottom-left" style={{ bottom: 72, left: 16 }}>
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

    {/* Fit view */}
    <button
      onClick={() => rfInstance?.fitView({ padding: 0.3, duration: 400 })}
      title="Ajustar vista"
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 34, height: 34, borderRadius: 10,
        cursor: 'pointer', border: 'none',
        backgroundColor: '#0d1525', color: '#475569',
        outline: '1px solid #1a2741', transition: 'all 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1e293b'; e.currentTarget.style.color = '#e2e8f0'; }}
      onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#0d1525'; e.currentTarget.style.color = '#475569'; }}
    >
      <Maximize2 size={14} />
    </button>

    {/* Sincronizando */}
    {loadingData && (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 12px', backgroundColor: '#0d1525',
        borderRadius: 10, outline: '1px solid #1a2741',
      }}>
        <Loader2 size={13} style={{ color: '#3b82f6', animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: 11, color: '#475569', fontWeight: 600 }}>Sincronizando…</span>
      </div>
    )}

    {/* Hint modo edición */}
    {isEditMode && can.editDashboard && (
      <div style={{
        padding: '6px 10px', borderRadius: 10,
        backgroundColor: '#0d1525', outline: '1px solid #1a2741',
        fontSize: 9, fontWeight: 600, fontFamily: 'monospace',
        color: '#334155', whiteSpace: 'nowrap',
      }}>
        Click arista → toggle flujo · Del → eliminar
      </div>
    )}
  </div>
</Panel>

        {/* ── Estado vacío ───────────────────────────────────────────── */}
        {diagramNodes.length === 0 && !loadingData && (
          <Panel position="top-center">
            <div style={{
              marginTop:    140,
              textAlign:   'center',
              pointerEvents: 'none',
            }}>
              <p style={{
                color:      '#1a2741',
                fontSize:    13,
                fontWeight:  700,
                margin:       0,
                fontFamily: 'monospace',
              }}>
                {isEditMode
                  ? 'Usá "Nodo" o "Símbolo" para comenzar el esquema unifilar'
                  : 'No hay nodos configurados'}
              </p>
            </div>
          </Panel>
        )}
      </ReactFlow>

      {/* ── Panel lateral de widgets ──────────────────────────────────── */}
      <NodeSidePanel
        isOpen={isPanelOpen}
        machine={selectedMachine}
        deviceType={selectedDeviceType}
        onClose={() => { setIsPanelOpen(false); setSelectedMachineId(null); }}
      />

      {/* ── Modal: agregar nodo ───────────────────────────────────────── */}
      <AddNodeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveNode}
      />

      {/* ── Modal: agregar símbolo inline ─────────────────────────────── */}
      <AddSymbolModal
        isOpen={isSymbolModalOpen}
        onClose={() => setIsSymbolModalOpen(false)}
        onSave={handleSaveSymbol}
      />

      <style>{`
        @keyframes spin     { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes flowDash { to   { stroke-dashoffset: -28; } }
      `}</style>
    </div>
  );
});

SchematicCanvas.displayName = 'SchematicCanvas';

// ── Wrapper con ReactFlowProvider ─────────────────────────────────────────────
const SchematicView = forwardRef((props, ref) => (
  <ReactFlowProvider>
    <SchematicCanvas ref={ref} {...props} />
  </ReactFlowProvider>
));

SchematicView.displayName = 'SchematicView';
export default SchematicView;