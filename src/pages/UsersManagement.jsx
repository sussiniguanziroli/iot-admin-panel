import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  deleteDoc, 
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
  Building2 
} from 'lucide-react';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

const UsersManagement = () => {
  const { userProfile } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'operator', // operator, viewer, admin
    tenantId: userProfile?.tenantId || 'sol-frut-srl',
    uid: '' // We will manually input this or generate it
  });

  // Fetch Users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        let q;
        // BIG BROTHER LOGIC:
        if (userProfile?.role === 'super_admin') {
          // You see EVERYONE
          q = collection(db, "users");
        } else {
          // Regular Admins only see their own staff
          q = query(collection(db, "users"), where("tenantId", "==", userProfile?.tenantId));
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

    if (userProfile) fetchUsers();
  }, [userProfile]);

  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to remove this user's access profile?")) return;
    try {
      await deleteDoc(doc(db, "users", userId));
      setUsers(users.filter(u => u.id !== userId));
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user profile");
    }
  };

  const handleCreateProfile = async (e) => {
    e.preventDefault();
    // For this prototype, we use the email as ID if UID is empty, 
    // strictly to create the Database Profile. 
    // ideally you copy the UID from the Auth Console.
    const docId = formData.uid || formData.email; 

    try {
      await setDoc(doc(db, "users", docId), {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        tenantId: formData.tenantId,
        createdAt: new Date().toISOString()
      });

      setUsers([...users, { id: docId, ...formData }]);
      setIsModalOpen(false);
      setFormData({ name: '', email: '', role: 'operator', tenantId: userProfile?.tenantId, uid: '' });
      alert("✅ User Profile Created! (Remember to create the Auth credential in Firebase Console)");
    } catch (error) {
      console.error("Error creating profile:", error);
      alert("Error creating profile");
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading Users Directory...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="text-blue-600" />
            User Management
          </h1>
          <p className="text-slate-500">
            {userProfile?.role === 'super_admin' 
              ? "Global Access Control (God Mode)" 
              : "Manage your team access"}
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm"
        >
          <UserPlus size={18} />
          Add New User
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-900 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Tenant (Organization)</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-lg">
                        {u.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{u.name}</div>
                        <div className="text-slate-400 text-xs flex items-center gap-1">
                          <Mail size={12} /> {u.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                      ${u.role === 'super_admin' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                        u.role === 'admin' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                        'bg-slate-100 text-slate-800 border-slate-200'
                      }`}>
                      {u.role === 'super_admin' && <ShieldAlert size={12} className="mr-1" />}
                      {u.role === 'admin' && <Shield size={12} className="mr-1" />}
                      {u.role.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Building2 size={16} className="text-slate-400" />
                      {u.tenantId}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDelete(u.id)}
                      className="text-slate-400 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-lg"
                      title="Revoke Access"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              
              {users.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-400">
                    No users found in directory.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE USER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800">Grant Access (Create Profile)</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                &times;
              </button>
            </div>
            
            <form onSubmit={handleCreateProfile} className="p-6 space-y-4">
              <div className="p-3 bg-yellow-50 text-yellow-800 text-xs rounded border border-yellow-200">
                <strong>Note:</strong> This creates the database profile. You must also create the email/password in the Firebase Auth Console with the same Email/UID.
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                  <select 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value})}
                  >
                    <option value="operator">Operator (Read Only)</option>
                    <option value="admin">Admin (Full Control)</option>
                    {userProfile?.role === 'super_admin' && (
                        <option value="super_admin">Super Admin (God Mode)</option>
                    )}
                  </select>
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Tenant ID</label>
                   <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50"
                      value={formData.tenantId}
                      onChange={e => setFormData({...formData, tenantId: e.target.value})}
                      disabled={userProfile?.role !== 'super_admin'}
                   />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Auth UID (Optional)</label>
                <input 
                  type="text" 
                  placeholder="Paste UID from Firebase Console..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-xs"
                  value={formData.uid}
                  onChange={e => setFormData({...formData, uid: e.target.value})}
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                >
                  Create Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManagement;