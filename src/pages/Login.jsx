import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowLeft, Loader2, Chrome } from 'lucide-react'; // Removed 'User' icon
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogle, resetPassword } = useAuth(); // Removed 'signup'
  
  const [view, setView] = useState('login'); 
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleBack = () => {
    navigate('/');
  };

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
      setError('Google sign-in failed. Check console.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (view === 'login') {
        await login(formData.email, formData.password);
        navigate('/app/dashboard');
        
      } else if (view === 'forgot') {
        await resetPassword(formData.email);
        alert('Password reset email sent!');
        setView('login');
      }
    } catch (err) {
      console.error(err.code);
      setError(err.code === 'auth/invalid-credential' ? 'Invalid email or password.' : err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="px-8 pt-8 pb-6">
          <button onClick={handleBack} className="flex items-center text-sm text-slate-500 hover:text-slate-800 transition-colors mb-6">
            <ArrowLeft size={16} className="mr-1" /> Back to Home
          </button>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900">
              {view === 'login' ? 'Welcome Back' : 'Reset Password'}
            </h2>
            <p className="text-slate-500 mt-2">
              {view === 'login' ? 'Authorized personnel only.' : 'Enter your email to recover access.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <input type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleChange} className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" required />
            </div>

            {view === 'login' && (
                <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" required />
                </div>
            )}

            {error && <div className="text-red-500 text-sm text-center bg-red-50 py-2 rounded">{error}</div>}

            <button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center">
              {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : (view === 'login' ? 'Sign In' : 'Send Reset Link')}
            </button>
          </form>

          {view === 'login' && (
            <div className="mt-6">
                <div className="relative flex justify-center text-sm mb-4">
                  <span className="px-2 bg-white text-slate-500">Or continue with</span>
                </div>
                <button onClick={handleGoogleLogin} type="button" className="w-full flex items-center justify-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium py-3 rounded-lg transition-colors">
                    <Chrome size={20} className="text-slate-900" /> Google
                </button>
            </div>
          )}
        </div>

        <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 text-center">
          {view === 'login' ? (
            <button onClick={() => setView('forgot')} className="text-blue-600 hover:underline text-sm font-medium">Forgot password?</button>
          ) : (
            <button onClick={() => setView('login')} className="text-blue-600 hover:underline text-sm font-medium">Back to Sign In</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;