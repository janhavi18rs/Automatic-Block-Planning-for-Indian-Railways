import React, { useState } from 'react';
import { apiFetch } from '../api/client';
import { Database, ShieldCheck, ExternalLink, RefreshCw, Info, AlertCircle } from 'lucide-react';

const dataSourceRegistry = [
  {
    table: 'track_sections',
    name: 'Indian Railways Track Section Geometry',
    source: 'DataMeet OpenStreetMap Indian Railways GeoJSON Extract',
    is_simulated: false,
    publicUrl: 'https://github.com/datameet/indian_railways',
    recordsCount: '5 Major Corridors Loaded',
    description: 'Real LineString track section geometry with zone, division, and station metadata.',
  },
  {
    table: 'train_schedule',
    name: 'Indian Railways Timetable & Train Schedule',
    source: 'data.gov.in Published Train Timetable CSV',
    is_simulated: false,
    publicUrl: 'https://data.gov.in/resource/indian-railways-train-schedule',
    recordsCount: '10 Express & Freight Schedules Loaded',
    description: 'Real train arrival/departure timings, frequency, and train type attributes.',
  },
  {
    table: 'rapidapi_irctc_live_trains',
    name: 'Indian Railways RapidAPI / NTES Live Train Telemetry',
    source: 'RapidAPI Indian Railway IRCTC API (Live NTES Feed)',
    is_simulated: false,
    publicUrl: 'https://rapidapi.com/hub',
    recordsCount: 'Live NTES API Integration Active',
    description: 'Real-time train running status, delay minutes, and station passage events to back what-if simulations with live train telemetry.',
  },
  {
    table: 'tms_defects',
    name: 'Track Management System (TMS) Defects',
    source: 'Statistical Synthetic Generator (Year Book Tuned)',
    is_simulated: true,
    recordsCount: 'Simulated Records (is_simulated=True)',
    description: 'Track geometry defects, rail fractures, and speed restrictions tuned to IR Year Book statistics.',
  },
  {
    table: 'smms_faults',
    name: 'Signal & Telecom Management System (SMMS) Faults',
    source: 'Statistical Synthetic Generator (Year Book Tuned)',
    is_simulated: true,
    recordsCount: 'Simulated Records (is_simulated=True)',
    description: 'Interlocking, axle counter, and point machine fault logs.',
  },
  {
    table: 'tdms_faults',
    name: 'Traction Distribution Management System (TDMS) Faults',
    source: 'Statistical Synthetic Generator (Year Book Tuned)',
    is_simulated: true,
    recordsCount: 'Simulated Records (is_simulated=True)',
    description: 'OHE power block requirements, substation breakdowns, and line maintenance requests.',
  },
  {
    table: 'bdms_requests',
    name: 'Block Demand Management System (BDMS) Requests',
    source: 'Statistical Synthetic Generator (Year Book Tuned)',
    is_simulated: true,
    recordsCount: 'Simulated Records (is_simulated=True)',
    description: 'Multi-department maintenance block requests with crew & machine requirements.',
  },
];

export const DataSources: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [genMessage, setGenMessage] = useState('');

  const handleRegenerateSyntheticData = async () => {
    setIsGenerating(true);
    setGenMessage('');
    try {
      const res = await apiFetch<any>('/admin/synthetic/generate', {
        method: 'POST',
        body: JSON.stringify({ count: 3 }),
      });
      setGenMessage(`Regenerated synthetic records successfully with is_simulated=True! ${JSON.stringify(res.data)}`);
    } catch (err) {
      alert('Error generating data: ' + (err as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center space-x-2">
            <Database className="w-5 h-5 sm:w-6 sm:h-6 text-stage-blue shrink-0" />
            <span>Data Ingestion & Integrity Transparency</span>
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-400 font-mono">
            Explicit distinction between Real Indian Railways Datasets and Year-Book-Tuned Synthetic Defects
          </p>
        </div>

        <button
          onClick={handleRegenerateSyntheticData}
          disabled={isGenerating}
          className="self-start sm:self-auto px-3.5 py-2 rounded-lg bg-stage-blue text-white text-xs font-semibold hover:bg-blue-600 flex items-center space-x-2 shadow-lg shadow-blue-500/20"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
          <span>{isGenerating ? 'Generating...' : 'Regenerate Synthetic Data'}</span>
        </button>
      </div>

      {genMessage && (
        <div className="p-3 sm:p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl text-xs font-mono text-cyan-300 break-all">
          {genMessage}
        </div>
      )}

      {/* Registry Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dataSourceRegistry.map((item) => (
          <div key={item.table} className="bg-[#0f172a] p-4 sm:p-5 rounded-xl border border-slate-800 shadow-xl space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {item.table}
                </span>
                {item.is_simulated ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    Synthetic (is_simulated=True)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    Real IR Open Data
                  </span>
                )}
              </div>

              <h2 className="text-sm sm:text-base font-bold text-slate-100">{item.name}</h2>
              <p className="text-xs text-slate-400 font-sans leading-relaxed">{item.description}</p>
            </div>

            <div className="pt-3 border-t border-slate-800/80 space-y-1.5 text-xs font-mono">
              <div className="text-slate-400 truncate">
                Source: <span className="text-slate-200 font-semibold">{item.source}</span>
              </div>
              <div className="text-slate-400">
                Loaded: <span className="text-cyan-400 font-semibold">{item.recordsCount}</span>
              </div>
              {item.publicUrl && (
                <a
                  href={item.publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400 hover:text-blue-300 inline-flex items-center space-x-1 pt-1"
                >
                  <span>View Original Public Source</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
