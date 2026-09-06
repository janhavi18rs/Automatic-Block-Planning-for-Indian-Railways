import React, { useState } from 'react';
import { Clock, Layers, CheckCircle, RefreshCw, Sparkles, UserCheck } from 'lucide-react';
import { apiFetch } from '../api/client';

export interface ScheduleItem {
  id: number;
  horizon_type: string;
  section_id: string;
  planned_start: string;
  planned_end: string;
  departments: string[];
  status: string;
}

interface GanttTimelineProps {
  schedules: ScheduleItem[];
  horizon: 'monthly' | 'weekly';
  onScheduleUpdated: () => void;
}

export const GanttTimeline: React.FC<GanttTimelineProps> = ({ schedules, horizon, onScheduleUpdated }) => {
  const [selectedSlot, setSelectedSlot] = useState<ScheduleItem | null>(null);
  const [isOverriding, setIsOverriding] = useState(false);
  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');
  const [reason, setReason] = useState('Optimized crew window realignment');

  // Distinct list of sections
  const trackSections = Array.from(new Set(schedules.map((s) => s.section_id)));
  if (trackSections.length === 0) {
    trackSections.push('SEC-NDLS-CNB', 'SEC-CNB-PRYJ', 'SEC-BCT-PUNE', 'SEC-HWH-ASN');
  }

  // Time slots column headers
  const timeSlots = horizon === 'monthly'
    ? Array.from({ length: 12 }, (_, i) => `Day ${i * 2 + 1}`)
    : ['Mon 02:00', 'Tue 02:00', 'Wed 02:00', 'Thu 02:00', 'Fri 02:00', 'Sat 02:00', 'Sun 02:00'];

  const getDeptColorClass = (depts: string[], status: string) => {
    if (status === 'shadow_blocked' || depts.length > 1) {
      return 'bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-blue-500/20 border-amber-500/80 text-amber-200';
    }
    if (depts.includes('engineering')) return 'bg-blue-950/80 border-blue-500/70 text-blue-200';
    if (depts.includes('signal_telecom')) return 'bg-purple-950/80 border-purple-500/70 text-purple-200';
    return 'bg-amber-950/80 border-amber-500/70 text-amber-200';
  };

  const handleOpenOverride = (slot: ScheduleItem) => {
    setSelectedSlot(slot);
    setNewStart(slot.planned_start ? slot.planned_start.substring(0, 16) : '');
    setNewEnd(slot.planned_end ? slot.planned_end.substring(0, 16) : '');
  };

  const handleApplyOverride = async () => {
    if (!selectedSlot) return;
    setIsOverriding(true);
    try {
      await apiFetch(`/schedule/slots/${selectedSlot.id}/override`, {
        method: 'PATCH',
        body: JSON.stringify({
          new_start: new Date(newStart).toISOString(),
          new_end: new Date(newEnd).toISOString(),
          reason,
        }),
      });
      setSelectedSlot(null);
      onScheduleUpdated();
    } catch (err) {
      alert('Failed to override slot: ' + (err as Error).message);
    } finally {
      setIsOverriding(false);
    }
  };

  return (
    <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-5 shadow-2xl space-y-4">
      {/* Header & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
            <Layers className="w-5 h-5 text-stage-amber" />
            <span>Interactive Corridor Block Timeline</span>
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Rows = Track Sections | Columns = {horizon === 'monthly' ? '30-Day Calendar' : '7-Day Hourly Dispatch Matrix'}
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded bg-blue-600 border border-blue-400"></span>
            <span className="text-slate-300">Engineering</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded bg-purple-600 border border-purple-400"></span>
            <span className="text-slate-300">Signal & Telecom</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded bg-amber-600 border border-amber-400"></span>
            <span className="text-slate-300">Traction</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded bg-gradient-to-r from-amber-500 via-purple-500 to-blue-500 border border-amber-400"></span>
            <span className="text-amber-300 font-bold">Shadow Blocked (Merged)</span>
          </div>
        </div>
      </div>

      {/* SVG / Canvas Timeline Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[950px]">
          {/* Timeline Header Row */}
          <div className="grid grid-cols-8 gap-2 bg-slate-900/90 p-2.5 rounded-t-lg border-b border-slate-800 text-xs font-mono text-slate-400 text-center font-semibold">
            <div className="text-left pl-2 text-slate-300">Track Section</div>
            {timeSlots.map((slot, idx) => (
              <div key={idx} className="truncate">
                {slot}
              </div>
            ))}
          </div>

          {/* Timeline Section Rows */}
          <div className="divide-y divide-slate-800/60 bg-slate-950/40 rounded-b-lg border border-slate-800">
            {trackSections.map((secId) => {
              const secSchedules = schedules.filter((s) => s.section_id === secId);

              return (
                <div key={secId} className="grid grid-cols-8 gap-2 p-3 items-center hover:bg-slate-900/40 transition-colors">
                  {/* Row Label */}
                  <div className="font-mono font-bold text-xs text-cyan-400 flex items-center space-x-1.5 truncate">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0"></span>
                    <span className="truncate">{secId}</span>
                  </div>

                  {/* Schedule Slots */}
                  {timeSlots.map((_, slotIdx) => {
                    // Render schedule card only for designated slot indices to prevent spam duplicates
                    const matchedSlot = secSchedules[slotIdx % secSchedules.length];
                    const isOccupied = secSchedules.length > 0 && (slotIdx % Math.ceil(timeSlots.length / Math.max(1, secSchedules.length)) === 0);

                    if (!isOccupied || !matchedSlot) {
                      return (
                        <div key={slotIdx} className="h-12 rounded-lg border border-dashed border-slate-800/40 bg-slate-900/20 flex items-center justify-center text-[10px] text-slate-600 font-mono">
                          Clear Window
                        </div>
                      );
                    }

                    const isShadow = matchedSlot.status === 'shadow_blocked' || matchedSlot.departments.length > 1;

                    return (
                      <div
                        key={slotIdx}
                        onClick={() => handleOpenOverride(matchedSlot)}
                        className={`h-12 rounded-lg border p-2 cursor-pointer transition-all hover:scale-[1.03] hover:shadow-xl flex flex-col justify-between ${getDeptColorClass(
                          matchedSlot.departments,
                          matchedSlot.status
                        )}`}
                        title={`Click to adjust slot. Depts: ${matchedSlot.departments.join(', ')}`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                          <span className="truncate max-w-[80px]">
                            {isShadow ? 'MULTI-DEPT' : matchedSlot.departments[0]?.toUpperCase()}
                          </span>
                          {isShadow && (
                            <span className="px-1 py-0.2 bg-amber-400 text-slate-950 text-[8px] rounded font-black tracking-tighter shrink-0">
                              SHADOW
                            </span>
                          )}
                        </div>
                        <div className="text-[9px] font-mono opacity-90 flex items-center justify-between">
                          <span>02:00 - 05:00</span>
                          <span className="font-bold">3h</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Interactive Slot Override Modal */}
      {selectedSlot && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <Clock className="w-5 h-5 text-stage-amber" />
                <span>Adjust Schedule Slot #{selectedSlot.id}</span>
              </h3>
              <button onClick={() => setSelectedSlot(null)} className="text-slate-400 hover:text-slate-200">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-900 p-3 rounded-lg font-mono space-y-1 text-slate-300">
                <div>Section: <span className="text-cyan-400 font-bold">{selectedSlot.section_id}</span></div>
                <div>Departments: <span className="text-amber-400">{selectedSlot.departments.join(', ')}</span></div>
                <div>Status: <span className="text-emerald-400 font-bold">{selectedSlot.status}</span></div>
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1">New Start Time:</label>
                <input
                  type="datetime-local"
                  value={newStart}
                  onChange={(e) => setNewStart(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-200 font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1">New End Time:</label>
                <input
                  type="datetime-local"
                  value={newEnd}
                  onChange={(e) => setNewEnd(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-200 font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1">Override Reason:</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-200 font-mono outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setSelectedSlot(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyOverride}
                disabled={isOverriding}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-stage-amber text-white hover:bg-amber-600 flex items-center space-x-2 shadow-lg shadow-amber-500/20"
              >
                {isOverriding ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Re-optimizing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Apply & Re-solve</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
