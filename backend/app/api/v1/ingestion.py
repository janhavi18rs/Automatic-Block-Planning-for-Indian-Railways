from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import User, TrackSection, TrainSchedule, CorridorEvent
from app.schemas.schemas import (
    GeoJSONFeatureCollection, StandardResponse, TrackSectionSchema,
    TrackSectionDetailSchema, TrainScheduleSchema, TrainScheduleCreate
)
from app.synthetic.geo_loader import load_track_sections_from_geojson
from app.synthetic.timetable_loader import load_train_schedules

router = APIRouter(tags=["Ingestion & Infrastructure"])

@router.post("/ingest/track-sections", response_model=StandardResponse[dict])
async def ingest_track_sections(
    body: GeoJSONFeatureCollection,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inserted = await load_track_sections_from_geojson(db, geojson_data=body.model_dump())
    return StandardResponse(data={"count": inserted}, meta={"message": f"Successfully ingested {inserted} track sections."})

@router.get("/track-sections", response_model=StandardResponse[List[TrackSectionSchema]])
async def list_track_sections(
    division: Optional[str] = Query(None),
    bbox: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(TrackSection)
    if division:
        stmt = stmt.filter_by(division=division)
    res = await db.execute(stmt)
    sections = res.scalars().all()
    data = [TrackSectionSchema.model_validate(s) for s in sections]
    return StandardResponse(data=data, meta={"total": len(data)})

@router.get("/track-sections/{section_id}", response_model=StandardResponse[TrackSectionDetailSchema])
async def get_track_section_detail(
    section_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    res = await db.execute(select(TrackSection).filter_by(section_id=section_id))
    sec = res.scalar_one_or_none()
    if not sec:
        raise HTTPException(status_code=404, detail=f"TrackSection {section_id} not found")

    events_res = await db.execute(select(CorridorEvent).filter_by(section_id=section_id))
    events = events_res.scalars().all()
    
    active_ev_data = [{"id": e.id, "departments": e.departments, "score": e.criticality_score, "status": e.status} for e in events]

    detail = TrackSectionDetailSchema(
        id=sec.id,
        section_id=sec.section_id,
        geometry=sec.geometry,
        zone=sec.zone,
        division=sec.division,
        start_station=sec.start_station,
        end_station=sec.end_station,
        active_events=active_ev_data
    )
    return StandardResponse(data=detail)

@router.post("/ingest/train-schedule", response_model=StandardResponse[dict])
async def ingest_train_schedule(
    body: List[TrainScheduleCreate],
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    json_list = [item.model_dump() for item in body]
    inserted = await load_train_schedules(db, json_list=json_list)
    return StandardResponse(data={"count": inserted}, meta={"message": f"Successfully ingested {inserted} train schedule entries."})

@router.get("/train-schedule", response_model=StandardResponse[List[TrainScheduleSchema]])
async def list_train_schedules(
    section_id: Optional[str] = Query(None),
    date: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(TrainSchedule)
    if section_id:
        stmt = stmt.filter_by(section_id=section_id)
    res = await db.execute(stmt)
    schedules = res.scalars().all()
    data = [TrainScheduleSchema.model_validate(s) for s in schedules]
    return StandardResponse(data=data, meta={"total": len(data)})
