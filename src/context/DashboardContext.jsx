import React, { createContext, useContext, useState, useEffect } from 'react';
import { arrayMove } from '@dnd-kit/sortable';

const DashboardContext = createContext();

const INITIAL_MACHINES = [{ id: 'm1', name: 'Planta Principal' }];
const INITIAL_WIDGETS = []; // Arrancamos vacio para probar el import

export const DashboardProvider = ({ children }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  
  const [machines, setMachines] = useState(() => {
    const saved = localStorage.getItem('iot_machines');
    return saved ? JSON.parse(saved) : INITIAL_MACHINES;
  });

  const [activeMachineId, setActiveMachineId] = useState(() => {
     return machines[0]?.id || 'm1';
  });

  const [widgets, setWidgets] = useState(() => {
    const saved = localStorage.getItem('iot_widgets');
    return saved ? JSON.parse(saved) : INITIAL_WIDGETS;
  });

  useEffect(() => {
    localStorage.setItem('iot_machines', JSON.stringify(machines));
    localStorage.setItem('iot_widgets', JSON.stringify(widgets));
  }, [machines, widgets]);

  const toggleEditMode = () => setIsEditMode(!isEditMode);

  // --- MAQUINAS ---
  const addMachine = (name) => {
    const newId = `m-${Date.now()}`;
    setMachines([...machines, { id: newId, name }]);
    setActiveMachineId(newId);
  };

  const removeMachine = (id) => {
    if (machines.length <= 1) return;
    setMachines(machines.filter(m => m.id !== id));
    setWidgets(widgets.filter(w => w.machineId !== id));
    setActiveMachineId(machines[0].id);
  };

  // --- WIDGETS ---
  const addWidget = (newWidget) => {
    setWidgets([...widgets, { ...newWidget, id: Date.now().toString(), machineId: activeMachineId }]);
  };

  const removeWidget = (id) => {
    setWidgets(widgets.filter(w => w.id !== id));
  };

  const reorderWidgets = (oldIndex, newIndex) => {
    setWidgets((items) => arrayMove(items, oldIndex, newIndex));
  };

  // --- NUEVA FUNCION: CARGAR PERFIL COMPLETO (IMPORT) ---
  const loadProfile = (data) => {
    try {
      if (data.machines && Array.isArray(data.machines)) {
        setMachines(data.machines);
        // Si la maquina activa actual no existe en el nuevo perfil, ponemos la primera del nuevo
        if(data.machines.length > 0) setActiveMachineId(data.machines[0].id);
      }
      if (data.widgets && Array.isArray(data.widgets)) {
        setWidgets(data.widgets);
      }
      alert("✅ Perfil cargado exitosamente");
    } catch (error) {
      console.error(error);
      alert("❌ Error al cargar el archivo de perfil");
    }
  };

  return (
    <DashboardContext.Provider value={{ 
      isEditMode, toggleEditMode, 
      machines, activeMachineId, setActiveMachineId, addMachine, removeMachine,
      widgets, addWidget, removeWidget, reorderWidgets,
      loadProfile // <--- EXPORTAMOS LA FUNCION
    }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => useContext(DashboardContext);