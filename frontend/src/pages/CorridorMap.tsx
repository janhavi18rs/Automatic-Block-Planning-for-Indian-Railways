import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Popup, useMap } from 'react-leaflet';
import { apiFetch } from '../api/client';
import { SectionDrawer } from '../components/SectionDrawer';
import { Map as MapIcon } from 'lucide-react';
import { useOpsStore } from '../stores/opsStore';
import { DIVISIONS } from '../constants/divisions';

const MapRecenter: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

export const CorridorMap: React.FC = () => {
  const { division } = useOpsStore();
  const [sections, setSections] = useState<any[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  const activeDiv = DIVISIONS[division] || DIVISIONS.PRYJ;

  useEffect(() => {
    const fetchSections = async () => {
      try {
        const res = await apiFetch<any[]>('/track-sections');
        setSections(res.data || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchSections();
  }, []);

  const allCorridors = Object.values(DIVISIONS).flatMap((d) => d.corridors);

  const getScoreColor = (score: number) => {
    if (score >= 70) return '#ef4444'; // Red
    if (score >= 40) return '#f59e0b'; // Amber
    return '#10b981'; // Green
  };

  return (
    <div className="space-y-4 h-[calc(100vh-6rem)] flex flex-col">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0f172a] p-4 rounded-xl border border-slate-800 shrink-0">
        <div>
          <h1 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
            <MapIcon className="w-5 h-5 text-stage-purple" />
            <span>Interactive Corridor Geometry & GIS Map</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Active Division Focus: <span className="text-cyan-400 font-bold">{activeDiv.name} ({activeDiv.railway})</span> | Click any section polyline to inspect active events & telemetry.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-4 text-xs font-mono">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            <span className="text-slate-300">Low Risk (&lt;40)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500"></span>
            <span className="text-slate-300">Moderate (40-70)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span className="text-slate-300">Critical (&gt;70)</span>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 rounded-xl overflow-hidden border border-slate-800 relative z-0 shadow-2xl">
        <MapContainer center={activeDiv.center} zoom={activeDiv.zoom} style={{ height: '100%', width: '100%' }}>
          <MapRecenter center={activeDiv.center} zoom={activeDiv.zoom} />
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            className="map-tiles-dark"
          />

          {allCorridors.map((c) => {
            const isSelectedDivision = activeDiv.sections.includes(c.section_id);
            return (
              <Polyline
                key={c.section_id}
                positions={c.coords}
                color={getScoreColor(c.score)}
                weight={isSelectedDivision ? 8 : 4}
                opacity={isSelectedDivision ? 0.95 : 0.4}
                eventHandlers={{
                  click: () => setSelectedSectionId(c.section_id),
                }}
              >
                <Popup>
                  <div className="font-mono text-xs p-1 space-y-1">
                    <div className="font-bold text-slate-900">{c.section_id}</div>
                    <div className="text-slate-700">{c.name}</div>
                    <div className="text-purple-700 font-bold">Criticality Score: {c.score}/100</div>
                    <button
                      onClick={() => setSelectedSectionId(c.section_id)}
                      className="mt-1 px-2 py-1 bg-purple-600 text-white rounded text-[10px] font-bold w-full"
                    >
                      Open Explainability Drawer
                    </button>
                  </div>
                </Popup>
              </Polyline>
            );
          })}
        </MapContainer>
      </div>

      {/* Expandable Section Side Drawer */}
      <SectionDrawer sectionId={selectedSectionId} onClose={() => setSelectedSectionId(null)} />
    </div>
  );
};
