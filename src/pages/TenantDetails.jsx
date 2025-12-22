import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useDashboard } from '../context/DashboardContext'; // <--- Import for "Eye" feature
import { 
  Building2, ArrowLeft, Save, UserPlus, Trash2, Shield, 
  Crown, Mail, CheckCircle, XCircle, Eye, Calendar, Server, Activity
} from 'lucide-react';

const TenantDetails = () => {
  const { tenantId } = useParams();
  const navigate = useNavigate();
  const { switchTenant } = useDashboard(); // <--- Hook to switch view
  
  const [tenant, setTenant] = useState(null);
  const [tenantUsers, setTenantUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Overview Form State
  const [overviewForm, setOverviewForm] = useState({
    name: '',
    plan: 'basic',
    status: 'active',
    maxDevices: 10, // New Config Example
    contactEmail: ''
  });

  // User Add Form
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', name: '', role: 'operator' });

  // 1. Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const tenantSnap = await getDoc(doc(db, "tenants", tenantId));
        if (tenantSnap.exists()) {
          const data = tenantSnap.data();
          setTenant({ id: tenantSnap.id, ...data });
          
          // Pre-fill Overview Form
          setOverviewForm({
            name: data.name || '',
            plan: data.plan || 'basic',
            status: data.status || 'active',
            maxDevices: data.maxDevices || 10,
            contactEmail: data.contactEmail || ''
          });
        } else {
          navigate('/app/tenants');
          return;
        }

        const q = query(collection(db, "users"), where("tenantId", "==", tenantId));
        const userSnaps = await getDocs(q);
        setTenantUsers(userSnaps.docs.map(d => ({ id: d.id, ...d.data() })));

      } catch (e) {
        console.error("Error fetching details:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tenantId, navigate]);

  // 2. Action: Update Overview Settings
  const handleUpdateOverview = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, "tenants", tenantId), {
        ...overviewForm,
        updatedAt: new Date().toISOString()
      });
      setTenant(prev => ({ ...prev, ...overviewForm }));
      alert("✅ Tenant Configuration Updated");
    } catch (e) {
      console.error(e);
      alert("Failed to update settings");
    }
  };

  // 3. Action: "Eye" Impersonation (View Dashboard AS Tenant)
  const handleImpersonate = () => {
    switchTenant(tenantId); // Tell DashboardContext to switch the stream
    navigate('/app/dashboard'); // Jump to the dashboard
  };

  // ... (User Actions: handleSetOwner, handleAddUser, handleRemoveUser remain same)
  const handleSetOwner = async (userId) => { /* ... same as before ... */ };
  const handleAddUser = async (e) => {
    e.preventDefault();
    const uid = newUser.email; 
    try {
      await setDoc(doc(db, "users", uid), {
        ...newUser,
        tenantId: tenantId,
        createdAt: new Date().toISOString()
      });
      setTenantUsers([...tenantUsers, { id: uid, ...newUser, tenantId }]);
      setIsUserModalOpen(false);
      setNewUser({ email: '', name: '', role: 'operator' });
    } catch (e) { console.error(e); }
  };
  const handleRemoveUser = async (userId) => { /* ... same as before ... */ };

  if (loading) return <div className="p-10 text-center">Loading Configuration...</div>;

  return (
    <div className="max-w-5xl mx-auto pb-20">
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
            <button onClick={() => navigate('/app/tenants')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                <ArrowLeft size={20} className="text-slate-500" />
            </button>
            <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Building2 className="text-blue-600" />
                    {tenant.name}
                </h1>
                <p className="text-slate-500 text-sm font-mono">ID: {tenant.id}</p>
            </div>
        </div>

        {/* --- NEW: IMPERSONATION BUTTON --- */}
        <button 
            onClick={handleImpersonate}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all"
            title="View Dashboard as this Tenant"
        >
            <Eye size={18} />
            <span className="hidden sm:inline">View Dashboard</span>
        </button>
      </div>

      {/* TABS */}
      <div className="flex gap-6 border-b border-slate-200 dark:border-slate-700 mb-6">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'overview' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
        >
          Overview & Config
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'users' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
        >
          Access & Staff ({tenantUsers.length})
        </button>
      </div>

      {/* TAB: OVERVIEW (CONFIGURATIONS) */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in">
            
            {/* LEFT COL: Main Settings Form */}
            <div className="md:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Activity size={18} className="text-blue-500"/> General Settings
                    </h3>
                </div>
                <form onSubmit={handleUpdateOverview} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Company Name</label>
                            <input 
                                type="text" 
                                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                value={overviewForm.name}
                                onChange={e => setOverviewForm({...overviewForm, name: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Contact Email (Billing)</label>
                            <input 
                                type="email" 
                                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                value={overviewForm.contactEmail}
                                onChange={e => setOverviewForm({...overviewForm, contactEmail: e.target.value})}
                                placeholder="billing@company.com"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Account Status</label>
                            <select 
                                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                value={overviewForm.status}
                                onChange={e => setOverviewForm({...overviewForm, status: e.target.value})}
                            >
                                <option value="active">Active</option>
                                <option value="suspended">Suspended (Payment Due)</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Subscription Plan</label>
                            <select 
                                className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                value={overviewForm.plan}
                                onChange={e => setOverviewForm({...overviewForm, plan: e.target.value})}
                            >
                                <option value="basic">Basic (Limited)</option>
                                <option value="pro">Professional</option>
                                <option value="enterprise">Enterprise (Unlimited)</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Max Devices Allowed</label>
                        <input 
                            type="number" 
                            className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                            value={overviewForm.maxDevices}
                            onChange={e => setOverviewForm({...overviewForm, maxDevices: Number(e.target.value)})}
                        />
                        <p className="text-xs text-slate-400 mt-1">Soft limit for dashboard validation.</p>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2">
                            <Save size={18} /> Save Changes
                        </button>
                    </div>
                </form>
            </div>

            {/* RIGHT COL: Stats / Metadata */}
            <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                    <h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <Server size={18} className="text-purple-500"/> System Stats
                    </h4>
                    <ul className="space-y-3 text-sm">
                        <li className="flex justify-between">
                            <span className="text-slate-500">Created At</span>
                            <span className="font-mono text-slate-700 dark:text-slate-300">{new Date(tenant.createdAt).toLocaleDateString()}</span>
                        </li>
                        <li className="flex justify-between">
                            <span className="text-slate-500">Registered Users</span>
                            <span className="font-bold text-slate-700 dark:text-slate-300">{tenantUsers.length}</span>
                        </li>
                        <li className="flex justify-between">
                            <span className="text-slate-500">Dashboard Layout</span>
                            <span className="text-green-600 font-medium">Customized</span>
                        </li>
                    </ul>
                </div>
                
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-6 border border-amber-100 dark:border-amber-800">
                    <h4 className="font-bold text-amber-800 dark:text-amber-200 mb-2">Technical Note</h4>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                        This tenant ID <strong>{tenant.id}</strong> is used as the root key for all MQTT Topics. 
                        Changing this ID requires a full database migration.
                    </p>
                </div>
            </div>
        </div>
      )}

      {/* TAB: USERS (Existing logic...) */}
      {activeTab === 'users' && (
        <div className="space-y-6 animate-in fade-in">
           {/* ... Previous Users Table Logic (Included in your prior file, just keep it here) ... */}
           <div className="flex justify-between items-center bg-blue-50 dark:bg-slate-800/50 p-4 rounded-xl border border-blue-100 dark:border-slate-700">
                <div>
                    <h3 className="font-bold text-blue-900 dark:text-blue-100">Staff Management</h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300">Create accounts for {tenant.name} employees.</p>
                </div>
                <button 
                    onClick={() => setIsUserModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold shadow-sm"
                >
                    <UserPlus size={18} /> Add User
                </button>
            </div>
            
            {/* Same Table as before */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                            <th className="px-6 py-4 text-slate-700 dark:text-slate-300">User</th>
                            <th className="px-6 py-4 text-slate-700 dark:text-slate-300">Role</th>
                            <th className="px-6 py-4 text-slate-700 dark:text-slate-300">Ownership</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {tenantUsers.map(u => (
                            <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-slate-800 dark:text-white">{u.name}</div>
                                    <div className="text-xs text-slate-400 flex items-center gap-1"><Mail size={10}/> {u.email}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="capitalize bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs font-medium text-slate-600 dark:text-slate-300">
                                        {u.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {tenant.ownerUid === u.id ? (
                                        <span className="flex items-center gap-1 text-amber-600 font-bold text-xs bg-amber-50 px-2 py-1 rounded-full w-fit">
                                            <Crown size={12} /> Owner
                                        </span>
                                    ) : (
                                        <button className="text-xs text-slate-400 hover:text-blue-600">Set as Owner</button>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => handleRemoveUser(u.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={18} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {/* USER MODAL (Existing logic...) */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-xl p-6 shadow-2xl">
                <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-white">Add User</h3>
                <form onSubmit={handleAddUser} className="space-y-4">
                    {/* ... form inputs same as before ... */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                        <input type="email" required className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                             value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Name</label>
                        <input type="text" required className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                             value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
                    </div>
                    <div>
                         <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Role</label>
                         <select className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                             value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                            <option value="operator">Operator</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setIsUserModalOpen(false)} className="px-4 py-2 text-slate-500">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold">Add User</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default TenantDetails;