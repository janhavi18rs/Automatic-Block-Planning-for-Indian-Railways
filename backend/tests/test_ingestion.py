import pytest
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select, func
from app.core.database import Base
from app.models.models import (
    TrackSection, TrainSchedule, TMSDefect, SMMSFault, TDMSFault, BDMSRequest
)
from app.synthetic.geo_loader import load_track_sections_from_geojson
from app.synthetic.timetable_loader import load_train_schedules
from app.synthetic.generator import generate_synthetic_data

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

@pytest.fixture
async def db_session():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    session_factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as session:
        yield session
    
    await engine.dispose()

@pytest.mark.asyncio
async def test_geojson_and_csv_loaders(db_session: AsyncSession):
    # 1. Load GeoJSON track sections
    inserted_sections = await load_track_sections_from_geojson(db_session)
    assert inserted_sections > 0, "GeoJSON loader should insert track sections"

    # Query track sections
    res = await db_session.execute(select(TrackSection))
    sections = res.scalars().all()
    assert len(sections) == inserted_sections
    
    sec_ids = {s.section_id for s in sections}
    assert "SEC-NDLS-CNB" in sec_ids
    assert "SEC-HWH-ASN" in sec_ids

    for sec in sections:
        assert sec.geometry.startswith("LINESTRING")
        assert sec.zone in ["NCR", "CR", "ER", "SWR"]
        assert sec.division is not None

    # 2. Load Train Timetable CSV
    inserted_trains = await load_train_schedules(db_session)
    assert inserted_trains > 0, "CSV timetable loader should insert train schedules"

    res = await db_session.execute(select(TrainSchedule))
    trains = res.scalars().all()
    assert len(trains) == inserted_trains
    
    for t in trains:
        assert t.train_number is not None
        assert t.section_id in sec_ids
        assert t.train_type in ["passenger", "freight"]

@pytest.mark.asyncio
async def test_synthetic_generator_counts_and_constraints(db_session: AsyncSession):
    # Load base sections first
    await load_track_sections_from_geojson(db_session)

    # Run synthetic generator
    summary = await generate_synthetic_data(db_session)
    
    assert summary["tms_defects"] > 0
    assert summary["smms_faults"] > 0
    assert summary["tdms_faults"] > 0
    assert summary["bdms_requests"] > 0

    # Test TMS defects constraints
    res = await db_session.execute(select(TMSDefect))
    tms_list = res.scalars().all()
    for d in tms_list:
        assert 1 <= d.severity <= 5
        assert d.defect_type in ["track", "bridge", "point_crossing"]
        assert d.speed_restriction_kmph >= 0.0

    # Test SMMS faults constraints
    res = await db_session.execute(select(SMMSFault))
    smms_list = res.scalars().all()
    for f in smms_list:
        assert 1 <= f.severity <= 5
        assert f.fault_type in ["signal", "interlocking", "telecom"]

    # Test TDMS faults constraints
    res = await db_session.execute(select(TDMSFault))
    tdms_list = res.scalars().all()
    for f in tdms_list:
        assert 1 <= f.severity <= 5
        assert f.fault_type in ["ohe", "substation", "power_block"]

    # Test BDMS requests constraints
    res = await db_session.execute(select(BDMSRequest))
    bdms_list = res.scalars().all()
    for r in bdms_list:
        assert r.department in ["engineering", "signal_telecom", "traction"]
        assert r.requested_window_end > r.requested_window_start
        assert r.crew_required >= 1
        assert r.status in ["pending", "approved", "rejected"]

@pytest.mark.asyncio
async def test_is_simulated_flag_assertion(db_session: AsyncSession):
    await load_track_sections_from_geojson(db_session)
    await generate_synthetic_data(db_session)

    # Check TMS
    tms_res = await db_session.execute(select(TMSDefect.is_simulated))
    for flag in tms_res.scalars().all():
        assert flag is True, "Every synthetic TMS defect must have is_simulated = True"

    # Check SMMS
    smms_res = await db_session.execute(select(SMMSFault.is_simulated))
    for flag in smms_res.scalars().all():
        assert flag is True, "Every synthetic SMMS fault must have is_simulated = True"

    # Check TDMS
    tdms_res = await db_session.execute(select(TDMSFault.is_simulated))
    for flag in tdms_res.scalars().all():
        assert flag is True, "Every synthetic TDMS fault must have is_simulated = True"

    # Check BDMS
    bdms_res = await db_session.execute(select(BDMSRequest.is_simulated))
    for flag in bdms_res.scalars().all():
        assert flag is True, "Every synthetic BDMS request must have is_simulated = True"
