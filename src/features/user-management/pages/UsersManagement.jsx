import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  deleteDoc, 
  doc,
  query, 
  where 
} from 'firebase/firestore';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Shield, 
  ShieldAlert, 
  Search, 
  Mail, 
  Building2,
  Filter,
  Download,
  MoreVertical,
  Edit2,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { db } from '../../../firebase/config';
import { useAuth } from '../../auth/context/AuthContext';
import { usePermissions } from '../../../shared/hooks/usePermissions';
import { createInvitation } from '../../../services/AdminService';
import InviteUserModal from './components/InviteUserModal';
import UserDetailsModal from './components/UserDetailsModal';
import ConfirmDeleteModal from './components/ConfirmDeleteModal';

const UsersManagement = () => {
  const { userProfile } = useAuth();
  const { can, isSuperAdmin } = usePermissions();
  
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [userProfile]);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter]);

  const fetchUsers = async () => {
    if (!userProfile) return;
    
    try {
      let q;
      if (isSuperAdmin) {
        q = collection(db, "users");
      } else {
        q = query(collection(db, "users"), where("tenantId", "==", userProfile.tenantId));
      }

      const querySnapshot = await getDocs(q);
      const usersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersList);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    
    try {
      await deleteDoc(doc(db, "users", userToDelete.id));
      setUsers(users.filter(u => u.id !== userToDelete.id));
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user profile");
    }
  };

  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setIsDetailsModalOpen(true);
  };

  const exportUsers = () => {
    const csvContent = [
      ['Name', 'Email', 'Role', 'Tenant ID', 'Created At'],
      ...filteredUsers.map(u => [
        u.name,
        u.email,
        u.role,
        u.tenantId,
        u.createdAt || 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `users-export-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getRoleBadgeColor = (role) => {
    switch(role) {
      case 'super_admin': return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800';
      case 'admin': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
      case 'operator': return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800';
      case 'viewer': return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600';
      default: return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  const getRoleIcon = (role) => {
    switch(role) {
      case 'super_admin': return <ShieldAlert size={14} />;
      case 'admin': return <Shield size={14} />;
      default: return null;
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

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Users className="text-blue-600 dark:text-blue-400" size={28} />
            </div>
            User Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            {isSuperAdmin 
              ? `Managing ${filteredUsers.length} users across all organizations` 
              : `${filteredUsers.length} team members in your organization`}
          </p>
        </div>
        
        {can.inviteUsers && (
          <button 
            onClick={() => setIsInviteModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5"
          >
            <UserPlus size={20} />
            Invite User
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
              />
            </div>

            <div className="flex gap-2">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="pl-10 pr-8 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white appearance-none cursor-pointer"
                >
                  <option value="all">All Roles</option>
                  <option value="super_admin">Super Admin</option>
                  <option value="admin">Admin</option>
                  <option value="operator">Operator</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>

              <button
                onClick={exportUsers}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors font-medium"
              >
                <Download size={18} />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              Total: {users.length}
            </div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              Filtered: {filteredUsers.length}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Role
                </th>
                {isSuperAdmin && (
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    Organization
                  </th>
                )}
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredUsers.map((user) => (
                <tr 
                  key={user.id} 
                  className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {user.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {user.name || 'Unnamed User'}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Mail size={12} /> {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getRoleBadgeColor(user.role)}`}>
                      {getRoleIcon(user.role)}
                      {user.role?.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>

                  {isSuperAdmin && (
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Building2 size={16} className="text-slate-400" />
                        <span className="font-mono">{user.tenantId}</span>
                      </div>
                    </td>
                  )}

                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800">
                      <CheckCircle size={12} />
                      Active
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleViewDetails(user)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Edit2 size={16} />
                      </button>
                      
                      {can.deleteUsers && user.id !== userProfile?.uid && (
                        <button 
                          onClick={() => handleDeleteClick(user)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Remove Access"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={isSuperAdmin ? 5 : 4} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                        <Users size={32} className="text-slate-400" />
                      </div>
                      <div>
                        <p className="text-slate-600 dark:text-slate-400 font-medium">No users found</p>
                        <p className="text-sm text-slate-500 dark:text-slate-500">
                          {searchTerm || roleFilter !== 'all' 
                            ? 'Try adjusting your filters' 
                            : 'Invite your first team member to get started'}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-400">
            Showing {filteredUsers.length} of {users.length} users
          </span>
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <AlertCircle size={14} />
            <span>Users are managed per organization</span>
          </div>
        </div>
      </div>

      {can.inviteUsers && (
        <InviteUserModal 
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          onSuccess={fetchUsers}
        />
      )}

      <UserDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setUserToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        user={userToDelete}
      />
    </div>
  );
};

export default UsersManagement;