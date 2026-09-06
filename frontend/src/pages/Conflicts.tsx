import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import { useOpsStore } from '../stores/opsStore';
import { DIVISIONS } from '../constants/divisions';
import { AlertTriangle, CheckCircle, RefreshCw, Zap } from 'lucide-react';

export const Conflicts: React.FC = () => {
  const { division } = useOpsStore();
  const [loading, setLoading] = useState(true);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [actionSuccess, setActionSuccess] = useState('');

  const activeDiv = DIVISIONS[division] || DIVISIONS.PRYJ;

  const fetchConflicts = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<any[]>('/dashboard/conflicts');
      setConflicts(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConflicts();
  }, [division]);

  const handleApplySuggestion = async (conflictId: string) => {
    try {
      await apiFetch('/schedule/default/shadow-block', { method: 'POST' });
      setActionSuccess(`Applied automated resolution for ${conflictId}. Merged into Shadow Block!`);
      setTimeout(() => setActionSuccess(''), 4000);
      fetchConflicts();
    } catch (err) {
      alert('Error applying suggestion: ' + (err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <span>Active Maintenance & Train Schedule Conflict Matrix</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Automated conflict detection powered by GIS spatial analysis and headway checks
          </p>
        </div>

        <button
          onClick={fetchConflicts}
          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-white flex items-center space-x-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Re-scan Conflicts</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs font-mono text-emerald-400 flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Conflicts Table */}
      <div className="bg-[#0f172a] rounded-xl border border-slate-800 shadow-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 font-mono animate-pulse">
            Scanning corridor for headway tightness and resource contention...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/90 text-xs font-mono text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <th className="p-4">Conflict ID</th>
                  <th className="p-4">Track Section</th>
                  <th className="p-4">Conflict Type</th>
                  <th className="p-4">Severity</th>
                  <th className="p-4">Affected Depts</th>
                  <th className="p-4">AI Suggested Resolution</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs font-mono">
                {conflicts.map((c) => (
                  <tr key={c.conflict_id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-4 font-bold text-slate-200">{c.conflict_id}</td>
                    <td className="p-4 text-cyan-400 font-bold">{c.section_id}</td>
                    <td className="p-4 text-slate-300">{c.conflict_type}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        c.severity === 'High'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {c.severity}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {c.affected_departments.map((d: string) => (
                          <span key={d} className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px]">
                            {d}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-slate-300 max-w-xs">{c.proposed_resolution}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleApplySuggestion(c.conflict_id)}
                        className="px-3 py-1.5 rounded-lg bg-stage-purple text-white hover:bg-purple-600 font-semibold transition-all flex items-center space-x-1.5 ml-auto shadow-md shadow-purple-500/20"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Apply Suggestion</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
