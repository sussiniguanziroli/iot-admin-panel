import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const { login, user } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (user) {
    return <Navigate to="/app/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError('Failed to sign in. Check your credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col relative overflow-hidden">
      
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>

      <nav className="relative z-10 p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
          SolFrut SCADA
        </div>
      </nav>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4">
        
        {!showLogin ? (
          <div className="text-center max-w-3xl space-y-8 animate-fade-in-up">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              Industrial IoT <br />
              <span className="text-blue-500">Real-time Analytics</span>
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Monitor, control, and analyze your industrial infrastructure with precision. 
              Integrated BigQuery analytics and real-time MQTT telemetry.
            </p>
            <button 
              onClick={() => setShowLogin(true)}
              className="group relative px-8 py-4 bg-blue-600 rounded-full font-bold text-lg hover:bg-blue-500 transition-all hover:scale-105 hover:shadow-lg hover:shadow-blue-500/50"
            >
              Access Platform
              <span className="absolute inset-0 rounded-full ring-2 ring-white/20 group-hover:ring-white/40 transition-all"></span>
            </button>
          </div>
        ) : (
          <div className="w-full max-w-md bg-white/5 backdrop-blur-lg border border-white/10 p-8 rounded-2xl shadow-2xl animate-fade-in">
            <div className="mb-8">
              <button 
                onClick={() => setShowLogin(false)}
                className="text-sm text-slate-400 hover:text-white mb-4 flex items-center gap-2"
              >
                ← Back
              </button>
              <h2 className="text-3xl font-bold">Welcome Back</h2>
              <p className="text-slate-400">Enter your credentials to access the dashboard</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 text-red-200 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500 transition-all"
                  placeholder="admin@solfrut.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500 transition-all"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-3 rounded-lg transition-all transform hover:scale-[1.02] shadow-lg"
              >
                Sign In
              </button>
            </form>
          </div>
        )}
      </div>

      <div className="relative z-10 py-6 text-center text-slate-500 text-sm">
        © 2025 SolFrut IoT Systems. Secure Connection.
      </div>
    </div>
  );
};

export default LandingPage;