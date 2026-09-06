import datetime
import random
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.models import User, TMSDefect, SMMSFault, TDMSFault, BDMSRequest
from app.schemas.schemas import (
    TMSDefectCreate, TMSDefectSchema, SMMSFaultCreate, SMMSFaultSchema,
    TDMSFaultCreate, TDMSFaultSchema, BDMSRequestCreate, BDMSRequestSchema,
    UnifiedDefectItem, SyntheticGenerateRequest, StandardResponse
)
from app.synthetic.generator import generate_synthetic_data

router = APIRouter(tags=["Defects & Department Requests"])

@router.post("/defects/tms", response_model=StandardResponse[TMSDefectSchema])
async def create_tms_defect(
    body: TMSDefectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    defect_id = body.defect_id or f"TMS-{body.section_id}-{random.randint(1000, 9999)}"
    item = TMSDefect(
        defect_id=defect_id,
        section_id=body.section_id,
        defect_type=body.defect_type,
        severity=body.severity,
        reported_date=body.reported_date or datetime.datetime.utcnow(),
        speed_restriction_kmph=body.speed_restriction_kmph,
        overdue_flag=body.overdue_flag,
        is_simulated=body.is_simulated
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return StandardResponse(data=TMSDefectSchema.model_validate(item))

@router.post("/defects/smms", response_model=StandardResponse[SMMSFaultSchema])
async def create_smms_fault(
    body: SMMSFaultCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    fault_id = body.fault_id or f"SMMS-{body.section_id}-{random.randint(1000, 9999)}"
    item = SMMSFault(
        fault_id=fault_id,
        section_id=body.section_id,
        fault_type=body.fault_type,
        severity=body.severity,
        reported_date=body.reported_date or datetime.datetime.utcnow(),
        is_simulated=body.is_simulated
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return StandardResponse(data=SMMSFaultSchema.model_validate(item))

@router.post("/defects/tdms", response_model=StandardResponse[TDMSFaultSchema])
async def create_tdms_fault(
    body: TDMSFaultCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    fault_id = body.fault_id or f"TDMS-{body.section_id}-{random.randint(1000, 9999)}"
    item = TDMSFault(
        fault_id=fault_id,
        section_id=body.section_id,
        fault_type=body.fault_type,
        severity=body.severity,
        reported_date=body.reported_date or datetime.datetime.utcnow(),
        is_simulated=body.is_simulated
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return StandardResponse(data=TDMSFaultSchema.model_validate(item))

@router.post("/bdms/requests", response_model=StandardResponse[BDMSRequestSchema])
async def create_bdms_request(
    body: BDMSRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    request_id = body.request_id or f"BDMS-{body.section_id}-{random.randint(1000, 9999)}"
    item = BDMSRequest(
        request_id=request_id,
        department=body.department,
        section_id=body.section_id,
        requested_window_start=body.requested_window_start,
        requested_window_end=body.requested_window_end,
        crew_required=body.crew_required,
        machine_required=body.machine_required,
        status=body.status,
        is_simulated=body.is_simulated
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return StandardResponse(data=BDMSRequestSchema.model_validate(item))

@router.get("/defects", response_model=StandardResponse[List[UnifiedDefectItem]])
async def list_unified_defects(
    department: Optional[str] = Query(None),
    section_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    unified: List[UnifiedDefectItem] = []

    # TMS
    if not department or department == "engineering":
        stmt = select(TMSDefect)
        if section_id:
            stmt = stmt.filter_by(section_id=section_id)
        res = await db.execute(stmt)
        for d in res.scalars().all():
            unified.append(UnifiedDefectItem(
                id=d.defect_id,
                source_table="tms_defects",
                section_id=d.section_id,
                department="engineering",
                defect_or_fault_type=d.defect_type,
                severity=d.severity,
                reported_date=d.reported_date,
                is_simulated=d.is_simulated,
                details={"speed_restriction_kmph": d.speed_restriction_kmph, "overdue_flag": d.overdue_flag}
            ))

    # SMMS
    if not department or department == "signal_telecom":
        stmt = select(SMMSFault)
        if section_id:
            stmt = stmt.filter_by(section_id=section_id)
        res = await db.execute(stmt)
        for f in res.scalars().all():
            unified.append(UnifiedDefectItem(
                id=f.fault_id,
                source_table="smms_faults",
                section_id=f.section_id,
                department="signal_telecom",
                defect_or_fault_type=f.fault_type,
                severity=f.severity,
                reported_date=f.reported_date,
                is_simulated=f.is_simulated,
                details={}
            ))

    # TDMS
    if not department or department == "traction":
        stmt = select(TDMSFault)
        if section_id:
            stmt = stmt.filter_by(section_id=section_id)
        res = await db.execute(stmt)
        for f in res.scalars().all():
            unified.append(UnifiedDefectItem(
                id=f.fault_id,
                source_table="tdms_faults",
                section_id=f.section_id,
                department="traction",
                defect_or_fault_type=f.fault_type,
                severity=f.severity,
                reported_date=f.reported_date,
                is_simulated=f.is_simulated,
                details={}
            ))

    return StandardResponse(data=unified, meta={"total": len(unified)})

@router.post("/admin/synthetic/generate", response_model=StandardResponse[dict])
async def trigger_synthetic_generation(
    body: SyntheticGenerateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "control_office"]))
):
    summary = await generate_synthetic_data(
        db,
        config_overrides=body.config_overrides,
        target_table=body.table,
        count_override=body.count
    )
    return StandardResponse(data=summary, meta={"message": "Synthetic data generated successfully with is_simulated=True."})
