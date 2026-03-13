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
  const [locations, setLocations] = useState([]);
  const [activeLocation, setActiveLocation] = useState(null);

  const [machines, setMachines] = useState([]);
  const [widgets, setWidgets] = useState([]);
  const [activeMachineId, setActiveMachineId] = useState(null);

  const [diagramNodes, setDiagramNodes] = useState([]);
  const [diagramEdges, setDiagramEdges] = useState([]);
  const diagramNodesRef = useRef([]);
  const diagramEdgesRef = useRef([]);

  const [isEditMode, setIsEditMode] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [chartData, setChartData] = useState({});
  const [nodeDisplayValues, setNodeDisplayValues] = useState({});

  const widgetDataStore = useRef({ metric: {}, gauge: {}, chart: {}, switch: {} });

  useEffect(() => { diagramNodesRef.current = diagramNodes; }, [diagramNodes]);
  useEffect(() => { diagramEdgesRef.current = diagramEdges; }, [diagramEdges]);

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

        const newDisplayValue = displayWidgetId === id ? liveData.value : cur.displayValue;
        const newDisplayUnit  = displayWidgetId === id ? (liveData.unit || '') : cur.displayUnit;
        const newIsOnline     = powerWidgetId === id
          ? (typeof liveData.value === 'boolean' ? liveData.value : Number(liveData.value) > 0)
          : cur.isOnline;

        if (
          cur.displayValue !== newDisplayValue ||
          cur.displayUnit  !== newDisplayUnit  ||
          cur.isOnline     !== newIsOnline
        ) {
          next[machineId] = { ...cur, displayValue: newDisplayValue, displayUnit: newDisplayUnit, isOnline: newIsOnline };
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

  const getChartData = useCallback((widgetId) => chartData[widgetId] || [], [chartData]);

  const clearChartData = useCallback((widgetId) => {
    setChartData(prev => {
      const updated = { ...prev };
      delete updated[widgetId];
      return updated;
    });
  }, []);

  const addChartPoint = useCallback((widgetId, dataPoint) => {
    setChartData(prev => {
      const existing = prev[widgetId] || [];
      const updated = [...existing, dataPoint];
      if (updated.length > 1000) return { ...prev, [widgetId]: updated.slice(-1000) };
      return { ...prev, [widgetId]: updated };
    });
  }, []);

  useEffect(() => {
    if (userProfile?.tenantId) setViewedTenantId(userProfile.tenantId);
  }, [userProfile]);

  useEffect(() => {
    if (!viewedTenantId) return;
    const fetchLocations = async () => {
      setLoadingData(true);
      try {
        const locRef = collection(db, "tenants", viewedTenantId, "locations");
        const snapshot = await getDocs(locRef);
        const locList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setLocations(locList);
        if (locList.length > 0) setActiveLocation(locList[0]);
        else { setActiveLocation(null); setMachines([]); }
      } catch (e) {
        console.error("Error loading locations:", e);
      } finally {
        setLoadingData(false);
      }
    };
    fetchLocations();
  }, [viewedTenantId]);

  useEffect(() => {
    if (!viewedTenantId || !activeLocation) {
      setMachines([]);
      setDiagramNodes([]);
      setDiagramEdges([]);
      disconnect();
      clearWidgetData();
      return;
    }

    setLoadingData(true);

    if (activeLocation.mqtt_config) connectToBroker(activeLocation.mqtt_config);
    else disconnect();

    const docRef = doc(db, "tenants", viewedTenantId, "locations", activeLocation.id);

    const unsubscribe = onSnapshot(docRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const layout      = data.layout  || {};
        const diagramData = data.diagram || {};

        let machineList = layout.machines || [];

        if (machineList.length === 0) {
          const defaultMachine = { id: `m-${Date.now()}`, name: "General" };
          machineList = [defaultMachine];
          await setDoc(docRef, {
            layout: { machines: machineList, widgets: [] },
            updatedAt: new Date().toISOString()
          }, { merge: true });
        }

        setMachines(machineList);
        setWidgets(layout.widgets || []);
        setActiveMachineId(prev => {
          if (machineList.length === 0) return null;
          const exists = machineList.find(m => m.id === prev);
          return exists ? prev : machineList[0].id;
        });

        setDiagramNodes(diagramData.nodes || []);
        setDiagramEdges(diagramData.edges || []);
      }
      setLoadingData(false);
    });

    return () => unsubscribe();
  }, [viewedTenantId, activeLocation]);

  const saveLayout = async (newMachines, newWidgets) => {
    if (!viewedTenantId || !activeLocation) return;
    try {
      const docRef = doc(db, "tenants", viewedTenantId, "locations", activeLocation.id);
      await setDoc(docRef, {
        layout: { machines: newMachines, widgets: newWidgets },
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.error("Error saving layout:", err);
    }
  };

  const saveDiagram = useCallback(async (nodes, edges) => {
    if (!viewedTenantId || !activeLocation) return;
    try {
      const docRef = doc(db, "tenants", viewedTenantId, "locations", activeLocation.id);
      await setDoc(docRef, {
        diagram: { nodes, edges },
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.error("Error saving diagram:", err);
    }
  }, [viewedTenantId, activeLocation]);

  useEffect(() => { saveDiagramRef.current = saveDiagram; }, [saveDiagram]);

  const onNodesChange = useCallback((changes) => {
    setDiagramNodes(prev => {
      const updated = applyNodeChanges(changes, prev);
      const hasMoveEnd = changes.some(c => c.type === 'position' && c.dragging === false);
      if (hasMoveEnd) saveDiagram(updated, diagramEdgesRef.current);
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
          id: `e-${Date.now()}`,
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

  const addDiagramNode = useCallback((machineId, machineName, deviceType = 'generic') => {
    const offset = diagramNodesRef.current.length * 40;
    const newNode = {
      id: machineId,
      type: 'schemNode',
      position: { x: 80 + offset, y: 80 + offset },
      data: {
        machineId,
        label: machineName,
        deviceType,
        displayWidgetId: null,
        powerWidgetId: null,
      },
    };
    setDiagramNodes(prev => {
      const updated = [...prev, newNode];
      saveDiagram(updated, diagramEdgesRef.current);
      return updated;
    });
  }, [saveDiagram]);

  const removeDiagramNode = useCallback((machineId) => {
    setDiagramNodes(prev => {
      const updatedNodes = prev.filter(n => n.id !== machineId);
      const updatedEdges = diagramEdgesRef.current.filter(
        e => e.source !== machineId && e.target !== machineId
      );
      setDiagramEdges(updatedEdges);
      saveDiagram(updatedNodes, updatedEdges);
      return updatedNodes;
    });
  }, [saveDiagram]);

  const updateDiagramNode = useCallback((machineId, data) => {
    setDiagramNodes(prev => {
      const updated = prev.map(n =>
        n.id === machineId ? { ...n, data: { ...n.data, ...data } } : n
      );
      saveDiagram(updated, diagramEdgesRef.current);
      return updated;
    });
  }, [saveDiagram]);

  const switchTenant = (id) => {
    setViewedTenantId(id);
    setActiveLocation(null);
    clearWidgetData();
  };

  const switchLocation = (locationId) => {
    const target = locations.find(l => l.id === locationId);
    if (target) { setActiveLocation(target); clearWidgetData(); }
  };

  const addMachine = (name, deviceType = 'generic') => {
    const newId = `m-${Date.now()}`;
    const newMachines = [...machines, { id: newId, name }];
    setMachines(newMachines);
    setActiveMachineId(newId);
    saveLayout(newMachines, widgets);
    addDiagramNode(newId, name, deviceType);
  };

  const addWidget = (w) => {
    const up = [...widgets, { ...w, id: Date.now().toString(), machineId: activeMachineId }];
    setWidgets(up);
    saveLayout(machines, up);
  };

  const updateWidget = (updatedWidget) => {
    const updatedWidgets = widgets.map(w => w.id === updatedWidget.id ? updatedWidget : w);
    setWidgets(updatedWidgets);
    saveLayout(machines, updatedWidgets);
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

  const removeMachine = (id) => {
    const nm = machines.filter(m => m.id !== id);
    const nw = widgets.filter(w => w.machineId !== id);
    setMachines(nm);
    setWidgets(nw);
    setActiveMachineId(nm[0]?.id || null);
    saveLayout(nm, nw);
    removeDiagramNode(id);
  };

  const loadProfile = (data) => {
    if (data.machines) setMachines(data.machines);
    if (data.widgets)  setWidgets(data.widgets);
    if (data.diagram) {
      setDiagramNodes(data.diagram.nodes || []);
      setDiagramEdges(data.diagram.edges || []);
    }
    if (data.mqtt_config && activeLocation) {
      const docRef = doc(db, "tenants", viewedTenantId, "locations", activeLocation.id);
      setDoc(docRef, { mqtt_config: data.mqtt_config }, { merge: true });
      connectToBroker(data.mqtt_config);
    }
    saveLayout(data.machines || machines, data.widgets || widgets);
    if (data.diagram) saveDiagram(data.diagram.nodes || [], data.diagram.edges || []);
  };

  return (
    <DashboardContext.Provider value={{
      isEditMode, setIsEditMode: (val) => setIsEditMode(val), toggleEditMode: () => setIsEditMode(!isEditMode),
      machines, activeMachineId, setActiveMachineId,
      widgets, addWidget, removeWidget, reorderWidgets, addMachine, removeMachine, updateWidget,
      loadProfile, loadingData,
      viewedTenantId, switchTenant,
      locations, activeLocation, switchLocation,
      getWidgetData, setWidgetData,
      chartData, getChartData, addChartPoint, clearChartData,
      nodeDisplayValues,
      diagramNodes, diagramEdges,
      onNodesChange, onEdgesChange, onConnect,
      addDiagramNode, removeDiagramNode, updateDiagramNode, updateEdge,
      saveDiagram,
    }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => useContext(DashboardContext);