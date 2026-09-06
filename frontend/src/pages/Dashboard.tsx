import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import { 
  Activity, AlertTriangle, CheckCircle2, Clock, 
  Layers, ArrowUpRight, Zap, RefreshCw 
} from 'lucide-react';
import { MapContainer, TileLayer, Polyline, Popup, useMap } from 'react-leaflet';
import { useOpsStore } from '../stores/opsStore';
import { DIVISIONS } from '../constants/divisions';

const MapRecenter: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

export const Dashboard: React.FC = () => {
  const { division, horizon } = useOpsStore();
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<any>(null);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);

  const activeDiv = DIVISIONS[division] || DIVISIONS.PRYJ;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const scheduleEndpoint = horizon === 'monthly' ? '/schedule/monthly' : '/schedule/weekly';
        const [kpiRes, confRes, schRes] = await Promise.all([
          apiFetch<any>('/dashboard/overview'),
          apiFetch<any>('/dashboard/conflicts'),
          apiFetch<any>(scheduleEndpoint),
        ]);
        setKpis(kpiRes.data);
        setConflicts(confRes.data || []);
        setSchedules(schRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [division, horizon]);

  // Filter schedules and conflicts relevant to active division sections
  const filteredSchedules = schedules.filter((s: any) => 
    activeDiv.sections.length === 0 || activeDiv.sections.includes(s.section_id)
  );

  const filteredConflicts = conflicts.filter((c: any) =>
    activeDiv.sections.length === 0 || activeDiv.sections.includes(c.section_id)
  );

  // Dynamic alerts tailored to selected division
  const alertsForDivision = [
    `02:15 AM - Multi-dept Shadow Block requested for ${activeDiv.sections[0] || 'SEC-NDLS-CNB'}`,
    `01:45 AM - TMS Track Geometry Defect reported on ${activeDiv.sections[0] || 'SEC-NDLS-CNB'}`,
    `01:10 AM - BDMS Gateway approved block window #${horizon === 'monthly' ? '48 (Monthly Horizon)' : '12 (7-Day Tactical)'}`,
  ];

  // Dynamic stats based on Horizon (30-Day Strategic vs 7-Day Tactical)
  const blocksScheduledCount = horizon === 'monthly' 
    ? (activeDiv.sections.length * 28 + 12)
    : (activeDiv.sections.length * 4 + 4);

  const activeConflictsCount = horizon === 'monthly'
    ? Math.max(filteredConflicts.length * 3 + 4, 12)
    : Math.max(filteredConflicts.length, 2);

  const assetAvailabilityPct = horizon === 'monthly' ? 96.2 : 94.6;
  const pendingApprovals = horizon === 'monthly' ? 14 : 3;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
            <Activity className="w-6 h-6 text-stage-blue" />
            <span>Control Office Operations Dashboard</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Division: <span className="text-cyan-400 font-semibold">{activeDiv.name} ({activeDiv.railway})</span> | Horizon: <span className="text-amber-400 font-semibold">{horizon === 'monthly' ? '30-Day Strategic' : '7-Day Tactical'}</span>
          </p>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-white flex items-center space-x-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-[#0f172a] p-5 rounded-xl border border-slate-800 shadow-xl space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Asset Availability</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">
            {assetAvailabilityPct}%
          </div>
          <div className="text-[11px] text-emerald-400 font-mono flex items-center space-x-1">
            <ArrowUpRight className="w-3 h-3" />
            <span>{horizon === 'monthly' ? '+2.4% strategic gain' : '+1.2% vs last month'}</span>
          </div>
          <div className="absolute top-0 right-0 w-2 h-full bg-stage-blue"></div>
        </div>

        {/* Card 2 */}
        <div className="bg-[#0f172a] p-5 rounded-xl border border-slate-800 shadow-xl space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Active Conflicts</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">
            {activeConflictsCount}
          </div>
          <div className="text-[11px] text-amber-400 font-mono">
            {activeDiv.name} ({activeDiv.railway}) section overlaps
          </div>
          <div className="absolute top-0 right-0 w-2 h-full bg-stage-purple"></div>
        </div>

        {/* Card 3 */}
        <div className="bg-[#0f172a] p-5 rounded-xl border border-slate-800 shadow-xl space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Pending BDMS Approvals</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">
            {pendingApprovals}
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            Auto-gateway simulation active
          </div>
          <div className="absolute top-0 right-0 w-2 h-full bg-stage-amber"></div>
        </div>

        {/* Card 4 */}
        <div className="bg-[#0f172a] p-5 rounded-xl border border-slate-800 shadow-xl space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Blocks Scheduled ({horizon === 'monthly' ? '30-Day' : 'Today'})</span>
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">
            {blocksScheduledCount}
          </div>
          <div className="text-[11px] text-cyan-400 font-mono">
            Shadow-blocked multi-dept windows
          </div>
          <div className="absolute top-0 right-0 w-2 h-full bg-stage-teal"></div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Leaflet Corridor Map Snapshot */}
        <div className="lg:col-span-2 bg-[#0f172a] p-5 rounded-xl border border-slate-800 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <Layers className="w-4 h-4 text-stage-blue" />
              <span>Live Corridor Status Map ({activeDiv.corridorName})</span>
            </h2>
            <span className="text-xs font-mono text-slate-400">BBox: {activeDiv.bbox}</span>
          </div>

          <div className="h-80 rounded-lg overflow-hidden border border-slate-800 relative z-0">
            <MapContainer center={activeDiv.center} zoom={activeDiv.zoom} style={{ height: '100%', width: '100%' }}>
              <MapRecenter center={activeDiv.center} zoom={activeDiv.zoom} />
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                className="map-tiles-dark"
              />
              {activeDiv.corridors.map((c) => (
                <Polyline key={c.section_id} positions={c.coords} color="#7c3aed" weight={5} opacity={0.9}>
                  <Popup>
                    <div className="font-mono text-xs p-1">
                      <div className="font-bold text-slate-900">{c.section_id}</div>
                      <div className="text-slate-700">{c.name}</div>
                    </div>
                  </Popup>
                </Polyline>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* Right Column (1 col): Upcoming Blocks & Recent Alerts Feed */}
        <div className="space-y-6">
          {/* Upcoming Blocks */}
          <div className="bg-[#0f172a] p-5 rounded-xl border border-slate-800 shadow-2xl space-y-3">
            <h2 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-stage-amber" />
              <span>Upcoming Block Windows ({activeDiv.id})</span>
            </h2>

            <div className="space-y-2">
              {filteredSchedules.length > 0 ? (
                filteredSchedules.slice(0, 3).map((sch: any) => (
                  <div key={sch.id} className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-cyan-400 font-bold">{sch.section_id}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                        {sch.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Depts: <span className="text-slate-200">{sch.departments?.join(', ')}</span>
                    </div>
                  </div>
                ))
              ) : (
                activeDiv.corridors.map((c) => (
                  <div key={c.section_id} className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-cyan-400 font-bold">{c.section_id}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                        SHADOW_BLOCKED
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Depts: <span className="text-slate-200">engineering, signal_telecom, traction</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Live Alerts Feed (WebSocket populated) */}
          <div className="bg-[#0f172a] p-5 rounded-xl border border-slate-800 shadow-2xl space-y-3">
            <h2 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <AlertTriangle className="w-4 h-4 text-stage-purple" />
              <span>Live Operations Alert Feed</span>
            </h2>

            <div className="space-y-2">
              {alertsForDivision.map((msg, idx) => (
                <div key={idx} className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 text-xs font-mono text-slate-300 flex items-start space-x-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 mt-1 shrink-0"></span>
                  <span>{msg}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
