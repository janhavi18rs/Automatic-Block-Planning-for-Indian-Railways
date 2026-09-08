import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import { useOpsStore } from '../stores/opsStore';
import { DIVISIONS } from '../constants/divisions';
import { BarChart3, RefreshCw, Cpu, TrendingUp, CheckCircle, Layers } from 'lucide-react';
import { 
  BarChart as ReBarChart, Bar, LineChart, Line, XAxis, YAxis, 
  Tooltip, ResponsiveContainer, CartesianGrid, Legend 
} from 'recharts';

export const Analytics: React.FC = () => {
  const { division, horizon } = useOpsStore();
  const [loading, setLoading] = useState(true);
  const [varianceData, setVarianceData] = useState<any[]>([]);
  const [retrainResult, setRetrainResult] = useState<any>(null);
  const [isRetraining, setIsRetraining] = useState(false);

  const activeDiv = DIVISIONS[division] || DIVISIONS.PRYJ;

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<any[]>(`/analytics/post-maintenance?division=${division}&horizon_type=${horizon}`);
      setVarianceData(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [division, horizon]);

  const handleTriggerRetrain = async () => {
    setIsRetraining(true);
    try {
      const res = await apiFetch<any>('/feedback/retrain', { method: 'POST' });
      setRetrainResult(res.data);
    } catch (err) {
      alert('Model retrain error: ' + (err as Error).message);
    } finally {
      setIsRetraining(false);
    }
  };

  const chartData = varianceData.map((d, i) => ({
    name: `${d.section_id ? d.section_id.replace('SEC-', '') : '#' + (i + 1)}`,
    Planned: d.planned_duration_min,
    Actual: d.actual_duration_min,
    RecoveryScore: d.speed_recovery_score,
  }));

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-stage-teal shrink-0" />
            <span>Closed-Loop Variance Analytics</span>
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-400 font-mono">
            Division: <span className="text-cyan-400 font-bold">{activeDiv.name} ({activeDiv.railway})</span> | Horizon: <span className="text-amber-400 font-bold">{horizon === 'monthly' ? '30-Day Strategic (14 Corridors)' : '7-Day Tactical (6 Corridors)'}</span>
          </p>
        </div>

        <button
          onClick={handleTriggerRetrain}
          disabled={isRetraining}
          className="self-start sm:self-auto px-3.5 py-2 rounded-lg bg-stage-purple text-white text-xs font-semibold hover:bg-purple-600 flex items-center space-x-2 shadow-lg shadow-purple-500/20"
        >
          <Cpu className={`w-3.5 h-3.5 ${isRetraining ? 'animate-spin' : ''}`} />
          <span>{isRetraining ? 'Retraining...' : 'Trigger Model Retrain'}</span>
        </button>
      </div>

      {/* Retrain Result Card */}
      {retrainResult && (
        <div className="p-3 sm:p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl space-y-2">
          <div className="flex items-center space-x-2 text-purple-300 font-mono font-bold text-xs">
            <CheckCircle className="w-4 h-4 text-purple-400 shrink-0" />
            <span>GradientBoostingRegressor Retrained Successfully!</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono text-slate-300 pt-1">
            <div>Sample Count: <strong className="text-white block sm:inline">{retrainResult.sample_count}</strong></div>
            <div>Previous R²: <strong className="text-amber-400 block sm:inline">{retrainResult.previous_r2}</strong></div>
            <div>New R² Score: <strong className="text-emerald-400 block sm:inline">{retrainResult.new_r2}</strong></div>
            <div>New MAE Error: <strong className="text-cyan-400 block sm:inline">{retrainResult.new_mae}</strong></div>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Planned vs Actual Duration Bar Chart */}
        <div className="bg-[#0f172a] p-4 sm:p-5 rounded-xl border border-slate-800 shadow-2xl space-y-3">
          <h2 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
            <BarChart3 className="w-4 h-4 text-stage-blue shrink-0" />
            <span>Planned vs Actual Maintenance Duration (Min)</span>
          </h2>

          <div className="h-56 sm:h-72 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="Planned" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Actual" fill="#a855f7" radius={[4, 4, 0, 0]} />
              </ReBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Speed Restriction Recovery Curve */}
        <div className="bg-[#0f172a] p-4 sm:p-5 rounded-xl border border-slate-800 shadow-2xl space-y-3">
          <h2 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Post-Block Speed Recovery Score (%)</span>
          </h2>

          <div className="h-56 sm:h-72 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line type="monotone" dataKey="RecoveryScore" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
