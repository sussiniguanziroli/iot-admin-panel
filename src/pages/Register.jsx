import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { validateInvitation, markInvitationUsed, logAction } from '../services/AdminService';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ShieldCheck, User, Lock, ArrowRight, Loader2, AlertTriangle, Building2 } from 'lucide-react';

const Register = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  
  const [inviteData, setInviteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Validate Token on Page Load
  useEffect(() => {
    const checkToken = async () => {
      if (!token) {
          setError("Missing invitation token.");
          setLoading(false);
          return;
      }
      
      const result = await validateInvitation(token);
      
      if (result.valid) {
        setInviteData(result.data);
        // Pre-fill email if the invite locked it
        if(result.data.email) {
            setFormData(prev => ({ ...prev, email: result.data.email }));
        }
      } else {
        setError(result.error);
      }
      setLoading(false);
    };
    checkToken();
  }, [token]);

  // 2. Handle Registration
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Check if email matches invite (security check)
      if (inviteData.email && formData.email.toLowerCase() !== inviteData.email.toLowerCase()) {
          throw new Error("This invitation is locked to a specific email address.");
      }

      // A. Create Auth User in Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // B. Create User Profile in Firestore (Linked to Tenant)
      await setDoc(doc(db, "users", user.uid), {
        name: formData.name,
        email: formData.email,
        role: inviteData.role,
        tenantId: inviteData.tenantId, // <--- CRITICAL: Links user to tenant
        createdAt: new Date().toISOString(),
        invitedBy: inviteData.createdBy
      });

      // C. Burn the Token
      await markInvitationUsed(token, user.uid);
      
      // D. Log it
      await logAction({ uid: user.uid, email: formData.email }, 'REGISTERED_VIA_INVITE', inviteData.tenantId);

      alert("Welcome aboard! Redirecting to dashboard...");
      navigate('/app/dashboard');

    } catch (err) {
      console.error(err);
      let msg = "Registration failed.";
      if (err.code === 'auth/email-already-in-use') msg = "This email is already registered.";
      if (err.code === 'auth/weak-password') msg = "Password must be at least 6 characters.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-blue-600" size={48}/>
            <p className="text-slate-500 font-medium">Validating Invitation...</p>
        </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md border border-red-100 w-full">
            <div className="mx-auto w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle size={32}/>
            </div>
            <h2 className="text-xl font-bold text-slate-800">Invalid Invitation</h2>
            <p className="text-slate-500 mt-2 mb-6">{error}</p>
            <button onClick={() => navigate('/login')} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors">
                Back to Login
            </button>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
        
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white text-center">
            <div className="mx-auto w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4 shadow-inner">
                <ShieldCheck size={28} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold">You've been invited!</h2>
            <div className="flex items-center justify-center gap-2 mt-2 opacity-90 text-sm">
                <Building2 size={16}/>
                <span>Joining: <strong>{inviteData.tenantId}</strong></span>
            </div>
            <span className="inline-block mt-3 px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-wider border border-white/20">
                Role: {inviteData.role}
            </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
            <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Full Name</label>
                <div className="relative">
                    <User className="absolute left-3 top-3.5 text-slate-400" size={18}/>
                    <input type="text" required className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-700" 
                        value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Jane Doe" />
                </div>
            </div>

            <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Email</label>
                <input type="email" required disabled={!!inviteData.email} 
                    className={`w-full px-4 py-3 border border-slate-200 rounded-xl outline-none ${inviteData.email ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500 text-slate-700'}`}
                    value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="name@company.com" />
                {inviteData.email && <p className="text-[10px] text-slate-400 mt-1">Invitation locked to this email.</p>}
            </div>

            <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Set Password</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-3.5 text-slate-400" size={18}/>
                    <input type="password" required className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-700" 
                        value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="••••••••" minLength={6} />
                </div>
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-200 mt-2">
                {isSubmitting ? <Loader2 className="animate-spin"/> : <>Complete Registration <ArrowRight size={18}/></>}
            </button>
        </form>
      </div>
    </div>
  );
};

export default Register;