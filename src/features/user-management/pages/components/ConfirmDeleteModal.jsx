import React from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, user }) => {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="bg-gradient-to-br from-red-600 to-rose-600 px-6 py-6 text-white">
          <div className="flex justify-between items-start">
            <div className="flex gap-4 items-start">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <AlertTriangle size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Remove User Access</h2>
                <p className="text-red-100 mt-1">This action cannot be undone</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          
          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
              You are about to remove access for:
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                {user.name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">{user.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <h3 className="font-bold text-red-900 dark:text-red-100 text-sm mb-2 flex items-center gap-2">
              <AlertTriangle size={16} />
              What will happen:
            </h3>
            <ul className="text-sm text-red-800 dark:text-red-200 space-y-1">
              <li>• User will lose access to the platform immediately</li>
              <li>• All active sessions will be terminated</li>
              <li>• User profile will be permanently deleted</li>
              <li>• This action cannot be reversed</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-500/30 transition-all"
            >
              <Trash2 size={18} />
              Remove User
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;