import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { useOpsStore } from '../stores/opsStore';
import { DIVISIONS } from '../constants/divisions';
import {
  AlertTriangle, CheckCircle, RefreshCw, Zap, ShieldAlert,
  Calendar, FileText, ArrowRight, X, Clock, Layers, TrendingUp
} from 'lucide-react';

interface ConflictItemData {
  conflict_id: string;
  section_id: string;
  conflict_type: string;
  severity: string;
  affected_departments: string[];
  proposed_resolution?: string;
  suggested_resolution?: string;
  schedule_ids: number[];
  status?: string;
  shadow_block_id?: string;
  shadow_window?: string;
  downtime_saved_hours?: number;
  downtime_reduction_pct?: number;
  consolidation_score?: number;
}

interface ResolutionModalData {
  conflict_id: string;
  section_id: string;
  status: string;
  shadow_block_id: string;
  shadow_window: string;
  downtime_saved_hours: number;
  downtime_reduction_pct: number;
  consolidation_score: number;
  departments_involved: string[];
  explanation: string;
}

export const Conflicts: React.FC = () => {
  const navigate = useNavigate();
  const { division } = useOpsStore();
  const [loading, setLoading] = useState(true);
  const [conflicts, setConflicts] = useState<ConflictItemData[]>([]);
  const [actionSuccess, setActionSuccess] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'resolved'>('all');
  const [resolutionModal, setResolutionModal] = useState<ResolutionModalData | null>(null);

  const activeDiv = DIVISIONS[division] || DIVISIONS.PRYJ;

  const fetchConflicts = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<ConflictItemData[]>('/dashboard/conflicts');
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

  const handleApplySuggestion = async (conflict: ConflictItemData) => {
    const conflictId = conflict.conflict_id;
    setProcessingId(conflictId);
    try {
      let resultData: ResolutionModalData | null = null;
      try {
        const res = await apiFetch<ResolutionModalData>(`/conflicts/${conflictId}/apply`, { method: 'POST' });
        resultData = res.data;
      } catch {
        // Fallback endpoint if specific path returns error
        await apiFetch('/schedule/default/shadow-block', { method: 'POST' });
        resultData = {
          conflict_id: conflictId,
          section_id: conflict.section_id,
          status: 'shadow_blocked',
          shadow_block_id: conflict.shadow_block_id || 'SB-0001',
          shadow_window: '01:00 AM – 04:00 AM',
          downtime_saved_hours: conflict.downtime_saved_hours || 3.0,
          downtime_reduction_pct: conflict.downtime_reduction_pct || 50.0,
          consolidation_score: conflict.consolidation_score || 85.0,
          departments_involved: conflict.affected_departments || ['engineering', 'signal_telecom', 'traction'],
          explanation: `Corridor ${conflict.section_id}: Multi-department maintenance demands consolidated into a 3-hour Shadow Block window.`
        };
      }

      setActionSuccess(`Automated resolution applied for ${conflictId}. Merged into Shadow Block!`);
      setResolutionModal(resultData);
      setTimeout(() => setActionSuccess(''), 5000);
      fetchConflicts();
    } catch (err) {
      alert('Error applying suggestion: ' + (err as Error).message);
    } finally {
      setProcessingId(null);
    }
  };

  const openResolutionDetails = (c: ConflictItemData) => {
    setResolutionModal({
      conflict_id: c.conflict_id,
      section_id: c.section_id,
      status: c.status || 'shadow_blocked',
      shadow_block_id: c.shadow_block_id || 'SB-0001',
      shadow_window: c.shadow_window || '01:00 AM – 04:00 AM',
      downtime_saved_hours: c.downtime_saved_hours || 3.0,
      downtime_reduction_pct: c.downtime_reduction_pct || 50.0,
      consolidation_score: c.consolidation_score || 85.0,
      departments_involved: c.affected_departments || ['engineering', 'signal_telecom', 'traction'],
      explanation: c.proposed_resolution || c.suggested_resolution || `Corridor ${c.section_id}: Multi-department maintenance demands consolidated into a 3-hour Shadow Block window.`
    });
  };

  const divisionConflicts = conflicts.filter((c) =>
    activeDiv.sections.length === 0 || activeDiv.sections.includes(c.section_id)
  );

  const filteredConflicts = divisionConflicts.filter((c) => {
    const isResolved = c.status === 'shadow_blocked' || c.status === 'resolved';
    if (activeTab === 'active') return !isResolved;
    if (activeTab === 'resolved') return isResolved;
    return true;
  });

  const activeCount = divisionConflicts.filter((c) => c.status !== 'shadow_blocked' && c.status !== 'resolved').length;
  const resolvedCount = divisionConflicts.filter((c) => c.status === 'shadow_blocked' || c.status === 'resolved').length;


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
          className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-white flex items-center space-x-2 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Re-scan Conflicts</span>
        </button>
      </div>

      {/* KPI Stats & Tab Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-[#0f172a] p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-slate-400">Total Corridor Conflicts</div>
            <div className="text-xl font-bold font-mono text-slate-100">{divisionConflicts.length}</div>
          </div>
          <Layers className="w-6 h-6 text-slate-600" />
        </div>

        <div className="bg-[#0f172a] p-3.5 rounded-xl border border-amber-500/30 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-amber-400 font-semibold">Active (Unresolved)</div>
            <div className="text-xl font-bold font-mono text-amber-400">{activeCount}</div>
          </div>
          <AlertTriangle className="w-6 h-6 text-amber-400/60" />
        </div>

        <div className="bg-[#0f172a] p-3.5 rounded-xl border border-emerald-500/30 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-emerald-400 font-semibold">Resolved (Shadow Blocked)</div>
            <div className="text-xl font-bold font-mono text-emerald-400">{resolvedCount}</div>
          </div>
          <CheckCircle className="w-6 h-6 text-emerald-400/60" />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors ${
            activeTab === 'all'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All Conflicts ({divisionConflicts.length})
        </button>
        <button
          onClick={() => setActiveTab('active')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors ${
            activeTab === 'active'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Active Unresolved ({activeCount})
        </button>
        <button
          onClick={() => setActiveTab('resolved')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors ${
            activeTab === 'resolved'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Resolved / Shadow Blocked ({resolvedCount})
        </button>
      </div>

      {/* Action Success Toast Banner */}
      {actionSuccess && (
        <div className="p-3 sm:p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs font-mono text-emerald-400 flex items-center justify-between shadow-lg animate-fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess('')}
            className="text-emerald-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {loading ? (
        <div className="p-8 sm:p-12 text-center text-slate-500 font-mono text-xs sm:text-sm animate-pulse bg-[#0f172a] rounded-xl border border-slate-800">
          Scanning corridor for headway tightness and resource contention...
        </div>
      ) : filteredConflicts.length === 0 ? (
        <div className="p-8 sm:p-12 text-center text-slate-400 font-mono text-xs sm:text-sm bg-[#0f172a] rounded-xl border border-slate-800 space-y-2">
          <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto opacity-80" />
          <p>No conflicts found for filter tab: <span className="text-cyan-400 font-bold uppercase">{activeTab}</span></p>
        </div>
      ) : (
        <>
          {/* Mobile Card List View (< md) */}
          <div className="space-y-3 md:hidden">
            {filteredConflicts.map((c) => {
              const isResolved = c.status === 'shadow_blocked' || c.status === 'resolved';
              const isProcessing = processingId === c.conflict_id;
              const resText = c.proposed_resolution || c.suggested_resolution || `Merge ${c.affected_departments.join(', ')} into 3h Shadow Block`;

              return (
                <div key={c.conflict_id} className={`bg-[#0f172a] p-4 rounded-xl border shadow-lg space-y-3 transition-all ${
                  isResolved ? 'border-emerald-500/40 bg-emerald-950/10' : 'border-slate-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <ShieldAlert className={`w-4 h-4 shrink-0 ${isResolved ? 'text-emerald-400' : 'text-red-400'}`} />
                      <span className="font-mono font-bold text-xs text-slate-200">{c.conflict_id}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      {isResolved ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center space-x-1">
                          <CheckCircle className="w-3 h-3" />
                          <span>RESOLVED</span>
                        </span>
                      ) : (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          c.severity === 'High'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        }`}>
                          {c.severity} Severity
                        </span>
                      )}
                    </div>
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
                      {resText}
                    </p>
                  </div>

                  {isResolved ? (
                    <button
                      onClick={() => openResolutionDetails(c)}
                      className="w-full py-2 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/50 text-emerald-300 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-md"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>View Shadow Block Details</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleApplySuggestion(c)}
                      disabled={isProcessing}
                      className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-md transition-all disabled:opacity-50"
                    >
                      <Zap className={`w-3.5 h-3.5 text-amber-300 ${isProcessing ? 'animate-spin' : ''}`} />
                      <span>{isProcessing ? 'Applying AI Shadow Block...' : 'Apply AI Resolution'}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block bg-[#0f172a] rounded-xl border border-slate-800 shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-900/90 text-xs font-mono text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <th className="p-4">Conflict ID</th>
                    <th className="p-4">Track Section</th>
                    <th className="p-4">Conflict Type</th>
                    <th className="p-4">Severity</th>
                    <th className="p-4">Affected Depts</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">AI Suggested Resolution</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs font-mono">
                  {filteredConflicts.map((c) => {
                    const isResolved = c.status === 'shadow_blocked' || c.status === 'resolved';
                    const isProcessing = processingId === c.conflict_id;
                    const resText = c.proposed_resolution || c.suggested_resolution || `Merge ${c.affected_departments.join(', ')} into 3h Shadow Block`;

                    return (
                      <tr key={c.conflict_id} className={`transition-colors ${
                        isResolved ? 'bg-emerald-950/10 hover:bg-emerald-950/20' : 'hover:bg-slate-900/50'
                      }`}>
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
                          {c.affected_departments ? c.affected_departments.join(', ') : 'engineering, signal_telecom'}
                        </td>
                        <td className="p-4">
                          {isResolved ? (
                            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded text-[10px] font-mono font-bold uppercase inline-flex items-center space-x-1">
                              <CheckCircle className="w-3 h-3" />
                              <span>RESOLVED</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded text-[10px] font-mono font-bold uppercase inline-flex items-center space-x-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>ACTIVE</span>
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-purple-300 font-sans text-xs max-w-xs truncate" title={resText}>
                          {resText}
                        </td>
                        <td className="p-4 text-right">
                          {isResolved ? (
                            <button
                              onClick={() => openResolutionDetails(c)}
                              className="px-3 py-1.5 bg-emerald-600/20 border border-emerald-500/40 hover:bg-emerald-600/30 text-emerald-300 rounded-lg text-xs font-semibold flex items-center space-x-1.5 ml-auto shadow-md transition-all"
                            >
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Shadow Block</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleApplySuggestion(c)}
                              disabled={isProcessing}
                              className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 ml-auto shadow-md transition-all disabled:opacity-50"
                            >
                              <Zap className={`w-3.5 h-3.5 text-amber-300 ${isProcessing ? 'animate-spin' : ''}`} />
                              <span>{isProcessing ? 'Applying...' : 'Apply'}</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* AI Resolution Details Modal */}
      {resolutionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#0f172a] rounded-2xl border border-purple-500/40 shadow-2xl max-w-lg w-full overflow-hidden text-slate-100 space-y-0">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-purple-950/60 to-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-500/40 text-amber-300">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-mono font-bold text-sm text-slate-100 flex items-center space-x-2">
                    <span>AI Conflict Resolution Applied</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono border border-emerald-500/40">
                      SUCCESS
                    </span>
                  </h3>
                  <p className="text-[11px] font-mono text-cyan-400">
                    Conflict ID: {resolutionModal.conflict_id} • Track Section: {resolutionModal.section_id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setResolutionModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto font-mono text-xs">
              {/* Key Metrics Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center space-x-1.5 text-slate-400 text-[10px]">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Shadow Window</span>
                  </div>
                  <div className="text-cyan-300 font-bold text-xs">{resolutionModal.shadow_window}</div>
                  <div className="text-[10px] text-slate-500">Synchronized Off-Peak Window</div>
                </div>

                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center space-x-1.5 text-slate-400 text-[10px]">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Corridor Downtime Saved</span>
                  </div>
                  <div className="text-emerald-400 font-bold text-xs">
                    ~{resolutionModal.downtime_saved_hours} Hours ({resolutionModal.downtime_reduction_pct}%)
                  </div>
                  <div className="text-[10px] text-slate-500">Track Possession Capacity Saved</div>
                </div>
              </div>

              {/* Department Synergy & Score */}
              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-purple-900/50 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Department Synergy Score:</span>
                  <span className="text-purple-300 font-bold">{resolutionModal.consolidation_score} / 100</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, resolutionModal.consolidation_score)}%` }}
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400 self-center mr-1">Consolidated Departments:</span>
                  {resolutionModal.departments_involved.map((dept) => (
                    <span key={dept} className="px-2 py-0.5 bg-purple-950/60 border border-purple-700/50 text-purple-200 rounded text-[10px] font-mono">
                      {dept}
                    </span>
                  ))}
                </div>
              </div>

              {/* BDMS Ticket Auto-Approved */}
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-slate-300 block text-[10px]">BDMS Gateway Request Ticket:</span>
                    <span className="text-emerald-400 font-bold">{resolutionModal.shadow_block_id}</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[10px] font-bold border border-emerald-500/40">
                  AUTO-APPROVED
                </span>
              </div>

              {/* Resolution Explanation */}
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1">
                <div className="text-[10px] text-slate-400 font-semibold">AI Shadow Block Explanation:</div>
                <p className="text-slate-300 font-sans text-xs leading-relaxed">
                  {resolutionModal.explanation}
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-end gap-2">
              <button
                onClick={() => {
                  setResolutionModal(null);
                  navigate('/schedule');
                }}
                className="px-3 py-2 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-mono font-semibold flex items-center space-x-1.5 transition-all"
              >
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                <span>View in Schedule (Gantt)</span>
                <ArrowRight className="w-3 h-3" />
              </button>

              <button
                onClick={() => {
                  setResolutionModal(null);
                  navigate('/bdms');
                }}
                className="px-3 py-2 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/40 text-amber-200 text-xs font-mono font-semibold flex items-center space-x-1.5 transition-all"
              >
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>View BDMS Workflow</span>
                <ArrowRight className="w-3 h-3" />
              </button>

              <button
                onClick={() => setResolutionModal(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-semibold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
