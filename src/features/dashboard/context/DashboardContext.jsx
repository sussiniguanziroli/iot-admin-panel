import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { doc, onSnapshot, setDoc, collection, getDocs, query } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { useAuth } from '../../auth/context/AuthContext';
import { useMqtt } from '../../mqtt/context/MqttContext';
import { arrayMove } from '@dnd-kit/sortable';

const DashboardContext = createContext();

const INITIAL_MACHINES = []; 
const INITIAL_WIDGETS = [];

export const DashboardProvider = ({ children }) => {
  const { userProfile } = useAuth();
  const { connectToBroker, disconnect } = useMqtt();

  const [viewedTenantId, setViewedTenantId] = useState(null);
  const [locations, setLocations] = useState([]);
  const [activeLocation, setActiveLocation] = useState(null);

  const [machines, setMachines] = useState(INITIAL_MACHINES);
  const [widgets, setWidgets] = useState(INITIAL_WIDGETS);
  const [activeMachineId, setActiveMachineId] = useState(null);
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  const widgetDataStore = useRef({
    metric: {},
    gauge: {},
    chart: {},
    switch: {}
  });

  const getWidgetData = (type, id) => {
    return widgetDataStore.current[type]?.[id];
  };

  const setWidgetData = (type, id, data) => {
    if (!widgetDataStore.current[type]) {
      widgetDataStore.current[type] = {};
    }
    widgetDataStore.current[type][id] = data;
  };

  const clearWidgetData = () => {
    widgetDataStore.current = {
      metric: {},
      gauge: {},
      chart: {},
      switch: {}
    };
  };

  useEffect(() => {
    if (userProfile?.tenantId) {
        setViewedTenantId(userProfile.tenantId);
    }
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

            if (locList.length > 0) {
                setActiveLocation(locList[0]);
            } else {
                setActiveLocation(null); 
                setMachines([]);
            }
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
        disconnect();
        clearWidgetData();
        return;
    }

    setLoadingData(true);
    console.log(`📍 Loading Location: ${activeLocation.name}`);

    if (activeLocation.mqtt_config) {
        connectToBroker(activeLocation.mqtt_config);
    } else {
        disconnect();
    }

    const docRef = doc(db, "tenants", viewedTenantId, "locations", activeLocation.id);

    const unsubscribe = onSnapshot(docRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const layout = data.layout || {};

        let machineList = layout.machines || [];
        
        if (machineList.length === 0) {
          const defaultMachine = {
            id: `m-${Date.now()}`,
            name: "General"
          };
          machineList = [defaultMachine];
          
          await setDoc(docRef, {
            layout: { 
              machines: machineList, 
              widgets: [] 
            },
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

  const switchTenant = (id) => {
      setViewedTenantId(id);
      setActiveLocation(null); 
      clearWidgetData();
  };

  const switchLocation = (locationId) => {
      const target = locations.find(l => l.id === locationId);
      if (target) {
        setActiveLocation(target);
        clearWidgetData();
      }
  };

  const addMachine = (name) => {
    const newId = `m-${Date.now()}`;
    const newMachines = [...machines, { id: newId, name }];
    setMachines(newMachines);
    setActiveMachineId(newId);
    saveLayout(newMachines, widgets);
  };
  
  const addWidget = (w) => {
     const up = [...widgets, { ...w, id: Date.now().toString(), machineId: activeMachineId }];
     setWidgets(up);
     saveLayout(machines, up);
  };

  const updateWidget = (updatedWidget) => {
    const updatedWidgets = widgets.map(w => 
      w.id === updatedWidget.id ? updatedWidget : w
    );
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
  };

  const loadProfile = (data) => {
      if(data.machines) setMachines(data.machines);
      if(data.widgets) setWidgets(data.widgets);
      
      if(data.mqtt_config && activeLocation) {
           const docRef = doc(db, "tenants", viewedTenantId, "locations", activeLocation.id);
           setDoc(docRef, { mqtt_config: data.mqtt_config }, { merge: true });
           connectToBroker(data.mqtt_config);
      }
      
      saveLayout(data.machines || machines, data.widgets || widgets);
  };

  return (
    <DashboardContext.Provider value={{ 
      isEditMode, setIsEditMode: (val) => setIsEditMode(val), toggleEditMode: () => setIsEditMode(!isEditMode),
      machines, activeMachineId, setActiveMachineId,
      widgets, addWidget, removeWidget, reorderWidgets, addMachine, removeMachine,
      loadProfile, loadingData,
      viewedTenantId, switchTenant,
      locations, activeLocation, switchLocation, updateWidget,
      getWidgetData, setWidgetData
    }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => useContext(DashboardContext);