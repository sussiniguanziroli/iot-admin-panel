// src/components/AddMachineModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Factory, Save } from 'lucide-react';

const AddMachineModal = ({ isOpen, onClose, onSave }) => {
  const [machineName, setMachineName] = useState('');

  // Limpiar el input cada vez que se abre
  useEffect(() => {
    if (isOpen) setMachineName('');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (machineName.trim()) {
      onSave(machineName);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop con Blur */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Contenedor del Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Visual */}
        <div className="bg-slate-50 px-6 py-6 border-b border-slate-100 flex justify-between items-start">
          <div className="flex gap-4">
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
              <Factory size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Nueva Sección</h2>
              <p className="text-sm text-slate-500">Crear un nuevo tablero independiente</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-rose-500 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Nombre de la Máquina / Sector
            </label>
            <input 
              type="text" 
              autoFocus
              placeholder="Ej: Horno de Secado 2"
              className="w-full px-4 py-3 text-lg bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
              value={machineName}
              onChange={(e) => setMachineName(e.target.value)}
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button 
              type="button" 
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={!machineName.trim()}
              className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              <Save size={18} />
              Crear Tablero
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default AddMachineModal;