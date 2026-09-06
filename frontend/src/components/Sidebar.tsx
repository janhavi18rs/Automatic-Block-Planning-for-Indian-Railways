import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Map, Calendar, AlertTriangle, 
  Wrench, BarChart3, Database, FileText
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
  return (
    <aside className="w-64 bg-[#0b0f19] border-r border-slate-800 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="py-4 space-y-1 px-3">
        <div className="px-3 pb-2 text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-widest">
          Operations Control Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
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

      {/* Footer Branding & Status */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/40 m-3 rounded-lg text-xs space-y-2">
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
  );
};
