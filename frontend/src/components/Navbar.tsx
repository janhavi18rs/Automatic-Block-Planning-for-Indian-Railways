import React from 'react';
import { useOpsStore } from '../stores/opsStore';
import { useAuthStore } from '../stores/authStore';
import { Radio, Wifi, WifiOff, Sun, Moon, LogOut, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { division, horizon, wsConnected, theme, setDivision, setHorizon, toggleTheme } = useOpsStore();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-[#0f172a] border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-40">
      {/* System Logo & Title */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-stage-blue via-stage-purple to-stage-amber flex items-center justify-center font-mono font-bold text-white shadow-lg shadow-blue-500/20">
            CO
          </div>
          <div>
            <h1 className="font-bold text-slate-100 tracking-tight text-lg flex items-center space-x-2">
              <span>CorridorOps</span>
              <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono font-normal">
                SIH #26027
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-mono hidden sm:block">Indian Railways Automatic Block Planner</p>
          </div>
        </div>
      </div>

      {/* Controls: Division Selector, Horizon Toggle, WS Indicator */}
      <div className="flex items-center space-x-4">
        {/* Division Selector */}
        <div className="flex items-center space-x-2 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
          <Radio className="w-4 h-4 text-cyan-400" />
          <span className="text-xs text-slate-400 font-mono">Division:</span>
          <select
            value={division}
            onChange={(e) => setDivision(e.target.value)}
            className="bg-transparent text-sm font-semibold text-slate-200 outline-none cursor-pointer"
          >
            <option value="PRYJ" className="bg-slate-900 text-slate-200">Prayagraj (NCR)</option>
            <option value="BB" className="bg-slate-900 text-slate-200">Mumbai Central (CR)</option>
            <option value="HWH" className="bg-slate-900 text-slate-200">Howrah (ER)</option>
            <option value="SBC" className="bg-slate-900 text-slate-200">Bengaluru (SWR)</option>
          </select>
        </div>

        {/* Horizon Toggle */}
        <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setHorizon('monthly')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              horizon === 'monthly'
                ? 'bg-stage-amber text-white shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            30-Day Strategic
          </button>
          <button
            onClick={() => setHorizon('weekly')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              horizon === 'weekly'
                ? 'bg-stage-purple text-white shadow-md shadow-purple-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            7-Day Tactical
          </button>
        </div>

        {/* WebSocket Indicator */}
        <div className="flex items-center space-x-1.5 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
          {wsConnected ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Wifi className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-emerald-400 font-mono font-medium hidden md:inline">Live WS</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-amber-400 font-mono font-medium hidden md:inline">Polling</span>
            </>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
        </button>

        {/* User Info & Logout */}
        {user && (
          <div className="flex items-center space-x-3 pl-2 border-l border-slate-800">
            <div className="flex flex-col text-right hidden lg:block">
              <span className="text-xs font-semibold text-slate-200">{user.full_name}</span>
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">{user.role}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
