import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';
import { arrayMove } from '@dnd-kit/sortable';

const DashboardContext = createContext();

const INITIAL_MACHINES = [{ id: 'm1', name: 'Planta Principal' }];
const INITIAL_WIDGETS = [];

export const DashboardProvider = ({ children }) => {
  const { userProfile } = useAuth(); 
  
  // STATE: Which tenant are we currently looking at?
  const [viewedTenantId, setViewedTenantId] = useState(null);

  const [machines, setMachines] = useState(INITIAL_MACHINES);
  const [widgets, setWidgets] = useState(INITIAL_WIDGETS);
  const [activeMachineId, setActiveMachineId] = useState('m1');
  const [isEditMode, setIsEditMode] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  // 1. Initialize View
  useEffect(() => {
    if (userProfile?.tenantId) {
        setViewedTenantId(userProfile.tenantId);
    }
  }, [userProfile]);

  // 2. FIRESTORE SYNC (The "Big Brother" Stream)
  useEffect(() => {
    if (!viewedTenantId) return;

    setLoadingData(true);
    console.log("🔌 Switching Dashboard Stream to:", viewedTenantId);

    const docRef = doc(db, "tenants", viewedTenantId, "dashboard_data", "main_layout");

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMachines(data.machines || INITIAL_MACHINES);
        setWidgets(data.widgets || INITIAL_WIDGETS);
        
        // Validate active machine tab
        setActiveMachineId(prev => {
            const currentList = data.machines || [];
            if (currentList.length === 0) return 'm1';
            const exists = currentList.find(m => m.id === prev);
            return exists ? prev : currentList[0].id;
        });
      } else {
        console.log("⚠️ No dashboard data found for this tenant. Loading defaults.");
        setMachines(INITIAL_MACHINES);
        setWidgets(INITIAL_WIDGETS);
      }
      setLoadingData(false);
    });

    return () => unsubscribe();
  }, [viewedTenantId]);

  // --- SAVE HELPER ---
  const saveToFirestore = async (newMachines, newWidgets, mqttConfig = null) => {
    if (!viewedTenantId) return;
    
    try {
      const docRef = doc(db, "tenants", viewedTenantId, "dashboard_data", "main_layout");
      const payload = {
        machines: newMachines,
        widgets: newWidgets,
        updatedBy: userProfile?.email || 'unknown',
        updatedAt: new Date().toISOString()
      };
      
      // If we are importing a file with MQTT config, save it too
      if (mqttConfig) {
        payload.mqtt_config = mqttConfig;
      }

      await setDoc(docRef, payload, { merge: true });
    } catch (err) {
      console.error("Error saving dashboard:", err);
    }
  };

  const switchTenant = (newTenantId) => {
      setViewedTenantId(newTenantId);
      setActiveMachineId('m1'); 
  };

  const toggleEditMode = () => setIsEditMode(!isEditMode);

  // --- ACTIONS ---
  const addMachine = (name) => {
    const newId = `m-${Date.now()}`;
    const newMachines = [...machines, { id: newId, name }];
    setMachines(newMachines);
    setActiveMachineId(newId);
    saveToFirestore(newMachines, widgets);
  };

  const removeMachine = (id) => {
    if (machines.length <= 1) return;
    const newMachines = machines.filter(m => m.id !== id);
    const newWidgets = widgets.filter(w => w.machineId !== id);
    setMachines(newMachines);
    setWidgets(newWidgets);
    setActiveMachineId(newMachines[0].id);
    saveToFirestore(newMachines, newWidgets);
  };

  const addWidget = (newWidget) => {
    const updatedWidgets = [...widgets, { ...newWidget, id: Date.now().toString(), machineId: activeMachineId }];
    setWidgets(updatedWidgets);
    saveToFirestore(machines, updatedWidgets);
  };

  const removeWidget = (id) => {
    const updatedWidgets = widgets.filter(w => w.id !== id);
    setWidgets(updatedWidgets);
    saveToFirestore(machines, updatedWidgets);
  };

  const reorderWidgets = (oldIndex, newIndex) => {
    const updatedWidgets = arrayMove(widgets, oldIndex, newIndex);
    setWidgets(updatedWidgets);
    saveToFirestore(machines, updatedWidgets);
  };

  // --- IMPORT FUNCTION ---
  const loadProfile = (data) => {
    // 1. Update State
    if (data.machines) setMachines(data.machines);
    if (data.widgets) setWidgets(data.widgets);
    
    // 2. Save to Firestore (Current Tenant)
    saveToFirestore(
        data.machines || machines, 
        data.widgets || widgets,
        data.mqtt_config || null // <--- NOW SAVES MQTT CONFIG TOO
    );
    
    alert(`✅ Profile imported for tenant: ${viewedTenantId}`);
  };

  return (
    <DashboardContext.Provider value={{ 
      isEditMode, toggleEditMode, 
      machines, activeMachineId, setActiveMachineId, addMachine, removeMachine,
      widgets, addWidget, removeWidget, reorderWidgets,
      loadProfile, loadingData,
      viewedTenantId, switchTenant 
    }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => useContext(DashboardContext);