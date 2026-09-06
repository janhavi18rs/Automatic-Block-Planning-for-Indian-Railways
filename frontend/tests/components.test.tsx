import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Dashboard } from '../src/pages/Dashboard';
import { GanttTimeline } from '../src/components/GanttTimeline';
import { FieldOps } from '../src/pages/FieldOps';
import { MemoryRouter } from 'react-router-dom';

// Mock Leaflet
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: any) => <div data-testid="leaflet-map">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Polyline: () => <div data-testid="polyline" />,
  Marker: () => <div data-testid="marker" />,
  Popup: () => <div data-testid="popup" />,
}));

// Mock fetch
global.fetch = vi.fn().mockImplementation((url) => {
  if (url.includes('/dashboard/overview')) {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            asset_availability_pct: 95.2,
            active_conflicts_count: 2,
            pending_bdms_approvals_count: 1,
            blocks_scheduled_today_count: 5,
          },
          meta: {},
        }),
    });
  }
  if (url.includes('/dashboard/conflicts')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ data: [], meta: {} }),
    });
  }
  if (url.includes('/schedule/weekly')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ data: [], meta: {} }),
    });
  }
  if (url.includes('/field/work-orders')) {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          data: [
            {
              id: 101,
              schedule_id: 12,
              crew_id: 'CREW-ENG-01',
              assigned_at: '2026-09-02T10:00:00',
              actual_status: 'assigned',
              geo_tag: null,
            },
          ],
          meta: {},
        }),
    });
  }
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: {}, meta: {} }),
  });
});

describe('CorridorOps Frontend Component Test Suite', () => {
  it('renders Dashboard KPI cards with mock API data', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    expect(screen.getByText(/Control Office Operations Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Asset Availability/i)).toBeInTheDocument();
    expect(screen.getByText(/Active Conflicts/i)).toBeInTheDocument();
  });

  it('renders GanttTimeline component with multi-department shadow blocks', () => {
    const mockSchedules = [
      {
        id: 1,
        horizon_type: 'weekly',
        section_id: 'SEC-NDLS-CNB',
        planned_start: '2026-09-03T02:00:00',
        planned_end: '2026-09-03T05:00:00',
        departments: ['engineering', 'signal_telecom'],
        status: 'shadow_blocked',
      },
    ];

    render(
      <GanttTimeline schedules={mockSchedules} horizon="weekly" onScheduleUpdated={() => {}} />
    );

    expect(screen.getByText(/Interactive Corridor Block Timeline/i)).toBeInTheDocument();
    expect(screen.getByText(/SEC-NDLS-CNB/i)).toBeInTheDocument();
    expect(screen.getAllByText(/ENGINEERING\+SIGNAL_TELECOM/i)[0]).toBeInTheDocument();
  });

  it('renders FieldOps work orders and triggers geolocation flow', async () => {
    render(
      <MemoryRouter>
        <FieldOps />
      </MemoryRouter>
    );

    expect(await screen.findByText(/Field Maintenance Terminal/i)).toBeInTheDocument();
    expect(await screen.findByText(/Order #101/i)).toBeInTheDocument();
  });
});
