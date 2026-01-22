import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../firebase/config';
import { createInvitation } from '../../../../services/AdminService';
import { useAuth } from '../../../auth/context/AuthContext';
import { 
  UserPlus, Mail, Trash2, Crown, User, Shield, 
  Copy, Check, Link as LinkIcon, XCircle, AlertCircle,
  Users as UsersIcon, Search, Filter, Lock, TrendingUp
} from 'lucide-react';

const UsersTab = ({ tenantId, tenantName }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [tenantLimits, setTenantLimits] = useState(null);
  const [tenantUsage, setTenantUsage] = useState(null);
  
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'operator' });
  const [inviteLink, setInviteLink] = useState('');
  const [hasCopied, setHasCopied] = useState(false);

  useEffect(() => {
    fetchTenantData();
    fetchUsers();
  }, [tenantId]);

  const fetchTenantData = async () => {
    try {
      const tenantDoc = await getDoc(doc(db, 'tenants', tenantId));
      if (tenantDoc.exists()) {
        const data = tenantDoc.data();
        setTenantLimits(data.limits);
        setTenantUsage(data.usage);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), where('tenantId', '==', tenantId));
      const snapshot = await getDocs(q);
      const usersList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsers(usersList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const canAddUser = () => {
    if (!tenantLimits || !tenantUsage) return false;
    return tenantUsage.users < tenantLimits.maxUsers;
  };

  const getRemainingUsers = () => {
    if (!tenantLimits || !tenantUsage) return 0;
    return tenantLimits.maxUsers - tenantUsage.users;
  };

  const getUsagePercentage = () => {
    if (!tenantLimits || !tenantUsage) return 0;
    if (tenantLimits.maxUsers === 999) return 0;
    return (tenantUsage.users / tenantLimits.maxUsers) * 100;
  };

  const handleGenerateInvite = async (e) => {
    e.preventDefault();
    
    if (!canAddUser()) {
      alert(`⚠️ User Limit Reached\n\nYour current plan allows ${tenantLimits.maxUsers} user(s).\nUpgrade your plan to invite more team members.`);
      return;
    }

    try {
      const link = await createInvitation(user, tenantId, inviteForm.role, inviteForm.email);
      setInviteLink(link);
    } catch (e) {
      console.error(e);
      alert('Error generating invite');
    }
  };

  const handleRemoveUser = async (userId) => {
    if (!window.confirm('Revoke access for this user?')) return;
    try {
      await deleteDoc(doc(db, 'users', userId));
      setUsers(users.filter(u => u.id !== userId));
      await fetchTenantData();
    } catch (e) {
      console.error(e);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  const resetInviteModal = () => {
    setIsInviteModalOpen(false);
    setInviteLink('');
    setInviteForm({ email: '', role: 'operator' });
    setHasCopied(false);
  };

  const handleOpenInviteModal = () => {
    if (!canAddUser()) {
      alert(`⚠️ User Limit Reached\n\nYour current plan allows ${tenantLimits.maxUsers} user(s).\nUpgrade your plan to invite more team members.`);
      return;
    }
    setIsInviteModalOpen(true);
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <Crown size={14} />;
      case 'operator': return <User size={14} />;
      default: return <Shield size={14} />;
    }
  };

  const getRoleBadgeStyles = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800';
      case 'operator':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 dark:text-slate-400">Loading users...</p>
        </div>
      </div>
    );
  }

  const usagePercentage = getUsagePercentage();
  const isNearLimit = usagePercentage >= 80 && tenantLimits?.maxUsers !== 999;

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {tenantLimits && tenantUsage && (
        <div className={`rounded-xl border-2 p-4 ${
          isNearLimit 
            ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' 
            : 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                isNearLimit ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-purple-100 dark:bg-purple-900/30'
              }`}>
                <TrendingUp size={20} className={isNearLimit ? 'text-orange-600' : 'text-purple-600'} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-white">
                  User Seats
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {tenantUsage.users} of {tenantLimits.maxUsers === 999 ? '∞' : tenantLimits.maxUsers} seats used
                </p>
              </div>
            </div>
            {tenantLimits.maxUsers !== 999 && (
              <div className="text-right">
                <p className={`text-2xl font-bold ${
                  isNearLimit ? 'text-orange-600 dark:text-orange-400' : 'text-purple-600 dark:text-purple-400'
                }`}>
                  {getRemainingUsers()}
                </p>
                <p className="text-xs text-slate-500">remaining</p>
              </div>
            )}
          </div>
          {tenantLimits.maxUsers !== 999 && (
            <div className="mt-3">
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    usagePercentage >= 90 ? 'bg-red-500' : 
                    usagePercentage >= 80 ? 'bg-orange-500' : 
                    'bg-purple-500'
                  }`}
                  style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border-2 border-blue-200 dark:border-blue-800 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-blue-100 dark:border-blue-900">
              <UsersIcon size={28} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100">
                Staff Management
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Manage access for {tenantName} employees
              </p>
            </div>
          </div>
          <button
            onClick={handleOpenInviteModal}
            disabled={!canAddUser()}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold shadow-lg transition-all ${
              canAddUser()
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/30'
                : 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
            }`}
          >
            {canAddUser() ? <UserPlus size={20} /> : <Lock size={20} />}
            Invite User
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        
        <div className="px-6 py-4 border-b-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 outline-none transition-all"
              />
            </div>
            <div className="relative">
              <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="pl-10 pr-8 py-2.5 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admins</option>
                <option value="operator">Operators</option>
              </select>
            </div>
          </div>
        </div>

        {filteredUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-900/50 border-b-2 border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredUsers.map(u => (
                  <tr 
                    key={u.id} 
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                          {u.name?.charAt(0).toUpperCase() || u.email?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white">
                            {u.name || 'Unnamed User'}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <Mail size={12} />
                            {u.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border-2 capitalize ${getRoleBadgeStyles(u.role)}`}>
                        {getRoleIcon(u.role)}
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleRemoveUser(u.id)}
                        className="inline-flex items-center gap-1.5 p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        title="Revoke Access"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <UsersIcon size={32} className="text-slate-400" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-2">
              {searchTerm || roleFilter !== 'all' ? 'No users match your filters' : 'No users found'}
            </p>
            <p className="text-sm text-slate-400">
              {searchTerm || roleFilter !== 'all' ? 'Try adjusting your search criteria' : 'Invite your first team member to get started'}
            </p>
          </div>
        )}
      </div>

      {isInviteModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden animate-in zoom-in-95">
            
            {!inviteLink ? (
              <>
                <div className="px-6 py-5 border-b-2 border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-600 rounded-xl shadow-md">
                        <UserPlus size={24} className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                          Invite User
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Generate a secure registration link
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={resetInviteModal}
                      className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <XCircle size={20} className="text-slate-500" />
                    </button>
                  </div>
                </div>

                <form onSubmit={handleGenerateInvite} className="p-6 space-y-5">
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2 block">
                      Role Permission
                    </label>
                    <select
                      className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-800 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 outline-none transition-all"
                      value={inviteForm.role}
                      onChange={e => setInviteForm({ ...inviteForm, role: e.target.value })}
                    >
                      <option value="operator">Operator (Read Only)</option>
                      <option value="admin">Tenant Admin (Full Control)</option>
                    </select>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                      {inviteForm.role === 'operator' 
                        ? 'Can view dashboards and monitor data'
                        : 'Can manage locations, users, and billing'}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2 block">
                      Restrict to Email (Optional)
                    </label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-800 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 outline-none transition-all"
                      value={inviteForm.email}
                      onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })}
                      placeholder="john@company.com"
                    />
                    <div className="flex items-start gap-2 mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <AlertCircle size={14} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        If set, only this email can use the invitation link
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={resetInviteModal}
                      className="px-5 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-bold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all"
                    >
                      <LinkIcon size={18} />
                      Generate Link
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="p-8">
                <div className="text-center mb-6">
                  <div className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
                    <Check size={32} className="text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                    Invitation Ready!
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Share this link to grant access to {tenantName}
                  </p>
                </div>

                <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 mb-6">
                  <div className="flex items-center gap-3">
                    <input
                      readOnly
                      value={inviteLink}
                      className="flex-1 bg-transparent text-xs font-mono text-slate-700 dark:text-slate-300 outline-none"
                    />
                    <button
                      onClick={copyToClipboard}
                      className="flex-shrink-0 p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-md"
                      title="Copy to clipboard"
                    >
                      {hasCopied ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={resetInviteModal}
                  className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersTab;