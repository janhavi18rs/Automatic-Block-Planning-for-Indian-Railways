import React, { useEffect, useState } from 'react';
import { ShieldAlert, BarChart, Layers, X, Info } from 'lucide-react';
import { apiFetch } from '../api/client';
import { BarChart as ReBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface SectionDrawerProps {
  sectionId: string | null;
  onClose: () => void;
}

export const SectionDrawer: React.FC<SectionDrawerProps> = ({ sectionId, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [sectionData, setSectionData] = useState<any>(null);
  const [explainability, setExplainability] = useState<any>(null);

  useEffect(() => {
    if (!sectionId) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const secRes = await apiFetch<any>(`/track-sections/${sectionId}`);
        setSectionData(secRes.data);

        // Fetch explainability for active events if present
        if (secRes.data?.active_events && secRes.data.active_events.length > 0) {
          const evId = secRes.data.active_events[0].id;
          const expRes = await apiFetch<any>(`/scoring/criticality/${evId}`);
          setExplainability(expRes.data);
        } else {
          setExplainability(null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [sectionId]);

  if (!sectionId) return null;

  const chartData = explainability?.feature_breakdown
    ? [
        { name: 'Severity', value: explainability.feature_breakdown.severity_impact, color: '#ef4444' },
        { name: 'Traffic', value: explainability.feature_breakdown.traffic_density_impact, color: '#f59e0b' },
        { name: 'Overdue', value: explainability.feature_breakdown.overdue_penalty, color: '#ec4899' },
        { name: 'Multi-Dept', value: explainability.feature_breakdown.multi_dept_synergy, color: '#8b5cf6' },
        { name: 'Speed Restr', value: explainability.feature_breakdown.speed_restriction_penalty, color: '#06b6d4' },
      ]
    : [];

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-[#0f172a] border-l border-slate-800 z-50 shadow-2xl flex flex-col justify-between">
      {/* Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
        <div className="flex items-center space-x-2">
          <Layers className="w-5 h-5 text-stage-purple" />
          <h2 className="font-bold text-slate-100 text-base">Track Section Details</h2>
        </div>
        <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body Content */}
      <div className="p-6 flex-1 overflow-y-auto space-y-6">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-20 bg-slate-800 rounded-lg"></div>
            <div className="h-40 bg-slate-800 rounded-lg"></div>
          </div>
        ) : (
          <>
            {/* Section Overview Card */}
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-base text-cyan-400">{sectionId}</span>
                <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono text-xs border border-blue-500/20">
                  {sectionData?.zone || 'NCR'} / {sectionData?.division || 'PRYJ'}
                </span>
              </div>
              <div className="text-xs text-slate-400 font-mono flex items-center justify-between pt-1">
                <span>Start: <strong className="text-slate-200">{sectionData?.start_station || 'NDLS'}</strong></span>
                <span>End: <strong className="text-slate-200">{sectionData?.end_station || 'CNB'}</strong></span>
              </div>
            </div>

            {/* Active Corridor Events */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                <ShieldAlert className="w-4 h-4 text-stage-purple" />
                <span>Active Synthesized Corridor Events</span>
              </h3>

              {sectionData?.active_events && sectionData.active_events.length > 0 ? (
                sectionData.active_events.map((ev: any) => (
                  <div key={ev.id} className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono text-slate-400">Event #{ev.id}</span>
                        <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-xs font-bold border border-purple-500/30">
                          Score: {ev.score}/100
                        </span>
                      </div>
                      <span className="text-xs font-mono text-emerald-400">{ev.status}</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {(ev.departments || ['engineering']).map((d: string) => (
                        <span key={d} className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 bg-slate-900/50 rounded-lg text-xs text-slate-500 font-mono text-center">
                  No active high-criticality events on this section.
                </div>
              )}
            </div>

            {/* Explainability Panel */}
            {explainability && (
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
                <h3 className="text-xs font-mono font-semibold text-slate-300 flex items-center space-x-1.5">
                  <BarChart className="w-4 h-4 text-cyan-400" />
                  <span>Criticality Score Explainability Panel</span>
                </h3>

                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  {explainability.explanation}
                </p>

                {/* Recharts Bar Chart Breakdown */}
                <div className="h-44 pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <ReBarChart data={chartData} layout="vertical" margin={{ left: -10, right: 10 }}>
                      <XAxis type="number" stroke="#64748b" fontSize={10} />
                      <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={65} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </ReBarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
