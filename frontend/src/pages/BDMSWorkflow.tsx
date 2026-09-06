import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import {
  FileText, CheckCircle2, XCircle, Clock, AlertTriangle,
  RefreshCw, Send, Zap, Building2, ChevronDown, ChevronUp, Info
} from 'lucide-react';

type BDMSStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'executed' | 'completed';

interface BDMSBlockRequest {
  block_id: string;
  corridor: string;
  section_id: string;
  start_station: string;
  end_station: string;
  start_time: string;
  end_time: string;
  departments_involved: string[];
  maintenance_tasks: string[];
  priority: string;
  priority_score: number;
  risk_score: number;
  conflict_score: number;
  reason_for_maintenance: string;
  approval_status: BDMSStatus;
  submitted_at: string;
  gateway_response_at?: string;
  notes: string;
}

const WORKFLOW_STEPS: BDMSStatus[] = ['pending', 'under_review', 'approved', 'executed', 'completed'];

const STATUS_CONFIG: Record<BDMSStatus, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  pending: { label: 'Draft / Pending', color: 'text-slate-400', bgColor: 'bg-slate-700/40 border-slate-600', icon: <Clock className="w-3.5 h-3.5" /> },
  under_review: { label: 'Under Review', color: 'text-amber-400', bgColor: 'bg-amber-500/10 border-amber-500/40', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  approved: { label: 'Approved', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10 border-emerald-500/40', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  rejected: { label: 'Rejected', color: 'text-red-400', bgColor: 'bg-red-500/10 border-red-500/40', icon: <XCircle className="w-3.5 h-3.5" /> },
  executed: { label: 'Executed', color: 'text-cyan-400', bgColor: 'bg-cyan-500/10 border-cyan-500/40', icon: <Zap className="w-3.5 h-3.5" /> },
  completed: { label: 'Completed', color: 'text-purple-400', bgColor: 'bg-purple-500/10 border-purple-500/40', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
};

const PRIORITY_COLORS: Record<string, string> = {
  Critical: 'text-red-400 bg-red-500/20 border-red-500/40',
  High: 'text-amber-400 bg-amber-500/20 border-amber-500/40',
  Medium: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/40',
  Low: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40',
};

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1">
      <div
        className={`h-1.5 rounded-full transition-all ${color}`}
        style={{ width: `${Math.min(100, value)}%` }}
      />
    </div>
  );
}

function WorkflowStepper({ status }: { status: BDMSStatus }) {
  const currentIdx = WORKFLOW_STEPS.indexOf(status);
  return (
    <div className="flex items-center space-x-1">
      {WORKFLOW_STEPS.map((step, idx) => {
        const conf = STATUS_CONFIG[step];
        const isActive = idx === currentIdx;
        const isDone = idx < currentIdx;
        return (
          <React.Fragment key={step}>
            <div
              className={`flex items-center space-x-1 px-2 py-1 rounded text-[10px] font-mono font-semibold border transition-all ${
                isActive ? conf.bgColor + ' ' + conf.color
                  : isDone ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-slate-900 border-slate-800 text-slate-600'
              }`}
            >
              {isDone ? <CheckCircle2 className="w-3 h-3" /> : conf.icon}
              <span className="hidden sm:inline">{conf.label}</span>
            </div>
            {idx < WORKFLOW_STEPS.length - 1 && (
              <div className={`h-px w-3 ${isDone ? 'bg-emerald-500' : 'bg-slate-700'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export const BDMSWorkflow: React.FC = () => {
  const [requests, setRequests] = useState<BDMSBlockRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      const res = await apiFetch<BDMSBlockRequest[]>(`/bdms/gateway/requests?${params.toString()}`);
      let data = res.data || [];
      if (filterPriority) data = data.filter((r) => r.priority === filterPriority);
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, [filterStatus, filterPriority]);

  const handleApprove = async (blockId: string) => {
    setProcessingId(blockId);
    try {
      await apiFetch(`/bdms/gateway/requests/${blockId}/approve`, { method: 'PATCH' });
      setActionMsg({ msg: `Block ${blockId} approved successfully. BDMS Gateway notified.`, type: 'success' });
      fetchRequests();
    } catch (err) {
      setActionMsg({ msg: (err as Error).message, type: 'error' });
    } finally {
      setProcessingId(null);
      setTimeout(() => setActionMsg(null), 5000);
    }
  };

  const handleReject = async (blockId: string) => {
    setProcessingId(blockId);
    try {
      await apiFetch(`/bdms/gateway/requests/${blockId}/reject`, { method: 'PATCH' });
      setActionMsg({ msg: `Block ${blockId} rejected.`, type: 'error' });
      fetchRequests();
    } catch (err) {
      setActionMsg({ msg: (err as Error).message, type: 'error' });
    } finally {
      setProcessingId(null);
      setTimeout(() => setActionMsg(null), 5000);
    }
  };

  const handleSubmitBDMS = async () => {
    try {
      await apiFetch('/bdms/gateway/submit', { method: 'POST', body: JSON.stringify({}) });
      setActionMsg({ msg: 'BDMS Gateway submission triggered. Under-review blocks promoted.', type: 'success' });
      fetchRequests();
    } catch (err) {
      setActionMsg({ msg: (err as Error).message, type: 'error' });
    }
    setTimeout(() => setActionMsg(null), 5000);
  };

  const counts = {
    pending: requests.filter((r) => r.approval_status === 'pending').length,
    under_review: requests.filter((r) => r.approval_status === 'under_review').length,
    approved: requests.filter((r) => r.approval_status === 'approved').length,
    rejected: requests.filter((r) => r.approval_status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
            <FileText className="w-6 h-6 text-stage-amber" />
            <span>BDMS Block Request Workflow</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Closed-Loop BDMS Automation — Block Demand Management System (Prototype Gateway)
          </p>
          <div className="mt-1 flex items-center space-x-1.5">
            <Info className="w-3 h-3 text-amber-400" />
            <span className="text-[11px] text-amber-400 font-mono">PROTOTYPE — No direct Indian Railways BDMS connection. Mock gateway for demonstration.</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleSubmitBDMS}
            className="px-4 py-2 rounded-lg bg-stage-amber text-white text-xs font-semibold hover:bg-amber-500 flex items-center space-x-2 shadow-lg shadow-amber-500/20"
          >
            <Send className="w-4 h-4" />
            <span>Submit to BDMS Gateway</span>
          </button>
          <button
            onClick={fetchRequests}
            className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-white flex items-center space-x-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Action Message */}
      {actionMsg && (
        <div className={`p-3 rounded-xl border text-xs font-mono flex items-center space-x-2 ${
          actionMsg.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {actionMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
          <span>{actionMsg.msg}</span>
        </div>
      )}

      {/* Summary KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Pending / Draft', count: counts.pending, color: 'text-slate-300', bar: 'bg-slate-500' },
          { label: 'Under Review', count: counts.under_review, color: 'text-amber-400', bar: 'bg-amber-500' },
          { label: 'Approved', count: counts.approved, color: 'text-emerald-400', bar: 'bg-emerald-500' },
          { label: 'Rejected', count: counts.rejected, color: 'text-red-400', bar: 'bg-red-500' },
        ].map((s) => (
          <div key={s.label} className="bg-[#0f172a] p-4 rounded-xl border border-slate-800 shadow-xl">
            <div className={`text-2xl font-bold font-mono ${s.color}`}>{s.count}</div>
            <div className="text-xs text-slate-400 font-mono">{s.label}</div>
            <ScoreBar value={(s.count / Math.max(requests.length, 1)) * 100} color={s.bar} />
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
          <span>Filter by Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono outline-none focus:border-cyan-500"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="executed">Executed</option>
          </select>
        </div>
        <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
          <span>Priority:</span>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono outline-none focus:border-cyan-500"
          >
            <option value="">All</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
        <span className="text-xs font-mono text-slate-500 ml-auto">{requests.length} block request(s) found</span>
      </div>

      {/* Block Request Cards */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 font-mono animate-pulse bg-[#0f172a] rounded-xl border border-slate-800">
          Loading BDMS block requests from gateway...
        </div>
      ) : requests.length === 0 ? (
        <div className="p-12 text-center text-slate-500 font-mono bg-[#0f172a] rounded-xl border border-slate-800">
          No block requests found. Run CP-SAT Solver and Apply Shadow Blocking first.
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            const conf = STATUS_CONFIG[req.approval_status] || STATUS_CONFIG.pending;
            const isExpanded = expandedId === req.block_id;
            const isProcessing = processingId === req.block_id;

            return (
              <div key={req.block_id} className={`bg-[#0f172a] rounded-xl border shadow-xl overflow-hidden transition-all ${conf.bgColor}`}>
                {/* Card Header */}
                <div
                  className="p-5 cursor-pointer hover:bg-slate-900/30 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : req.block_id)}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    {/* Left: Block ID + Status */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2.5">
                        <span className="text-base font-bold font-mono text-slate-100">{req.block_id}</span>
                        <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold uppercase ${conf.bgColor} ${conf.color}`}>
                          {conf.icon}
                          <span>{conf.label}</span>
                        </span>
                        <span className={`px-2 py-0.5 rounded border text-[10px] font-mono font-bold ${PRIORITY_COLORS[req.priority] || ''}`}>
                          {req.priority}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-cyan-400 font-semibold">{req.corridor}</div>
                      <div className="text-xs text-slate-400 font-mono">
                        {req.start_station} → {req.end_station}
                        <span className="ml-3 text-amber-400">
                          {new Date(req.start_time).toLocaleDateString()} {new Date(req.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {' '}–{' '}
                          {new Date(req.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {/* Dept badges */}
                      <div className="flex flex-wrap gap-1.5">
                        {req.departments_involved.map((d) => (
                          <span key={d} className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] font-mono border border-slate-700">
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Right: Scores + Expand */}
                    <div className="flex items-center space-x-4">
                      <div className="text-right space-y-1 text-xs font-mono">
                        <div className="text-slate-400">Priority Score</div>
                        <div className="text-amber-400 font-bold text-base">{req.priority_score.toFixed(1)}</div>
                        <ScoreBar value={req.priority_score} color="bg-amber-500" />
                      </div>
                      <div className="text-right space-y-1 text-xs font-mono">
                        <div className="text-slate-400">Risk Score</div>
                        <div className="text-red-400 font-bold text-base">{req.risk_score.toFixed(1)}</div>
                        <ScoreBar value={req.risk_score} color="bg-red-500" />
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </div>

                  {/* Workflow stepper */}
                  <div className="mt-4 overflow-x-auto">
                    <WorkflowStepper status={req.approval_status} />
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-slate-800/60 p-5 space-y-4">
                    {/* Detail Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono">
                      <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
                        <div className="text-slate-400">Block ID</div>
                        <div className="text-slate-100 font-bold">{req.block_id}</div>
                      </div>
                      <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
                        <div className="text-slate-400">Section ID</div>
                        <div className="text-cyan-400 font-bold">{req.section_id}</div>
                      </div>
                      <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
                        <div className="text-slate-400">Conflict Score</div>
                        <div className="text-orange-400 font-bold">{req.conflict_score.toFixed(1)} / 100</div>
                      </div>
                      <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
                        <div className="text-slate-400">Submitted At</div>
                        <div className="text-slate-300">{new Date(req.submitted_at).toLocaleString()}</div>
                      </div>
                      <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
                        <div className="text-slate-400">Gateway Response</div>
                        <div className="text-slate-300">
                          {req.gateway_response_at ? new Date(req.gateway_response_at).toLocaleString() : '—'}
                        </div>
                      </div>
                      <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
                        <div className="text-slate-400">Priority Classification</div>
                        <div className={`font-bold ${PRIORITY_COLORS[req.priority]?.split(' ')[0] || 'text-white'}`}>
                          {req.priority}
                        </div>
                      </div>
                    </div>

                    {/* Tasks Included */}
                    <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 space-y-2">
                      <div className="text-xs font-mono font-bold text-slate-300">Maintenance Tasks:</div>
                      <div className="flex flex-wrap gap-2">
                        {req.maintenance_tasks.map((t, i) => (
                          <span key={i} className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-300 rounded text-[11px] font-mono">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Reason */}
                    <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 space-y-1">
                      <div className="text-xs font-mono font-bold text-slate-300">Reason for Maintenance:</div>
                      <div className="text-xs text-slate-400 leading-relaxed font-sans">{req.reason_for_maintenance}</div>
                    </div>

                    {/* Prototype Notice */}
                    <div className="flex items-start space-x-2 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                      <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-amber-400 font-mono">{req.notes}</p>
                    </div>

                    {/* Action Buttons */}
                    {(req.approval_status === 'pending' || req.approval_status === 'under_review') && (
                      <div className="flex items-center justify-end space-x-3 pt-2">
                        <button
                          onClick={() => handleReject(req.block_id)}
                          disabled={isProcessing}
                          className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-semibold hover:bg-red-500/30 transition-all flex items-center space-x-1.5"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>{isProcessing ? 'Processing...' : 'Reject Block'}</span>
                        </button>
                        <button
                          onClick={() => handleApprove(req.block_id)}
                          disabled={isProcessing}
                          className="px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/30 transition-all flex items-center space-x-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isProcessing ? 'Processing...' : 'Approve Block'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
