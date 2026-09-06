# CorridorOps — Complete Project Documentation

**AI-Powered Automatic Block Planning to Maximize Asset Availability for Train Operations on Indian Railways**

> Smart India Hackathon (SIH) 2024 — Problem Statement PS1  
> Team: CorridorOps | Theme: Railways

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Architecture](#3-architecture)
4. [Installation & Running](#4-installation--running)
5. [Environment Variables](#5-environment-variables)
6. [Demo Credentials](#6-demo-credentials)
7. [API Reference](#7-api-reference)
8. [Unique Selling Points (USPs)](#8-unique-selling-points-usps)
9. [Data Sources & Transparency](#9-data-sources--transparency)
10. [Project Structure](#10-project-structure)
11. [Known Limitations](#11-known-limitations)
12. [Docker Deployment](#12-docker-deployment)

---

## 1. Project Overview

CorridorOps is an AI-powered block planning and operations intelligence system for Indian Railways. It automates the scheduling of maintenance blocks across the **Engineering (Track)**, **Signal & Telecom**, and **Traction Distribution** departments by:

- Synthesizing defect/fault data from TMS, SMMS, and TDMS systems
- Scoring maintenance urgency using ML (GradientBoostingRegressor)
- Optimizing maintenance windows using Google OR-Tools CP-SAT constraint solver
- Merging multi-department tasks into synchronized shadow blocks (USP 1)
- Evaluating conflict impact on train operations using COA data (USP 2)
- Automating the BDMS block request workflow (USP 3)
- Mining hidden maintenance opportunities in train schedules (USP 5)
- Simulating delay impact via Monte Carlo What-If analysis (USP 10)

---

## 2. Technology Stack

### Backend
| Component | Technology | Version |
|---|---|---|
| Framework | FastAPI | 0.110+ |
| Server | Uvicorn (ASGI) | 0.28+ |
| ORM | SQLAlchemy (Async) | 2.0+ |
| Database (Dev) | SQLite + aiosqlite | — |
| Database (Prod) | PostgreSQL + asyncpg | — |
| Auth | PyJWT + passlib[bcrypt] | — |
| AI Optimizer | Google OR-Tools CP-SAT | 9.9+ |
| ML Model | scikit-learn GradientBoostingRegressor | 1.4+ |
| Spatial | Shapely + GeoAlchemy2 | — |
| Data | NumPy, Pandas | — |
| Validation | Pydantic v2 | 2.6+ |
| Testing | pytest + pytest-asyncio + httpx | — |

### Frontend
| Component | Technology | Version |
|---|---|---|
| Framework | React + TypeScript | 18 |
| Build Tool | Vite | 5.x |
| Styling | TailwindCSS | 3.x |
| State | Zustand | — |
| Router | React Router v6 | — |
| Map | Leaflet + react-leaflet | — |
| Charts | Recharts | — |
| Icons | Lucide React | — |
| WebSocket | Native browser WebSocket | — |

### Infrastructure
| Component | Technology |
|---|---|
| Containerization | Docker + docker-compose |
| Spatial DB (Prod) | PostGIS 15-3.3 |

---

## 3. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React/Vite)                   │
│  Login  Signup  Dashboard  Schedule  Conflicts  BDMS  Map   │
│         Field Ops   Analytics   Data Sources                │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS / WebSocket
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   FastAPI Backend (Port 8000)                │
│  /api/v1/auth        JWT Authentication + Signup/Login      │
│  /api/v1/ingest      Track Sections + Train Schedules       │
│  /api/v1/defects     TMS / SMMS / TDMS / BDMS Requests      │
│  /api/v1/...         AI Core, Closed-Loop, Analytics        │
└────────┬─────────────────────┬───────────────────────────────┘
         │                     │
         ▼                     ▼
┌────────────────┐    ┌────────────────────────────────────────┐
│   SQLite DB    │    │          AI Services Layer             │
│ (Dev/Default)  │    │  scoring.py   → GBRegressor ML         │
│    OR          │    │  solver.py    → OR-Tools CP-SAT        │
│  PostgreSQL    │    │  shadow_blocking.py → Dept merger       │
│  (Prod/Docker) │    │  spatial_synthesizer.py → GIS join     │
└────────────────┘    │  simulator.py → Monte Carlo What-If   │
                      └────────────────────────────────────────┘
```

### Data Flow

```
1. Seed Data (startup)
   GeoJSON corridors → TrackSection DB
   CSV timetable     → TrainSchedule DB
   Synthetic generator → TMS/SMMS/TDMS/BDMS records

2. Stage 2: AI Decision Pipeline
   TMS + SMMS + TDMS + BDMS → spatial_synthesizer → CorridorEvents
   CorridorEvents → scoring.py → CriticalityScore (GBRegressor)
   CorridorEvents → solver.py → Optimized Schedule (CP-SAT)
   Schedules → shadow_blocking.py → ShadowBlock (merged block)

3. Stage 4: Operational Loop
   Schedules → bdms/gateway/requests → BDMS Workflow
   Schedules → field/work-orders → Field Crew dispatch
   WorkOrders completed → feedback → analytics/variance
   Feedback → feedback/retrain → Model improvement
```

---

## 4. Installation & Running

### Prerequisites

| Tool | Minimum Version |
|---|---|
| Python | 3.10+ |
| Node.js | 18+ |
| npm | 9+ |
| Git | Any |

### Backend Setup

```powershell
# 1. Navigate to backend directory
cd c:\Users\Deepa\Downloads\Ps1SIH\Ps1SIH\backend

# 2. Create virtual environment
python -m venv venv

# 3. Activate virtual environment
venv\Scripts\Activate.ps1          # Windows PowerShell
# source venv/bin/activate          # Linux/macOS

# 4. Install all dependencies
venv\Scripts\pip install -r requirements.txt

# 5. Start the backend server
$env:PYTHONPATH="."; venv\Scripts\uvicorn app.main:app --reload --port 8000
```

> **On first startup**, the server automatically:
> - Creates all database tables
> - Seeds 3 default users (admin, control, field)
> - Loads 5 real GeoJSON corridor sections
> - Loads 10 real train schedule entries
> - Generates synthetic TMS/SMMS/TDMS/BDMS records

### Frontend Setup

```powershell
# 1. Navigate to frontend directory
cd c:\Users\Deepa\Downloads\Ps1SIH\Ps1SIH\frontend

# 2. Install npm packages
npm install

# 3. Start Vite dev server
npm run dev
```

### Access URLs

| Service | URL |
|---|---|
| Frontend App | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| Swagger Docs | http://localhost:8000/docs |
| ReDoc | http://localhost:8000/redoc |

---

## 5. Environment Variables

Copy `backend/.env.example` to `backend/.env` to configure:

```env
# JWT Secret — change in production
SECRET_KEY=your-super-secret-jwt-key-replace-this-in-production

# JWT Algorithm
ALGORITHM=HS256

# Token expiry in minutes (default 7 days)
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Database — SQLite (dev default, no config needed)
# DATABASE_URL=sqlite+aiosqlite:///./corridorops.db

# Database — PostgreSQL (production/Docker)
DATABASE_URL=postgresql+asyncpg://corridor_user:corridor_password@localhost:5432/corridorops_db
```

> **Note:** If `DATABASE_URL` is not set, the app defaults to SQLite. No additional setup is required for local development.

---

## 6. Demo Credentials

Three users are seeded automatically on first startup:

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Administrator** | `admin@corridorops.ir` | `admin123` | Full system access, synthetic data generation |
| **Control Office** | `control@corridorops.ir` | `control123` | Schedule management, BDMS approval |
| **Field Crew / SSE** | `field@corridorops.ir` | `field123` | Work orders, field completion |

### Creating New Users

Navigate to **http://localhost:3000/signup** or use the API:

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Senior Section Engineer",
    "email": "sse@railways.gov.in",
    "password": "mypassword",
    "role": "field_crew",
    "department": "engineering"
  }'
```

**Allowed roles:** `admin` | `control_office` | `field_crew`  
**Allowed departments:** `engineering` | `signal_telecom` | `traction` | `operations`

---

## 7. API Reference

All endpoints are prefixed with `/api/v1`. Authentication uses **Bearer JWT tokens**.

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | ❌ Public | Create new user account |
| `POST` | `/auth/login` | ❌ Public | Login, returns JWT token |
| `GET` | `/auth/me` | ✅ JWT | Get current logged-in user |

**Login Request:**
```json
{ "email": "admin@corridorops.ir", "password": "admin123" }
```
**Login Response:**
```json
{
  "data": {
    "access_token": "eyJ...",
    "token_type": "bearer",
    "role": "admin",
    "user_id": 1,
    "email": "admin@corridorops.ir",
    "full_name": "System Administrator"
  }
}
```

---

### Infrastructure & Ingestion

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/track-sections` | List all railway track sections |
| `GET` | `/track-sections/{section_id}` | Get section detail with active events |
| `POST` | `/ingest/track-sections` | Ingest GeoJSON corridor data |
| `GET` | `/train-schedule` | List train schedules |
| `POST` | `/ingest/train-schedule` | Ingest train timetable CSV data |

---

### Defects & Department Faults

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/defects` | Unified defect list (TMS + SMMS + TDMS) |
| `POST` | `/defects/tms` | Create Track Management System defect |
| `POST` | `/defects/smms` | Create Signal & Telecom fault |
| `POST` | `/defects/tdms` | Create Traction Distribution fault |
| `POST` | `/bdms/requests` | Create BDMS block demand request |
| `POST` | `/admin/synthetic/generate` | Regenerate synthetic data (`admin` only) |

---

### AI Decision Core (Stage 2)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/corridor-events/synthesize` | Run GIS spatial join → create CorridorEvents |
| `GET` | `/corridor-events` | List all corridor events |
| `GET` | `/corridor-events/{id}` | Get event detail |
| `POST` | `/corridor-events/score` | Run GBRegressor criticality scoring |
| `GET` | `/corridor-events/{id}/explain` | Explainability breakdown for one event |
| `POST` | `/schedule/optimize` | Run OR-Tools CP-SAT scheduler |
| `GET` | `/schedule` | List generated schedules |
| `POST` | `/schedule/shadow-block` | Apply shadow blocking merger |
| `GET` | `/shadow-blocks` | **[NEW]** Rich shadow block results with scores |
| `GET` | `/corridor-events/opportunities` | **[NEW]** Maintenance opportunity mining |
| `POST` | `/whatif/simulate` | Run Monte Carlo What-If simulation |

---

### BDMS Workflow & Closed-Loop (Stage 4)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/dashboard/overview` | Dashboard KPIs (total events, avg score, schedules) |
| `GET` | `/dashboard/conflicts` | Conflict list with train impact analysis |
| `GET` | `/bdms/gateway/requests` | **[NEW]** All BDMS block requests with full detail |
| `POST` | `/bdms/gateway/submit` | Submit blocks to BDMS gateway |
| `GET` | `/bdms/gateway/status/{id}` | Get submission status |
| `PATCH` | `/bdms/gateway/requests/{id}/approve` | **[NEW]** Approve a block request |
| `PATCH` | `/bdms/gateway/requests/{id}/reject` | **[NEW]** Reject a block request |
| `GET` | `/field/work-orders` | List field crew work orders |
| `PATCH` | `/field/work-orders/{id}/complete` | Mark work order complete with GPS tag |
| `GET` | `/analytics/post-maintenance` | Planned vs actual variance data |
| `POST` | `/feedback/retrain` | Trigger ML model retraining on feedback |

---

### WebSocket

| Endpoint | Description |
|---|---|
| `ws://localhost:8000/ws` | Real-time dashboard updates (schedule events, BDMS approvals) |

---

## 8. Unique Selling Points (USPs)

### USP 1 — Corridor-Level Shadow Blocking ✅ Implemented

**Problem:** Engineering, Signal & Telecom, and Traction departments each file separate maintenance block requests for the same corridor, causing multiple disruptions.

**Solution:** The shadow blocking engine detects co-located multi-department tasks and merges them into one synchronized maintenance window.

**Key Metrics Computed:**
- **Consolidation Score (0–100):** Based on dept synergy, task severity, task density
- **Estimated Downtime Reduction (%):** Traditional N×2h blocks vs one 3h combined block
- **Human-readable explanation:** Auto-generated narrative explaining the merger

**API Endpoints:**
- `POST /api/v1/schedule/shadow-block` — execute merging
- `GET /api/v1/shadow-blocks` — view results with full detail

---

### USP 2 — COA-Based Conflict Prediction ✅ Implemented

**Problem:** Maintenance blocks are approved without knowing whether they clash with critical train movements.

**Solution:** The conflict analyzer evaluates scheduled maintenance blocks against the COA (Control Office Authorization) train schedule and identifies high-impact clashes.

**API Endpoint:** `GET /api/v1/dashboard/conflicts`

---

### USP 3 — Closed-Loop BDMS Automation ✅ Implemented

**Problem:** Block Demand Management System (BDMS) requests are filed manually and the status is opaque.

**Solution:** A complete digital workflow from block creation to execution:

```
Draft → Submitted → Under Review → Approved/Rejected → Executed → Completed
```

**Features:**
- Full block detail: stations, departments, tasks, priority, risk score, conflict score
- Approve / Reject actions with WebSocket broadcast
- PROTOTYPE label — clearly marked as mock gateway (no direct IR BDMS access)

**API Endpoints:**
- `GET /api/v1/bdms/gateway/requests`
- `PATCH /api/v1/bdms/gateway/requests/{block_id}/approve`
- `PATCH /api/v1/bdms/gateway/requests/{block_id}/reject`

---

### USP 4 — AI-Based Maintenance Priority & Risk Scoring ✅ Implemented

**Problem:** Maintenance priority decisions are subjective and vary by officer.

**Solution:** Transparent weighted ML scoring using GradientBoostingRegressor with explainability.

**Scoring Formula (Transparent, not black-box):**
```
Base Score  = severity × weight_s + overdue_flag × weight_o + ...
ML Boost    = GBRegressor prediction on feature vector
Final Score = min(100, base_score + ml_boost)
```

**Explainability:** Each score comes with a breakdown of contributing factors (severity, overdue status, defect type, speed restriction).

**Priority Classification:**
- **Critical:** Score ≥ 80
- **High:** Score ≥ 60
- **Medium:** Score ≥ 40
- **Low:** Score < 40

**API Endpoint:** `GET /api/v1/corridor-events/{id}/explain`

---

### USP 5 — Maintenance Opportunity Mining ✅ Implemented

**Problem:** Maintenance planners only look for completely empty corridors. Hidden low-traffic windows between trains are wasted.

**Solution:** Analyzes the full 24-hour train schedule using a 48-slot (30-min each) timeline and discovers:
- Gaps between consecutive train movements
- Low-traffic windows (1–2 trains only)
- Match pending maintenance tasks to suitable windows by duration

**Block Suitability Score (0–100):**
```
Traffic Bonus (0/20/30) + Task Match Score + Duration Score = Suitability Score
```

**API Endpoint:** `GET /api/v1/corridor-events/opportunities`

---

### USP 10 — What-If Scenario Simulator ✅ Implemented

**Problem:** Planners cannot evaluate the delay risk of a maintenance block before approving it.

**Solution:** Monte Carlo simulation that runs 500 stochastic trials per block and estimates:
- Probability of delay cascade
- Expected delay minutes (P50 / P90)
- Affected train count

**API Endpoint:** `POST /api/v1/whatif/simulate`

---

## 9. Data Sources & Transparency

> **CorridorOps follows a strict data transparency policy. All data sources are explicitly labeled as REAL or SIMULATED.**

| Table | Data Source | Type |
|---|---|---|
| `track_sections` | DataMeet OpenStreetMap Indian Railways GeoJSON | ✅ REAL PUBLIC DATA |
| `train_schedule` | data.gov.in Published Train Timetable CSV | ✅ REAL PUBLIC DATA |
| `tms_defects` | Statistical Synthetic Generator (IR Year Book tuned) | ⚠️ SIMULATED (`is_simulated=True`) |
| `smms_faults` | Statistical Synthetic Generator (IR Year Book tuned) | ⚠️ SIMULATED (`is_simulated=True`) |
| `tdms_faults` | Statistical Synthetic Generator (IR Year Book tuned) | ⚠️ SIMULATED (`is_simulated=True`) |
| `bdms_requests` | Statistical Synthetic Generator (IR Year Book tuned) | ⚠️ SIMULATED (`is_simulated=True`) |

All synthetic records are flagged with `is_simulated=True` in the database. The **Data Sources** page in the frontend displays this transparency registry.

---

## 10. Project Structure

```
Ps1SIH/
├── backend/
│   ├── app/
│   │   ├── api/v1/
│   │   │   ├── auth.py              # Login + Signup endpoints
│   │   │   ├── ingestion.py         # Track & schedule ingestion
│   │   │   ├── defects.py           # TMS/SMMS/TDMS/BDMS + synthetic gen
│   │   │   ├── ai_core.py           # AI pipeline: synthesize, score, schedule, opportunities
│   │   │   └── closed_loop.py       # Dashboard, BDMS workflow, field ops, analytics
│   │   ├── core/
│   │   │   ├── config.py            # Settings + JWT config
│   │   │   ├── database.py          # Async SQLAlchemy + init_db
│   │   │   └── security.py          # JWT create/verify, bcrypt, role guards
│   │   ├── models/models.py         # 11 SQLAlchemy ORM models
│   │   ├── schemas/schemas.py       # 35+ Pydantic v2 schemas
│   │   ├── services/
│   │   │   ├── scoring.py           # GradientBoosting ML + explainability
│   │   │   ├── shadow_blocking.py   # Shadow block merger + consolidation scoring
│   │   │   ├── simulator.py         # Monte Carlo What-If simulator
│   │   │   ├── solver.py            # OR-Tools CP-SAT optimizer
│   │   │   ├── spatial_synthesizer.py # GIS join + opportunity mining
│   │   │   └── ws_manager.py        # WebSocket broadcast manager
│   │   ├── synthetic/
│   │   │   ├── generator.py         # Statistical synthetic data generator
│   │   │   ├── geo_loader.py        # GeoJSON → DB loader
│   │   │   ├── timetable_loader.py  # CSV → DB loader
│   │   │   └── seed_data/
│   │   │       ├── corridors.geojson   # 5 real IR corridors
│   │   │       └── train_schedule.csv  # 10 real train schedules
│   │   └── main.py                  # FastAPI app + startup seeder
│   ├── tests/
│   │   ├── test_api.py              # Auth + defect + BDMS API tests
│   │   ├── test_ingestion.py        # Track section + schedule ingestion tests
│   │   └── test_pipeline_e2e.py     # End-to-end pipeline tests
│   ├── .env.example                 # Environment template
│   ├── requirements.txt
│   ├── Dockerfile
│   └── corridorops.db               # SQLite DB (auto-created)
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx                  # Router + ProtectedRoute + all routes
│   │   ├── api/client.ts            # apiFetch wrapper (auto-attaches JWT)
│   │   ├── stores/
│   │   │   ├── authStore.ts         # Zustand: token, user, login/logout
│   │   │   └── opsStore.ts          # Zustand: division, horizon, WS state
│   │   ├── pages/
│   │   │   ├── Login.tsx            # JWT login + link to Signup
│   │   │   ├── Signup.tsx           # [NEW] User registration form
│   │   │   ├── Dashboard.tsx        # KPI cards + Leaflet map + alerts
│   │   │   ├── ScheduleView.tsx     # Gantt + CP-SAT + shadow block + what-if
│   │   │   ├── Conflicts.tsx        # COA conflict matrix
│   │   │   ├── BDMSWorkflow.tsx     # [NEW] Full BDMS lifecycle tracker
│   │   │   ├── FieldOps.tsx         # Mobile work order + GPS completion
│   │   │   ├── Analytics.tsx        # Variance charts + ML retrain
│   │   │   ├── CorridorMap.tsx      # Full Leaflet corridor map
│   │   │   └── DataSources.tsx      # Data transparency registry
│   │   ├── components/
│   │   │   ├── GanttTimeline.tsx    # SVG Gantt chart
│   │   │   ├── Navbar.tsx           # Top nav + division/horizon selector
│   │   │   ├── Sidebar.tsx          # Left nav with BDMS item
│   │   │   └── SectionDrawer.tsx    # Section detail panel
│   │   └── layouts/ControlRoomLayout.tsx
│   ├── tests/components.test.tsx
│   └── package.json
│
├── docker-compose.yml               # Backend + Frontend + PostgreSQL
└── backend/.env.example             # [NEW] Environment template
```

---

## 11. Known Limitations

> These are clearly documented in the project to avoid false claims.

| Limitation | Details |
|---|---|
| **No live IR system access** | Direct TMS, SMMS, TDMS, BDMS system integration is not possible (proprietary, internal IR systems). All defect/fault data is synthetic. |
| **Mock BDMS Gateway** | The BDMS workflow is a prototype. No actual connection to Indian Railways' Block Demand Management System exists. Clearly labeled `[PROTOTYPE]` in the UI. |
| **Simulated COA data** | Real-time Control Office Authorization data is unavailable. Published train timetable CSV is used as the baseline. |
| **ML model trained on synthetic data** | The GradientBoostingRegressor is pre-trained on synthetic defect data. Real-world performance will improve once actual TMS/SMMS/TDMS data is available for retraining. |
| **SQLite for development** | SQLite does not support PostGIS spatial queries. Full GIS capability requires PostgreSQL + PostGIS (configured in docker-compose). |
| **Opportunity mining is 30-min granularity** | The timeline uses 30-minute slots. Finer granularity (e.g., 5-min) would require real-time COA feeds. |

---

## 12. Docker Deployment

For production or team-shared environment using PostgreSQL + PostGIS:

```powershell
# From the project root
cd c:\Users\Deepa\Downloads\Ps1SIH\Ps1SIH

# Build and start all services
docker-compose up --build

# Services started:
#   PostgreSQL + PostGIS → localhost:5432
#   Backend API          → localhost:8000
#   Frontend             → localhost:3000
```

**docker-compose services:**

| Service | Image | Port |
|---|---|---|
| `postgres` | postgis/postgis:15-3.3 | 5432 |
| `backend` | Custom Dockerfile (FastAPI) | 8000 |
| `frontend` | Custom Dockerfile (Vite/Nginx) | 3000 |

**Default Docker DB credentials:**
```
Host:     localhost:5432
Database: corridorops_db
User:     corridor_user
Password: corridor_password
```

---

## Running Tests

```powershell
# Backend tests
cd c:\Users\Deepa\Downloads\Ps1SIH\Ps1SIH\backend
$env:PYTHONPATH="."; venv\Scripts\pytest -v

# Frontend tests
cd c:\Users\Deepa\Downloads\Ps1SIH\Ps1SIH\frontend
npm test
```

---

*Documentation generated for SIH 2024 submission — CorridorOps Team*
