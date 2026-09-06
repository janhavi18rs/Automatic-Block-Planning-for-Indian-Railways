import React, { useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { useOpsStore } from '../stores/opsStore';
import { LayoutDashboard, Calendar, Map, AlertTriangle, Wrench } from 'lucide-react';

const mobileNavItems = [
  { path: '/dashboard', label: 'Dash', icon: LayoutDashboard },
  { path: '/schedule', label: 'Schedule', icon: Calendar },
  { path: '/map', label: 'Map', icon: Map },
  { path: '/conflicts', label: 'Conflicts', icon: AlertTriangle },
  { path: '/field', label: 'Field', icon: Wrench },
];

export const ControlRoomLayout: React.FC = () => {
  const { setWsConnected } = useOpsStore();

  useEffect(() => {
    // Setup native WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/dashboard`;
    
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(wsUrl);
      ws.onopen = () => setWsConnected(true);
      ws.onclose = () => setWsConnected(false);
      ws.onerror = () => setWsConnected(false);
    } catch (e) {
      setWsConnected(false);
    }

    return () => {
      if (ws) ws.close();
    };
  }, [setWsConnected]);

  return (
    <div className="min-h-screen bg-ops-bg text-slate-100 flex flex-col">
      <Navbar />
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar />
        <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto bg-[#080c14] min-h-[calc(100vh-4rem)] pb-20 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Quick Bar (smartphone viewports) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0f172a]/95 backdrop-blur-md border-t border-slate-800 z-30 px-2 py-1.5 flex items-center justify-around">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center px-2 py-1 rounded-lg text-[10px] font-mono font-medium transition-all ${
                  isActive
                    ? 'text-cyan-400 bg-cyan-500/10 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};
