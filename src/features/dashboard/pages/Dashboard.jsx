import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboard } from '../context/DashboardContext';
import { useAuth } from '../../auth/context/AuthContext';
import { usePermissions } from '../../../shared/hooks/usePermissions';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase/config';

import GaugeWidget from '../../../widgets/GaugeWidget';
import SwitchWidget from '../../../widgets/SwitchWidget';
import MetricWidget from '../../../widgets/MetricWidget';
import ChartWidget from '../../../widgets/ChartWidget';

import WidgetConfigModal from '../../dashboard/components/WidgetConfigModal';
import AddMachineModal from '../../dashboard/components/AddMachineModal';
import WidgetCustomizerRouter from '../customizers/WidgetCustomizerRouter';
import MqttAuditor from '../../mqtt-auditor/MqttAuditor';

import {
    PlusCircle, Plus, X, Building, ChevronDown, Loader2,
    MapPin, AlertCircle, Lock, Activity, Settings
} from 'lucide-react';
import { DndContext, closestCenter, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';

const WidgetFactory = ({ widget, onEdit, onCustomize }) => {
    const commonProps = { ...widget, onEdit, onCustomize };

    switch (widget.type) {
        case 'gauge': return <GaugeWidget {...commonProps} />;
        case 'switch': return <SwitchWidget {...commonProps} />;
        case 'metric': return <MetricWidget {...commonProps} />;
        case 'chart': return <ChartWidget {...commonProps} />;
        default: return null;
    }
};

const Dashboard = () => {
    const navigate = useNavigate();
    const {
        widgets, isEditMode, addWidget, updateWidget,
        machines, activeMachineId, setActiveMachineId, addMachine, removeMachine,
        reorderWidgets, viewedTenantId, switchTenant, loadingData,
        locations, activeLocation, switchLocation
    } = useDashboard();

    const { userProfile } = useAuth();
    const { can, isSuperAdmin } = usePermissions();

    const [isWidgetModalOpen, setIsWidgetModalOpen] = useState(false);
    const [isMachineModalOpen, setIsMachineModalOpen] = useState(false);
    const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
    const [isMqttAuditorOpen, setIsMqttAuditorOpen] = useState(false);
    const [editingWidget, setEditingWidget] = useState(null);
    const [customizingWidget, setCustomizingWidget] = useState(null);
    const [availableTenants, setAvailableTenants] = useState([]);

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
    );

    useEffect(() => {
        if (isSuperAdmin) {
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
    }, [isSuperAdmin]);

    const currentWidgets = widgets.filter(w => w.machineId === activeMachineId);

    const handleDragEnd = (event) => {
        if (!can.editDashboard) return;

        const { active, over } = event;
        if (active.id !== over.id) {
            const oldIndex = widgets.findIndex((w) => w.id === active.id);
            const newIndex = widgets.findIndex((w) => w.id === over.id);
            reorderWidgets(oldIndex, newIndex);
        }
    };

    const handleEditWidget = (widget) => {
        setEditingWidget(widget);
        setIsWidgetModalOpen(true);
    };

    const handleCustomizeWidget = (widget) => {
        setCustomizingWidget(widget);
        setIsCustomizerOpen(true);
    };

    const handleSaveWidget = (widgetData) => {
        if (editingWidget) {
            updateWidget(widgetData);
        } else {
            addWidget(widgetData);
        }
    };

    const handleSaveCustomizer = (widgetData) => {
        updateWidget(widgetData);
    };

    const handleCloseModal = () => {
        setIsWidgetModalOpen(false);
        setEditingWidget(null);
    };

    const handleCloseCustomizer = () => {
        setIsCustomizerOpen(false);
        setCustomizingWidget(null);
    };

    const handleGoToTenantConfig = () => {
        if (viewedTenantId) {
            navigate(`/app/tenants/${viewedTenantId}`);
        }
    };

    return (
        <div className="max-w-7xl mx-auto pb-20">

            {isSuperAdmin && (
                <div className="mb-4 bg-slate-800 text-white p-4 rounded-xl shadow-lg">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500 rounded-lg">
                                <Building size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-indigo-200 font-bold uppercase tracking-wider">Super Admin Mode</p>
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
                        
                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                onClick={handleGoToTenantConfig}
                                disabled={!viewedTenantId}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-colors shadow-lg ${
                                    viewedTenantId
                                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                        : 'bg-slate-600 text-slate-400 cursor-not-allowed'
                                }`}
                            >
                                <Settings size={18} />
                                <span className="hidden sm:inline">Configure</span>
                            </button>
                            
                            <button
                                onClick={() => setIsMqttAuditorOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-bold transition-colors shadow-lg"
                            >
                                <Activity size={18} />
                                <span className="hidden sm:inline">MQTT Auditor</span>
                            </button>
                            
                            {loadingData && (
                                <div className="flex items-center gap-2 text-xs text-indigo-300 animate-pulse">
                                    <Loader2 size={14} className="animate-spin" /> 
                                    <span className="hidden md:inline">Syncing...</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {locations.length > 0 && (
                <div className="mb-6 flex items-center gap-4 bg-white dark:bg-slate-800 p-2 pl-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <MapPin size={18} />
                        <span className="text-sm font-bold uppercase tracking-wide">Location:</span>
                    </div>

                    <div className="relative group">
                        <select
                            value={activeLocation?.id || ''}
                            onChange={(e) => switchLocation(e.target.value)}
                            disabled={!can.viewLocations}
                            className={`appearance-none bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-white pl-4 pr-10 py-2 rounded-lg font-bold cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all ${!can.viewLocations ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {locations.map(loc => (
                                <option key={loc.id} value={loc.id}>{loc.name}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-3 pointer-events-none text-slate-500" />
                    </div>

                    <div className="ml-auto px-4 border-l border-slate-100 dark:border-slate-700 hidden sm:block">
                        {activeLocation?.mqtt_config?.host ? (
                            <span className="text-xs font-mono text-slate-400">
                                Broker: {activeLocation.mqtt_config.host}
                            </span>
                        ) : (
                            <span className="text-xs font-bold text-orange-500 flex items-center gap-1">
                                <AlertCircle size={12} /> No Broker Configured
                            </span>
                        )}
                    </div>
                </div>
            )}

            {machines.length > 0 ? (
                <>
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
                                    {isEditMode && can.editDashboard && machines.length > 1 && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); removeMachine(machine.id); }}
                                            className="p-1 rounded-full bg-red-100 text-red-500 hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <X size={12} />
                                        </button>
                                    )}
                                </div>
                            ))}
                            {isEditMode && can.editDashboard && (
                                <button
                                    onClick={() => setIsMachineModalOpen(true)}
                                    className="p-2 rounded-lg text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/20 transition-colors"
                                >
                                    <Plus size={20} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                            {machines.find(m => m.id === activeMachineId)?.name}
                        </h1>
                    </div>

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext items={currentWidgets.map(w => w.id)} strategy={rectSortingStrategy}>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-min">
                                {currentWidgets.map((widget) => (<div
                                    key={widget.id}
                                    className={widget.width === 'full' ? 'col-span-1 md:col-span-2 lg:col-span-3' : 'col-span-1'}
                                >
                                    <WidgetFactory
                                        widget={widget}
                                        onEdit={() => handleEditWidget(widget)}
                                        onCustomize={() => handleCustomizeWidget(widget)}
                                    />
                                </div>
                                ))}
                                {isEditMode && can.editDashboard && (
                                    <button
                                        onClick={() => {
                                            setEditingWidget(null);
                                            setIsWidgetModalOpen(true);
                                        }}
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
                </>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                    <div className="bg-slate-200 dark:bg-slate-700 p-4 rounded-full mb-4">
                        <MapPin size={48} className="text-slate-400 dark:text-slate-500" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-600 dark:text-slate-300">No Dashboards Yet</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md text-center">
                        {locations.length === 0
                            ? "This tenant has no locations yet. Ask your Administrator to add a Site."
                            : "Start building your dashboard by adding your first widget."}
                    </p>
                    {!can.editDashboard && locations.length > 0 && (
                        <div className="mt-4 flex items-center gap-2 text-sm text-orange-500">
                            <Lock size={16} />
                            <span>Contact your administrator to configure this location</span>
                        </div>
                    )}
                </div>
            )}

            {can.editDashboard && (
                <>
                    <WidgetConfigModal
                        isOpen={isWidgetModalOpen}
                        onClose={handleCloseModal}
                        onSave={handleSaveWidget}
                        widget={editingWidget}
                        machineId={activeMachineId}
                    />
                    <AddMachineModal
                        isOpen={isMachineModalOpen}
                        onClose={() => setIsMachineModalOpen(false)}
                        onSave={addMachine}
                    />
                    <WidgetCustomizerRouter
                        isOpen={isCustomizerOpen}
                        onClose={handleCloseCustomizer}
                        onSave={handleSaveCustomizer}
                        widget={customizingWidget}
                    />
                </>
            )}

            {isSuperAdmin && (
                <MqttAuditor
                    isOpen={isMqttAuditorOpen}
                    onClose={() => setIsMqttAuditorOpen(false)}
                />
            )}
        </div>
    );
};
export default Dashboard;