import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowLeft, Loader2, Chrome, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogle, resetPassword } = useAuth();

  const [view, setView] = useState('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      await loginWithGoogle();
      navigate('/app/dashboard');
    } catch (err) {
      console.error(err);
      setError('Google sign-in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setResetSent(false);

    try {
      if (view === 'login') {
        await login(formData.email, formData.password);
        navigate('/app/dashboard');
      } else {
        await resetPassword(formData.email);
        setResetSent(true);
      }
    } catch (err) {
      console.error(err.code);
      setError(err.code === 'auth/invalid-credential' ? 'Email o contraseña incorrectos.' : err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchView = (newView) => {
    setView(newView);
    setError('');
    setResetSent(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">

      <header className="h-14 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 shadow-sm shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-sm">F</div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-widest text-slate-800 dark:text-white leading-none">FORTUNATO</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider leading-none mt-0.5">Industrial IoT SCADA</span>
          </div>
        </div>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          Volver
        </button>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">

          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {view === 'login' ? 'Bienvenido' : 'Recuperar contraseña'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
              {view === 'login' ? 'Solo personal autorizado.' : 'Te enviamos un link de recuperación.'}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-6">

              {view === 'login' && (
                <>
                  <button
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-5"
                  >
                    {isLoading ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <Chrome size={20} className="text-slate-700 dark:text-slate-300" />
                    )}
                    Continuar con Google
                  </button>

                  <div className="relative flex items-center justify-center mb-5">
                    <div className="border-t border-slate-200 dark:border-slate-700 w-full"></div>
                    <span className="absolute bg-white dark:bg-slate-800 px-4 text-xs text-slate-400 font-medium">O</span>
                  </div>
                </>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">

                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="email"
                      name="email"
                      placeholder="nombre@empresa.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-9 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white placeholder:text-slate-400"
                      required
                    />
                  </div>
                </div>

                {view === 'login' && (
                  <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
                      Contraseña
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="password"
                        name="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full pl-9 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white"
                        required
                      />
                    </div>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
                    <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                  </div>
                )}

                {resetSent && (
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-3">
                    <p className="text-sm text-emerald-800 dark:text-emerald-200">
                      Link de recuperación enviado. Revisá tu casilla.
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : view === 'login' ? (
                    <>
                      Iniciar sesión
                      <ArrowRight size={18} />
                    </>
                  ) : (
                    'Enviar link de recuperación'
                  )}
                </button>
              </form>

            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 text-center">
              {view === 'login' ? (
                <button
                  onClick={() => handleSwitchView('forgot')}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              ) : (
                <button
                  onClick={() => handleSwitchView('login')}
                  className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors mx-auto"
                >
                  <ArrowLeft size={14} />
                  Volver al login
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;