import React from 'react';
import { X, Mail, Shield, Building2, Calendar, User as UserIcon, Clock, CheckCircle } from 'lucide-react';

const UserDetailsModal = ({ isOpen, onClose, user }) => {
  if (!isOpen || !user) return null;

  const getRoleBadgeColor = (role) => {
    switch(role) {
      case 'super_admin': return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800';
      case 'admin': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
      case 'operator': return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800';
      case 'viewer': return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600';
      default: return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 px-6 py-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
          
          <div className="relative">
            <div className="flex justify-between items-start mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-xl">
                {user.name?.charAt(0).toUpperCase() || '?'}
              </div>
              <button 
                onClick={onClose}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <h2 className="text-2xl font-bold mb-1">{user.name || 'Unnamed User'}</h2>
            <p className="text-slate-300 text-sm flex items-center gap-1.5">
              <Mail size={14} />
              {user.email}
            </p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          
          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Role & Permissions</span>
              <Shield size={16} className="text-slate-400" />
            </div>
            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold border ${getRoleBadgeColor(user.role)}`}>
              {user.role?.replace('_', ' ').toUpperCase()}
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {user.role === 'super_admin' && 'Full platform access across all organizations'}
              {user.role === 'admin' && 'Can manage users, configure dashboards, and control equipment'}
              {user.role === 'operator' && 'Can view dashboards and monitor equipment'}
              {user.role === 'viewer' && 'Read-only access to dashboards'}
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Organization</span>
              <Building2 size={16} className="text-slate-400" />
            </div>
            <p className="text-sm font-mono text-slate-700 dark:text-slate-300">
              {user.tenantId || 'N/A'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={14} className="text-slate-400" />
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Created</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300">
                {formatDate(user.createdAt)}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle size={14} className="text-emerald-500" />
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Status</span>
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                Active
              </p>
            </div>
          </div>

          {user.invitedBy && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <UserIcon size={14} className="text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase">Invited By</span>
              </div>
              <p className="text-sm text-blue-900 dark:text-blue-100">
                {user.invitedBy}
              </p>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-xl font-bold hover:opacity-90 transition-opacity"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;