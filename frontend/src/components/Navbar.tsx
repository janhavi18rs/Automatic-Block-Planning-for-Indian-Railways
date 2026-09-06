import React from 'react';
import { useOpsStore } from '../stores/opsStore';
import { useAuthStore } from '../stores/authStore';
import { Radio, Wifi, WifiOff, Sun, Moon, LogOut, Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { 
    division, horizon, wsConnected, theme, mobileMenuOpen,
    setDivision, setHorizon, toggleTheme, toggleMobileMenu 
  } = useOpsStore();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-[#0f172a] border-b border-slate-800 px-3 sm:px-6 py-2.5 sm:py-3 sticky top-0 z-40 shadow-md">
      <div className="flex items-center justify-between gap-2">
        {/* Mobile Menu Button & Brand Logo */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            aria-label="Toggle Mobile Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-purple-400" /> : <Menu className="w-5 h-5 text-slate-300" />}
          </button>

          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-stage-blue via-stage-purple to-stage-amber flex items-center justify-center font-mono font-bold text-white shadow-lg shadow-blue-500/20 shrink-0">
              CO
            </div>
            <div>
              <h1 className="font-bold text-slate-100 tracking-tight text-base sm:text-lg flex items-center space-x-2">
                <span>CorridorOps</span>
                <span className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono font-normal hidden sm:inline">
                  SIH #26027
                </span>
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-400 font-mono hidden md:block">Indian Railways Automatic Block Planner</p>
            </div>
          </div>
        </div>

        {/* Controls: Division, Horizon, Connection Status, Theme, User */}
        <div className="flex items-center space-x-1.5 sm:space-x-3">
          {/* Division Selector */}
          <div className="flex items-center space-x-1 sm:space-x-2 bg-slate-900/80 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-slate-800">
            <Radio className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="text-xs text-slate-400 font-mono hidden lg:inline">Div:</span>
            <select
              value={division}
              onChange={(e) => setDivision(e.target.value)}
              className="bg-transparent text-xs sm:text-sm font-semibold text-slate-200 outline-none cursor-pointer"
            >
              <option value="PRYJ" className="bg-slate-900 text-slate-200">PRYJ (NCR)</option>
              <option value="BB" className="bg-slate-900 text-slate-200">BB (CR)</option>
              <option value="HWH" className="bg-slate-900 text-slate-200">HWH (ER)</option>
              <option value="SBC" className="bg-slate-900 text-slate-200">SBC (SWR)</option>
            </select>
          </div>

          {/* Horizon Toggle */}
          <div className="flex items-center bg-slate-900 p-0.5 sm:p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setHorizon('monthly')}
              className={`px-2 sm:px-3 py-1 text-[11px] sm:text-xs font-semibold rounded-md transition-all ${
                horizon === 'monthly'
                  ? 'bg-stage-amber text-white shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="hidden sm:inline">30-Day </span>Strategic
            </button>
            <button
              onClick={() => setHorizon('weekly')}
              className={`px-2 sm:px-3 py-1 text-[11px] sm:text-xs font-semibold rounded-md transition-all ${
                horizon === 'weekly'
                  ? 'bg-stage-purple text-white shadow-md shadow-purple-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="hidden sm:inline">7-Day </span>Tactical
            </button>
          </div>

          {/* WebSocket Indicator */}
          <div className="hidden sm:flex items-center space-x-1.5 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
            {wsConnected ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs text-emerald-400 font-mono font-medium hidden md:inline">Live</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs text-amber-400 font-mono font-medium hidden md:inline">Polling</span>
              </>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 sm:p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>

          {/* User Info & Logout */}
          {user && (
            <div className="flex items-center space-x-2 pl-1 sm:pl-2 border-l border-slate-800">
              <div className="flex flex-col text-right hidden lg:block">
                <span className="text-xs font-semibold text-slate-200">{user.full_name}</span>
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">{user.role}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 sm:p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
