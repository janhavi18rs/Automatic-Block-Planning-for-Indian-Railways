import React from 'react';
import { NavLink } from 'react-router-dom';
import { useOpsStore } from '../stores/opsStore';
import { 
  LayoutDashboard, Map, Calendar, AlertTriangle, 
  Wrench, BarChart3, Database, FileText, X
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, stageColor: 'border-stage-blue' },
  { path: '/map', label: 'Corridor Map', icon: Map, stageColor: 'border-stage-purple' },
  { path: '/schedule', label: 'Schedule / Gantt', icon: Calendar, stageColor: 'border-stage-amber' },
  { path: '/conflicts', label: 'Conflicts', icon: AlertTriangle, stageColor: 'border-red-500' },
  { path: '/bdms', label: 'BDMS Workflow', icon: FileText, stageColor: 'border-stage-amber' },
  { path: '/field', label: 'Field Ops', icon: Wrench, stageColor: 'border-stage-teal' },
  { path: '/analytics', label: 'Analytics', icon: BarChart3, stageColor: 'border-cyan-500' },
  { path: '/data-sources', label: 'Data Sources', icon: Database, stageColor: 'border-blue-500' },
];

export const Sidebar: React.FC = () => {
  const { mobileMenuOpen, setMobileMenuOpen } = useOpsStore();

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
          onClick={closeMenu}
        />
      )}

      {/* Sidebar Container (Desktop Sidebar + Mobile Drawer) */}
      <aside 
        className={`
          bg-[#0b0f19] border-r border-slate-800 flex flex-col justify-between shrink-0
          transition-transform duration-300 ease-in-out z-50
          md:static md:translate-x-0 md:w-64 md:min-h-[calc(100vh-4rem)]
          fixed top-0 left-0 bottom-0 w-72 h-full shadow-2xl
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="py-4 space-y-1 px-3 overflow-y-auto flex-1">
          {/* Mobile Header Close Button */}
          <div className="flex items-center justify-between px-3 pb-3 md:hidden border-b border-slate-800 mb-2">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded bg-gradient-to-tr from-stage-blue to-stage-purple flex items-center justify-center text-xs font-mono font-bold text-white">
                CO
              </div>
              <span className="font-bold text-sm text-slate-200">CorridorOps Menu</span>
            </div>
            <button 
              onClick={closeMenu}
              className="p-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-3 pb-2 text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-widest">
            Operations Navigation
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={closeMenu}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? `bg-slate-800/90 text-white font-semibold border-l-4 ${item.stageColor} shadow-sm`
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Footer Branding & Engine Info */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/40 m-3 rounded-lg text-xs space-y-2 shrink-0">
          <div className="flex items-center justify-between text-slate-400 font-mono">
            <span>Engine:</span>
            <span className="text-purple-400 font-semibold">OR-Tools CP-SAT</span>
          </div>
          <div className="flex items-center justify-between text-slate-400 font-mono">
            <span>Scoring:</span>
            <span className="text-cyan-400 font-semibold">GBRegressor</span>
          </div>
          <div className="flex items-center justify-between text-slate-400 font-mono">
            <span>BDMS:</span>
            <span className="text-amber-400 font-semibold">Prototype</span>
          </div>
        </div>
      </aside>
    </>
  );
};
