import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../api/client';
import {
  Shield, UserPlus, Lock, AlertCircle, User, Mail, Briefcase, ChevronRight
} from 'lucide-react';

const ROLES = [
  { value: 'admin', label: 'Administrator', color: 'border-purple-500 text-purple-300 bg-purple-500/10' },
  { value: 'control_office', label: 'Railway Planner / Control Office', color: 'border-stage-blue text-blue-300 bg-stage-blue/10' },
  { value: 'field_crew', label: 'Field Engineer / SSE', color: 'border-stage-teal text-teal-300 bg-stage-teal/10' },
];

export const Signup: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('control_office');
  const [department, setDepartment] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!fullName.trim()) {
      setError('Full name is required.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch<any>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ full_name: fullName, email, password, role, department: department || undefined }),
      });
      setSuccessMsg(`Account created for ${res.data.full_name}! Redirecting to login...`);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080c14] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-stage-blue/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-stage-purple/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-stage-teal/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-[#0f172a] border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6 relative z-10">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-stage-blue via-stage-purple to-stage-amber mx-auto flex items-center justify-center font-mono font-bold text-white text-xl shadow-lg shadow-blue-500/20">
            CO
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Create Account</h1>
          <p className="text-xs text-slate-400 font-mono">Indian Railways Automatic Block Planning Portal</p>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success */}
        {successMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-400 flex items-center space-x-2">
            <Shield className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Role Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider">Select Your Role</label>
          <div className="space-y-2">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={`w-full p-2.5 rounded-lg border text-xs font-mono font-semibold transition-all text-left flex items-center justify-between ${
                  role === r.value ? r.color : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{r.label}</span>
                {role === r.value && <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSignup} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">Full Name:</label>
            <div className="relative">
              <input
                id="signup-fullname"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Senior Section Engineer (Track)"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 px-3 pl-9 text-sm text-slate-200 font-mono outline-none focus:border-cyan-500 placeholder:text-slate-600"
              />
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">Official Email:</label>
            <div className="relative">
              <input
                id="signup-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer@railways.gov.in"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 px-3 pl-9 text-sm text-slate-200 font-mono outline-none focus:border-cyan-500 placeholder:text-slate-600"
              />
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            </div>
          </div>

          {/* Department (optional) */}
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">Department (optional):</label>
            <div className="relative">
              <select
                id="signup-department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 px-3 pl-9 text-sm text-slate-200 font-mono outline-none focus:border-cyan-500 appearance-none"
              >
                <option value="">— Select Department —</option>
                <option value="engineering">Engineering (Track & Civil)</option>
                <option value="signal_telecom">Signal & Telecommunication</option>
                <option value="traction">Traction Distribution (OHE/Electrical)</option>
                <option value="operations">Operations / Control Office</option>
              </select>
              <Briefcase className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">Password (min. 6 characters):</label>
            <div className="relative">
              <input
                id="signup-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 px-3 pl-9 text-sm text-slate-200 font-mono outline-none focus:border-cyan-500"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">Confirm Password:</label>
            <div className="relative">
              <input
                id="signup-confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full bg-slate-900 border rounded-lg py-2.5 px-3 pl-9 text-sm text-slate-200 font-mono outline-none focus:border-cyan-500 ${
                  confirmPassword && password !== confirmPassword ? 'border-red-500' : 'border-slate-700'
                }`}
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-[11px] text-red-400 font-mono mt-1">Passwords do not match.</p>
            )}
          </div>

          <button
            id="signup-submit"
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-stage-blue via-stage-purple to-stage-amber text-white font-semibold text-sm hover:opacity-95 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center space-x-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>{loading ? 'Creating Account...' : 'Create CorridorOps Account'}</span>
          </button>
        </form>

        {/* Link to Login */}
        <p className="text-center text-xs text-slate-400 font-mono">
          Already have an account?{' '}
          <Link to="/login" className="text-cyan-400 hover:text-cyan-300 underline font-semibold">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};
