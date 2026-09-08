import datetime
import uuid
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.models import (
    Schedule, BDMSRequest, TMSDefect, SMMSFault, TDMSFault, TrackSection, CorridorEvent
)
from app.schemas.schemas import ShadowBlockResultSchema, ShadowBlockTaskItem


async def execute_shadow_blocking(
    db: AsyncSession, schedule_batch_id: str = "default", section_id: Any = None
) -> List[Schedule]:
    """
    USP 1 — Corridor-Level Shadow Blocking Engine:
    """
    query = select(Schedule).filter(Schedule.status.in_(["draft", "shadow_blocked"]))
    if section_id:
        query = query.filter_by(section_id=section_id)
    res = await db.execute(query)
    schedules = res.scalars().all()

    # Group schedules by section_id
    grouped_by_section: Dict[str, List[Schedule]] = {}
    for s in schedules:
        grouped_by_section.setdefault(s.section_id, []).append(s)

    updated_schedules = []

    for sec_id, sec_schedules in grouped_by_section.items():
        if not sec_schedules:
            continue

        # Fetch track section metadata
        ts_res = await db.execute(select(TrackSection).filter_by(section_id=sec_id))
        ts = ts_res.scalar_one_or_none()
        start_station = ts.start_station if ts else "START"
        end_station = ts.end_station if ts else "END"
        zone = ts.zone if ts else "NR"

        # Fetch all dept tasks for section
        tms_res = await db.execute(select(TMSDefect).filter_by(section_id=sec_id))
        tms_items = tms_res.scalars().all()

        smms_res = await db.execute(select(SMMSFault).filter_by(section_id=sec_id))
        smms_items = smms_res.scalars().all()

        tdms_res = await db.execute(select(TDMSFault).filter_by(section_id=sec_id))
        tdms_items = tdms_res.scalars().all()

        bdms_res = await db.execute(select(BDMSRequest).filter_by(section_id=sec_id))
        bdms_reqs = bdms_res.scalars().all()

        # Collect all departments involved
        all_depts = set()
        for r in bdms_reqs:
            all_depts.add(r.department)
        if tms_items:
            all_depts.add("engineering")
        if smms_items:
            all_depts.add("signal_telecom")
        if tdms_items:
            all_depts.add("traction")

        if not all_depts:
            all_depts = {"engineering", "signal_telecom"}

        num_depts = len(all_depts)
        total_tasks = len(tms_items) + len(smms_items) + len(tdms_items) + len(bdms_reqs)
        max_severity = 1
        for item in list(tms_items) + list(smms_items) + list(tdms_items):
            if item.severity > max_severity:
                max_severity = item.severity

        # ── Consolidation Score Calculation (0–100) ──────────────────────────
        dept_synergy_score = min(40.0, (num_depts - 1) * 20.0)
        severity_score = min(25.0, max_severity * 5.0)
        task_density_score = min(25.0, total_tasks * 2.5)
        base_score = 10.0

        consolidation_score = round(
            base_score + dept_synergy_score + severity_score + task_density_score, 1
        )
        consolidation_score = min(100.0, consolidation_score)

        # ── Estimated Downtime Reduction ──────────────────────────────────────
        individual_total_hours = num_depts * 2.0
        shadow_block_hours = 3.0
        time_saved_hours = max(0.0, individual_total_hours - shadow_block_hours)
        estimated_downtime_reduction_pct = round(
            (time_saved_hours / max(individual_total_hours, 1.0)) * 100.0, 1
        )

        # ── Update Schedules ───────────────────────────────────────────────────
        for sch in sec_schedules:
            merged_depts = set(sch.departments or [])
            merged_depts.update(all_depts)
            sch.departments = sorted(list(merged_depts))
            sch.status = "shadow_blocked"
            updated_schedules.append(sch)

        # Mark BDMS requests approved
        for r in bdms_reqs:
            r.status = "approved"

        # Mark Corridor Events as shadow_blocked
        ev_res = await db.execute(select(CorridorEvent).filter_by(section_id=sec_id))
        events = ev_res.scalars().all()
        for ev in events:
            ev.status = "shadow_blocked"

    await db.commit()
    for s in updated_schedules:
        await db.refresh(s)

    return updated_schedules


async def get_shadow_block_results(
    db: AsyncSession
) -> List[ShadowBlockResultSchema]:
    """
    Returns rich ShadowBlockResultSchema objects for the UI dashboard,
    including consolidation scores, downtime reduction estimates, and explanations.
    """
    res = await db.execute(select(Schedule).filter_by(status="shadow_blocked"))
    schedules = res.scalars().all()

    results: List[ShadowBlockResultSchema] = []

    for sch in schedules:
        sec_id = sch.section_id

        # Fetch track section metadata
        ts_res = await db.execute(select(TrackSection).filter_by(section_id=sec_id))
        ts = ts_res.scalar_one_or_none()
        start_station = ts.start_station if ts else "START"
        end_station = ts.end_station if ts else "END"
        zone = ts.zone if ts else "NR"

        # Fetch dept tasks
        tms_res = await db.execute(select(TMSDefect).filter_by(section_id=sec_id))
        tms_items = tms_res.scalars().all()
        smms_res = await db.execute(select(SMMSFault).filter_by(section_id=sec_id))
        smms_items = smms_res.scalars().all()
        tdms_res = await db.execute(select(TDMSFault).filter_by(section_id=sec_id))
        tdms_items = tdms_res.scalars().all()

        tasks_included = []
        max_severity = 1

        for item in tms_items[:3]:  # limit display to top 3 per dept
            if item.severity > max_severity:
                max_severity = item.severity
            tasks_included.append(ShadowBlockTaskItem(
                task_id=item.defect_id,
                department="engineering",
                defect_or_fault_type=item.defect_type,
                severity=item.severity,
                section_id=sec_id
            ))
        for item in smms_items[:3]:
            if item.severity > max_severity:
                max_severity = item.severity
            tasks_included.append(ShadowBlockTaskItem(
                task_id=item.fault_id,
                department="signal_telecom",
                defect_or_fault_type=item.fault_type,
                severity=item.severity,
                section_id=sec_id
            ))
        for item in tdms_items[:3]:
            if item.severity > max_severity:
                max_severity = item.severity
            tasks_included.append(ShadowBlockTaskItem(
                task_id=item.fault_id,
                department="traction",
                defect_or_fault_type=item.fault_type,
                severity=item.severity,
                section_id=sec_id
            ))

        depts = sch.departments or ["engineering", "signal_telecom"]
        num_depts = len(depts)
        total_tasks = len(tasks_included)

        dept_synergy_score = min(40.0, (num_depts - 1) * 20.0)
        severity_score = min(25.0, max_severity * 5.0)
        task_density_score = min(25.0, total_tasks * 2.5)
        consolidation_score = round(10.0 + dept_synergy_score + severity_score + task_density_score, 1)
        consolidation_score = min(100.0, consolidation_score)

        individual_total_hours = num_depts * 2.0
        shadow_block_hours = 3.0
        time_saved = max(0.0, individual_total_hours - shadow_block_hours)
        downtime_reduction = round((time_saved / max(individual_total_hours, 1.0)) * 100.0, 1)

        total_duration_min = (sch.planned_end - sch.planned_start).total_seconds() / 60.0

        dept_list = ", ".join(sorted(depts))
        explanation = (
            f"Corridor {sec_id}: {num_depts} department(s) ({dept_list}) synchronized into one "
            f"shadow block. Consolidation score: {consolidation_score}/100. "
            f"Estimated corridor downtime reduction: {downtime_reduction:.1f}%."
        )

        results.append(ShadowBlockResultSchema(
            block_id=f"SB-{sch.id:04d}",
            corridor=f"{zone} — {sec_id}",
            section_id=sec_id,
            start_station=start_station,
            end_station=end_station,
            block_start_time=sch.planned_start,
            block_end_time=sch.planned_end,
            departments_involved=sorted(depts),
            tasks_included=tasks_included,
            total_maintenance_duration_min=round(total_duration_min, 1),
            estimated_downtime_reduction_pct=downtime_reduction,
            consolidation_score=consolidation_score,
            individual_blocks_count=num_depts,
            explanation=explanation,
            status=sch.status
        ))

    return results
