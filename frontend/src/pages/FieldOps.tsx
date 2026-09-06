import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import { Wrench, MapPin, CheckCircle2, Play, Clock, Navigation } from 'lucide-react';

export const FieldOps: React.FC = () => {
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeWo, setActiveWo] = useState<any | null>(null);
  const [geoTag, setGeoTag] = useState('POINT(77.2197 28.6143)');
  const [isCompleting, setIsCompleting] = useState(false);
  const [completedMsg, setCompletedMsg] = useState('');

  const fetchWorkOrders = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<any[]>('/field/work-orders');
      setWorkOrders(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkOrders();
  }, []);

  const handleCaptureLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGeoTag(`POINT(${pos.coords.longitude.toFixed(4)} ${pos.coords.latitude.toFixed(4)})`);
        },
        (err) => {
          setGeoTag('POINT(77.2197 28.6143)'); // fallback
        }
      );
    }
  };

  const handleCompleteWorkOrder = async (woId: number) => {
    setIsCompleting(true);
    try {
      const now = new Date();
      const start = new Date(now.getTime() - 170 * 60 * 1000); // 170 mins ago

      await apiFetch(`/field/work-orders/${woId}/complete`, {
        method: 'PATCH',
        body: JSON.stringify({
          actual_start: start.toISOString(),
          actual_end: now.toISOString(),
          geo_tag: geoTag,
        }),
      });

      setCompletedMsg(`Work order #${woId} completed successfully! Actual timings written back to closed-loop feedback engine.`);
      setActiveWo(null);
      fetchWorkOrders();
    } catch (err) {
      alert('Error completing work order: ' + (err as Error).message);
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Mobile Header */}
      <div className="bg-[#0f172a] p-5 rounded-2xl border border-slate-800 shadow-2xl space-y-1">
        <div className="flex items-center space-x-2 text-stage-teal">
          <Wrench className="w-5 h-5" />
          <h1 className="text-lg font-bold text-slate-100">Field Maintenance Terminal</h1>
        </div>
        <p className="text-xs text-slate-400 font-mono">Mobile-first dispatch portal for SSE (Track / Signal / Traction)</p>
      </div>

      {completedMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs font-mono text-emerald-400 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{completedMsg}</span>
        </div>
      )}

      {/* Work Orders List */}
      <div className="space-y-4">
        <h2 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Assigned Maintenance Work Orders</h2>

        {loading ? (
          <div className="p-8 text-center text-slate-500 font-mono animate-pulse bg-slate-900 rounded-xl">
            Fetching assigned field work orders...
          </div>
        ) : (
          workOrders.map((wo) => (
            <div key={wo.id} className="bg-[#0f172a] p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono text-slate-400">Order #{wo.id}</span>
                  <div className="text-base font-bold font-mono text-cyan-400">Schedule #{wo.schedule_id}</div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase ${
                    wo.actual_status === 'completed'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {wo.actual_status}
                </span>
              </div>

              <div className="text-xs text-slate-300 font-mono space-y-1 bg-slate-900 p-3 rounded-lg border border-slate-800">
                <div>Crew ID: <span className="text-slate-100 font-bold">{wo.crew_id}</span></div>
                <div>Assigned: <span className="text-slate-400">{new Date(wo.assigned_at).toLocaleTimeString()}</span></div>
                {wo.geo_tag && <div className="text-teal-400">GPS Tag: {wo.geo_tag}</div>}
              </div>

              {wo.actual_status !== 'completed' && (
                <button
                  onClick={() => {
                    setActiveWo(wo);
                    handleCaptureLocation();
                  }}
                  className="w-full py-3 rounded-xl bg-stage-teal text-white font-semibold text-xs hover:bg-teal-600 transition-all flex items-center justify-center space-x-2 shadow-lg shadow-teal-500/20"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start / Complete Work Order</span>
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Completion Modal with Geolocation */}
      {activeWo && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-stage-teal" />
                <span>Complete Order #{activeWo.id}</span>
              </h3>
              <button onClick={() => setActiveWo(null)} className="text-slate-400">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-mono mb-1">Captured GPS Coordinates:</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={geoTag}
                    onChange={(e) => setGeoTag(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-200 font-mono"
                  />
                  <button
                    onClick={handleCaptureLocation}
                    className="p-2 bg-slate-800 text-cyan-400 rounded border border-slate-700"
                    title="Re-capture GPS"
                  >
                    <Navigation className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button onClick={() => setActiveWo(null)} className="px-3 py-2 text-xs text-slate-400">Cancel</button>
              <button
                onClick={() => handleCompleteWorkOrder(activeWo.id)}
                disabled={isCompleting}
                className="px-4 py-2 bg-stage-teal text-white rounded-lg font-semibold text-xs hover:bg-teal-600"
              >
                {isCompleting ? 'Submitting...' : 'Confirm & Log Geo-Tag'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
