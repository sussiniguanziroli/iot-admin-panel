import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    collection,
    getDocs,
    updateDoc,
    deleteDoc,
    doc
} from 'firebase/firestore';
import {
    Building2,
    Plus,
    CheckCircle,
    XCircle,
    Trash2
} from 'lucide-react';
import { db } from '../../../firebase/config';
import { useAuth } from '../../auth/context/AuthContext';

const TenantsManagement = () => {
    const { userProfile } = useAuth();
    const navigate = useNavigate();
    
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);

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

    const toggleStatus = async (tenantId, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
        try {
            await updateDoc(doc(db, "tenants", tenantId), { status: newStatus });
            setTenants(tenants.map(t => t.id === tenantId ? { ...t, status: newStatus } : t));
        } catch (error) {
            console.error(error);
        }
    };

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
                    onClick={() => navigate('/app/tenants/setup')}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-blue-500/30 transition-all"
                >
                    <Plus size={20} /> New Client
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
        </div>
    );
};

export default TenantsManagement;