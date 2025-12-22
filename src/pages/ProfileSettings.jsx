import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { User, Mail, Building, Shield, Moon, Sun, Save, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { db } from '../firebase/config';

const ProfileSettings = () => {
  const { userProfile, user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Load initial data from the fetched profile
  useEffect(() => {
    if (userProfile?.name) {
      setName(userProfile.name);
    }
  }, [userProfile]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');

    try {
      // Update only the 'name' field in Firestore
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        name: name
      });
      setMessage('✅ Profile updated successfully');
    } catch (error) {
      console.error(error);
      setMessage('❌ Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (!userProfile) return <div className="p-10 text-center">Loading Profile...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Account Settings</h1>

      {/* 1. PERSONAL INFO CARD */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
          <h2 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <User size={20} className="text-blue-500" />
            Personal Information
          </h2>
        </div>
        
        <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Full Name (Editable) */}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Full Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
              />
            </div>

            {/* Email (Read Only) */}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Email Address</label>
              <div className="flex items-center px-3 py-2 border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-slate-500 dark:text-slate-400">
                <Mail size={16} className="mr-2 opacity-50" />
                {userProfile.email}
              </div>
            </div>

            {/* Role (Read Only) */}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">System Role</label>
              <div className="flex items-center px-3 py-2 border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-slate-500 dark:text-slate-400 capitalize">
                <Shield size={16} className="mr-2 opacity-50" />
                {userProfile.role.replace('_', ' ')}
              </div>
            </div>

            {/* Tenant (Read Only) */}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Organization ID</label>
              <div className="flex items-center px-3 py-2 border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-slate-500 dark:text-slate-400 font-mono text-sm">
                <Building size={16} className="mr-2 opacity-50" />
                {userProfile.tenantId}
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-700 mt-4">
             <span className="text-sm font-medium text-green-600 h-6">{message}</span>
             <button 
                type="submit" 
                disabled={isSaving}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold transition-all shadow-lg shadow-blue-200 dark:shadow-none disabled:opacity-70"
             >
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                Save Changes
             </button>
          </div>
        </form>
      </div>

      {/* 2. PREFERENCES CARD */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <h2 className="font-bold text-slate-700 dark:text-slate-200">App Preferences</h2>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-indigo-900 text-indigo-300' : 'bg-orange-100 text-orange-500'}`}>
                   {isDarkMode ? <Moon size={24} /> : <Sun size={24} />}
                </div>
                <div>
                   <h3 className="font-bold text-slate-800 dark:text-white">Interface Theme</h3>
                   <p className="text-sm text-slate-500 dark:text-slate-400">
                     {isDarkMode ? 'Dark mode is active' : 'Light mode is active'}
                   </p>
                </div>
             </div>
             
             <button 
                onClick={toggleTheme}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isDarkMode ? 'bg-blue-600' : 'bg-slate-200'}`}
             >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}`} />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;