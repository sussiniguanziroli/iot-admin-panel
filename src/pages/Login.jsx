import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowLeft, Loader2, Chrome } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login, signup, loginWithGoogle, resetPassword } = useAuth();
  
  const [view, setView] = useState('login'); 
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });

  const handleBack = () => {
    navigate('/');
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  // --- Real Google Login ---
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

  // --- Real Form Submission ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (view === 'login') {
        await login(formData.email, formData.password);
        navigate('/app/dashboard');
        
      } else if (view === 'register') {
        await signup(formData.email, formData.password, formData.name);
        navigate('/app/dashboard');
        
      } else if (view === 'forgot') {
        await resetPassword(formData.email);
        alert('Password reset email sent! Check your inbox.');
        setView('login');
      }
    } catch (err) {
      console.error("Auth Error:", err.code);
      // Map Firebase error codes to user-friendly messages
      switch (err.code) {
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          setError('Invalid email or password.');
          break;
        case 'auth/email-already-in-use':
          setError('An account with this email already exists.');
          break;
        case 'auth/weak-password':
          setError('Password should be at least 6 characters.');
          break;
        default:
          setError('Failed to process request. ' + err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="px-8 pt-8 pb-6">
          <button 
            onClick={handleBack}
            className="flex items-center text-sm text-slate-500 hover:text-slate-800 transition-colors mb-6"
          >
            <ArrowLeft size={16} className="mr-1" />
            Back to Home
          </button>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900">
              {view === 'login' && 'Welcome Back'}
              {view === 'register' && 'Create Account'}
              {view === 'forgot' && 'Reset Password'}
            </h2>
            <p className="text-slate-500 mt-2">
              {view === 'login' && 'Enter your credentials to access the platform'}
              {view === 'register' && 'Get started with your free account'}
              {view === 'forgot' && 'Enter your email to receive recovery instructions'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {view === 'register' && (
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  required
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                required
              />
            </div>

            {view !== 'forgot' && (
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  required
                />
              </div>
            )}

            {error && (
              <div className="text-red-500 text-sm text-center bg-red-50 py-2 rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all transform active:scale-[0.98] flex items-center justify-center"
            >
              {isLoading ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : (
                <>
                  {view === 'login' && 'Sign In'}
                  {view === 'register' && 'Sign Up'}
                  {view === 'forgot' && 'Send Reset Link'}
                </>
              )}
            </button>
          </form>

          {view !== 'forgot' && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-slate-500">Or continue with</span>
                </div>
              </div>

              <button
                onClick={handleGoogleLogin}
                type="button"
                className="w-full flex items-center justify-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium py-3 rounded-lg transition-colors"
              >
                <Chrome size={20} className="text-slate-900" />
                Google
              </button>
            </>
          )}
        </div>

        <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 text-center">
          {view === 'login' && (
            <div className="text-sm text-slate-600">
              <button onClick={() => setView('forgot')} className="text-blue-600 hover:underline mb-2 block w-full">
                Forgot your password?
              </button>
              Don't have an account?{' '}
              <button onClick={() => setView('register')} className="text-blue-600 hover:underline font-medium">
                Sign up
              </button>
            </div>
          )}

          {view === 'register' && (
            <div className="text-sm text-slate-600">
              Already have an account?{' '}
              <button onClick={() => setView('login')} className="text-blue-600 hover:underline font-medium">
                Sign in
              </button>
            </div>
          )}

          {view === 'forgot' && (
            <div className="text-sm text-slate-600">
              Remember your password?{' '}
              <button onClick={() => setView('login')} className="text-blue-600 hover:underline font-medium">
                Back to Sign in
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;