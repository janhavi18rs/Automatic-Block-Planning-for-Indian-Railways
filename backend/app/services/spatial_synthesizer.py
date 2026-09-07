from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.models import (
    TrackSection, TMSDefect, SMMSFault, TDMSFault, BDMSRequest, CorridorEvent
)

async def synthesize_corridor_events(
    db: AsyncSession, section_ids: Optional[List[str]] = None
) -> List[CorridorEvent]:
    """
    Stage 2 GIS Spatial Join & Synthesizer:
    Groups co-located TMS defects, SMMS faults, TDMS faults, and BDMS requests by section_id
    and builds multi-departmental CorridorEvent records with merged source IDs.
    """
    # Fetch target sections
    stmt = select(TrackSection.section_id)
    if section_ids:
        stmt = stmt.filter(TrackSection.section_id.in_(section_ids))
    res = await db.execute(stmt)
    valid_sections = res.scalars().all()

    created_or_updated_events = []

    for sec_id in valid_sections:
        # Fetch defects/faults for this section
        tms_res = await db.execute(select(TMSDefect).filter_by(section_id=sec_id))
        tms_items = tms_res.scalars().all()

        smms_res = await db.execute(select(SMMSFault).filter_by(section_id=sec_id))
        smms_items = smms_res.scalars().all()

        tdms_res = await db.execute(select(TDMSFault).filter_by(section_id=sec_id))
        tdms_items = tdms_res.scalars().all()

        bdms_res = await db.execute(select(BDMSRequest).filter_by(section_id=sec_id))
        bdms_items = bdms_res.scalars().all()

        if not (tms_items or smms_items or tdms_items or bdms_items):
            continue

        departments = set()
        merged_ids = []
        max_severity = 1
        speed_restrictions = []

        for item in tms_items:
            departments.add("engineering")
            merged_ids.append(item.defect_id)
            if item.severity > max_severity:
                max_severity = item.severity
            if item.speed_restriction_kmph > 0:
                speed_restrictions.append(item.speed_restriction_kmph)

        for item in smms_items:
            departments.add("signal_telecom")
            merged_ids.append(item.fault_id)
            if item.severity > max_severity:
                max_severity = item.severity

        for item in tdms_items:
            departments.add("traction")
            merged_ids.append(item.fault_id)
            if item.severity > max_severity:
                max_severity = item.severity

        for item in bdms_items:
            departments.add(item.department)
            merged_ids.append(item.request_id)

        # Baseline score calculation prior to ML scoring
        base_score = min(100.0, float(max_severity * 8 + len(departments) * 5 + len(merged_ids) * 3))
        confidence = round(min(1.0, 0.7 + 0.1 * len(departments)), 2)

        # Check if an active corridor event already exists for section
        exist_res = await db.execute(
            select(CorridorEvent).filter_by(section_id=sec_id, status="synthesized")
        )
        existing_event = exist_res.scalar_one_or_none()

        if existing_event:
            existing_event.departments = sorted(list(departments))
            existing_event.merged_from = merged_ids
            existing_event.criticality_score = base_score
            existing_event.confidence = confidence
            created_or_updated_events.append(existing_event)
        else:
            new_event = CorridorEvent(
                section_id=sec_id,
                departments=sorted(list(departments)),
                criticality_score=base_score,
                confidence=confidence,
                merged_from=merged_ids,
                status="synthesized"
            )
            db.add(new_event)
            created_or_updated_events.append(new_event)

    await db.commit()
    for ev in created_or_updated_events:
        await db.refresh(ev)

    return created_or_updated_events


async def mine_maintenance_opportunities(
    db: AsyncSession, section_ids: Optional[List[str]] = None
) -> List[dict]:
    """
    USP 5 — Maintenance Opportunity Mining:

    Instead of only looking for completely empty corridors, this function:
    1. Parses the real train schedule for each section (HH:MM windows)
    2. Detects gaps between consecutive train movements
    3. Classifies each gap as: low-traffic, medium-traffic, high-traffic, or empty
    4. Matches pending maintenance tasks to suitable gap windows
    5. Returns scored opportunity windows with task recommendations

    Example output:
        01:00–02:00 → Train Movement
        02:00–02:30 → Available (30-min gap)   ← SHORT tasks only
        02:30–03:30 → Train Movement
        03:30–05:30 → Low Traffic             ← COMBINED tasks
    """
    from app.models.models import TrainSchedule, TMSDefect, SMMSFault, TDMSFault, TrackSection, CorridorEvent

    # 24-hour timeline in 30-minute slots (index 0 = 00:00, index 47 = 23:30)
    SLOT_MINUTES = 30
    TOTAL_SLOTS = 48  # 24h / 30min

    # Fetch sections
    stmt = select(TrackSection)
    if section_ids:
        stmt = stmt.filter(TrackSection.section_id.in_(section_ids))
    ts_res = await db.execute(stmt)
    sections = ts_res.scalars().all()

    all_opportunities = []

    for sec in sections:
        sec_id = sec.section_id

        # Build 48-slot timeline: 0 = free, 1 = occupied
        timeline = [0] * TOTAL_SLOTS

        # Load train schedules for this section
        sch_res = await db.execute(select(TrainSchedule).filter_by(section_id=sec_id))
        train_schedules = sch_res.scalars().all()

        for ts in train_schedules:
            try:
                arr_h, arr_m = map(int, ts.arrival_time.split(":"))
                dep_h, dep_m = map(int, ts.departure_time.split(":"))
                arr_slot = (arr_h * 60 + arr_m) // SLOT_MINUTES
                dep_slot = (dep_h * 60 + dep_m) // SLOT_MINUTES
                # Mark slots as occupied (add buffer of 1 slot = 30 min headway)
                for slot in range(max(0, arr_slot - 1), min(TOTAL_SLOTS, dep_slot + 2)):
                    timeline[slot] += 1
            except Exception:
                continue

        # Identify contiguous free or low-traffic windows
        windows = []
        i = 0
        while i < TOTAL_SLOTS:
            occupancy = timeline[i]
            if occupancy <= 1:  # free or light traffic
                # Find extent of this window
                start_slot = i
                while i < TOTAL_SLOTS and timeline[i] <= 1:
                    i += 1
                end_slot = i
                duration_min = (end_slot - start_slot) * SLOT_MINUTES

                if duration_min < 30:  # ignore < 30 min windows
                    continue

                start_h, start_m = divmod(start_slot * SLOT_MINUTES, 60)
                end_h, end_m = divmod(end_slot * SLOT_MINUTES, 60)

                # Count trains passing through window
                trains_in_window = sum(timeline[start_slot:end_slot])

                if trains_in_window == 0:
                    traffic_level = "none"
                    suitability_bonus = 30.0
                elif trains_in_window <= 2:
                    traffic_level = "low"
                    suitability_bonus = 20.0
                else:
                    traffic_level = "medium"
                    suitability_bonus = 5.0

                windows.append({
                    "start_slot": start_slot,
                    "end_slot": end_slot,
                    "start_str": f"{start_h:02d}:{start_m:02d}",
                    "end_str": f"{end_h:02d}:{end_m:02d}",
                    "duration_min": duration_min,
                    "traffic_level": traffic_level,
                    "trains_in_window": trains_in_window,
                    "suitability_bonus": suitability_bonus
                })
            else:
                i += 1

        # Fetch pending defect tasks for this section
        tms_res = await db.execute(select(TMSDefect).filter_by(section_id=sec_id))
        tms_tasks = tms_res.scalars().all()
        smms_res = await db.execute(select(SMMSFault).filter_by(section_id=sec_id))
        smms_tasks = smms_res.scalars().all()
        tdms_res = await db.execute(select(TDMSFault).filter_by(section_id=sec_id))
        tdms_tasks = tdms_res.scalars().all()

        # Score each window
        for win in windows:
            duration = win["duration_min"]
            suitable_tasks = []

            for t in tms_tasks:
                est_duration = 30 + t.severity * 15  # 45–105 min per task
                if est_duration <= duration:
                    suitable_tasks.append({
                        "task_id": t.defect_id,
                        "department": "engineering",
                        "task_type": t.defect_type,
                        "severity": t.severity,
                        "priority_score": round(t.severity * 18.0, 1)
                    })

            for t in smms_tasks:
                est_duration = 30 + t.severity * 10
                if est_duration <= duration:
                    suitable_tasks.append({
                        "task_id": t.fault_id,
                        "department": "signal_telecom",
                        "task_type": t.fault_type,
                        "severity": t.severity,
                        "priority_score": round(t.severity * 16.0, 1)
                    })

            for t in tdms_tasks:
                est_duration = 45 + t.severity * 12
                if est_duration <= duration:
                    suitable_tasks.append({
                        "task_id": t.fault_id,
                        "department": "traction",
                        "task_type": t.fault_type,
                        "severity": t.severity,
                        "priority_score": round(t.severity * 17.0, 1)
                    })

            if not suitable_tasks and duration < 60:
                continue  # skip tiny windows with no matching tasks

            # Block suitability score
            task_score = min(40.0, len(suitable_tasks) * 8.0)
            duration_score = min(30.0, duration / 6.0)
            suitability_score = round(win["suitability_bonus"] + task_score + duration_score, 1)
            suitability_score = min(100.0, suitability_score)

            if duration >= 120:
                recommendation = f"Major maintenance window ({duration}min). Ideal for combined multi-dept shadow block."
            elif duration >= 60:
                recommendation = f"Medium window ({duration}min). Suitable for 1–2 high-priority tasks."
            else:
                recommendation = f"Short window ({duration}min). Schedule only critical short-duration tasks."

            win_id = f"OPP-{sec_id}-{win['start_str'].replace(':', '')}"

            all_opportunities.append({
                "window_id": win_id,
                "section_id": sec_id,
                "corridor": f"{sec.start_station} — {sec.end_station}",
                "window_start": win["start_str"],
                "window_end": win["end_str"],
                "duration_minutes": duration,
                "traffic_level": win["traffic_level"],
                "trains_in_window": win["trains_in_window"],
                "suitable_tasks": suitable_tasks[:5],  # cap at 5 for display
                "block_suitability_score": suitability_score,
                "recommendation": recommendation,
                "section_obj": sec
            })

    # Sort by suitability descending
    all_opportunities.sort(key=lambda x: x["block_suitability_score"], reverse=True)
    return all_opportunities
