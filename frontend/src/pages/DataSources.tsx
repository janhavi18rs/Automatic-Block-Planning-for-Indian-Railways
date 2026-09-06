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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
            <Database className="w-6 h-6 text-stage-blue" />
            <span>Data Ingestion & Integrity Transparency Registry</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Explicit distinction between Real Indian Railways Datasets and Year-Book-Tuned Synthetic Defects
          </p>
        </div>

        <button
          onClick={handleRegenerateSyntheticData}
          disabled={isGenerating}
          className="px-4 py-2 rounded-lg bg-stage-blue text-white text-xs font-semibold hover:bg-blue-600 flex items-center space-x-2 shadow-lg shadow-blue-500/20"
        >
          <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
          <span>{isGenerating ? 'Generating...' : 'Regenerate Synthetic Data'}</span>
        </button>
      </div>

      {genMessage && (
        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl text-xs font-mono text-blue-400">
          {genMessage}
        </div>
      )}

      {/* Registry Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {dataSourceRegistry.map((ds) => (
          <div key={ds.table} className="bg-[#0f172a] p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="font-mono font-bold text-sm text-cyan-400">{ds.table}</div>
              {ds.is_simulated ? (
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>SIMULATED (is_simulated=True)</span>
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>REAL PUBLIC DATA</span>
                </span>
              )}
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-slate-100 text-sm">{ds.name}</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">{ds.description}</p>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Source: <strong className="text-slate-200">{ds.source}</strong></span>
              {ds.publicUrl && (
                <a
                  href={ds.publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 underline"
                >
                  <span>Public Link</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <div className={`absolute top-0 right-0 w-1.5 h-full ${ds.is_simulated ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
          </div>
        ))}
      </div>
    </div>
  );
};
