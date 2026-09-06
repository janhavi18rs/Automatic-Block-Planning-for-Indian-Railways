import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import { BarChart3, RefreshCw, Cpu, TrendingUp, CheckCircle } from 'lucide-react';
import { 
  BarChart as ReBarChart, Bar, LineChart, Line, XAxis, YAxis, 
  Tooltip, ResponsiveContainer, CartesianGrid, Legend 
} from 'recharts';

export const Analytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [varianceData, setVarianceData] = useState<any[]>([]);
  const [retrainResult, setRetrainResult] = useState<any>(null);
  const [isRetraining, setIsRetraining] = useState(false);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<any[]>('/analytics/post-maintenance');
      setVarianceData(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

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
    name: `Slot #${d.schedule_id || i + 1}`,
    Planned: d.planned_duration_min,
    Actual: d.actual_duration_min,
    RecoveryScore: d.speed_recovery_score,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
            <BarChart3 className="w-6 h-6 text-stage-teal" />
            <span>Closed-Loop Variance Analytics & ML Feedback</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Tracks planned vs actual block durations and retrains the GradientBoosting criticality model over time.
          </p>
        </div>

        <button
          onClick={handleTriggerRetrain}
          disabled={isRetraining}
          className="px-4 py-2 rounded-lg bg-stage-purple text-white text-xs font-semibold hover:bg-purple-600 flex items-center space-x-2 shadow-lg shadow-purple-500/20"
        >
          <Cpu className={`w-4 h-4 ${isRetraining ? 'animate-spin' : ''}`} />
          <span>{isRetraining ? 'Retraining ML Model...' : 'Trigger Model Retrain'}</span>
        </button>
      </div>

      {/* Retrain Result Card */}
      {retrainResult && (
        <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl space-y-2">
          <div className="flex items-center space-x-2 text-purple-300 font-mono font-bold text-xs">
            <CheckCircle className="w-4 h-4 text-purple-400" />
            <span>GradientBoostingRegressor Retrained Successfully!</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono text-slate-300 pt-1">
            <div>Sample Count: <strong className="text-white">{retrainResult.sample_count}</strong></div>
            <div>Previous R²: <strong className="text-amber-400">{retrainResult.previous_r2}</strong></div>
            <div>New R² Score: <strong className="text-emerald-400">{retrainResult.new_r2}</strong></div>
            <div>New MAE Error: <strong className="text-cyan-400">{retrainResult.new_mae}</strong></div>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Planned vs Actual Duration Bar Chart */}
        <div className="bg-[#0f172a] p-5 rounded-xl border border-slate-800 shadow-2xl space-y-3">
          <h2 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
            <BarChart3 className="w-4 h-4 text-stage-blue" />
            <span>Planned vs Actual Maintenance Duration (Minutes)</span>
          </h2>

          <div className="h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Planned" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Actual" fill="#ea580c" radius={[4, 4, 0, 0]} />
              </ReBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Speed Recovery Score Trend Line */}
        <div className="bg-[#0f172a] p-5 rounded-xl border border-slate-800 shadow-2xl space-y-3">
          <h2 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
            <TrendingUp className="w-4 h-4 text-stage-teal" />
            <span>Speed Recovery Score Trend (%)</span>
          </h2>

          <div className="h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} domain={[40, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                <Line type="monotone" dataKey="RecoveryScore" stroke="#0d9488" strokeWidth={3} dot={{ fill: '#38bdf8' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
