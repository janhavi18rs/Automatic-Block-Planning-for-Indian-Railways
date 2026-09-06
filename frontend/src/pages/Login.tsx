import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { apiFetch } from '../api/client';
import { Shield, UserCheck, Lock, AlertCircle, UserPlus } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@corridorops.ir', pass: 'admin123' },
  { label: 'Control Office', email: 'control@corridorops.ir', pass: 'control123' },
  { label: 'Field SSE', email: 'field@corridorops.ir', pass: 'field123' },
];

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const fillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
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
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">CorridorOps Portal</h1>
          <p className="text-xs text-slate-400 font-mono">Indian Railways Automatic Block Planning System</p>
        </div>

        {/* Quick Demo Fill Buttons */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider">Quick Demo Login:</label>
          <div className="grid grid-cols-3 gap-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.label}
                type="button"
                onClick={() => fillDemo(acc.email, acc.pass)}
                className="py-1.5 px-2 bg-slate-900 border border-slate-800 hover:border-slate-600 rounded text-[11px] font-mono text-slate-300 hover:text-white transition-all text-center truncate"
              >
                {acc.label}
              </button>
            ))}
          </div>
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
            <label className="block text-xs font-mono text-slate-400 mb-1">Email Address:</label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="officer@railways.gov.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 px-3 pl-9 text-sm text-slate-200 font-mono outline-none focus:border-cyan-500 placeholder:text-slate-600"
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
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 px-3 pl-9 text-sm text-slate-200 font-mono outline-none focus:border-cyan-500 placeholder:text-slate-600"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-stage-blue via-stage-purple to-stage-amber text-white font-semibold text-sm hover:opacity-95 transition-all shadow-lg shadow-blue-500/20"
          >
            {loading ? 'Authenticating...' : 'Sign In to Control Room'}
          </button>
        </form>

        {/* Link to Signup */}
        <div className="pt-2 border-t border-slate-800 text-center space-y-2">
          <p className="text-xs text-slate-400 font-mono">
            Don't have an account?{' '}
            <Link to="/signup" className="text-cyan-400 hover:text-cyan-300 underline font-semibold inline-flex items-center space-x-1">
              <span>Create Account / Register</span>
              <UserPlus className="w-3.5 h-3.5 inline ml-1" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
