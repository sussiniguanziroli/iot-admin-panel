import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { doc, onSnapshot, setDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { useAuth } from '../../auth/context/AuthContext';
import { useMqtt } from '../../mqtt/context/MqttContext';
import { arrayMove } from '@dnd-kit/sortable';
import { applyNodeChanges, applyEdgeChanges, addEdge as rfAddEdge } from '@xyflow/react';

const DashboardContext = createContext();

export const DashboardProvider = ({ children }) => {
  const { userProfile } = useAuth();
  const { connectToBroker, disconnect } = useMqtt();

  const [viewedTenantId, setViewedTenantId] = useState(null);
  const [locations,      setLocations]      = useState([]);
  const [activeLocation, setActiveLocation] = useState(null);

  const [machines,        setMachines]        = useState([]);
  const [widgets,         setWidgets]         = useState([]);
  const [activeMachineId, setActiveMachineId] = useState(null);

  const [diagramNodes, setDiagramNodes] = useState([]);
  const [diagramEdges, setDiagramEdges] = useState([]);
  const diagramNodesRef = useRef([]);
  const diagramEdgesRef = useRef([]);

  const [isEditMode,        setIsEditMode]        = useState(false);
  const [loadingData,       setLoadingData]       = useState(false);
  const [chartData,         setChartData]         = useState({});
  const [nodeDisplayValues, setNodeDisplayValues] = useState({});

  const widgetDataStore = useRef({ metric: {}, gauge: {}, chart: {}, switch: {} });

  useEffect(() => { diagramNodesRef.current = diagramNodes; }, [diagramNodes]);
  useEffect(() => { diagramEdgesRef.current = diagramEdges; }, [diagramEdges]);

  // ── Widget data store ─────────────────────────────────────────────────────
  const getWidgetData = (type, id) => widgetDataStore.current[type]?.[id];

  const setWidgetData = useCallback((type, id, liveData) => {
    if (!widgetDataStore.current[type]) widgetDataStore.current[type] = {};
    widgetDataStore.current[type][id] = liveData;

    const watchingNodes = diagramNodesRef.current.filter(n =>
      n.data.displayWidgetId === id || n.data.powerWidgetId === id
    );
    if (watchingNodes.length === 0) return;

    setNodeDisplayValues(prev => {
      const next = { ...prev };
      let changed = false;

      watchingNodes.forEach(node => {
        const { machineId, displayWidgetId, powerWidgetId, deviceType } = node.data;
        const cur = next[machineId] || {};

        const newDisplayValue = displayWidgetId === id ? liveData.value        : cur.displayValue;
        const newDisplayUnit  = displayWidgetId === id ? (liveData.unit || '') : cur.displayUnit;
        const newIsOnline     = powerWidgetId   === id
          ? (typeof liveData.value === 'boolean' ? liveData.value : Number(liveData.value) > 0)
          : cur.isOnline;

        if (
          cur.displayValue !== newDisplayValue ||
          cur.displayUnit  !== newDisplayUnit  ||
          cur.isOnline     !== newIsOnline
        ) {
          next[machineId] = {
            ...cur,
            displayValue: newDisplayValue,
            displayUnit:  newDisplayUnit,
            isOnline:     newIsOnline,
          };
          changed = true;

          if (powerWidgetId === id && deviceType === 'recloser') {
            const recloserOnline = newIsOnline;
            setDiagramEdges(prevEdges => {
              const outgoing = prevEdges.filter(e => e.source === machineId);
              if (outgoing.length === 0) return prevEdges;
              const updatedEdges = prevEdges.map(e => {
                if (e.source !== machineId) return e;
                return {
                  ...e,
                  data: {
                    ...e.data,
                    hasFlow:   recloserOnline,
                    flowColor: recloserOnline ? '#22c55e' : '#334155',
                  },
                };
              });
              saveDiagramRef.current(diagramNodesRef.current, updatedEdges);
              return updatedEdges;
            });
          }
        }
      });

      return changed ? next : prev;
    });
  }, []);

  const saveDiagramRef = useRef(null);

  const clearWidgetData = () => {
    widgetDataStore.current = { metric: {}, gauge: {}, chart: {}, switch: {} };
    setNodeDisplayValues({});
  };

  // ── Chart helpers ─────────────────────────────────────────────────────────
  const getChartData = useCallback((wId) => chartData[wId] || [], [chartData]);

  const clearChartData = useCallback((wId) => {
    setChartData(prev => { const u = { ...prev }; delete u[wId]; return u; });
  }, []);

  const addChartPoint = useCallback((wId, pt) => {
    setChartData(prev => {
      const ex  = prev[wId] || [];
      const upd = [...ex, pt];
      if (upd.length > 1000) return { ...prev, [wId]: upd.slice(-1000) };
      return { ...prev, [wId]: upd };
    });
  }, []);

  // ── Bootstrap ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (userProfile?.tenantId) setViewedTenantId(userProfile.tenantId);
  }, [userProfile]);

  useEffect(() => {
    if (!viewedTenantId) return;
    const fetchLocs = async () => {
      setLoadingData(true);
      try {
        const snap    = await getDocs(collection(db, 'tenants', viewedTenantId, 'locations'));
        const locList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setLocations(locList);
        if (locList.length > 0) setActiveLocation(locList[0]);
        else { setActiveLocation(null); setMachines([]); }
      } catch (e) { console.error('Error loading locations:', e); }
      finally     { setLoadingData(false); }
    };
    fetchLocs();
  }, [viewedTenantId]);

  useEffect(() => {
    if (!viewedTenantId || !activeLocation) {
      setMachines([]); setDiagramNodes([]); setDiagramEdges([]);
      disconnect(); clearWidgetData();
      return;
    }

    setLoadingData(true);
    if (activeLocation.mqtt_config) connectToBroker(activeLocation.mqtt_config);
    else disconnect();

    const docRef = doc(db, 'tenants', viewedTenantId, 'locations', activeLocation.id);
    const unsub  = onSnapshot(docRef, async snap => {
      if (snap.exists()) {
        const d           = snap.data();
        const layout      = d.layout  || {};
        const diagramData = d.diagram || {};
        let machineList   = layout.machines || [];

        if (machineList.length === 0) {
          const def = { id: `m-${Date.now()}`, name: 'General' };
          machineList = [def];
          await setDoc(docRef, {
            layout: { machines: machineList, widgets: [] },
            updatedAt: new Date().toISOString(),
          }, { merge: true });
        }

        setMachines(machineList);
        setWidgets(layout.widgets || []);
        setActiveMachineId(prev => {
          if (!machineList.length) return null;
          return machineList.find(m => m.id === prev) ? prev : machineList[0].id;
        });
        setDiagramNodes(diagramData.nodes || []);
        setDiagramEdges(diagramData.edges || []);
      }
      setLoadingData(false);
    });
    return () => unsub();
  }, [viewedTenantId, activeLocation]);

  // ── Firestore ─────────────────────────────────────────────────────────────
  const saveLayout = async (nm, nw) => {
    if (!viewedTenantId || !activeLocation) return;
    try {
      await setDoc(
        doc(db, 'tenants', viewedTenantId, 'locations', activeLocation.id),
        { layout: { machines: nm, widgets: nw }, updatedAt: new Date().toISOString() },
        { merge: true }
      );
    } catch (e) { console.error('Error saving layout:', e); }
  };

  const saveDiagram = useCallback(async (nodes, edges) => {
    if (!viewedTenantId || !activeLocation) return;
    try {
      await setDoc(
        doc(db, 'tenants', viewedTenantId, 'locations', activeLocation.id),
        { diagram: { nodes, edges }, updatedAt: new Date().toISOString() },
        { merge: true }
      );
    } catch (e) { console.error('Error saving diagram:', e); }
  }, [viewedTenantId, activeLocation]);

  useEffect(() => { saveDiagramRef.current = saveDiagram; }, [saveDiagram]);

  // ── ReactFlow handlers ────────────────────────────────────────────────────
  const onNodesChange = useCallback((changes) => {
    setDiagramNodes(prev => {
      const updated      = applyNodeChanges(changes, prev);
      const hasMoveEnd   = changes.some(c => c.type === 'position'   && c.dragging  === false);
      const hasResizeEnd = changes.some(c => c.type === 'dimensions' && c.resizing  === false);
      if (hasMoveEnd || hasResizeEnd) saveDiagram(updated, diagramEdgesRef.current);
      return updated;
    });
  }, [saveDiagram]);

  const onEdgesChange = useCallback((changes) => {
    setDiagramEdges(prev => {
      const updated = applyEdgeChanges(changes, prev);
      saveDiagram(diagramNodesRef.current, updated);
      return updated;
    });
  }, [saveDiagram]);

  const onConnect = useCallback((connection) => {
    setDiagramEdges(prev => {
      const updated = rfAddEdge(
        {
          ...connection,
          type: 'flowEdge',
          id:   `e-${Date.now()}`,
          data: { hasFlow: false, flowColor: '#22d3ee' },
        },
        prev
      );
      saveDiagram(diagramNodesRef.current, updated);
      return updated;
    });
  }, [saveDiagram]);

  const updateEdge = useCallback((edgeId, data) => {
    setDiagramEdges(prev => {
      const updated = prev.map(e =>
        e.id === edgeId ? { ...e, data: { ...e.data, ...data } } : e
      );
      saveDiagram(diagramNodesRef.current, updated);
      return updated;
    });
  }, [saveDiagram]);

  // ── Diagram node CRUD ─────────────────────────────────────────────────────
  const addDiagramNode = useCallback((machineId, machineName, deviceType = 'generic') => {
    const isBusbar = deviceType === 'busbar';
    const offset   = diagramNodesRef.current.length * 40;
    const newNode  = {
      id:       machineId,
      type:     isBusbar ? 'busbarNode' : 'schemNode',
      position: { x: 80, y: 80 + offset },
      ...(isBusbar ? { width: 300, height: 4 } : {}),
      data: {
        machineId,
        label:           machineName,
        deviceType,
        displayWidgetId: null,
        powerWidgetId:   null,
        ...(isBusbar ? { busbarColor: '#94a3b8', voltage: '' } : {}),
      },
    };
    setDiagramNodes(prev => {
      const updated = [...prev, newNode];
      saveDiagram(updated, diagramEdgesRef.current);
      return updated;
    });
  }, [saveDiagram]);

  // ── addInlineSymbol ───────────────────────────────────────────────────────
  const addInlineSymbol = useCallback((symbolType, label = '', rotation = 0) => {
    const nodeId  = `sym-${Date.now()}`;
    const offset  = diagramNodesRef.current.length * 20;
    const newNode = {
      id:       nodeId,
      type:    'inlineSymbolNode',
      position: { x: 200 + offset, y: 200 + offset },
      width:    80,
      height:   100,
      data:     { symbolType, label, rotation },
    };
    setDiagramNodes(prev => {
      const updated = [...prev, newNode];
      saveDiagram(updated, diagramEdgesRef.current);
      return updated;
    });
  }, [saveDiagram]);

  // ── addJunction — punto de derivación / empalme ───────────────────────────
  const addJunction = useCallback((x, y) => {
    const nodeId  = `jct-${Date.now()}`;
    const newNode = {
      id:       nodeId,
      type:    'junctionNode',
      position: { x: x ?? 300, y: y ?? 300 },
      // sin dragHandle acá — lo agrega SchematicView al vuelo
      data:     {},
    };
    setDiagramNodes(prev => {
      const updated = [...prev, newNode];
      saveDiagram(updated, diagramEdgesRef.current);
      return updated;
    });
  }, [saveDiagram]);

  // ── removeDiagramNode — por nodeId ────────────────────────────────────────
  const removeDiagramNode = useCallback((nodeId) => {
    setDiagramNodes(prev => {
      const updatedNodes = prev.filter(n => n.id !== nodeId);
      const updatedEdges = diagramEdgesRef.current.filter(
        e => e.source !== nodeId && e.target !== nodeId
      );
      setDiagramEdges(updatedEdges);
      saveDiagram(updatedNodes, updatedEdges);
      return updatedNodes;
    });
  }, [saveDiagram]);

  // ── removeMachine — por machineId (SchemNode) ─────────────────────────────
  const removeMachine = (id) => {
    const nm = machines.filter(m => m.id !== id);
    const nw = widgets.filter(w => w.machineId !== id);
    setMachines(nm);
    setWidgets(nw);
    setActiveMachineId(nm[0]?.id || null);
    saveLayout(nm, nw);
    setDiagramNodes(prev => {
      const updatedNodes = prev.filter(n => n.id !== id);
      const updatedEdges = diagramEdgesRef.current.filter(
        e => e.source !== id && e.target !== id
      );
      setDiagramEdges(updatedEdges);
      saveDiagram(updatedNodes, updatedEdges);
      return updatedNodes;
    });
  };

  const updateDiagramNode = useCallback((nodeId, data) => {
    setDiagramNodes(prev => {
      const updated = prev.map(n =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
      );
      saveDiagram(updated, diagramEdgesRef.current);
      return updated;
    });
  }, [saveDiagram]);

  // ── Tenant / location switching ───────────────────────────────────────────
  const switchTenant = (id) => {
    setViewedTenantId(id);
    setActiveLocation(null);
    clearWidgetData();
  };

  const switchLocation = (locationId) => {
    const t = locations.find(l => l.id === locationId);
    if (t) { setActiveLocation(t); clearWidgetData(); }
  };

  // ── Machine CRUD ──────────────────────────────────────────────────────────
  const addMachine = (name, deviceType = 'generic') => {
    const newId       = `m-${Date.now()}`;
    const newMachines = [...machines, { id: newId, name }];
    setMachines(newMachines);
    setActiveMachineId(newId);
    saveLayout(newMachines, widgets);
    addDiagramNode(newId, name, deviceType);
  };

  // ── Widget CRUD ───────────────────────────────────────────────────────────
  const addWidget = (w) => {
    const up = [...widgets, { ...w, id: Date.now().toString(), machineId: activeMachineId }];
    setWidgets(up);
    saveLayout(machines, up);
  };

  const updateWidget = (uw) => {
    const up = widgets.map(w => w.id === uw.id ? uw : w);
    setWidgets(up);
    saveLayout(machines, up);
  };

  const removeWidget = (id) => {
    const up = widgets.filter(w => w.id !== id);
    setWidgets(up);
    saveLayout(machines, up);
  };

  const reorderWidgets = (o, n) => {
    const up = arrayMove(widgets, o, n);
    setWidgets(up);
    saveLayout(machines, up);
  };

  // ── Profile import ────────────────────────────────────────────────────────
  const loadProfile = (data) => {
    if (data.machines) setMachines(data.machines);
    if (data.widgets)  setWidgets(data.widgets);
    if (data.diagram)  {
      setDiagramNodes(data.diagram.nodes || []);
      setDiagramEdges(data.diagram.edges || []);
    }
    if (data.mqtt_config && activeLocation) {
      const docRef = doc(db, 'tenants', viewedTenantId, 'locations', activeLocation.id);
      setDoc(docRef, { mqtt_config: data.mqtt_config }, { merge: true });
      connectToBroker(data.mqtt_config);
    }
    saveLayout(data.machines || machines, data.widgets || widgets);
    if (data.diagram) saveDiagram(data.diagram.nodes || [], data.diagram.edges || []);
  };

  // ── Context value ─────────────────────────────────────────────────────────
  return (
    <DashboardContext.Provider value={{
      // Edit mode
      isEditMode,
      setIsEditMode:  (v) => setIsEditMode(v),
      toggleEditMode: ()  => setIsEditMode(p => !p),

      // Machines
      machines, activeMachineId, setActiveMachineId,
      addMachine, removeMachine,

      // Widgets
      widgets, addWidget, removeWidget, reorderWidgets, updateWidget,

      // Layout
      loadProfile, loadingData,

      // Tenant / locations
      viewedTenantId, switchTenant,
      locations, activeLocation, switchLocation,

      // Widget data
      getWidgetData, setWidgetData,

      // Chart data
      chartData, getChartData, addChartPoint, clearChartData,

      // Diagram display values
      nodeDisplayValues,

      // ReactFlow diagram
      diagramNodes, diagramEdges,
      onNodesChange, onEdgesChange, onConnect,
      addDiagramNode, removeDiagramNode, updateDiagramNode,
      addInlineSymbol,
      addJunction,
      updateEdge, saveDiagram,
    }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => useContext(DashboardContext);