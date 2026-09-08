import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.main import app
from app.core.database import Base, get_db
from app.core.security import get_password_hash
from app.models.models import User

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

@pytest.fixture
async def async_client():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

    async def override_get_db():
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    # Seed test users & track sections
    async with session_factory() as session:
        from app.synthetic.geo_loader import load_track_sections_from_geojson
        await load_track_sections_from_geojson(session)

        user = User(
            email="testcontrol@corridorops.ir",
            hashed_password=get_password_hash("test1234"),
            role="admin",
            full_name="Test Controller"
        )
        session.add(user)
        await session.commit()

    from httpx import ASGITransport
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client

    app.dependency_overrides.clear()
    await engine.dispose()

@pytest.mark.asyncio
async def test_auth_login_and_me(async_client: AsyncClient):
    # 1. Login
    login_resp = await async_client.post("/api/v1/auth/login", json={
        "email": "testcontrol@corridorops.ir",
        "password": "test1234"
    })
    assert login_resp.status_code == 200
    token_data = login_resp.json()["data"]
    token = token_data["access_token"]
    assert token_data["role"] == "admin"

    # 2. Get Me
    headers = {"Authorization": f"Bearer {token}"}
    me_resp = await async_client.get("/api/v1/auth/me", headers=headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["data"]["email"] == "testcontrol@corridorops.ir"

@pytest.mark.asyncio
async def test_all_api_endpoints_contract(async_client: AsyncClient):
    # Obtain Auth Token
    login_resp = await async_client.post("/api/v1/auth/login", json={
        "email": "testcontrol@corridorops.ir",
        "password": "test1234"
    })
    token = login_resp.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Track sections & train schedule
    res = await async_client.get("/api/v1/track-sections", headers=headers)
    assert res.status_code == 200

    res = await async_client.get("/api/v1/train-schedule", headers=headers)
    assert res.status_code == 200

    # 2. Synthetic Generation
    res = await async_client.post("/api/v1/admin/synthetic/generate", json={"count": 2}, headers=headers)
    assert res.status_code == 200

    # 3. Defects creation & query
    res = await async_client.post("/api/v1/defects/tms", json={
        "section_id": "SEC-NDLS-CNB",
        "defect_type": "track",
        "severity": 4,
        "speed_restriction_kmph": 45.0,
        "is_simulated": True
    }, headers=headers)
    assert res.status_code == 200

    res = await async_client.get("/api/v1/defects", headers=headers)
    assert res.status_code == 200

    # 4. Corridor Events Synthesize & Query
    res = await async_client.post("/api/v1/corridor-events/synthesize", json={"section_ids": ["SEC-NDLS-CNB"]}, headers=headers)
    assert res.status_code == 200
    events = res.json()["data"]
    assert len(events) > 0
    event_id = events[0]["id"]

    res = await async_client.get("/api/v1/corridor-events", headers=headers)
    assert res.status_code == 200

    res = await async_client.get(f"/api/v1/corridor-events/{event_id}", headers=headers)
    assert res.status_code == 200

    # 5. Criticality Scoring & Explainability
    res = await async_client.post("/api/v1/scoring/criticality", json={"event_ids": [event_id]}, headers=headers)
    assert res.status_code == 200

    res = await async_client.get(f"/api/v1/scoring/criticality/{event_id}", headers=headers)
    assert res.status_code == 200
    assert "feature_breakdown" in res.json()["data"]

    # 6. Schedule Optimization & Shadow Block
    res = await async_client.post("/api/v1/schedule/optimize", json={"horizon_type": "weekly"}, headers=headers)
    assert res.status_code == 200
    schedules = res.json()["data"]
    assert len(schedules) > 0
    slot_id = schedules[0]["id"]

    res = await async_client.post("/api/v1/schedule/default/shadow-block", headers=headers)
    assert res.status_code == 200

    # 7. What-If Simulator
    res = await async_client.post("/api/v1/simulate/what-if", json={"schedule_batch_id": "default", "iterations": 50}, headers=headers)
    assert res.status_code == 200
    assert "p95_delay_minutes" in res.json()["data"]

    # 8. Dual Horizon Schedules
    res = await async_client.get("/api/v1/schedule/monthly", headers=headers)
    assert res.status_code == 200

    res = await async_client.get("/api/v1/schedule/weekly", headers=headers)
    assert res.status_code == 200

    # 9. Dashboard Overview & Conflicts
    res = await async_client.get("/api/v1/dashboard/overview", headers=headers)
    assert res.status_code == 200

    res = await async_client.get("/api/v1/dashboard/conflicts", headers=headers)
    assert res.status_code == 200

    # 10. Override & BDMS Gateway
    res = await async_client.patch(f"/api/v1/schedule/slots/{slot_id}/override", json={
        "new_start": "2026-09-03T02:00:00",
        "new_end": "2026-09-03T05:00:00",
        "reason": "Emergency rail grinder availability"
    }, headers=headers)
    assert res.status_code == 200

    res = await async_client.post("/api/v1/bdms/gateway/submit", json={"schedule_batch_id": "default"}, headers=headers)
    assert res.status_code == 200
    sub_id = res.json()["data"]["submission_id"]

    res = await async_client.get(f"/api/v1/bdms/gateway/status/{sub_id}", headers=headers)
    assert res.status_code == 200

    # 11. Field Work Orders
    res = await async_client.get("/api/v1/field/work-orders", headers=headers)
    assert res.status_code == 200
    wo_list = res.json()["data"]
    wo_id = wo_list[0]["id"] if wo_list else 1

    res = await async_client.patch(f"/api/v1/field/work-orders/{wo_id}/complete", json={
        "actual_start": "2026-09-03T02:05:00",
        "actual_end": "2026-09-03T04:55:00",
        "geo_tag": "POINT(77.2197 28.6143)"
    }, headers=headers)
    assert res.status_code == 200

    # 12. Analytics & Retrain
    res = await async_client.get("/api/v1/analytics/post-maintenance", headers=headers)
    assert res.status_code == 200

    res = await async_client.post("/api/v1/feedback/retrain", json={}, headers=headers)
    assert res.status_code == 200
    assert res.json()["data"]["status"] == "success"
