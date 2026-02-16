// src/features/dashboard/components/UserSelector.jsx

import React, { useState, useEffect } from 'react';
import { Search, User, CheckCircle, Circle, Loader2, Mail, Shield, Crown } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { useAuth } from '../../auth/context/AuthContext';

const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  operator: 'Operator',
  viewer: 'Viewer'
};

const ROLE_COLORS = {
  super_admin: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
  admin: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  operator: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
  viewer: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'
};

const UserSelector = ({ selectedUserIds = [], onChange }) => {
  const { userProfile } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [userProfile?.tenantId]);

  const fetchUsers = async () => {
    if (!userProfile?.tenantId) {
      setUsers([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('tenantId', '==', userProfile.tenantId));
      const snapshot = await getDocs(q);

      const usersList = snapshot.docs.map(doc => ({
        id: doc.id,
        uid: doc.id,
        ...doc.data()
      }));

      usersList.sort((a, b) => {
        const nameA = a.name || a.email || '';
        const nameB = b.name || b.email || '';
        return nameA.localeCompare(nameB);
      });

      setUsers(usersList);
    } catch (err) {
      console.error('[UserSelector] Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    const name = user.name || '';
    const email = user.email || '';

    return (
      name.toLowerCase().includes(searchLower) ||
      email.toLowerCase().includes(searchLower)
    );
  });

  const toggleUser = (uid) => {
    const isSelected = selectedUserIds.includes(uid);

    if (isSelected) {
      onChange(selectedUserIds.filter(id => id !== uid));
    } else {
      onChange([...selectedUserIds, uid]);
    }
  };

  const selectAll = () => {
    onChange(filteredUsers.map(u => u.uid));
  };

  const clearAll = () => {
    onChange([]);
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'super_admin':
      case 'admin':
        return <Crown size={12} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-8 rounded-lg text-center">
        <Loader2 size={32} className="animate-spin mx-auto text-emerald-500 mb-2" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 p-4 rounded-lg">
        <p className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-lg text-center">
        <User size={32} className="mx-auto text-slate-400 mb-2" />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No users found in your organization
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        <button
          type="button"
          onClick={selectAll}
          className="px-3 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
        >
          Select All
        </button>

        <button
          type="button"
          onClick={clearAll}
          className="px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          Clear
        </button>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 max-h-[300px] overflow-y-auto">
        {filteredUsers.length === 0 ? (
          <div className="p-4 text-center text-sm text-slate-500">
            No users match your search
          </div>
        ) : (
          <div className="space-y-1">
            {filteredUsers.map(user => {
              const isSelected = selectedUserIds.includes(user.uid);

              return (
                <label
                  key={user.uid}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/30'
                      : 'bg-white dark:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleUser(user.uid)}
                    className="sr-only"
                  />

                  {isSelected ? (
                    <CheckCircle size={20} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  ) : (
                    <Circle size={20} className="text-slate-300 dark:text-slate-600 flex-shrink-0" />
                  )}

                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0">
                    {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || '?'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">
                        {user.name || 'Unnamed User'}
                      </p>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full border flex-shrink-0 ${ROLE_COLORS[user.role] || ROLE_COLORS.viewer}`}>
                        {getRoleIcon(user.role)}
                        {ROLE_LABELS[user.role] || 'Unknown'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                      <Mail size={10} />
                      {user.email}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {selectedUserIds.length > 0 && (
        <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/30 p-3 rounded-lg">
          <p className="text-xs text-emerald-700 dark:text-emerald-400">
            <strong>{selectedUserIds.length}</strong> {selectedUserIds.length === 1 ? 'user' : 'users'} selected
          </p>
        </div>
      )}
    </div>
  );
};

export default UserSelector;
