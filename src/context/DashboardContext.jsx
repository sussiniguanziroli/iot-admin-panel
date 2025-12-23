import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, collection, getDocs, query } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';
import { useMqtt } from './MqttContext'; // Import MQTT to drive connections
import { arrayMove } from '@dnd-kit/sortable';

const DashboardContext = createContext();

const INITIAL_MACHINES = []; 
const INITIAL_WIDGETS = [];

export const DashboardProvider = ({ children }) => {
  const { userProfile } = useAuth();
  const { connectToBroker, disconnect } = useMqtt(); // <--- Control MQTT from here

  // 1. TENANT & LOCATION STATE
  const [viewedTenantId, setViewedTenantId] = useState(null);
  const [locations, setLocations] = useState([]); // List of available locations
  const [activeLocation, setActiveLocation] = useState(null); // The full location object

  // 2. DASHBOARD CONTENT STATE
  const [machines, setMachines] = useState(INITIAL_MACHINES);
  const [widgets, setWidgets] = useState(INITIAL_WIDGETS);
  const [activeMachineId, setActiveMachineId] = useState(null);
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  // --- INIT: Set default tenant ---
  useEffect(() => {
    if (userProfile?.tenantId) {
        setViewedTenantId(userProfile.tenantId);
    }
  }, [userProfile]);

  // --- STEP 1: Fetch Locations for Tenant ---
  useEffect(() => {
    if (!viewedTenantId) return;

    const fetchLocations = async () => {
        setLoadingData(true);
        try {
            const locRef = collection(db, "tenants", viewedTenantId, "locations");
            const snapshot = await getDocs(locRef);
            
            const locList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setLocations(locList);

            // Auto-select first location if none active
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

  // --- STEP 2: Sync Dashboard & Connect MQTT for Active Location ---
  useEffect(() => {
    if (!viewedTenantId || !activeLocation) {
        setMachines([]); 
        disconnect(); // No location = No MQTT
        return;
    }

    setLoadingData(true);
    console.log(`📍 Loading Location: ${activeLocation.name}`);

    // A. Connect MQTT (If config exists)
    if (activeLocation.mqtt_config) {
        connectToBroker(activeLocation.mqtt_config);
    } else {
        disconnect();
    }

    // B. Real-time Dashboard Sync (Firestore)
    const docRef = doc(db, "tenants", viewedTenantId, "locations", activeLocation.id);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const layout = data.layout || {};

        setMachines(layout.machines || []);
        setWidgets(layout.widgets || []);
        
        // Smart Tab Selection
        setActiveMachineId(prev => {
            const list = layout.machines || [];
            if (list.length === 0) return null;
            const exists = list.find(m => m.id === prev);
            return exists ? prev : list[0].id;
        });
      }
      setLoadingData(false);
    });

    return () => unsubscribe();
  }, [viewedTenantId, activeLocation]); 

  // --- SAVE HELPER ---
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

  // --- ACTIONS ---
  const switchTenant = (id) => {
      setViewedTenantId(id);
      setActiveLocation(null); 
  };

  const switchLocation = (locationId) => {
      const target = locations.find(l => l.id === locationId);
      if (target) setActiveLocation(target);
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
      
      // Update broker config if present in JSON import
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
      // LOCATION EXPORTS
      locations, activeLocation, switchLocation 
    }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => useContext(DashboardContext);