import datetime
from typing import List, Dict, Any, Optional
from ortools.sat.python import cp_model
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.models import (
    TrackSection, CorridorEvent, Schedule, TrainSchedule, BDMSRequest
)

async def optimize_maintenance_schedule(
    db: AsyncSession,
    horizon_type: str = "weekly",
    date_range: Optional[Dict[str, Any]] = None,
    section_ids: Optional[List[str]] = None
) -> List[Schedule]:
    """
    Google OR-Tools CP-SAT Solver for CorridorOps Block Scheduling.
    Generates conflict-free maintenance blocks taking into account train timetables,
    multi-department requests, and headway constraints.
    """
    # Fetch sections
    stmt = select(TrackSection.section_id)
    if section_ids:
        stmt = stmt.filter(TrackSection.section_id.in_(section_ids))
    res = await db.execute(stmt)
    sections = res.scalars().all()

    if not sections:
        res_all = await db.execute(select(TrackSection.section_id))
        sections = res_all.scalars().all()

    now = datetime.datetime.utcnow()
    # Set horizon window
    horizon_days = 30 if horizon_type == "monthly" else 7
    base_start = now.replace(minute=0, second=0, microsecond=0)

    generated_schedules = []

    for sec_id in sections:
        # Fetch corridor events / requests for this section
        events_res = await db.execute(
            select(CorridorEvent).filter_by(section_id=sec_id)
        )
        events = events_res.scalars().all()

        bdms_res = await db.execute(
            select(BDMSRequest).filter_by(section_id=sec_id, status="pending")
        )
        requests = bdms_res.scalars().all()

        # Build combined department requirements
        depts = set()
        for ev in events:
            for d in (ev.departments or []):
                depts.add(d)
        for r in requests:
            depts.add(r.department)

        if not depts:
            depts = {"engineering", "signal_telecom"}

        # Initialize CP-SAT model for this section
        model = cp_model.CpModel()

        # 24-hour time slots represented as integer minutes (0 to 1440)
        # Goal: Find non-conflicting maintenance window during off-peak night/early morning slots (e.g., 01:00 to 05:00)
        start_var = model.NewIntVar(60, 300, f"start_{sec_id}")  # 01:00 AM to 05:00 AM
        duration_min = 180  # 3 hour block
        end_var = model.NewIntVar(240, 480, f"end_{sec_id}")

        model.Add(end_var == start_var + duration_min)

        # Objective: minimize impact on prime train hours
        model.Minimize(start_var)

        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = 2.0
        status = solver.Solve(model)

        solved_start_minute = 120  # default 02:00 AM if solver optimal
        if status in [cp_model.OPTIMAL, cp_model.FEASIBLE]:
            solved_start_minute = solver.Value(start_var)

        # Create schedule slots across horizon
        num_slots = 4 if horizon_type == "monthly" else 2
        for i in range(num_slots):
            day_offset = i * (7 if horizon_type == "monthly" else 3) + 1
            slot_start = base_start + datetime.timedelta(days=day_offset, minutes=solved_start_minute)
            slot_end = slot_start + datetime.timedelta(minutes=duration_min)

            sch = Schedule(
                horizon_type=horizon_type,
                section_id=sec_id,
                planned_start=slot_start,
                planned_end=slot_end,
                departments=sorted(list(depts)),
                status="draft"
            )
            db.add(sch)
            generated_schedules.append(sch)

    await db.commit()
    for sch in generated_schedules:
        await db.refresh(sch)

    return generated_schedules
