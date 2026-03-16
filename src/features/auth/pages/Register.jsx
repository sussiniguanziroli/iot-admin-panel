import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { validateInvitation, markInvitationUsed, logAction } from '../../../services/AdminService';
import { sendWelcomeEmail } from '../../../services/EmailService';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db, auth, googleProvider } from '../../../firebase/config';
import { createUserWithEmailAndPassword, signInWithPopup, signOut, sendEmailVerification } from 'firebase/auth';
import { ShieldCheck, User, Lock, ArrowRight, Loader2, AlertTriangle, Building2, Chrome, Mail, CheckCircle } from 'lucide-react';
import Swal from 'sweetalert2';

const Register = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [inviteData, setInviteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);

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
        if (result.data.email) {
          setFormData(prev => ({ ...prev, email: result.data.email }));
        }
      } else {
        setError(result.error);
      }
      setLoading(false);
    };
    checkToken();
  }, [token]);

  const handleEmailPasswordSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    let createdUser = null;

    try {
      if (inviteData.email && formData.email.toLowerCase() !== inviteData.email.toLowerCase()) {
        throw new Error("This invitation is locked to a specific email address.");
      }

      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      createdUser = userCredential.user;

      await setDoc(doc(db, "users", createdUser.uid), {
        name: formData.name,
        email: formData.email,
        role: inviteData.role,
        tenantId: inviteData.tenantId,
        createdAt: new Date().toISOString(),
        invitedBy: inviteData.createdBy,
        authProvider: 'email',
        emailVerified: false
      });

      await markInvitationUsed(token, createdUser.uid);
      await logAction({ uid: createdUser.uid, email: formData.email }, 'REGISTERED_VIA_INVITE', inviteData.tenantId);
      await sendEmailVerification(createdUser);
      await signOut(auth);

      setShowVerificationMessage(true);

    } catch (err) {
      if (createdUser) {
        try { await createdUser.delete(); } catch (cleanupErr) { console.error('Auth cleanup failed:', cleanupErr); }
      }
      console.error('Registration Error:', err);
      let msg = "Registration failed. Please try again.";
      if (err.code === 'auth/email-already-in-use') msg = "This email is already registered. Try logging in instead.";
      if (err.code === 'auth/weak-password') msg = "Password must be at least 6 characters.";
      if (err.message && !err.code) msg = err.message;
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError('');

    let createdUser = null;

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      createdUser = user;

      if (inviteData.email && user.email.toLowerCase() !== inviteData.email.toLowerCase()) {
        await signOut(auth);
        throw new Error("This invitation is locked to a different email address.");
      }

      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        await signOut(auth);
        throw new Error("This Google account is already registered. Please log in instead.");
      }

      await setDoc(userDocRef, {
        name: user.displayName || formData.name || 'Google User',
        email: user.email,
        role: inviteData.role,
        tenantId: inviteData.tenantId,
        createdAt: new Date().toISOString(),
        invitedBy: inviteData.createdBy,
        authProvider: 'google',
        photoURL: user.photoURL || null,
        emailVerified: true
      });

      await markInvitationUsed(token, user.uid);
      await logAction({ uid: user.uid, email: user.email }, 'REGISTERED_VIA_INVITE_GOOGLE', inviteData.tenantId);
      await sendWelcomeEmail(user.email, user.displayName, inviteData.tenantId, inviteData.role);

      await Swal.fire({
        icon: 'success',
        title: '¡Bienvenido!',
        text: 'Tu cuenta fue creada exitosamente.',
        timer: 2000,
        showConfirmButton: false
      });

      navigate('/app/dashboard');

    } catch (err) {
      if (createdUser && err.message !== "This Google account is already registered. Please log in instead.") {
        try { await createdUser.delete(); } catch (cleanupErr) { console.error('Auth cleanup failed:', cleanupErr); }
      }
      console.error('Google Sign-In Error:', err);
      let msg = "Google sign-in failed.";
      if (err.code === 'auth/popup-closed-by-user') msg = "Sign-in cancelled. Please try again.";
      else if (err.code === 'auth/popup-blocked') msg = "Pop-up blocked by browser. Please allow pop-ups and try again.";
      else if (err.message) msg = err.message;
      setError(msg);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-500/20 text-purple-200 border-purple-400/30';
      case 'admin': return 'bg-blue-500/20 text-blue-200 border-blue-400/30';
      case 'operator': return 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30';
      default: return 'bg-slate-500/20 text-slate-200 border-slate-400/30';
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white text-lg mb-2">F</div>
        <Loader2 className="animate-spin text-blue-600" size={32} />
        <p className="text-slate-500 dark:text-slate-400 font-medium">Validando invitación...</p>
      </div>
    </div>
  );

  if (error && !inviteData) return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      <header className="h-14 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center px-6 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-sm">F</div>
          <span className="text-sm font-bold tracking-widest text-slate-800 dark:text-white">FORTUNATO</span>
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl text-center max-w-md border border-slate-200 dark:border-slate-700 w-full">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Invitación inválida</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-xl font-bold hover:opacity-90 transition-opacity"
          >
            Ir al Login
          </button>
        </div>
      </div>
    </div>
  );

  if (showVerificationMessage) return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      <header className="h-14 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center px-6 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-sm">F</div>
          <span className="text-sm font-bold tracking-widest text-slate-800 dark:text-white">FORTUNATO</span>
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl text-center max-w-md w-full border border-slate-200 dark:border-slate-700">
          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400 rounded-full flex items-center justify-center mb-4">
            <Mail size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">Verificá tu email</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Te enviamos un email de verificación a{' '}
            <strong className="text-slate-800 dark:text-white">{formData.email}</strong>.
            Hacé click en el enlace para activar tu cuenta.
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Una vez verificado recibirás un email de bienvenida y podrás acceder al dashboard.
            </p>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors"
          >
            Ir al Login
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">

      <header className="h-14 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center px-6 shadow-sm shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-sm">F</div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-widest text-slate-800 dark:text-white leading-none">FORTUNATO</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider leading-none mt-0.5">Industrial IoT SCADA</span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">

          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white text-center mb-4 shadow-xl shadow-blue-500/20">
            <div className="mx-auto w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4">
              <ShieldCheck size={26} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-1">¡Fuiste invitado!</h2>
            <div className="flex items-center justify-center gap-2 text-blue-100 text-sm mb-3">
              <Building2 size={14} />
              <span>Uniéndote a: <strong className="text-white">{inviteData.tenantId}</strong></span>
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getRoleBadgeColor(inviteData.role)}`}>
              {inviteData.role.replace('_', ' ')}
            </span>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-6">

              <button
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading || isSubmitting}
                className="w-full flex items-center justify-center gap-3 border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-3 rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed mb-5"
              >
                {isGoogleLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <Chrome size={20} className="text-slate-700 dark:text-slate-300" />
                )}
                {isGoogleLoading ? 'Iniciando...' : 'Continuar con Google'}
              </button>

              <div className="relative flex items-center justify-center mb-5">
                <div className="border-t border-slate-200 dark:border-slate-700 w-full"></div>
                <span className="absolute bg-white dark:bg-slate-800 px-4 text-xs text-slate-400 font-medium">O</span>
              </div>

              <form onSubmit={handleEmailPasswordSubmit} className="space-y-4">

                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
                    Nombre completo
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      required
                      className="w-full pl-9 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 dark:text-white bg-slate-50 dark:bg-slate-900 placeholder:text-slate-400"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Jane Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="email"
                      required
                      disabled={!!inviteData.email}
                      className={`w-full pl-9 pr-4 py-3 border rounded-xl outline-none transition-colors ${
                        inviteData.email
                          ? 'bg-slate-100 dark:bg-slate-900/70 text-slate-400 dark:text-slate-500 cursor-not-allowed border-slate-200 dark:border-slate-700'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-white'
                      }`}
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      placeholder="nombre@empresa.com"
                    />
                  </div>
                  {inviteData.email && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <CheckCircle size={12} className="text-emerald-500" />
                      <p className="text-xs text-emerald-600 dark:text-emerald-400">Invitación vinculada a este email</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="password"
                      required
                      className="w-full pl-9 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 dark:text-white bg-slate-50 dark:bg-slate-900"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      minLength={6}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Mínimo 6 caracteres</p>
                </div>

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={16} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                      <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || isGoogleLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Creando cuenta...
                    </>
                  ) : (
                    <>
                      Completar registro
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>

              <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-5">
                ¿Ya tenés cuenta?{' '}
                <button
                  onClick={() => navigate('/login')}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                >
                  Iniciá sesión
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;