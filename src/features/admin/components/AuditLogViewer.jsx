// src/features/admin/components/AuditLogViewer.jsx

import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { useAuth } from '../../auth/context/AuthContext';
import { usePermissions } from '../../../shared/hooks/usePermissions';
import { useDashboard } from '../../dashboard/context/DashboardContext';
import { 
  Shield, Search, Filter, Download, Calendar, User, 
  Activity, Database, Settings, LogIn, AlertCircle, Clock,
  MapPin, Building2, X
} from 'lucide-react';
import { ACTION_CATEGORIES } from '../../../services/AdminService';

const AuditLogViewer = () => {
  const { userProfile } = useAuth();
  const { isSuperAdmin } = usePermissions();
  const { locations } = useDashboard();
  
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [tenantFilter, setTenantFilter] = useState('all');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  
  const [availableTenants, setAvailableTenants] = useState([]);
  const [availableLocations, setAvailableLocations] = useState([]);

  // Fetch tenants (solo super admin)
  useEffect(() => {
    if (isSuperAdmin) {
      const fetchTenants = async () => {
        try {
          const snapshot = await getDocs(collection(db, 'tenants'));
          const tenantsList = snapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name
          }));
          setAvailableTenants(tenantsList);
        } catch (error) {
          console.error('Error fetching tenants:', error);
        }
      };
      fetchTenants();
    }
  }, [isSuperAdmin]);

  // Fetch locations (basado en tenant seleccionado)
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        let targetTenantId = tenantFilter !== 'all' ? tenantFilter : userProfile?.tenantId;
        
        if (!targetTenantId) return;

        const locationsRef = collection(db, 'tenants', targetTenantId, 'locations');
        const snapshot = await getDocs(locationsRef);
        const locationsList = snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name
        }));
        setAvailableLocations(locationsList);
      } catch (error) {
        console.error('Error fetching locations:', error);
      }
    };

    fetchLocations();
  }, [tenantFilter, userProfile]);

  useEffect(() => {
    fetchLogs();
  }, [userProfile, categoryFilter, dateFilter, locationFilter, tenantFilter, customDateRange]);

  const fetchLogs = async () => {
    if (!userProfile) return;
    
    setLoading(true);
    try {
      let q = collection(db, "audit_logs");
      const constraints = [];
      
      // Filtro de Tenant
      if (tenantFilter !== 'all') {
        constraints.push(where("tenantId", "==", tenantFilter));
      } else if (!isSuperAdmin) {
        constraints.push(where("tenantId", "==", userProfile.tenantId));
      }
      
      // Filtro de Location
      if (locationFilter !== 'all') {
        constraints.push(where("locationId", "==", locationFilter));
      }
      
      // Filtro de Categoría
      if (categoryFilter !== 'all') {
        constraints.push(where("category", "==", categoryFilter));
      }
      
      // Filtro de Fecha
      if (dateFilter === 'custom' && customDateRange.start && customDateRange.end) {
        const startDate = new Date(customDateRange.start);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(customDateRange.end);
        endDate.setHours(23, 59, 59, 999);
        
        constraints.push(where("timestamp", ">=", Timestamp.fromDate(startDate)));
        constraints.push(where("timestamp", "<=", Timestamp.fromDate(endDate)));
      } else if (dateFilter !== 'all') {
        const now = new Date();
        let startDate;
        
        switch(dateFilter) {
          case 'today':
            startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
          case 'week':
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
          case 'month':
            startDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
          case 'quarter':
            startDate = new Date(now.setMonth(now.getMonth() - 3));
            break;
        }
        
        if (startDate) {
          constraints.push(where("timestamp", ">=", Timestamp.fromDate(startDate)));
        }
      }
      
      constraints.push(orderBy("timestamp", "desc"));
      constraints.push(limit(200));
      
      q = query(q, ...constraints);
      
      const querySnapshot = await getDocs(q);
      const logsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      }));
      
      setLogs(logsList);
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      log.actor?.toLowerCase().includes(search) ||
      log.action?.toLowerCase().includes(search) ||
      log.target?.toLowerCase().includes(search) ||
      log.metadata?.locationName?.toLowerCase().includes(search) ||
      log.metadata?.machineName?.toLowerCase().includes(search)
    );
  });

  const clearFilters = () => {
    setCategoryFilter('all');
    setDateFilter('all');
    setLocationFilter('all');
    setTenantFilter('all');
    setSearchTerm('');
    setCustomDateRange({ start: '', end: '' });
  };

  const activeFiltersCount = [
    categoryFilter !== 'all',
    dateFilter !== 'all',
    locationFilter !== 'all',
    tenantFilter !== 'all',
    searchTerm !== ''
  ].filter(Boolean).length;

  const exportLogs = () => {
    const csvContent = [
      ['Timestamp', 'Tenant', 'Location', 'Actor', 'Role', 'Action', 'Category', 'Target', 'Previous State', 'New State'],
      ...filteredLogs.map(l => [
        l.timestamp.toISOString(),
        l.tenantId || 'N/A',
        l.metadata?.locationName || 'N/A',
        l.actor,
        l.actorRole || 'N/A',
        l.action,
        l.category,
        l.target,
        l.previousState || 'N/A',
        l.newState || 'N/A'
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-logs-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCategoryIcon = (category) => {
    switch(category) {
      case ACTION_CATEGORIES.DEVICE_CONTROL: return <Activity size={16} className="text-blue-500" />;
      case ACTION_CATEGORIES.USER_MGMT: return <User size={16} className="text-purple-500" />;
      case ACTION_CATEGORIES.TENANT_MGMT: return <Database size={16} className="text-emerald-500" />;
      case ACTION_CATEGORIES.CONFIG: return <Settings size={16} className="text-orange-500" />;
      case ACTION_CATEGORIES.AUTH: return <LogIn size={16} className="text-cyan-500" />;
      case ACTION_CATEGORIES.DATA: return <Download size={16} className="text-pink-500" />;
      default: return <AlertCircle size={16} className="text-slate-400" />;
    }
  };

  const getCategoryColor = (category) => {
    switch(category) {
      case ACTION_CATEGORIES.DEVICE_CONTROL: return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300';
      case ACTION_CATEGORIES.USER_MGMT: return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300';
      case ACTION_CATEGORIES.TENANT_MGMT: return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300';
      case ACTION_CATEGORIES.CONFIG: return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300';
      case ACTION_CATEGORIES.AUTH: return 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-300';
      case ACTION_CATEGORIES.DATA: return 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-900/20 dark:text-pink-300';
      default: return 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 dark:text-slate-400">Loading audit logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
              <Shield className="text-purple-600 dark:text-purple-400" size={28} />
            </div>
            Audit Logs
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            {isSuperAdmin 
              ? `Viewing ${filteredLogs.length} system-wide activity logs` 
              : `${filteredLogs.length} organization activity logs`}
          </p>
        </div>
        
        <button 
          onClick={exportLogs}
          disabled={filteredLogs.length === 0}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-purple-500/30 transition-all hover:shadow-xl hover:shadow-purple-500/40 hover:-translate-y-0.5"
        >
          <Download size={20} />
          Export CSV
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 space-y-4">
          
          {/* Barra de búsqueda */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Search by actor, action, target, location, or machine..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-slate-900 dark:text-white placeholder:text-slate-400 text-sm"
              />
            </div>
          </div>

          {/* Filtros principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            
            {/* Filtro de Tenant (solo super admin) */}
            {isSuperAdmin && (
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select
                  value={tenantFilter}
                  onChange={(e) => {
                    setTenantFilter(e.target.value);
                    setLocationFilter('all');
                  }}
                  className="w-full pl-10 pr-8 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-slate-900 dark:text-white appearance-none cursor-pointer text-sm"
                >
                  <option value="all">All Tenants</option>
                  {availableTenants.map(tenant => (
                    <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Filtro de Location */}
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                disabled={availableLocations.length === 0}
                className="w-full pl-10 pr-8 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-slate-900 dark:text-white appearance-none cursor-pointer text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="all">All Locations</option>
                {availableLocations.map(location => (
                  <option key={location.id} value={location.id}>{location.name}</option>
                ))}
              </select>
            </div>

            {/* Filtro de Categoría */}
            <div className="relative">
  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
  <select
    value={categoryFilter}
    onChange={(e) => {
      console.log('[FILTER] Category selected:', e.target.value);
      setCategoryFilter(e.target.value);
    }}
    className="w-full pl-10 pr-8 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-slate-900 dark:text-white appearance-none cursor-pointer text-sm"
  >
    <option value="all">All Categories</option>
    <option value="DEVICE_CONTROL">Device Control</option>
    <option value="USER_MGMT">User Management</option>
    <option value="TENANT_MGMT">Tenant Management</option>
    <option value="CONFIG">Configuration</option>
    <option value="AUTH">Authentication</option>
    <option value="DATA">Data</option>
  </select>
</div>

            {/* Filtro de Fecha */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-slate-900 dark:text-white appearance-none cursor-pointer text-sm"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="quarter">Last 3 Months</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
          </div>

          {/* Rango de fechas personalizado */}
          {dateFilter === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Start Date</label>
                <input
                  type="date"
                  value={customDateRange.start}
                  onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-slate-900 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">End Date</label>
                <input
                  type="date"
                  value={customDateRange.end}
                  onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-slate-900 dark:text-white text-sm"
                />
              </div>
            </div>
          )}

          {/* Indicador de filtros activos */}
          {activeFiltersCount > 0 && (
            <div className="flex items-center justify-between bg-purple-50 dark:bg-purple-900/20 px-4 py-2 rounded-lg border border-purple-200 dark:border-purple-800">
              <span className="text-sm text-purple-700 dark:text-purple-300 font-medium">
                {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} active
              </span>
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-bold"
              >
                <X size={14} />
                Clear all
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Timestamp
                </th>
                {isSuperAdmin && (
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    Tenant
                  </th>
                )}
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Actor
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Target
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  State Change
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredLogs.map((log) => (
                <tr 
                  key={log.id} 
                  className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Clock size={14} />
                      <span className="font-mono text-xs">
                        {log.timestamp.toLocaleString()}
                      </span>
                    </div>
                  </td>
                  
                  {isSuperAdmin && (
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                        {log.tenantId || 'N/A'}
                      </span>
                    </td>
                  )}

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={12} className="text-slate-400" />
                      <span className="text-xs text-slate-700 dark:text-slate-300">
                        {log.metadata?.locationName || 'N/A'}
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white text-xs">
                        {log.actor}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                        {log.actorRole?.replace('_', ' ')}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <code className="text-xs font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                      {log.action}
                    </code>
                  </td>

                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getCategoryColor(log.category)}`}>
                      {getCategoryIcon(log.category)}
                      {log.category?.replace('_', ' ')}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span className="text-slate-700 dark:text-slate-300 text-xs font-medium">
                      {log.target}
                    </span>
                    {log.metadata?.machineName && (
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Machine: {log.metadata.machineName}
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    {log.previousState && log.newState ? (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded font-mono text-slate-600 dark:text-slate-400">
                          {log.previousState}
                        </span>
                        <span className="text-slate-400">→</span>
                        <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded font-mono font-bold">
                          {log.newState}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
              
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={isSuperAdmin ? 8 : 7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                        <AlertCircle size={32} className="text-slate-400" />
                      </div>
                      <div>
                        <p className="text-slate-600 dark:text-slate-400 font-medium">No audit logs found</p>
                        <p className="text-sm text-slate-500 dark:text-slate-500">
                          {activeFiltersCount > 0
                            ? 'Try adjusting your filters' 
                            : 'Activity will appear here as actions are performed'}
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
            Showing {filteredLogs.length} of {logs.length} logs
          </span>
          <span className="text-slate-500 dark:text-slate-400 text-xs">
            Last 200 events • Retention: 90 days
          </span>
        </div>
      </div>
    </div>
  );
};

export default AuditLogViewer;