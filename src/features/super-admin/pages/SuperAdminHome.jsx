import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { 
  Building2, Users, Activity, TrendingUp, ArrowRight, 
  AlertCircle, Server, Shield, MapPin, Plus, Eye,
  CheckCircle, XCircle, BarChart3
} from 'lucide-react';

const SuperAdminHome = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalTenants: 0,
    activeTenants: 0,
    suspendedTenants: 0,
    totalUsers: 0,
    totalLocations: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [recentTenants, setRecentTenants] = useState([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const tenantsSnap = await getDocs(collection(db, 'tenants'));
      const usersSnap = await getDocs(collection(db, 'users'));
      
      let locationCount = 0;
      const tenantsList = [];
      
      for (const tenantDoc of tenantsSnap.docs) {
        const tenantData = tenantDoc.data();
        tenantsList.push({
          id: tenantDoc.id,
          name: tenantData.name,
          status: tenantData.status,
          createdAt: tenantData.createdAt
        });
        
        const locSnap = await getDocs(collection(db, 'tenants', tenantDoc.id, 'locations'));
        locationCount += locSnap.size;
      }

      const activeTenants = tenantsSnap.docs.filter(d => d.data().status === 'active').length;
      const suspendedTenants = tenantsSnap.docs.filter(d => d.data().status === 'suspended').length;

      tenantsList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setRecentTenants(tenantsList.slice(0, 5));

      setStats({
        totalTenants: tenantsSnap.size,
        activeTenants,
        suspendedTenants,
        totalUsers: usersSnap.size,
        totalLocations: locationCount
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, label, value, color, sublabel, onClick }) => (
    <button
      onClick={onClick}
      className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all text-left group w-full"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon size={24} />
        </div>
        <ArrowRight size={20} className="text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
      </div>
      <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
        {loading ? (
          <div className="h-9 w-20 bg-slate-200 dark:bg-slate-700 animate-pulse rounded"></div>
        ) : (
          value
        )}
      </div>
      <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">
        {label}
      </div>
      {sublabel && (
        <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          {sublabel}
        </div>
      )}
    </button>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full translate-y-24 -translate-x-24"></div>
        
        <div className="relative">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl">
              <Shield size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Platform Control Center</h1>
              <p className="text-slate-300 mt-1">Fortunato.ctech Administration</p>
            </div>
          </div>
          <p className="text-slate-400 max-w-2xl">
            Monitor and manage all organizations, users, and system health from this central hub.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Building2}
          label="Total Organizations"
          value={stats.totalTenants}
          sublabel={`${stats.activeTenants} active`}
          color="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
          onClick={() => navigate('/app/tenants')}
        />
        <StatCard
          icon={CheckCircle}
          label="Active Tenants"
          value={stats.activeTenants}
          sublabel={`${stats.suspendedTenants} suspended`}
          color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
          onClick={() => navigate('/app/tenants')}
        />
        <StatCard
          icon={Users}
          label="Total Users"
          value={stats.totalUsers}
          sublabel="Across all organizations"
          color="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
          onClick={() => navigate('/app/users')}
        />
        <StatCard
          icon={MapPin}
          label="Total Locations"
          value={stats.totalLocations}
          sublabel="Industrial sites"
          color="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
          onClick={() => navigate('/app/tenants')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp size={20} className="text-blue-600 dark:text-blue-400" />
              Quick Actions
            </h3>
          </div>
          <div className="p-6 space-y-3">
            <button
              onClick={() => navigate('/app/tenants')}
              className="w-full text-left px-4 py-3 bg-slate-50 dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                  <Plus size={16} />
                </div>
                <span className="font-medium text-slate-700 dark:text-slate-300">Create New Organization</span>
              </div>
              <ArrowRight size={16} className="text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
            </button>
            
            <button
              onClick={() => navigate('/app/users')}
              className="w-full text-left px-4 py-3 bg-slate-50 dark:bg-slate-900 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                  <Users size={16} />
                </div>
                <span className="font-medium text-slate-700 dark:text-slate-300">View All Users</span>
              </div>
              <ArrowRight size={16} className="text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400" />
            </button>

            <button
              onClick={() => navigate('/app/tenants')}
              className="w-full text-left px-4 py-3 bg-slate-50 dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                  <BarChart3 size={16} />
                </div>
                <span className="font-medium text-slate-700 dark:text-slate-300">View Platform Analytics</span>
              </div>
              <ArrowRight size={16} className="text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Server size={20} className="text-emerald-600 dark:text-emerald-400" />
              System Health
            </h3>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">OPERATIONAL</span>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700">
              <span className="text-sm text-slate-600 dark:text-slate-400">Platform Status</span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle size={14} />
                Online
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700">
              <span className="text-sm text-slate-600 dark:text-slate-400">Database</span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Connected</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700">
              <span className="text-sm text-slate-600 dark:text-slate-400">Active Organizations</span>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{stats.activeTenants}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">Total Users Online</span>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{stats.totalUsers}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity size={20} className="text-slate-600 dark:text-slate-400" />
            Recent Organizations
          </h3>
          <button
            onClick={() => navigate('/app/tenants')}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-semibold"
          >
            View All
          </button>
        </div>
        
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Loading organizations...</p>
            </div>
          </div>
        ) : recentTenants.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 size={32} className="text-slate-400" />
            </div>
            <p className="text-slate-600 dark:text-slate-400 font-medium">No organizations yet</p>
            <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">Create your first organization to get started</p>
            <button
              onClick={() => navigate('/app/tenants')}
              className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors"
            >
              Create Organization
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    Organization
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {recentTenants.map((tenant) => (
                  <tr 
                    key={tenant.id} 
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                          {tenant.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {tenant.name}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                            {tenant.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                        tenant.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
                          : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'
                      }`}>
                        {tenant.status === 'active' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                        {tenant.status?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {tenant.createdAt ? new Date(tenant.createdAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => navigate(`/app/tenants/${tenant.id}`)}
                        className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <Eye size={14} />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default SuperAdminHome;