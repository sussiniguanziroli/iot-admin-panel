import React, { useState, useEffect } from 'react';
import { X, Gauge, Power, Save, Hash, LineChart as IconChart, Layout } from 'lucide-react';

const AddWidgetModal = ({ isOpen, onClose, onSave }) => {
  const [activeTab, setActiveTab] = useState('gauge'); 
  
  const [formData, setFormData] = useState({
    title: '',
    topic: 'bombeo/santa_isabel/telemetria',
    dataKey: 'amperes',
    commandTopic: 'bombeo/santa_isabel/comandos',
    unit: '',
    color: 'blue',
    min: '', // Inicializamos vacíos para permitir 'auto'
    max: '',
    width: 'half',
    height: 'md'
  });

  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({ 
        ...prev, 
        title: '',
        width: activeTab === 'chart' ? 'full' : 'half',
        height: 'md',
        min: '', // Resetear min/max al abrir
        max: ''
      }));
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Preparar valores numéricos solo si existen
    const finalMin = formData.min !== '' ? Number(formData.min) : undefined;
    const finalMax = formData.max !== '' ? Number(formData.max) : undefined;

    const newWidget = {
      type: activeTab,
      title: formData.title || 'Nuevo Widget',
      topic: formData.topic,
      width: formData.width,
      height: formData.height,
      dataKey: formData.dataKey,
      commandTopic: formData.commandTopic,
      unit: formData.unit,
      color: formData.color,
      min: finalMin, // <--- Pasamos el valor limpio
      max: finalMax  // <--- Pasamos el valor limpio
    };

    onSave(newWidget);
    onClose();
  };

  const TypeBtn = ({ id, label, icon: Icon, colorClass }) => (
    <button
      type="button"
      onClick={() => setActiveTab(id)}
      className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
        activeTab === id
          ? `border-${colorClass}-500 bg-${colorClass}-50 text-${colorClass}-700 shadow-md`
          : 'border-slate-100 bg-white text-slate-400 hover:bg-slate-50'
      }`}
    >
      <div className={`mb-1 ${activeTab === id ? '' : 'opacity-50'}`}><Icon size={24} /></div>
      <span className="text-xs font-bold">{label}</span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
          <h2 className="text-lg font-bold text-slate-800">Agregar Widget</h2>
          <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-red-500" /></button>
        </div>

        <div className="overflow-y-auto p-6">
          <form id="widget-form" onSubmit={handleSubmit}>
            
            <div className="grid grid-cols-4 gap-3 mb-6">
              <TypeBtn id="gauge" label="Medidor" icon={Gauge} colorClass="blue" />
              <TypeBtn id="metric" label="Dato" icon={Hash} colorClass="purple" />
              <TypeBtn id="chart" label="Gráfico" icon={IconChart} colorClass="orange" />
              <TypeBtn id="switch" label="Botón" icon={Power} colorClass="emerald" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* COLUMNA IZQUIERDA */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Título</label>
                  <input type="text" required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
                
                {activeTab !== 'switch' && (
                   <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Variable JSON</label>
                    <input type="text" placeholder="Ej: temp" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm" 
                      value={formData.dataKey} onChange={e => setFormData({...formData, dataKey: e.target.value})} />
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Tópico MQTT</label>
                  <input type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-xs text-slate-600" 
                    value={formData.topic} onChange={e => setFormData({...formData, topic: e.target.value})} />
                </div>
              </div>

              {/* COLUMNA DERECHA */}
              <div className="space-y-4">
                
                {/* DIMENSIONES */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                    <Layout size={14} /> Dimensiones
                  </label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setFormData({...formData, width: 'half'})} className={`flex-1 py-1.5 text-xs font-bold rounded border transition-all ${formData.width === 'half' ? 'bg-white border-blue-500 text-blue-600 shadow-sm' : 'border-slate-200 text-slate-400'}`}>Normal</button>
                    <button type="button" onClick={() => setFormData({...formData, width: 'full'})} className={`flex-1 py-1.5 text-xs font-bold rounded border transition-all ${formData.width === 'full' ? 'bg-white border-blue-500 text-blue-600 shadow-sm' : 'border-slate-200 text-slate-400'}`}>Ancho Completo</button>
                  </div>
                  {(activeTab === 'chart' || activeTab === 'metric') && (
                    <div className="flex gap-1 pt-2">
                      {['sm', 'md', 'lg'].map((size) => (
                        <button key={size} type="button" onClick={() => setFormData({...formData, height: size})} className={`flex-1 py-1 text-[10px] font-bold uppercase rounded border transition-all ${formData.height === size ? 'bg-orange-50 border-orange-500 text-orange-600' : 'border-slate-200 text-slate-400'}`}>{size === 'sm' ? 'Bajo' : size === 'md' ? 'Medio' : 'Alto'}</button>
                      ))}
                    </div>
                  )}
                </div>

                {/* ESCALA Y/O COLOR (Ahora Chart también tiene escala) */}
                {(activeTab === 'gauge' || activeTab === 'chart') && (
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                     <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Escala Manual (Opcional)</label>
                     <div className="grid grid-cols-2 gap-2">
                        <div>
                           <input type="number" placeholder="Min" className="w-full px-2 py-1 border rounded text-sm" value={formData.min} onChange={e => setFormData({...formData, min: e.target.value})} />
                        </div>
                        <div>
                           <input type="number" placeholder="Max" className="w-full px-2 py-1 border rounded text-sm" value={formData.max} onChange={e => setFormData({...formData, max: e.target.value})} />
                        </div>
                     </div>
                  </div>
                )}

                 {activeTab === 'chart' && (
                     <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Color Línea</label>
                        <input type="color" className="w-full h-8 cursor-pointer rounded" value={formData.color === 'blue' ? '#0ea5e9' : formData.color} onChange={e => setFormData({...formData, color: e.target.value})} />
                     </div>
                  )}

                  {activeTab === 'switch' && (
                     <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                       <label className="text-[10px] font-bold text-slate-400 uppercase">Topic Comando</label>
                       <input type="text" className="w-full px-2 py-1 border rounded font-mono text-xs" value={formData.commandTopic} onChange={e => setFormData({...formData, commandTopic: e.target.value})} />
                     </div>
                  )}
              </div>
            </div>
          </form>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 rounded-lg">Cancelar</button>
          <button type="submit" form="widget-form" className="px-6 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200 flex items-center gap-2">
            <Save size={18} /> Guardar
          </button>
        </div>

      </div>
    </div>
  );
};

export default AddWidgetModal;