import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { User, Mail, Building, Shield, Moon, Sun, Save, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '../../auth/context/AuthContext';
import { useTheme } from '../../../shared/context/ThemeContext';
import { db } from '../../../firebase/config';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

const ProfileSettings = () => {
  const { userProfile, user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (userProfile?.name) {
      setName(userProfile.name);
    }
  }, [userProfile]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Name cannot be empty', {
        position: 'top-right',
        autoClose: 3000
      });
      return;
    }

    if (name === userProfile.name) {
      toast.info('No changes detected', {
        position: 'top-right',
        autoClose: 2000
      });
      return;
    }

    const result = await Swal.fire({
      title: 'Save Changes?',
      html: `
        <div class="text-left space-y-2">
          <p class="text-slate-600">Your profile will be updated with the following information:</p>
          <div class="bg-slate-50 p-3 rounded-lg mt-3">
            <p class="text-sm"><strong>Name:</strong> ${name}</p>
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Save Changes',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    });

    if (!result.isConfirmed) return;

    setIsSaving(true);

    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        name: name,
        updatedAt: new Date().toISOString()
      });
      
      toast.success('Profile updated successfully!', {
        position: 'bottom-right',
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.', {
        position: 'top-right',
        autoClose: 3000
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleThemeToggle = () => {
    toggleTheme();
    toast.success(`Switched to ${!isDarkMode ? 'dark' : 'light'} mode`, {
      position: 'bottom-right',
      autoClose: 1500,
      icon: !isDarkMode ? '🌙' : '☀️'
    });
  };

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="animate-spin text-blue-600" size={32} />
        <span className="ml-3 text-slate-600 dark:text-slate-400">Loading Profile...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Account Settings</h1>
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <CheckCircle size={16} className="text-emerald-500" />
          <span>Account Active</span>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-900/50">
          <h2 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <User size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            Personal Information
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 ml-10">
            Manage your personal details and contact information
          </p>
        </div>
        
        <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
                Full Name
              </label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
                Email Address
              </label>
              <div className="flex items-center px-4 py-3 border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-slate-600 dark:text-slate-400">
                <Mail size={18} className="mr-2 opacity-50" />
                <span className="font-mono text-sm">{userProfile.email}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
                System Role
              </label>
              <div className="flex items-center px-4 py-3 border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-slate-600 dark:text-slate-400 capitalize">
                <Shield size={18} className="mr-2 opacity-50" />
                <span className="font-semibold">{userProfile.role.replace('_', ' ')}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
                Organization ID
              </label>
              <div className="flex items-center px-4 py-3 border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-slate-600 dark:text-slate-400">
                <Building size={18} className="mr-2 opacity-50" />
                <span className="font-mono text-sm">{userProfile.tenantId}</span>
              </div>
            </div>
          </div>

          <div className="pt-6 flex items-center justify-end border-t border-slate-100 dark:border-slate-700 mt-6">
             <button 
                type="submit" 
                disabled={isSaving || name === userProfile.name}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-200 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
             >
                {isSaving ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Changes
                  </>
                )}
             </button>
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-slate-900 dark:to-slate-900/50">
          <h2 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              {isDarkMode ? <Moon size={20} className="text-purple-600 dark:text-purple-400" /> : <Sun size={20} className="text-orange-500" />}
            </div>
            App Preferences
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 ml-10">
            Customize your application experience
          </p>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700">
             <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-indigo-900/50 text-indigo-300' : 'bg-orange-100 text-orange-600'}`}>
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
                onClick={handleThemeToggle}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all focus:outline-none focus:ring-4 focus:ring-blue-500/20 ${
                  isDarkMode ? 'bg-blue-600' : 'bg-slate-300'
                }`}
             >
                <span 
                  className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform flex items-center justify-center ${
                    isDarkMode ? 'translate-x-7' : 'translate-x-1'
                  }`}
                >
                  {isDarkMode ? <Moon size={12} className="text-blue-600" /> : <Sun size={12} className="text-orange-500" />}
                </span>
             </button>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
            <Shield size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-bold text-blue-900 dark:text-blue-200 text-sm">Security Note</h3>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              Email address and system role cannot be changed directly. Contact your system administrator if you need to update these fields.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;