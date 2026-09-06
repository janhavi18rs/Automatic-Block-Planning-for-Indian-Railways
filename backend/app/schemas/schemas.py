import datetime
from typing import List, Optional, Any, Generic, TypeVar
# pyrefly: ignore [missing-import]
from pydantic import BaseModel, Field, EmailStr

T = TypeVar("T")

class StandardResponse(BaseModel, Generic[T]):
    data: T
    meta: dict = Field(default_factory=dict)

# Auth Schemas
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class SignupRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: str = "control_office"  # control_office, field_crew, admin
    department: Optional[str] = None  # engineering, signal_telecom, traction

class SignupResponse(BaseModel):
    user_id: int
    email: str
    full_name: str
    role: str
    message: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    email: str
    full_name: str

class UserSchema(BaseModel):
    id: int
    email: str
    role: str
    full_name: str

    class Config:
        from_attributes = True

# Track Section Schemas
class TrackSectionBase(BaseModel):
    section_id: str
    geometry: str
    zone: str
    division: str
    start_station: str
    end_station: str

class TrackSectionCreate(TrackSectionBase):
    pass

class TrackSectionSchema(TrackSectionBase):
    id: int

    class Config:
        from_attributes = True

class TrackSectionDetailSchema(TrackSectionSchema):
    active_events: List[Any] = []

# GeoJSON Feature Collection Schema
class GeoJSONFeatureProperties(BaseModel):
    section_id: str
    zone: Optional[str] = "NR"
    division: Optional[str] = "DLI"
    start_station: Optional[str] = "START"
    end_station: Optional[str] = "END"

class GeoJSONFeatureGeometry(BaseModel):
    type: str
    coordinates: Any

class GeoJSONFeature(BaseModel):
    type: str = "Feature"
    properties: GeoJSONFeatureProperties
    geometry: GeoJSONFeatureGeometry

class GeoJSONFeatureCollection(BaseModel):
    type: str = "FeatureCollection"
    features: List[GeoJSONFeature]

# Train Schedule Schemas
class TrainScheduleBase(BaseModel):
    train_number: str
    section_id: str
    arrival_time: str
    departure_time: str
    days_of_week: str
    train_type: str

class TrainScheduleCreate(TrainScheduleBase):
    pass

class TrainScheduleSchema(TrainScheduleBase):
    id: int

    class Config:
        from_attributes = True

# Defects / Faults Schemas
class TMSDefectCreate(BaseModel):
    defect_id: Optional[str] = None
    section_id: str
    defect_type: str  # track, bridge, point_crossing
    severity: int
    reported_date: Optional[datetime.datetime] = None
    speed_restriction_kmph: float = 0.0
    overdue_flag: bool = False
    is_simulated: bool = True

class TMSDefectSchema(TMSDefectCreate):
    id: int
    defect_id: str
    reported_date: datetime.datetime

    class Config:
        from_attributes = True

class SMMSFaultCreate(BaseModel):
    fault_id: Optional[str] = None
    section_id: str
    fault_type: str  # signal, interlocking, telecom
    severity: int
    reported_date: Optional[datetime.datetime] = None
    is_simulated: bool = True

class SMMSFaultSchema(SMMSFaultCreate):
    id: int
    fault_id: str
    reported_date: datetime.datetime

    class Config:
        from_attributes = True

class TDMSFaultCreate(BaseModel):
    fault_id: Optional[str] = None
    section_id: str
    fault_type: str  # ohe, substation, power_block
    severity: int
    reported_date: Optional[datetime.datetime] = None
    is_simulated: bool = True

class TDMSFaultSchema(TDMSFaultCreate):
    id: int
    fault_id: str
    reported_date: datetime.datetime

    class Config:
        from_attributes = True

class BDMSRequestCreate(BaseModel):
    request_id: Optional[str] = None
    department: str  # engineering, signal_telecom, traction
    section_id: str
    requested_window_start: datetime.datetime
    requested_window_end: datetime.datetime
    crew_required: int = 1
    machine_required: bool = False
    status: str = "pending"
    is_simulated: bool = True

class BDMSRequestSchema(BDMSRequestCreate):
    id: int
    request_id: str

    class Config:
        from_attributes = True

# Unified Defect Response
class UnifiedDefectItem(BaseModel):
    id: str
    source_table: str  # tms, smms, tdms, bdms
    section_id: str
    department: str
    defect_or_fault_type: str
    severity: int
    reported_date: datetime.datetime
    is_simulated: bool
    details: dict = {}

# Synthetic Generator Trigger
class SyntheticGenerateRequest(BaseModel):
    table: Optional[str] = None
    count: Optional[int] = None
    config_overrides: Optional[dict] = None

# Stage 2 AI Decision Core Schemas
class SynthesizeRequest(BaseModel):
    section_ids: Optional[List[str]] = None

class CorridorEventSchema(BaseModel):
    id: int
    section_id: str
    departments: List[str]
    criticality_score: float
    confidence: float
    merged_from: List[str]
    status: str

    class Config:
        from_attributes = True

class CorridorEventDetailSchema(CorridorEventSchema):
    source_records: List[dict] = []

class CriticalityScoreRequest(BaseModel):
    event_ids: Optional[List[int]] = None

class CriticalityExplainabilityResponse(BaseModel):
    event_id: int
    section_id: str
    criticality_score: float
    feature_breakdown: dict  # e.g., {"severity_impact": 35.0, "traffic_density_impact": 25.0, "overdue_penalty": 20.0, "multi_dept_synergy": 15.0}
    explanation: str

class ScheduleOptimizeRequest(BaseModel):
    horizon_type: str = "weekly"  # monthly, weekly
    date_range: Optional[dict] = None
    section_ids: Optional[List[str]] = None

class ScheduleSchema(BaseModel):
    id: int
    horizon_type: str
    section_id: str
    planned_start: datetime.datetime
    planned_end: datetime.datetime
    departments: List[str]
    status: str

    class Config:
        from_attributes = True

class WhatIfSimulationRequest(BaseModel):
    schedule_batch_id: Optional[str] = "default"
    variation_pct: float = 15.0
    iterations: int = 100

class WhatIfSimulationResponse(BaseModel):
    schedule_batch_id: str
    risk_level: str  # low, medium, high
    expected_delay_risk_minutes: float
    p95_delay_minutes: float
    delay_distribution: List[float]
    recommended_adjustment: str

# Stage 4 Closed-Loop Schemas
class DashboardKPIOverview(BaseModel):
    asset_availability_pct: float
    active_conflicts_count: int
    pending_bdms_approvals_count: int
    blocks_scheduled_today_count: int

class ConflictItem(BaseModel):
    conflict_id: str
    section_id: str
    conflict_type: str
    severity: str
    affected_departments: List[str]
    proposed_resolution: str
    schedule_ids: List[int]

class SlotOverrideRequest(BaseModel):
    new_start: datetime.datetime
    new_end: datetime.datetime
    reason: str

class BDMSSubmitRequest(BaseModel):
    schedule_batch_id: Optional[str] = "default"

class BDMSSubmissionStatusResponse(BaseModel):
    submission_id: int
    schedule_id: int
    submitted_at: datetime.datetime
    gateway_status: str
    gateway_response_at: Optional[datetime.datetime] = None
    message: str

class WorkOrderSchema(BaseModel):
    id: int
    schedule_id: int
    crew_id: str
    assigned_at: datetime.datetime
    actual_start: Optional[datetime.datetime] = None
    actual_end: Optional[datetime.datetime] = None
    actual_status: str
    geo_tag: Optional[str] = None

    class Config:
        from_attributes = True

class WorkOrderCompleteRequest(BaseModel):
    actual_start: datetime.datetime
    actual_end: datetime.datetime
    geo_tag: str  # e.g., "POINT(77.2197 28.6143)" or "28.6143, 77.2197"

class PostMaintenanceAnalyticsItem(BaseModel):
    schedule_id: int
    section_id: str
    planned_duration_min: float
    actual_duration_min: float
    variance_min: float
    speed_recovery_score: float

class RetrainResponse(BaseModel):
    status: str
    sample_count: int
    previous_r2: float
    new_r2: float
    new_mae: float
    retrained_at: datetime.datetime

# ─── USP 1: Enhanced Shadow Blocking Result ───
class ShadowBlockTaskItem(BaseModel):
    task_id: str
    department: str
    defect_or_fault_type: str
    severity: int
    section_id: str

class ShadowBlockResultSchema(BaseModel):
    block_id: str
    corridor: str
    section_id: str
    start_station: str
    end_station: str
    block_start_time: datetime.datetime
    block_end_time: datetime.datetime
    departments_involved: List[str]
    tasks_included: List[ShadowBlockTaskItem]
    total_maintenance_duration_min: float
    estimated_downtime_reduction_pct: float
    consolidation_score: float  # 0 to 100
    individual_blocks_count: int
    explanation: str
    status: str  # shadow_blocked, approved, etc.

    class Config:
        from_attributes = True

# ─── USP 5: Maintenance Opportunity Mining ───
class MaintenanceOpportunityTask(BaseModel):
    task_id: str
    department: str
    task_type: str
    severity: int
    priority_score: float

class OpportunityWindowSchema(BaseModel):
    window_id: str
    section_id: str
    corridor: str
    window_start: str  # HH:MM format
    window_end: str    # HH:MM format
    duration_minutes: int
    traffic_level: str  # low, medium, high, none
    trains_in_window: int
    suitable_tasks: List[MaintenanceOpportunityTask]
    block_suitability_score: float  # 0 to 100
    recommendation: str

class OpportunityMiningResponse(BaseModel):
    section_id: str
    total_windows_found: int
    opportunities: List[OpportunityWindowSchema]
    analysis_notes: str

# ─── USP 3: BDMS Block Request Detail ───
class BDMSBlockRequestDetail(BaseModel):
    block_id: str
    corridor: str
    section_id: str
    start_station: str
    end_station: str
    start_time: datetime.datetime
    end_time: datetime.datetime
    departments_involved: List[str]
    maintenance_tasks: List[str]
    priority: str  # Critical, High, Medium, Low
    priority_score: float
    risk_score: float
    conflict_score: float
    reason_for_maintenance: str
    approval_status: str  # pending, under_review, approved, rejected, executed, completed
    submitted_at: datetime.datetime
    gateway_response_at: Optional[datetime.datetime] = None
    notes: str = ""
