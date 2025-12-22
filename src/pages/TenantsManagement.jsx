import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // <--- Added missing import
import {
    collection,
    getDocs,
    setDoc,
    doc,
    updateDoc,
    deleteDoc
} from 'firebase/firestore';
import {
    Building2,
    Plus,
    Search,
    MoreVertical,
    CheckCircle,
    XCircle,
    Trash2,
    ExternalLink
} from 'lucide-react';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

const TenantsManagement = () => {
    const { userProfile } = useAuth();
    const navigate = useNavigate(); // <--- Added missing hook initialization
    
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State for new Tenant
    const [formData, setFormData] = useState({
        name: '',
        id: '', // e.g. 'sol-frut-srl'
        plan: 'basic',
        status: 'active'
    });

    // 1. Fetch All Tenants (Only allowed because you are Super Admin)
    useEffect(() => {
        const fetchTenants = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "tenants"));
                const list = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setTenants(list);
            } catch (error) {
                console.error("Error fetching tenants:", error);
            } finally {
                setLoading(false);
            }
        };

        if (userProfile?.role === 'super_admin') {
            fetchTenants();
        }
    }, [userProfile]);

    // 2. Create New Tenant
    const handleCreate = async (e) => {
        e.preventDefault();
        if (!formData.id || !formData.name) return;

        try {
            // Create the main Tenant Document
            await setDoc(doc(db, "tenants", formData.id), {
                name: formData.name,
                plan: formData.plan,
                status: formData.status,
                createdAt: new Date().toISOString()
            });

            // Optional: Create a default empty dashboard layout for them immediately
            await setDoc(doc(db, "tenants", formData.id, "dashboard_data", "main_layout"), {
                machines: [],
                widgets: [],
                updatedAt: new Date().toISOString()
            });

            setTenants([...tenants, { ...formData, createdAt: new Date().toISOString() }]);
            setIsModalOpen(false);
            setFormData({ name: '', id: '', plan: 'basic', status: 'active' });
            alert("✅ Tenant created successfully!");
        } catch (error) {
            console.error(error);
            alert("Error creating tenant");
        }
    };

    // 3. Toggle Status (Active/Suspended)
    const toggleStatus = async (tenantId, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
        try {
            await updateDoc(doc(db, "tenants", tenantId), { status: newStatus });
            setTenants(tenants.map(t => t.id === tenantId ? { ...t, status: newStatus } : t));
        } catch (error) {
            console.error(error);
        }
    };

    // 4. Delete Tenant (Dangerous!)
    const handleDelete = async (tenantId) => {
        if (!window.confirm(`⚠️ DANGER: This will delete the tenant "${tenantId}". Are you absolutely sure?`)) return;

        try {
            await deleteDoc(doc(db, "tenants", tenantId));
            setTenants(tenants.filter(t => t.id !== tenantId));
        } catch (error) {
            console.error(error);
            alert("Error deleting tenant. Check console.");
        }
    };

    // Auto-generate ID from name
    const handleNameChange = (val) => {
        setFormData(prev => ({
            ...prev,
            name: val,
            id: val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        }));
    };

    if (loading) return <div className="p-8 text-center">Loading Global Directory...</div>;
    if (userProfile?.role !== 'super_admin') return <div className="p-8 text-red-500">⛔ Access Denied: Big Brother Eyes Only.</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Building2 className="text-blue-600" />
                        Tenants Directory
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage all companies registered on Fortunato.ctech</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium shadow-sm transition-colors"
                >
                    <Plus size={18} /> New Client
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200">
                        <tr>
                            <th className="px-6 py-4">Company Name</th>
                            <th className="px-6 py-4">Tenant ID (Database Key)</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Plan</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-600 dark:text-slate-300">
                        {tenants.map((t) => (
                            <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                    {/* Wrap name in button/link */}
                                    <button
                                        onClick={() => navigate(`/app/tenants/${t.id}`)}
                                        className="hover:text-blue-600 hover:underline text-left font-bold"
                                    >
                                        {t.name}
                                    </button>
                                </td>
                                <td className="px-6 py-4 font-mono text-xs text-slate-400">
                                    {t.id}
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => toggleStatus(t.id, t.status)}
                                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${t.status === 'active'
                                                ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                                            }`}>
                                        {t.status === 'active' ? <CheckCircle size={12} className="mr-1" /> : <XCircle size={12} className="mr-1" />}
                                        {t.status.toUpperCase()}
                                    </button>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="capitalize px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded text-xs font-bold border border-blue-100 dark:border-blue-800">
                                        {t.plan}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                    <button onClick={() => handleDelete(t.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 rounded-lg transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {tenants.length === 0 && (
                    <div className="p-12 text-center text-slate-400">No tenants found. Create the first one!</div>
                )}
            </div>

            {/* NEW TENANT MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white">Register New Tenant</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500"><XCircle size={20} /></button>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Company Name</label>
                                <input
                                    type="text"
                                    className="w-full mt-1 px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="e.g. Sol Frut S.R.L."
                                    value={formData.name}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Tenant ID (Auto-generated)</label>
                                <input
                                    type="text"
                                    className="w-full mt-1 px-3 py-2 bg-slate-100 dark:bg-slate-900 border dark:border-slate-700 rounded-lg text-slate-500 font-mono text-sm"
                                    value={formData.id}
                                    readOnly
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Subscription Plan</label>
                                <select
                                    className="w-full mt-1 px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none"
                                    value={formData.plan}
                                    onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                                >
                                    <option value="basic">Basic</option>
                                    <option value="pro">Professional</option>
                                    <option value="enterprise">Enterprise</option>
                                </select>
                            </div>
                            <div className="pt-4 flex justify-end gap-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/30">Create Tenant</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TenantsManagement;