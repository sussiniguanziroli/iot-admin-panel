import React, { useState, useEffect } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { useAuth } from '../context/AuthContext';
import { collection, getDocs } from 'firebase/firestore'; 
import { db } from '../firebase/config';

// WIDGETS
import GaugeWidget from '../widgets/GaugeWidget';
import SwitchWidget from '../widgets/SwitchWidget';
import MetricWidget from '../widgets/MetricWidget';
import ChartWidget from '../widgets/ChartWidget';

import AddWidgetModal from '../components/AddWidgetModal';
import AddMachineModal from '../components/AddMachineModal';
import { PlusCircle, Plus, X, Building, ChevronDown, Loader2 } from 'lucide-react';
import { DndContext, closestCenter, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';

const WidgetFactory = ({ widget }) => {
    switch (widget.type) {
        case 'gauge': return <GaugeWidget {...widget} />;
        case 'switch': return <SwitchWidget {...widget} />;
        case 'metric': return <MetricWidget {...widget} />;
        case 'chart': return <ChartWidget {...widget} />;
        default: return null;
    }
};

const Dashboard = () => {
    const {
        widgets, isEditMode, addWidget,
        machines, activeMachineId, setActiveMachineId, addMachine, removeMachine,
        reorderWidgets, viewedTenantId, switchTenant, loadingData
    } = useDashboard();
    
    const { userProfile } = useAuth();
    
    const [isWidgetModalOpen, setIsWidgetModalOpen] = useState(false);
    const [isMachineModalOpen, setIsMachineModalOpen] = useState(false);
    
    // State for Tenant Switcher
    const [availableTenants, setAvailableTenants] = useState([]);

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
    );

    // Fetch Tenants List ONLY if Super Admin
    useEffect(() => {
        if (userProfile?.role === 'super_admin') {
            const fetchList = async () => {
                try {
                    const snap = await getDocs(collection(db, 'tenants'));
                    const list = snap.docs.map(d => ({ id: d.id, name: d.data().name }));
                    setAvailableTenants(list);
                } catch (e) {
                    console.error("Error fetching tenants list:", e);
                }
            };
            fetchList();
        }
    }, [userProfile]);

    const currentWidgets = widgets.filter(w => w.machineId === activeMachineId);

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            const oldIndex = widgets.findIndex((w) => w.id === active.id);
            const newIndex = widgets.findIndex((w) => w.id === over.id);
            reorderWidgets(oldIndex, newIndex);
        }
    };

    return (
        <div className="max-w-7xl mx-auto pb-20">
            
            {/* --- HEADER SUPER ADMIN (TENANT SWITCHER) --- */}
            {userProfile?.role === 'super_admin' && (
                <div className="mb-6 bg-slate-800 text-white p-4 rounded-xl flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500 rounded-lg">
                            <Building size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-indigo-200 font-bold uppercase tracking-wider">Big Brother Mode</p>
                            <div className="flex items-center gap-2">
                                <span className="text-sm opacity-70">Viewing:</span>
                                <div className="relative group">
                                    <select 
                                        value={viewedTenantId || ''}
                                        onChange={(e) => switchTenant(e.target.value)}
                                        className="appearance-none bg-slate-900 border border-slate-600 text-white pl-3 pr-8 py-1 rounded cursor-pointer hover:border-indigo-400 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold"
                                    >
                                        <option value="" disabled>Select Tenant</option>
                                        {availableTenants.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={14} className="absolute right-2 top-2 pointer-events-none text-slate-400" />
                                </div>
                            </div>
                        </div>
                    </div>
                    {loadingData && (
                        <div className="flex items-center gap-2 text-xs text-indigo-300 animate-pulse">
                            <Loader2 size={14} className="animate-spin" /> Syncing...
                        </div>
                    )}
                </div>
            )}

            {/* --- MACHINE TABS --- */}
            <div className="mb-8 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    {machines.map(machine => (
                        <div
                            key={machine.id}
                            onClick={() => setActiveMachineId(machine.id)}
                            className={`group relative flex items-center gap-2 px-6 py-3 rounded-t-xl cursor-pointer transition-all border-b-2 ${activeMachineId === machine.id 
                                ? 'bg-white dark:bg-slate-800 border-blue-500 text-blue-600 dark:text-blue-400 font-bold shadow-sm' 
                                : 'bg-transparent border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                        >
                            <span>{machine.name}</span>
                            {isEditMode && machines.length > 1 && (
                                <button onClick={(e) => { e.stopPropagation(); removeMachine(machine.id); }} className="p-1 rounded-full bg-red-100 text-red-500 hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all">
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                    ))}
                    {isEditMode && (
                        <button onClick={() => setIsMachineModalOpen(true)} className="p-2 rounded-lg text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                            <Plus size={20} />
                        </button>
                    )}
                </div>
            </div>

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{machines.find(m => m.id === activeMachineId)?.name}</h1>
            </div>

            {/* --- DRAG ZONE --- */}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={currentWidgets.map(w => w.id)} strategy={rectSortingStrategy}>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-min">
                        {currentWidgets.map((widget) => (
                            <div
                                key={widget.id}
                                className={widget.width === 'full' ? 'col-span-1 md:col-span-2 lg:col-span-3' : 'col-span-1'}
                            >
                                <WidgetFactory widget={widget} />
                            </div>
                        ))}

                        {isEditMode && (
                            <button
                                onClick={() => setIsWidgetModalOpen(true)}
                                className="col-span-1 border-3 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl p-6 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all min-h-[250px] group animate-in fade-in"
                            >
                                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900 flex items-center justify-center mb-4 transition-colors">
                                    <PlusCircle size={32} className="group-hover:scale-110 transition-transform duration-300" />
                                </div>
                                <span className="font-bold text-lg">Add Widget</span>
                            </button>
                        )}
                    </div>
                </SortableContext>
            </DndContext>

            <AddWidgetModal isOpen={isWidgetModalOpen} onClose={() => setIsWidgetModalOpen(false)} onSave={addWidget} />
            <AddMachineModal isOpen={isMachineModalOpen} onClose={() => setIsMachineModalOpen(false)} onSave={addMachine} />
        </div>
    );
};

export default Dashboard;