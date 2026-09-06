import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import { useOpsStore } from '../stores/opsStore';
import { DIVISIONS } from '../constants/divisions';
import { AlertTriangle, CheckCircle, RefreshCw, Zap, ShieldAlert } from 'lucide-react';

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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 shrink-0" />
            <span>Conflict Detection Matrix</span>
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-400 font-mono">
            GIS spatial analysis and headway overlap detection for {activeDiv.name} ({activeDiv.railway})
          </p>
        </div>

        <button
          onClick={fetchConflicts}
          className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-white flex items-center space-x-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Re-scan Conflicts</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="p-3 sm:p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs font-mono text-emerald-400 flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {loading ? (
        <div className="p-8 sm:p-12 text-center text-slate-500 font-mono text-xs sm:text-sm animate-pulse bg-[#0f172a] rounded-xl border border-slate-800">
          Scanning corridor for headway tightness and resource contention...
        </div>
      ) : (
        <>
          {/* Mobile Card List View (< md) */}
          <div className="space-y-3 md:hidden">
            {conflicts.map((c) => (
              <div key={c.conflict_id} className="bg-[#0f172a] p-4 rounded-xl border border-slate-800 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                    <span className="font-mono font-bold text-xs text-slate-200">{c.conflict_id}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    c.severity === 'High'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  }`}>
                    {c.severity} Severity
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Track Section:</span>
                    <span className="text-cyan-400 font-bold">{c.section_id}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Conflict Type:</span>
                    <span className="text-slate-300">{c.conflict_type}</span>
                  </div>
                </div>

                <div className="text-xs font-mono space-y-1">
                  <span className="text-slate-400 text-[11px]">AI Suggested Resolution:</span>
                  <p className="text-slate-200 bg-purple-950/40 border border-purple-800/40 p-2 rounded text-[11px] leading-relaxed">
                    {c.suggested_resolution}
                  </p>
                </div>

                <button
                  onClick={() => handleApplySuggestion(c.conflict_id)}
                  className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-md"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>Apply AI Resolution</span>
                </button>
              </div>
            ))}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block bg-[#0f172a] rounded-xl border border-slate-800 shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
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
                            ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        }`}>
                          {c.severity}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400">
                        {c.affected_departments ? c.affected_departments.join(', ') : 'TMS, SMMS'}
                      </td>
                      <td className="p-4 text-purple-300 font-sans text-xs max-w-xs truncate" title={c.suggested_resolution}>
                        {c.suggested_resolution}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleApplySuggestion(c.conflict_id)}
                          className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 ml-auto shadow-md"
                        >
                          <Zap className="w-3.5 h-3.5 text-amber-300" />
                          <span>Apply</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
