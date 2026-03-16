import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/context/AuthContext';
import { auth, db } from '../../firebase/config';
import { doc, updateDoc } from 'firebase/firestore';
import { Mail, RefreshCw, LogOut, Loader2 } from 'lucide-react';
import { sendWelcomeEmail } from '../../services/EmailService';

const EmailVerificationGuard = ({ children }) => {
  const { user, userProfile, logout, sendEmailVerification } = useAuth();
  const navigate = useNavigate();
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [checkingVerification, setCheckingVerification] = useState(false);

  useEffect(() => {
    const handleVerifiedUser = async () => {
      if (!user || !userProfile) return;
      if (userProfile.authProvider === 'google') return;
      if (!user.emailVerified || userProfile.emailVerified) return;

      try {
        await updateDoc(doc(db, 'users', user.uid), {
          emailVerified: true,
          emailVerifiedAt: new Date().toISOString()
        });

        await sendWelcomeEmail(
          userProfile.email,
          userProfile.name,
          userProfile.tenantId,
          userProfile.role
        );
      } catch (error) {
        console.error('Error updating emailVerified or sending welcome email:', error);
      }
    };

    handleVerifiedUser();
  }, [user, userProfile]);

  if (!user || !userProfile) return children;
  if (userProfile.authProvider === 'google') return children;
  if (user.emailVerified) return children;

  const handleResendVerification = async () => {
    setIsResending(true);
    setResendMessage('');
    try {
      const result = await sendEmailVerification();
      if (result.success) {
        setResendMessage('success');
      } else {
        setResendMessage('error');
      }
    } catch {
      setResendMessage('error');
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckVerification = async () => {
    setCheckingVerification(true);
    try {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        window.location.reload();
      } else {
        setResendMessage('pending');
      }
    } catch (error) {
      console.error('Error checking verification:', error);
      setResendMessage('error');
    } finally {
      setCheckingVerification(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

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
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-md overflow-hidden">

          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 px-8 py-8 text-center">
            <div className="mx-auto w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mb-4">
              <Mail size={28} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">Verificá tu email</h2>
            <p className="text-blue-100 text-sm">Un paso más para acceder a la plataforma</p>
          </div>

          <div className="p-8">
            <p className="text-slate-600 dark:text-slate-400 text-center mb-2">
              Enviamos un email de verificación a
            </p>
            <p className="text-center font-bold text-slate-800 dark:text-white mb-6 break-all">
              {user.email}
            </p>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
              <p className="text-sm text-blue-800 dark:text-blue-200 text-center">
                Una vez verificado recibirás un email de bienvenida y podrás acceder al dashboard.
              </p>
            </div>

            {resendMessage && (
              <div className={`mb-5 p-3 rounded-xl text-sm text-center border ${
                resendMessage === 'success'
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
                  : resendMessage === 'pending'
                  ? 'bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-200 border-amber-200 dark:border-amber-800'
                  : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-200 border-red-200 dark:border-red-800'
              }`}>
                {resendMessage === 'success' && 'Email de verificación enviado. Revisá tu casilla.'}
                {resendMessage === 'pending' && 'Email aún no verificado. Revisá tu casilla.'}
                {resendMessage === 'error' && 'No se pudo completar la acción. Intentá de nuevo.'}
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleCheckVerification}
                disabled={checkingVerification}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
              >
                {checkingVerification ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Verificando...
                  </>
                ) : (
                  <>
                    <RefreshCw size={18} />
                    Ya verifiqué mi email
                  </>
                )}
              </button>

              <button
                onClick={handleResendVerification}
                disabled={isResending}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResending ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Mail size={18} />
                    Reenviar verificación
                  </>
                )}
              </button>

              <button
                onClick={handleLogout}
                className="w-full py-3 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <LogOut size={18} />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationGuard;