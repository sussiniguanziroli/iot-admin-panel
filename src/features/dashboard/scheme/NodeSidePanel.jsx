import React, { useState } from 'react';
import { X, Plus, Settings, Package } from 'lucide-react';
import { DndContext, closestCenter, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { useDashboard } from '../context/DashboardContext';
import { usePermissions } from '../../../shared/hooks/usePermissions';
import { getDeviceConfig } from './deviceRegistry';
import GaugeWidget from '../../../widgets/GaugeWidget';
import SwitchWidget from '../../../widgets/SwitchWidget';
import MetricWidget from '../../../widgets/MetricWidget';
import ChartWidget from '../../../widgets/ChartWidget';
import WidgetConfigModal from '../components/WidgetConfigModal';
import WidgetCustomizerRouter from '../customizers/WidgetCustomizerRouter';

const WidgetFactory = ({ widget, onEdit, onCustomize }) => {
  const props = { ...widget, onEdit, onCustomize };
  switch (widget.type) {
    case 'gauge':  return <GaugeWidget  {...props} />;
    case 'switch': return <SwitchWidget {...props} />;
    case 'metric': return <MetricWidget {...props} />;
    case 'chart':  return <ChartWidget  {...props} />;
    default:       return null;
  }
};

const NodeSidePanel = ({ isOpen, machine, deviceType, onClose }) => {
  const { isEditMode, widgets, addWidget, updateWidget, reorderWidgets } = useDashboard();
  const { can } = usePermissions();

  const [isWidgetModalOpen, setIsWidgetModalOpen] = useState(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState(null);
  const [customizingWidget, setCustomizingWidget] = useState(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const machineWidgets = widgets.filter(w => w.machineId === machine?.id);

  const handleDragEnd = ({ active, over }) => {
    if (!can.editDashboard || !over || active.id === over.id) return;
    const oldIndex = widgets.findIndex(w => w.id === active.id);
    const newIndex = widgets.findIndex(w => w.id === over.id);
    reorderWidgets(oldIndex, newIndex);
  };

  const handleSaveWidget = (widgetData) => {
    if (editingWidget) updateWidget(widgetData);
    else addWidget(widgetData);
  };

  const cfg = getDeviceConfig(deviceType || 'generic');
  const Icon = cfg.icon;

  return (
    <>
      <div
        style={{
          position: 'absolute', inset: '0 0 0 auto',
          width: 400, zIndex: 30,
          display: 'flex', flexDirection: 'column',
          backgroundColor: '#0a0f1a',
          borderLeft: '1px solid #1e293b',
          boxShadow: '-16px 0 48px rgba(0,0,0,0.6)',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
      >
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: `${cfg.color}18`, border: `1px solid ${cfg.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={20} style={{ color: cfg.color }} />
            </div>
            <div>
              <p style={{ fontSize: 10, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
                {cfg.label}
              </p>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', margin: 0, lineHeight: 1.3 }}>
                {machine?.name || '—'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {machineWidgets.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 64, paddingBottom: 64, textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Package size={28} style={{ color: '#334155' }} />
              </div>
              <p style={{ color: '#475569', fontWeight: 700, fontSize: 14, margin: '0 0 6px' }}>Sin widgets configurados</p>
              <p style={{ color: '#334155', fontSize: 12, margin: 0 }}>
                {isEditMode ? 'Usá el botón de abajo para agregar métricas' : 'Activá el modo edición para configurar'}
              </p>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={machineWidgets.map(w => w.id)} strategy={rectSortingStrategy}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {machineWidgets.map(widget => (
                    <WidgetFactory
                      key={widget.id}
                      widget={widget}
                      onEdit={() => { setEditingWidget(widget); setIsWidgetModalOpen(true); }}
                      onCustomize={() => { setCustomizingWidget(widget); setIsCustomizerOpen(true); }}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        {isEditMode && can.editDashboard && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid #1e293b', flexShrink: 0 }}>
            <button
              onClick={() => { setEditingWidget(null); setIsWidgetModalOpen(true); }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px 16px', backgroundColor: '#1d4ed8', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', transition: 'background-color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2563eb'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#1d4ed8'}
            >
              <Plus size={16} />
              Agregar Widget
            </button>
          </div>
        )}
      </div>

      {can.editDashboard && machine && (
        <>
          <WidgetConfigModal
            isOpen={isWidgetModalOpen}
            onClose={() => { setIsWidgetModalOpen(false); setEditingWidget(null); }}
            onSave={handleSaveWidget}
            widget={editingWidget}
            machineId={machine.id}
          />
          <WidgetCustomizerRouter
            isOpen={isCustomizerOpen}
            onClose={() => { setIsCustomizerOpen(false); setCustomizingWidget(null); }}
            onSave={updateWidget}
            widget={customizingWidget}
          />
        </>
      )}
    </>
  );
};

export default NodeSidePanel;