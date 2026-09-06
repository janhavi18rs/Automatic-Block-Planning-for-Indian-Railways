import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import { GanttTimeline, ScheduleItem } from '../components/GanttTimeline';
import { useOpsStore } from '../stores/opsStore';
import { DIVISIONS } from '../constants/divisions';
import { Calendar, Cpu, Layers, Play, Activity, Sparkles } from 'lucide-react';

export const ScheduleView: React.FC = () => {
  const { horizon, division } = useOpsStore();
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [isSolving, setIsSolving] = useState(false);
  const [isShadowing, setIsShadowing] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<{ message: string; type: 'purple' | 'amber' } | null>(null);

  const activeDiv = DIVISIONS[division] || DIVISIONS.PRYJ;

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const endpoint = horizon === 'monthly' ? '/schedule/monthly' : '/schedule/weekly';
      const res = await apiFetch<ScheduleItem[]>(endpoint);
      setSchedules(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [horizon, division]);

  const handleRunCPSAT = async () => {
    setIsSolving(true);
    try {
      await apiFetch('/schedule/optimize', {
        method: 'POST',
        body: JSON.stringify({ horizon_type: horizon }),
      });
      await fetchSchedules();
      setActionSuccess({
        message: `⚡ Google OR-Tools CP-SAT Solver successfully optimized ${horizon === 'monthly' ? '30-Day' : '7-Day'} block schedules for ${activeDiv.name} (${activeDiv.railway}) corridor!`,
        type: 'purple',
      });
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err) {
      alert('CP-SAT Solver error: ' + (err as Error).message);
    } finally {
      setIsSolving(false);
    }
  };

  const handleShadowBlock = async () => {
    setIsShadowing(true);
    try {
      await apiFetch('/schedule/default/shadow-block', { method: 'POST' });
      await fetchSchedules();
      setActionSuccess({
        message: `🛡 Multi-Department Shadow Blocking Applied! Merged Engineering, Signal & Telecom, and Traction block requests into combined maintenance windows.`,
        type: 'amber',
      });
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err) {
      alert('Shadow blocking error: ' + (err as Error).message);
    } finally {
      setIsShadowing(false);
    }
  };

  const handleWhatIfSimulation = async () => {
    setIsSimulating(true);
    try {
      const res = await apiFetch<any>('/simulate/what-if', {
        method: 'POST',
        body: JSON.stringify({ schedule_batch_id: 'default', variation_pct: 15.0, iterations: 100 }),
      });
      setSimulationResult(res.data);
    } catch (err) {
      alert('What-If simulation error: ' + (err as Error).message);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center space-x-2">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-stage-amber shrink-0" />
            <span>Dual-Horizon Block Schedule Matrix</span>
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-400 font-mono">
            Division: <span className="text-cyan-400 font-bold">{activeDiv.name} ({activeDiv.railway})</span> | Horizon: <span className="text-amber-400 font-bold">{horizon === 'monthly' ? '30-Day Strategic' : '7-Day Tactical'}</span>
          </p>
        </div>

        {/* Action Buttons (Responsive Wrap on Mobile) */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleRunCPSAT}
            disabled={isSolving}
            className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-lg shadow-purple-600/30 cursor-pointer border border-purple-400/40"
          >
            <Cpu className={`w-3.5 h-3.5 ${isSolving ? 'animate-spin' : ''}`} />
            <span>{isSolving ? 'Solving...' : 'Run CP-SAT Solver'}</span>
          </button>

          <button
            onClick={handleShadowBlock}
            disabled={isShadowing}
            className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-lg shadow-amber-600/30 cursor-pointer border border-amber-400/40"
          >
            <Layers className={`w-3.5 h-3.5 ${isShadowing ? 'animate-spin' : ''}`} />
            <span>{isShadowing ? 'Merging...' : 'Shadow Blocking'}</span>
          </button>

          <button
            onClick={handleWhatIfSimulation}
            disabled={isSimulating}
            className="w-full sm:w-auto px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-lg shadow-teal-600/30 cursor-pointer border border-teal-400/40"
          >
            <Play className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'Simulating...' : 'What-If Delay Simulator'}</span>
          </button>
        </div>
      </div>

      {/* Action Banners */}
      {actionSuccess && (
        <div
          className={`p-3 sm:p-4 rounded-xl border font-mono text-xs flex items-center space-x-3 shadow-lg transition-all ${
            actionSuccess.type === 'purple'
              ? 'bg-purple-950/60 border-purple-500/50 text-purple-200'
              : 'bg-amber-950/60 border-amber-500/50 text-amber-200'
          }`}
        >
          <Sparkles className="w-5 h-5 shrink-0" />
          <span className="font-semibold">{actionSuccess.message}</span>
        </div>
      )}

      {/* Main Gantt Component */}
      {loading ? (
        <div className="h-64 sm:h-80 bg-slate-900 rounded-xl border border-slate-800 animate-pulse flex items-center justify-center text-slate-500 font-mono text-xs sm:text-sm">
          Loading Schedule Matrix...
        </div>
      ) : (
        <GanttTimeline 
          schedules={
            schedules.filter((s) => activeDiv.sections.length === 0 || activeDiv.sections.includes(s.section_id)).length > 0
              ? schedules.filter((s) => activeDiv.sections.length === 0 || activeDiv.sections.includes(s.section_id))
              : schedules
          } 
          horizon={horizon} 
          onScheduleUpdated={fetchSchedules} 
        />
      )}

      {/* What-If Simulation Result Modal */}
      {simulationResult && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-xl p-4 sm:p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm sm:text-base font-bold text-slate-100 flex items-center space-x-2">
                <Activity className="w-5 h-5 text-stage-teal shrink-0" />
                <span>Monte Carlo What-If Delay Risk</span>
              </h3>
              <button onClick={() => setSimulationResult(null)} className="text-slate-400 hover:text-slate-200 p-1">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <div className="text-slate-400 font-mono">Risk Level</div>
                  <div className="text-base sm:text-lg font-bold font-mono text-emerald-400 uppercase">
                    {simulationResult.risk_level}
                  </div>
                </div>
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <div className="text-slate-400 font-mono">P95 Delay Risk</div>
                  <div className="text-base sm:text-lg font-bold font-mono text-amber-400">
                    {simulationResult.p95_delay_minutes} min
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 p-3 sm:p-4 rounded-lg border border-slate-800 space-y-1">
                <div className="font-mono font-bold text-slate-300">Recommended Action:</div>
                <div className="text-slate-400 font-sans leading-relaxed">
                  {simulationResult.recommended_adjustment}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSimulationResult(null)}
                className="w-full sm:w-auto px-4 py-2 bg-slate-800 text-slate-200 font-semibold rounded-lg hover:bg-slate-700 text-xs"
              >
                Dismiss Analysis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
