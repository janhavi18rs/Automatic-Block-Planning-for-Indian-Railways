import datetime
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from app.core.config import settings
from app.core.database import init_db, AsyncSessionLocal
from app.core.security import get_password_hash
from app.models.models import User, TMSDefect
from app.synthetic.geo_loader import load_track_sections_from_geojson
from app.synthetic.timetable_loader import load_train_schedules
from app.synthetic.generator import generate_synthetic_data
from app.services.spatial_synthesizer import synthesize_corridor_events
from app.services.scoring import compute_criticality_scores
from app.services.solver import optimize_maintenance_schedule
from app.services.shadow_blocking import execute_shadow_blocking
from app.services.ws_manager import ws_manager

from app.api.v1.auth import router as auth_router
from app.api.v1.ingestion import router as ingestion_router
from app.api.v1.defects import router as defects_router
from app.api.v1.ai_core import router as ai_core_router
from app.api.v1.closed_loop import router as closed_loop_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="CorridorOps - AI-Powered Automatic Block Planning System for Indian Railways (SIH PS #26027)",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers with /api/v1 prefix
api_v1_prefix = settings.API_V1_STR
app.include_router(auth_router, prefix=api_v1_prefix)
app.include_router(ingestion_router, prefix=api_v1_prefix)
app.include_router(defects_router, prefix=api_v1_prefix)
app.include_router(ai_core_router, prefix=api_v1_prefix)
app.include_router(closed_loop_router, prefix=api_v1_prefix)

@app.websocket("/ws/dashboard")
async def websocket_dashboard(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo or process incoming ping
            await websocket.send_text(f"pong: {data}")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)

@app.on_event("startup")
async def on_startup():
    await init_db()
    async with AsyncSessionLocal() as db:
        # 1. Seed users if not existing
        res = await db.execute(select(User))
        users = res.scalars().all()
        if not users:
            admin_user = User(
                email="admin@corridorops.ir",
                hashed_password=get_password_hash("admin123"),
                role="admin",
                full_name="System Administrator"
            )
            control_user = User(
                email="control@corridorops.ir",
                hashed_password=get_password_hash("control123"),
                role="control_office",
                full_name="Chief Controller NDLS"
            )
            field_user = User(
                email="field@corridorops.ir",
                hashed_password=get_password_hash("field123"),
                role="field_crew",
                full_name="Senior Section Engineer (Track)"
            )
            db.add_all([admin_user, control_user, field_user])
            await db.commit()

        # 2. Seed Track Sections & Timetable & Synthetic Data if needed
        await load_track_sections_from_geojson(db)
        await load_train_schedules(db)
        
        # Check defects
        defects_res = await db.execute(select(TMSDefect))
        defects = defects_res.scalars().all()
        if not defects:
            await generate_synthetic_data(db)
            await synthesize_corridor_events(db)
        await compute_criticality_scores(db)
        await optimize_maintenance_schedule(db, horizon_type="weekly")
        await execute_shadow_blocking(db)

@app.get("/")
async def root():
    return {
        "app": settings.PROJECT_NAME,
        "status": "operational",
        "docs": "/docs",
        "api_v1": settings.API_V1_STR
    }
