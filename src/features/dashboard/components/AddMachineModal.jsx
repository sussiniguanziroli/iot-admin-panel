import React, { useState } from 'react';
import { X, Save, Cpu } from 'lucide-react';

const AddMachineModal = ({ isOpen, onClose, onSave }) => {
  const [machineName, setMachineName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (machineName.trim()) {
      onSave(machineName.trim());
      setMachineName('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <Cpu size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Add Machine</h2>
              <p className="text-indigo-100 text-sm mt-1">Create a new dashboard tab</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors p-2">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              Machine Name *
            </label>
            <input
              type="text"
              required
              value={machineName}
              onChange={(e) => setMachineName(e.target.value)}
              placeholder="e.g., Motor 4, Pump Station, Compressor"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white"
              autoFocus
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              This will create a new tab in your dashboard
            </p>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 transition-all"
            >
              <Save size={18} />
              Add Machine
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default AddMachineModal;