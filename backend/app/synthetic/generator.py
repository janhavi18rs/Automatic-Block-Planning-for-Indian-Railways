import datetime
import random
import uuid
import os
import yaml
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.models import (
    TrackSection, TMSDefect, SMMSFault, TDMSFault, BDMSRequest
)

def load_generator_config(config_path: Optional[str] = None) -> Dict[str, Any]:
    if config_path is None or not os.path.exists(config_path):
        base_dir = os.path.dirname(__file__)
        config_path = os.path.join(base_dir, "generator_config.yaml")
    
    with open(config_path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)

async def generate_synthetic_data(
    db: AsyncSession,
    config_overrides: Optional[Dict[str, Any]] = None,
    target_table: Optional[str] = None,
    count_override: Optional[int] = None
) -> Dict[str, int]:
    """
    Generates synthetic maintenance records (tms_defects, smms_faults, tdms_faults, bdms_requests)
    anchored to existing track sections with is_simulated=True.
    """
    config = load_generator_config()
    if config_overrides:
        config.update(config_overrides)

    # Fetch track sections
    res = await db.execute(select(TrackSection.section_id))
    sections = res.scalars().all()
    if not sections:
        raise ValueError("No track sections found. Load GeoJSON track geometry first!")

    summary = {
        "tms_defects": 0,
        "smms_faults": 0,
        "tdms_faults": 0,
        "bdms_requests": 0
    }

    now = datetime.datetime.utcnow()

    # 1. TMS Defects
    if target_table is None or target_table == "tms_defects":
        tms_cfg = config.get("tms_defects", {})
        types = tms_cfg.get("types", ["track", "bridge", "point_crossing"])
        weights = tms_cfg.get("severity_weights", [0.3, 0.3, 0.2, 0.1, 0.1])
        sr_range = tms_cfg.get("speed_restriction_range", [20.0, 75.0])
        
        for sec_id in sections:
            cnt = count_override if (count_override and target_table == "tms_defects") else random.randint(
                tms_cfg.get("count_per_section_range", [2, 4])[0],
                tms_cfg.get("count_per_section_range", [2, 4])[1]
            )
            for i in range(cnt):
                sev = random.choices([1, 2, 3, 4, 5], weights=weights)[0]
                defect = TMSDefect(
                    defect_id=f"TMS-DEF-{sec_id}-{uuid.uuid4().hex[:6]}",
                    section_id=sec_id,
                    defect_type=random.choice(types),
                    severity=sev,
                    reported_date=now - datetime.timedelta(hours=random.randint(1, 72)),
                    speed_restriction_kmph=round(random.uniform(sr_range[0], sr_range[1]), 1),
                    overdue_flag=bool(sev >= 4),
                    is_simulated=True
                )
                db.add(defect)
                summary["tms_defects"] += 1

    # 2. SMMS Faults
    if target_table is None or target_table == "smms_faults":
        smms_cfg = config.get("smms_faults", {})
        types = smms_cfg.get("types", ["signal", "interlocking", "telecom"])
        weights = smms_cfg.get("severity_weights", [0.4, 0.3, 0.15, 0.1, 0.05])
        
        for sec_id in sections:
            cnt = count_override if (count_override and target_table == "smms_faults") else random.randint(
                smms_cfg.get("count_per_section_range", [1, 3])[0],
                smms_cfg.get("count_per_section_range", [1, 3])[1]
            )
            for i in range(cnt):
                sev = random.choices([1, 2, 3, 4, 5], weights=weights)[0]
                fault = SMMSFault(
                    fault_id=f"SMMS-FLT-{sec_id}-{uuid.uuid4().hex[:6]}",
                    section_id=sec_id,
                    fault_type=random.choice(types),
                    severity=sev,
                    reported_date=now - datetime.timedelta(hours=random.randint(1, 48)),
                    is_simulated=True
                )
                db.add(fault)
                summary["smms_faults"] += 1

    # 3. TDMS Faults
    if target_table is None or target_table == "tdms_faults":
        tdms_cfg = config.get("tdms_faults", {})
        types = tdms_cfg.get("types", ["ohe", "substation", "power_block"])
        weights = tdms_cfg.get("severity_weights", [0.35, 0.35, 0.15, 0.1, 0.05])
        
        for sec_id in sections:
            cnt = count_override if (count_override and target_table == "tdms_faults") else random.randint(
                tdms_cfg.get("count_per_section_range", [1, 3])[0],
                tdms_cfg.get("count_per_section_range", [1, 3])[1]
            )
            for i in range(cnt):
                sev = random.choices([1, 2, 3, 4, 5], weights=weights)[0]
                fault = TDMSFault(
                    fault_id=f"TDMS-FLT-{sec_id}-{uuid.uuid4().hex[:6]}",
                    section_id=sec_id,
                    fault_type=random.choice(types),
                    severity=sev,
                    reported_date=now - datetime.timedelta(hours=random.randint(1, 36)),
                    is_simulated=True
                )
                db.add(fault)
                summary["tdms_faults"] += 1

    # 4. BDMS Requests
    if target_table is None or target_table == "bdms_requests":
        bdms_cfg = config.get("bdms_requests", {})
        depts = bdms_cfg.get("departments", ["engineering", "signal_telecom", "traction"])
        
        for sec_id in sections:
            cnt = count_override if (count_override and target_table == "bdms_requests") else random.randint(
                bdms_cfg.get("count_per_section_range", [2, 4])[0],
                bdms_cfg.get("count_per_section_range", [2, 4])[1]
            )
            for i in range(cnt):
                start_offset = random.randint(1, 168)  # next 7 days
                duration = random.randint(2, 6)
                win_start = now + datetime.timedelta(hours=start_offset)
                win_end = win_start + datetime.timedelta(hours=duration)
                
                req = BDMSRequest(
                    request_id=f"BDMS-REQ-{sec_id}-{uuid.uuid4().hex[:6]}",
                    department=random.choice(depts),
                    section_id=sec_id,
                    requested_window_start=win_start,
                    requested_window_end=win_end,
                    crew_required=random.randint(2, 8),
                    machine_required=random.random() < bdms_cfg.get("machine_required_probability", 0.6),
                    status="pending",
                    is_simulated=True
                )
                db.add(req)
                summary["bdms_requests"] += 1

    await db.commit()
    return summary
