import React from 'react';
import { Trash2, Clock } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const BaseWidget = ({ id, title, icon: Icon, lastUpdated, children }) => {
  const { isEditMode, removeWidget } = useDashboard();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
    position: 'relative'
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`bg-white rounded-2xl shadow-sm border transition-all relative group h-full flex flex-col ${
        isEditMode ? 'border-orange-300 ring-2 ring-orange-100' : 'border-slate-100 hover:shadow-md'
      }`}
    >
      
      {/* HEADER: Ícono + Título + Botón Borrar */}
      <div className="flex justify-between items-center p-5 pb-2 relative z-20"> 
        <div className="flex items-center gap-2 overflow-hidden">
          {/* Si pasamos un ícono, lo mostramos con un fondo suave */}
          {Icon && (
            <div className="p-1.5 rounded-lg bg-slate-50 text-slate-500">
              <Icon size={16} />
            </div>
          )}
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider truncate">{title}</h3>
        </div>
        
        {isEditMode && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              removeWidget(id);
            }}
            className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* BODY: El contenido del gráfico */}
      <div className="flex-1 px-5 relative z-10">
        {children}
      </div>

      {/* FOOTER: Última actualización */}
      <div className="px-5 py-3 mt-2 border-t border-slate-50 flex items-center justify-between text-[10px] text-slate-400 font-medium">
        <div className="flex items-center gap-1.5">
          <Clock size={12} />
          <span>{lastUpdated ? `Actualizado: ${lastUpdated}` : 'Esperando datos...'}</span>
        </div>
        {/* Indicador de estado (Puntito verde) */}
        <div className={`w-2 h-2 rounded-full ${lastUpdated ? 'bg-emerald-400' : 'bg-slate-300'}`}></div>
      </div>

      {/* CAPA DE ARRASTRE (Solo modo edición) */}
      {isEditMode && (
        <div 
          {...attributes} 
          {...listeners}
          className="absolute inset-0 bg-white/50 hover:bg-white/10 cursor-grab active:cursor-grabbing rounded-2xl z-10"
        />
      )}
    </div>
  );
};

export default BaseWidget;