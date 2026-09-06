import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { apiFetch } from '../api/client';
import { Shield, UserCheck, Lock, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('admin@corridorops.ir');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await apiFetch<any>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      const { access_token, role, user_id, full_name } = res.data;
      setAuth(
        { id: user_id, email, role, full_name },
        access_token
      );

      navigate('/dashboard');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080c14] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-stage-blue/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-stage-purple/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-[#0f172a] border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6 relative z-10">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-stage-blue via-stage-purple to-stage-amber mx-auto flex items-center justify-center font-mono font-bold text-white text-xl shadow-lg shadow-blue-500/20">
            CO
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">CorridorOps Admin Login</h1>
          <p className="text-xs text-slate-400 font-mono">Indian Railways Automatic Block Planning Portal</p>
        </div>

        {/* Admin-only notice */}
        <div className="flex items-center space-x-2 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
          <Shield className="w-4 h-4 text-purple-400 shrink-0" />
          <p className="text-xs font-mono text-purple-300">
            This portal is restricted to <span className="font-bold text-purple-200">Administrators</span> only.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">Admin Email:</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 px-3 pl-9 text-sm text-slate-200 font-mono outline-none focus:border-cyan-500"
              />
              <UserCheck className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">Password:</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 px-3 pl-9 text-sm text-slate-200 font-mono outline-none focus:border-cyan-500"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-stage-blue via-stage-purple to-stage-amber text-white font-semibold text-sm hover:opacity-95 transition-all shadow-lg shadow-blue-500/20"
          >
            {loading ? 'Authenticating...' : 'Enter Control Room'}
          </button>
        </form>
      </div>
    </div>
  );
};
