import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/context/AuthContext';
import { auth } from '../../firebase/config';
import { Mail, RefreshCw, LogOut, Loader2 } from 'lucide-react';
import { sendWelcomeEmail } from '../../services/EmailService';

const EmailVerificationGuard = ({ children }) => {
  const { user, userProfile, logout, sendEmailVerification } = useAuth();
  const navigate = useNavigate();
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [checkingVerification, setCheckingVerification] = useState(false);

  useEffect(() => {
    const checkAndSendWelcome = async () => {
      if (user && user.emailVerified && userProfile && !userProfile.emailVerified) {
        await sendWelcomeEmail(
          userProfile.email,
          userProfile.name,
          userProfile.tenantId,
          userProfile.role
        );
      }
    };

    checkAndSendWelcome();
  }, [user, userProfile]);

  if (!user || !userProfile) {
    return children;
  }

  if (userProfile.authProvider === 'google') {
    return children;
  }

  if (!user.emailVerified) {
    const handleResendVerification = async () => {
      setIsResending(true);
      setResendMessage('');
      try {
        const result = await sendEmailVerification();
        if (result.success) {
          setResendMessage('✅ Email de verificación enviado. Revisá tu casilla.');
        } else {
          setResendMessage('❌ Error al enviar el email. Intentá de nuevo.');
        }
      } catch (error) {
        setResendMessage('❌ Error al enviar el email. Intentá de nuevo.');
      } finally {
        setIsResending(false);
      }
    };

    const handleCheckVerification = async () => {
      setCheckingVerification(true);
      try {
        await auth.currentUser.reload();
        const refreshedUser = auth.currentUser;
        
        if (refreshedUser.emailVerified) {
          window.location.reload();
        } else {
          setResendMessage('⏳ Email aún no verificado. Revisá tu casilla.');
        }
      } catch (error) {
        console.error('Error checking verification:', error);
        setResendMessage('❌ Error al verificar. Intentá de nuevo.');
      } finally {
        setCheckingVerification(false);
      }
    };

    const handleLogout = async () => {
      await logout();
      navigate('/login');
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400 rounded-full flex items-center justify-center mb-4">
            <Mail size={32}/>
          </div>
          
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">
            Verificá tu email
          </h2>
          
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Enviamos un email de verificación a <strong>{user.email}</strong>. 
            Hacé click en el enlace del email para activar tu cuenta y acceder a la plataforma.
          </p>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Una vez verificado tu email, recibirás un email de bienvenida con los detalles de tu cuenta.
            </p>
          </div>

          {resendMessage && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${
              resendMessage.includes('✅') 
                ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200'
                : 'bg-orange-50 text-orange-800 dark:bg-orange-900/20 dark:text-orange-200'
            }`}>
              {resendMessage}
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleCheckVerification}
              disabled={checkingVerification}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                  Reenviar email de verificación
                </>
              )}
            </button>

            <button
              onClick={handleLogout}
              className="w-full py-3 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <LogOut size={18} />
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default EmailVerificationGuard;