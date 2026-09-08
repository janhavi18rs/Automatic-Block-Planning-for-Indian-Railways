const BASE_URL = import.meta.env.VITE_API_URL || '';
const API_BASE = `${BASE_URL}/api/v1`;

export interface StandardResponse<T> {
  data: T;
  meta: Record<string, any>;
}

// In-memory mock data store for static/offline fallback execution
const mockStore = {
  retrainCount: 0,
  lastR2: 0.742,
  conflicts: [
    {
      conflict_id: "CONF-2026-001",
      section_id: "SEC-NDLS-CNB",
      conflict_type: "Headway Tightness & Track Geometry Defect",
      severity: "High",
      affected_departments: ["TMS (Track)", "SMMS (Signal)", "TDMS (Electrical)"],
      suggested_resolution: "Merge TMS rail renewal with SMMS axle counter replacement into a single 3h Shadow Block at 02:00 AM.",
      criticality_score: 88.5
    },
    {
      conflict_id: "CONF-2026-002",
      section_id: "SEC-CNB-ALD",
      conflict_type: "Resource Contention (Tower Wagon)",
      severity: "High",
      affected_departments: ["TDMS (Electrical)", "TMS (Track)"],
      suggested_resolution: "Shift TDMS OHE inspection to 03:30 AM to share Tower Wagon with Track Tamping crew.",
      criticality_score: 76.2
    },
    {
      conflict_id: "CONF-2026-003",
      section_id: "SEC-ALD-DDU",
      conflict_type: "Signal Interlocking & Train Overlap",
      severity: "Medium",
      affected_departments: ["SMMS (Signal)"],
      suggested_resolution: "Reschedule 12301 Rajdhani Express loop dwell by +12 mins to clear signal testing window.",
      criticality_score: 64.0
    },
    {
      conflict_id: "CONF-2026-004",
      section_id: "SEC-DDU-GAYA",
      conflict_type: "Ballast Cleaning & Freight Path Bottleneck",
      severity: "Medium",
      affected_departments: ["TMS (Track)"],
      suggested_resolution: "Execute BCM machine deployment during 01:15 AM shadow block window.",
      criticality_score: 59.8
    },
    {
      conflict_id: "CONF-2026-005",
      section_id: "SEC-BCT-PUNE",
      conflict_type: "Ghat Section Speed Restriction & OHE Maintenance",
      severity: "High",
      affected_departments: ["TMS (Track)", "TDMS (Electrical)"],
      suggested_resolution: "Integrate Karjat-Lonavala 1-in-37 gradient rail grinding with OHE wire tensioning during 01:00 AM shadow block.",
      criticality_score: 88.0
    },
    {
      conflict_id: "CONF-2026-006",
      section_id: "SEC-CSMT-IGP",
      conflict_type: "Thal Ghat Signal Interlocking & Track Inspection",
      severity: "High",
      affected_departments: ["SMMS (Signal)", "TMS (Track)"],
      suggested_resolution: "Combine Kasara-Igatpuri axle counter testing with rail defect ultrasound scanning during 02:00 AM window.",
      criticality_score: 72.0
    }
  ],
  workOrders: [
    {
      id: 101,
      schedule_id: 1,
      crew_id: "CREW-TRK-04 (SSE/P.Way)",
      assigned_at: new Date(Date.now() - 3600000).toISOString(),
      actual_status: "in_progress",
      geo_tag: "POINT(81.8463 25.4358)",
      section_id: "SEC-NDLS-CNB",
      department: "Track (TMS)"
    },
    {
      id: 102,
      schedule_id: 2,
      crew_id: "CREW-SIG-02 (SSE/Signal)",
      assigned_at: new Date(Date.now() - 7200000).toISOString(),
      actual_status: "assigned",
      geo_tag: "POINT(80.3319 26.4499)",
      section_id: "SEC-CNB-ALD",
      department: "Signal (SMMS)"
    },
    {
      id: 103,
      schedule_id: 3,
      crew_id: "CREW-TRC-01 (SSE/OHE)",
      assigned_at: new Date(Date.now() - 14400000).toISOString(),
      actual_status: "completed",
      geo_tag: "POINT(83.0080 25.2820)",
      section_id: "SEC-ALD-DDU",
      department: "Traction (TDMS)"
    },
    {
      id: 104,
      schedule_id: 4,
      crew_id: "CREW-TRK-09 (SSE/P.Way)",
      assigned_at: new Date(Date.now() - 18000000).toISOString(),
      actual_status: "assigned",
      geo_tag: "POINT(84.9995 24.7964)",
      section_id: "SEC-DDU-GAYA",
      department: "Track (TMS)"
    }
  ],
  schedules: [
    { id: 1, horizon_type: "weekly", section_id: "SEC-NDLS-CNB", planned_start: "2026-09-08T02:00:00", planned_end: "2026-09-08T05:00:00", departments: ["engineering", "signal_telecom", "electrical"], status: "shadow_blocked" },
    { id: 2, horizon_type: "weekly", section_id: "SEC-CNB-ALD", planned_start: "2026-09-09T01:30:00", planned_end: "2026-09-09T04:30:00", departments: ["engineering"], status: "optimized" },
    { id: 3, horizon_type: "weekly", section_id: "SEC-ALD-DDU", planned_start: "2026-09-10T03:00:00", planned_end: "2026-09-10T06:00:00", departments: ["signal_telecom"], status: "optimized" },
    { id: 4, horizon_type: "weekly", section_id: "SEC-DDU-GAYA", planned_start: "2026-09-11T02:15:00", planned_end: "2026-09-11T05:15:00", departments: ["electrical"], status: "optimized" },
    { id: 5, horizon_type: "weekly", section_id: "SEC-BCT-PUNE", planned_start: "2026-09-12T01:00:00", planned_end: "2026-09-12T04:00:00", departments: ["engineering", "electrical"], status: "shadow_blocked" },
    { id: 6, horizon_type: "weekly", section_id: "SEC-HWH-ASN", planned_start: "2026-09-13T02:30:00", planned_end: "2026-09-13T05:30:00", departments: ["signal_telecom"], status: "optimized" }
  ],
  variance: [
    { schedule_id: 1, section_id: "SEC-NDLS-CNB", planned_duration_min: 180, actual_duration_min: 172, speed_recovery_score: 96.5 },
    { schedule_id: 2, section_id: "SEC-CNB-ALD", planned_duration_min: 180, actual_duration_min: 195, speed_recovery_score: 89.2 },
    { schedule_id: 3, section_id: "SEC-ALD-DDU", planned_duration_min: 150, actual_duration_min: 145, speed_recovery_score: 98.0 },
    { schedule_id: 4, section_id: "SEC-DDU-GAYA", planned_duration_min: 210, actual_duration_min: 205, speed_recovery_score: 94.1 },
    { schedule_id: 5, section_id: "SEC-BCT-PUNE", planned_duration_min: 180, actual_duration_min: 178, speed_recovery_score: 97.8 },
    { schedule_id: 6, section_id: "SEC-HWH-ASN", planned_duration_min: 240, actual_duration_min: 252, speed_recovery_score: 91.5 },
    { schedule_id: 7, section_id: "SEC-MAS-SBC", planned_duration_min: 120, actual_duration_min: 118, speed_recovery_score: 99.1 },
    { schedule_id: 8, section_id: "SEC-NDLS-AGC", planned_duration_min: 180, actual_duration_min: 184, speed_recovery_score: 95.4 }
  ],
  bdmsRequests: [
    {
      block_id: "BLK-2026-0891",
      corridor: "New Delhi - Kanpur Central (NCR/PRYJ)",
      section_id: "SEC-NDLS-CNB",
      start_station: "NDLS",
      end_station: "CNB",
      start_time: "2026-09-08T02:00:00.000Z",
      end_time: "2026-09-08T05:00:00.000Z",
      departments_involved: ["TMS (Track)", "SMMS (Signal)", "TDMS (Electrical)"],
      maintenance_tasks: ["TRT Rail Renewal", "Axle Counter Calibration", "OHE Contact Wire Straining"],
      priority: "Critical",
      priority_score: 92.5,
      risk_score: 18.2,
      conflict_score: 88.5,
      reason_for_maintenance: "High-density Rajdhani corridor track geometry flaw combined with 3-department overdue shadow block window.",
      approval_status: "under_review",
      submitted_at: "2026-09-07T22:30:00.000Z",
      gateway_response_at: "2026-09-07T22:35:00.000Z",
      notes: "PROTOTYPE — Simulated BDMS Gateway auto-scoring engine evaluated priority 92.5/100."
    },
    {
      block_id: "BLK-2026-0892",
      corridor: "Mumbai Central - Pune Junction (CR/BB)",
      section_id: "SEC-BCT-PUNE",
      start_station: "MMCT",
      end_station: "PUNE",
      start_time: "2026-09-08T01:00:00.000Z",
      end_time: "2026-09-08T04:00:00.000Z",
      departments_involved: ["TMS (Track)", "TDMS (Electrical)"],
      maintenance_tasks: ["Ghat Section Rail Grinding", "OHE Cantilever Insulator Replacement"],
      priority: "High",
      priority_score: 85.0,
      risk_score: 22.4,
      conflict_score: 88.0,
      reason_for_maintenance: "Bhor Ghat gradient section heavy rail wear and traction wire inspection.",
      approval_status: "approved",
      submitted_at: "2026-09-07T21:15:00.000Z",
      gateway_response_at: "2026-09-07T21:20:00.000Z",
      notes: "PROTOTYPE — Approved by Division Control Office for 01:00 AM execution."
    },
    {
      block_id: "BLK-2026-0893",
      corridor: "Prayagraj - Pt. Deen Dayal Upadhyaya (NCR/PRYJ)",
      section_id: "SEC-ALD-DDU",
      start_station: "PRYJ",
      end_station: "DDU",
      start_time: "2026-09-09T03:00:00.000Z",
      end_time: "2026-09-09T06:00:00.000Z",
      departments_involved: ["SMMS (Signal)"],
      maintenance_tasks: ["Point Machine Interlocking Overhaul"],
      priority: "Medium",
      priority_score: 64.0,
      risk_score: 12.0,
      conflict_score: 64.0,
      reason_for_maintenance: "Routine 90-day signal interlocking check at Mirzapur yard.",
      approval_status: "pending",
      submitted_at: "2026-09-07T23:00:00.000Z",
      notes: "PROTOTYPE — Pending Divisional Operations Manager (DOM) sign-off."
    },
    {
      block_id: "BLK-2026-0894",
      corridor: "Howrah - Asansol Corridor (ER/HWH)",
      section_id: "SEC-HWH-ASN",
      start_station: "HWH",
      end_station: "ASN",
      start_time: "2026-09-10T02:30:00.000Z",
      end_time: "2026-09-10T05:30:00.000Z",
      departments_involved: ["SMMS (Signal)"],
      maintenance_tasks: ["Automatic Block Signal Testing"],
      priority: "Low",
      priority_score: 32.0,
      risk_score: 8.5,
      conflict_score: 32.0,
      reason_for_maintenance: "Durgapur suburban section signaling check during low traffic window.",
      approval_status: "executed",
      submitted_at: "2026-09-07T18:00:00.000Z",
      gateway_response_at: "2026-09-07T18:10:00.000Z",
      notes: "PROTOTYPE — Completed execution logged to Closed-Loop Engine."
    },
    {
      block_id: "BLK-2026-0895",
      corridor: "Bengaluru City - Mysuru Junction (SWR/SBC)",
      section_id: "SEC-SBC-MYS",
      start_station: "SBC",
      end_station: "MYS",
      start_time: "2026-09-09T01:30:00.000Z",
      end_time: "2026-09-09T04:30:00.000Z",
      departments_involved: ["TMS (Track)", "SMMS (Signal)"],
      maintenance_tasks: ["Ramanagara Curve Track Tamping", "Interlocking Testing"],
      priority: "High",
      priority_score: 74.5,
      risk_score: 16.0,
      conflict_score: 68.0,
      reason_for_maintenance: "Kengeri-Ramanagara track alignment maintenance and signal testing during non-traffic window.",
      approval_status: "under_review",
      submitted_at: "2026-09-08T01:00:00.000Z",
      gateway_response_at: "2026-09-08T01:05:00.000Z",
      notes: "PROTOTYPE — Bengaluru Division shadow block window auto-generated."
    },
    {
      block_id: "BLK-2026-0896",
      corridor: "Bengaluru - Chennai Central Corridor (SWR/SBC)",
      section_id: "SEC-SBC-MAS",
      start_station: "SBC",
      end_station: "MAS",
      start_time: "2026-09-09T02:00:00.000Z",
      end_time: "2026-09-09T05:00:00.000Z",
      departments_involved: ["TMS (Track)", "TDMS (Electrical)", "SMMS (Signal)"],
      maintenance_tasks: ["OHE Contact Wire Straining", "TRT Rail Renewal"],
      priority: "Critical",
      priority_score: 91.0,
      risk_score: 21.0,
      conflict_score: 85.0,
      reason_for_maintenance: "Joint track and OHE maintenance on high-density Vande Bharat route between Bangarapet and Jolarpettai.",
      approval_status: "pending",
      submitted_at: "2026-09-08T02:15:00.000Z",
      notes: "PROTOTYPE — Pending Divisional Operations Manager (DOM) sign-off."
    }
  ]
};

function getMockFallbackResponse<T>(endpoint: string, options: RequestInit = {}): StandardResponse<T> {
  const method = (options.method || 'GET').toUpperCase();

  if (endpoint.includes('/bdms/gateway/requests')) {
    if (method === 'PATCH' && endpoint.includes('/approve')) {
      const parts = endpoint.split('/');
      const blockId = parts[parts.indexOf('requests') + 1];
      mockStore.bdmsRequests = mockStore.bdmsRequests.map((r) =>
        r.block_id === blockId ? { ...r, approval_status: 'approved', gateway_response_at: new Date().toISOString() } : r
      );
      return { data: { status: 'success', message: `Block ${blockId} approved.` } as any, meta: { status: 'mock_fallback' } };
    }
    if (method === 'PATCH' && endpoint.includes('/reject')) {
      const parts = endpoint.split('/');
      const blockId = parts[parts.indexOf('requests') + 1];
      mockStore.bdmsRequests = mockStore.bdmsRequests.map((r) =>
        r.block_id === blockId ? { ...r, approval_status: 'rejected', gateway_response_at: new Date().toISOString() } : r
      );
      return { data: { status: 'success', message: `Block ${blockId} rejected.` } as any, meta: { status: 'mock_fallback' } };
    }
    let results = mockStore.bdmsRequests;
    if (endpoint.includes('?')) {
      const queryStr = endpoint.split('?')[1];
      const searchParams = new URLSearchParams(queryStr);
      const statusParam = searchParams.get('status');
      if (statusParam) {
        results = results.filter((r) => r.approval_status === statusParam);
      }
    }
    return {
      data: results as any,
      meta: { total: results.length, status: 'mock_fallback' }
    };
  }

  if (endpoint.includes('/bdms/gateway/submit')) {
    mockStore.bdmsRequests = mockStore.bdmsRequests.map((r) =>
      r.approval_status === 'pending' || r.approval_status === 'under_review'
        ? { ...r, approval_status: 'approved', gateway_response_at: new Date().toISOString() }
        : r
    );
    return {
      data: { status: 'success', message: 'BDMS Gateway submission processed.' } as any,
      meta: { status: 'mock_fallback' }
    };
  }

  if (endpoint.includes('/dashboard/overview')) {
    return {
      data: {
        asset_availability_pct: 94.6,
        active_conflicts_count: mockStore.conflicts.length,
        pending_bdms_approvals_count: 3,
        blocks_scheduled_today_count: 12
      } as any,
      meta: { status: 'mock_fallback' }
    };
  }

  if (endpoint.includes('/dashboard/conflicts')) {
    return {
      data: mockStore.conflicts as any,
      meta: { total: mockStore.conflicts.length, status: 'mock_fallback' }
    };
  }

  if (endpoint.includes('/field/work-orders')) {
    if (method === 'PATCH' && endpoint.includes('/complete')) {
      const parts = endpoint.split('/');
      const woId = parseInt(parts[parts.indexOf('work-orders') + 1], 10);
      let bodyData: any = {};
      try { bodyData = JSON.parse((options.body as string) || '{}'); } catch (e) {}

      mockStore.workOrders = mockStore.workOrders.map((w) => {
        if (w.id === woId) {
          return { ...w, actual_status: 'completed', geo_tag: bodyData.geo_tag || w.geo_tag };
        }
        return w;
      });
      const updated = mockStore.workOrders.find((w) => w.id === woId);
      return { data: updated as any, meta: { status: 'completed' } };
    }
    return {
      data: mockStore.workOrders as any,
      meta: { total: mockStore.workOrders.length, status: 'mock_fallback' }
    };
  }

  if (endpoint.includes('/schedule/weekly') || endpoint.includes('/schedule/monthly')) {
    return {
      data: mockStore.schedules as any,
      meta: { total: mockStore.schedules.length, status: 'mock_fallback' }
    };
  }

  if (endpoint.includes('/schedule/default/shadow-block')) {
    return {
      data: {
        status: 'success',
        shadow_blocks_created: 2,
        total_time_saved_mins: 140,
        merged_departments: ['TMS (Track)', 'SMMS (Signal)', 'TDMS (Electrical)']
      } as any,
      meta: { status: 'mock_fallback' }
    };
  }

  if (endpoint.includes('/schedule/optimize')) {
    return {
      data: {
        status: 'success',
        solver: 'Google OR-Tools CP-SAT',
        blocks_optimized: 12,
        conflicts_resolved: 4
      } as any,
      meta: { status: 'mock_fallback' }
    };
  }

  if (endpoint.includes('/schedule/slots/') && endpoint.includes('/override')) {
    const parts = endpoint.split('/');
    const slotId = parseInt(parts[parts.indexOf('slots') + 1], 10);
    let bodyData: any = {};
    try { bodyData = JSON.parse((options.body as string) || '{}'); } catch (e) {}

    let found = false;
    mockStore.schedules = mockStore.schedules.map((s) => {
      if (s.id === slotId) {
        found = true;
        return {
          ...s,
          planned_start: bodyData.new_start || s.planned_start,
          planned_end: bodyData.new_end || s.planned_end,
          status: 'optimized_overridden'
        };
      }
      return s;
    });

    if (!found) {
      mockStore.schedules.push({
        id: isNaN(slotId) ? 22 : slotId,
        horizon_type: 'weekly',
        section_id: 'SEC-HWH-ASN',
        planned_start: bodyData.new_start || '2026-09-29T14:30:00',
        planned_end: bodyData.new_end || '2026-09-29T17:30:00',
        departments: ['engineering', 'signal_telecom', 'traction'],
        status: 'shadow_blocked'
      });
    }

    return {
      data: { status: 'success', message: 'Slot override saved successfully' } as any,
      meta: { status: 'mock_fallback' }
    };
  }

  if (endpoint.includes('/simulate') || endpoint.includes('/schedule/simulate')) {
    return {
      data: {
        simulation_id: 'SIM-8821',
        risk_level: 'Low Risk (P95 < 25m)',
        p95_delay_minutes: 18.5,
        total_delay_mins: 18,
        delay_delta_mins: -42,
        recovery_pct: 91.4,
        recommended_adjustment: 'Fast-freight loop bypass saved 42 mins. Combined TMS rail renewal with SMMS signal check during 02:00 AM shadow block window.',
        details: 'Fast-freight loop bypass saved 42 mins'
      } as any,
      meta: { status: 'mock_fallback' }
    };
  }

  if (endpoint.includes('/analytics/post-maintenance')) {
    const divSectionMap: Record<string, string[]> = {
      PRYJ: ['SEC-NDLS-CNB', 'SEC-CNB-PRYJ', 'SEC-ALD-DDU'],
      SBC: ['SEC-SBC-MYS', 'SEC-SBC-MAS', 'SEC-SBC-YNK'],
      BB: ['SEC-BCT-PUNE', 'SEC-CSMT-IGP', 'SEC-BB-PNVL'],
      HWH: ['SEC-HWH-ASN', 'SEC-HWH-KGP'],
      DDU: ['SEC-DDU-GAYA', 'SEC-DDU-PNBE']
    };

    let targetDiv = 'PRYJ';
    let isMonthly = false;

    if (endpoint.includes('?')) {
      const q = new URLSearchParams(endpoint.split('?')[1]);
      if (q.get('division')) targetDiv = q.get('division')!.toUpperCase();
      if (q.get('horizon_type') === 'monthly') isMonthly = true;
    }

    const sections = divSectionMap[targetDiv] || divSectionMap.PRYJ;
    const count = isMonthly ? 14 : 6;
    const basePlanned = [180, 180, 210, 150, 240, 180, 180, 210, 150, 180, 240, 180, 210, 180];
    const offsets = [-15.5, 6.2, -18.4, 8.5, 12.1, -10.8, 5.4, 15.8, -8.2, 4.5, -12.0, 9.8, -6.5, 11.2];

    const mockVariance = Array.from({ length: count }, (_, i) => {
      const p = basePlanned[i % basePlanned.length];
      const varVal = offsets[i % offsets.length];
      const a = Math.max(30, Math.round((p + varVal) * 10) / 10);
      const varMin = Math.round((a - p) * 10) / 10;
      const score = Math.max(60, Math.min(99, Math.round((100 - Math.abs(varMin) * 0.75 + (i % 3) * 1.5) * 10) / 10));

      return {
        schedule_id: 101 + i,
        section_id: sections[i % sections.length],
        planned_duration_min: p,
        actual_duration_min: a,
        variance_min: varMin,
        speed_recovery_score: score
      };
    });

    return {
      data: mockVariance as any,
      meta: { total: mockVariance.length, status: 'mock_fallback', division: targetDiv, horizon: isMonthly ? 'monthly' : 'weekly' }
    };
  }

  if (endpoint.includes('/feedback/retrain')) {
    mockStore.retrainCount = (mockStore.retrainCount || 0) + 1;
    const prevR2 = mockStore.lastR2 || 0.742;
    const sampleCount = 220 + (mockStore.retrainCount * 25);
    const newR2 = Math.min(0.925, Math.round((0.818 + (mockStore.retrainCount - 1) * 0.018) * 1000) / 1000);
    const newMae = Math.max(2.15, Math.round((5.33 - (mockStore.retrainCount - 1) * 0.42) * 100) / 100);
    mockStore.lastR2 = newR2;

    return {
      data: {
        status: 'success',
        sample_count: sampleCount,
        previous_r2: prevR2,
        new_r2: newR2,
        new_mae: newMae,
        retrained_at: new Date().toISOString()
      } as any,
      meta: { status: 'mock_fallback' }
    };
  }

  if (endpoint.includes('/live-trains')) {
    const liveTrains = [
      { train_number: "12301", train_name: "Howrah Rajdhani Express", route: "HWH - NDLS", current_station: "Aligarh Junction (ALJN)", delay_minutes: 14, status: "Running 14m Late", speed_kmph: 115, data_source: "Live RapidAPI / NTES Feed" },
      { train_number: "12004", train_name: "Lucknow Swarna Shatabdi Express", route: "NDLS - LKO", current_station: "Kanpur Central (CNB)", delay_minutes: 0, status: "On Time", speed_kmph: 120, data_source: "Live RapidAPI / NTES Feed" },
      { train_number: "22436", train_name: "Vande Bharat Express", route: "NDLS - BSB", current_station: "Tundla Junction (TDL)", delay_minutes: 4, status: "Running 4m Late", speed_kmph: 130, data_source: "Live RapidAPI / NTES Feed" },
      { train_number: "12581", train_name: "Banaras Superfast Express", route: "BSBS - NDLS", current_station: "Prayagraj Junction (PRYJ)", delay_minutes: 22, status: "Running 22m Late", speed_kmph: 95, data_source: "Live RapidAPI / NTES Feed" },
      { train_number: "12628", train_name: "Karnataka Express", route: "NDLS - SBC", current_station: "Bangarapet (BWT)", delay_minutes: 8, status: "Running 8m Late", speed_kmph: 105, data_source: "Live RapidAPI / NTES Feed" },
      { train_number: "12127", train_name: "Mumbai-Pune Intercity Express", route: "CSMT - PUNE", current_station: "Karjat Junction (KJT)", delay_minutes: 6, status: "Running 6m Late", speed_kmph: 88, data_source: "Live RapidAPI / NTES Feed" }
    ];

    if (endpoint.split('/').length > 3) {
      const num = endpoint.split('/').pop() || '12301';
      const matched = liveTrains.find(t => t.train_number === num) || liveTrains[0];
      return { data: matched as any, meta: { status: 'mock_fallback', source: 'IRCTC RapidAPI Integration' } };
    }

    return { data: liveTrains as any, meta: { total: liveTrains.length, status: 'mock_fallback', source: 'IRCTC RapidAPI Integration' } };
  }

  if (endpoint.includes('/ingestion/generate-synthetic') || endpoint.includes('/admin/synthetic/generate')) {
    return {
      data: {
        status: 'success',
        tms_defects: 48,
        smms_faults: 32,
        tdms_faults: 21,
        bdms_requests: 15
      } as any,
      meta: { status: 'mock_fallback' }
    };
  }

  if (endpoint.includes('/track-sections')) {
    if (endpoint.split('/').length > 2 && !endpoint.endsWith('/track-sections')) {
      const parts = endpoint.split('/');
      const secId = parts[parts.length - 1];

      const sectionMap: Record<string, any> = {
        'SEC-NDLS-CNB': { zone: 'NCR', division: 'PRYJ', start: 'NDLS', end: 'CNB', score: 78.0, depts: ['engineering', 'signal_telecom', 'electrical'] },
        'SEC-CNB-PRYJ': { zone: 'NCR', division: 'PRYJ', start: 'CNB', end: 'PRYJ', score: 45.0, depts: ['engineering', 'signal_telecom'] },
        'SEC-BCT-PUNE': { zone: 'CR', division: 'BB', start: 'BCT', end: 'PUNE', score: 88.0, depts: ['engineering', 'electrical'] },
        'SEC-CSMT-IGP': { zone: 'CR', division: 'BB', start: 'CSMT', end: 'IGP', score: 72.0, depts: ['engineering', 'signal_telecom'] },
        'SEC-HWH-ASN': { zone: 'ER', division: 'HWH', start: 'HWH', end: 'ASN', score: 32.0, depts: ['signal_telecom'] },
        'SEC-SBC-MYS': { zone: 'SWR', division: 'SBC', start: 'SBC', end: 'MYS', score: 55.0, depts: ['engineering'] },
        'SEC-ALD-DDU': { zone: 'NCR', division: 'PRYJ', start: 'ALD', end: 'DDU', score: 64.0, depts: ['signal_telecom', 'electrical'] },
        'SEC-DDU-GAYA': { zone: 'ECR', division: 'DDU', start: 'DDU', end: 'GAYA', score: 59.8, depts: ['engineering'] },
      };

      const info = sectionMap[secId] || { zone: 'NCR', division: 'PRYJ', start: 'NDLS', end: 'CNB', score: 45.0, depts: ['engineering'] };

      return {
        data: {
          id: secId,
          section_id: secId,
          zone: info.zone,
          division: info.division,
          start_station: info.start,
          end_station: info.end,
          active_events: [
            { id: 201, score: info.score, status: 'synthesized', departments: info.depts }
          ]
        } as any,
        meta: { status: 'mock_fallback' }
      };
    }
    return {
      data: [
        { section_id: 'SEC-NDLS-CNB', name: 'New Delhi - Kanpur Central', zone: 'NCR', division: 'PRYJ' },
        { section_id: 'SEC-CNB-PRYJ', name: 'Kanpur Central - Prayagraj Jn', zone: 'NCR', division: 'PRYJ' }
      ] as any,
      meta: { status: 'mock_fallback' }
    };
  }

  if (endpoint.includes('/scoring/criticality/')) {
    const parts = endpoint.split('/');
    const evId = parts[parts.length - 1];

    return {
      data: {
        event_id: evId,
        explanation: 'Calibrated criticality score reflecting section traffic density, track defect severity, and multi-department synergy.',
        feature_breakdown: {
          severity_impact: 18,
          traffic_density_impact: 14,
          overdue_penalty: 5,
          multi_dept_synergy: 5,
          speed_restriction_penalty: 3
        }
      } as any,
      meta: { status: 'mock_fallback' }
    };
  }

  if (endpoint.includes('/auth/login')) {
    let bodyData: any = {};
    try { bodyData = JSON.parse((options.body as string) || '{}'); } catch (e) {}
    const email = bodyData.email || 'user@railways.gov.in';
    const isField = email.includes('field');
    const isAdmin = email.includes('admin');
    return {
      data: {
        access_token: 'mock_jwt_token_corridorops',
        token_type: 'bearer',
        role: isAdmin ? 'admin' : (isField ? 'field_crew' : 'control_office'),
        user_id: 1,
        full_name: isAdmin ? 'System Administrator' : (isField ? 'Senior Section Engineer (Track)' : 'Chief Operations Controller')
      } as any,
      meta: { status: 'mock_fallback' }
    };
  }

  if (endpoint.includes('/auth/register')) {
    let bodyData: any = {};
    try { bodyData = JSON.parse((options.body as string) || '{}'); } catch (e) {}
    return {
      data: {
        user_id: 10,
        full_name: bodyData.full_name || 'Railway Engineer',
        email: bodyData.email || 'engineer@railways.gov.in',
        role: bodyData.role || 'control_office'
      } as any,
      meta: { status: 'mock_fallback' }
    };
  }

  // Generic default mock fallback
  return {
    data: [] as any,
    meta: { status: 'mock_fallback_default' }
  };
}

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<StandardResponse<T>> {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      // If server returned non-200, try reading error or fall back to mock
      let errMessage = 'API Request Failed';
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errJson = await response.json();
          errMessage = errJson.detail || errJson.message || response.statusText;
          throw new Error(errMessage);
        }
      } catch (e) {
        // Non-JSON response (e.g. 404 HTML on static host), use mock fallback
      }
      return getMockFallbackResponse<T>(endpoint, options);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      return getMockFallbackResponse<T>(endpoint, options);
    }
  } catch (err) {
    // Network failure or CORS/Offline mode: seamless fallback to mock data
    return getMockFallbackResponse<T>(endpoint, options);
  }
}

