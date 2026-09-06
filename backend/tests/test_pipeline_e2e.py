import pytest
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.core.database import Base
from app.synthetic.geo_loader import load_track_sections_from_geojson
from app.synthetic.timetable_loader import load_train_schedules
from app.synthetic.generator import generate_synthetic_data
from app.services.spatial_synthesizer import synthesize_corridor_events
from app.services.scoring import compute_criticality_scores, explain_event_criticality
from app.services.solver import optimize_maintenance_schedule
from app.services.shadow_blocking import execute_shadow_blocking
from app.services.simulator import run_what_if_simulation

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
async def test_full_pipeline_end_to_end(db_session: AsyncSession):
    # Step 1: Ingest Track Sections & Timetable
    sec_count = await load_track_sections_from_geojson(db_session)
    assert sec_count > 0, "Track sections must be ingested"

    train_count = await load_train_schedules(db_session)
    assert train_count > 0, "Train schedules must be ingested"

    # Step 2: Generate Multi-department synthetic defects/faults/requests
    gen_summary = await generate_synthetic_data(db_session)
    assert gen_summary["tms_defects"] > 0
    assert gen_summary["smms_faults"] > 0

    # Step 3: Stage 2 GIS Spatial Synthesizer
    events = await synthesize_corridor_events(db_session)
    assert len(events) > 0, "Synthesizer must produce corridor events"
    for ev in events:
        assert len(ev.departments) >= 1
        assert len(ev.merged_from) >= 1

    # Step 4: Criticality Scoring & Explainability
    scored_events = await compute_criticality_scores(db_session)
    assert len(scored_events) > 0
    for ev in scored_events:
        assert 0.0 <= ev.criticality_score <= 100.0

    score, breakdown = await explain_event_criticality(db_session, scored_events[0].id)
    assert "feature_breakdown" in breakdown
    assert breakdown["criticality_score"] == score

    # Step 5: CP-SAT Optimization Solver
    schedules = await optimize_maintenance_schedule(db_session, horizon_type="weekly")
    assert len(schedules) > 0, "CP-SAT solver must produce non-empty schedule"
    for s in schedules:
        assert s.planned_end > s.planned_start
        assert s.status == "draft"

    # Step 6: Multi-Department Shadow Blocking Clustering
    shadow_schedules = await execute_shadow_blocking(db_session)
    assert len(shadow_schedules) > 0
    for s in shadow_schedules:
        assert s.status == "shadow_blocked"

    # Step 7: Monte Carlo What-If Delay Risk Simulation
    sim_result = await run_what_if_simulation(db_session, iterations=30)
    assert sim_result["risk_level"] in ["low", "medium", "high"]
    assert sim_result["p95_delay_minutes"] >= 0.0
    assert len(sim_result["delay_distribution"]) > 0
