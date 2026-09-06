import datetime
from typing import List, Optional, Any
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON, Enum as SQLEnum
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum
from app.core.database import Base

# Enums
class DefectTypeEnum(str, enum.Enum):
    track = "track"
    bridge = "bridge"
    point_crossing = "point_crossing"

class SMMSFaultTypeEnum(str, enum.Enum):
    signal = "signal"
    interlocking = "interlocking"
    telecom = "telecom"

class TDMSFaultTypeEnum(str, enum.Enum):
    ohe = "ohe"
    substation = "substation"
    power_block = "power_block"

class DepartmentEnum(str, enum.Enum):
    engineering = "engineering"
    signal_telecom = "signal_telecom"
    traction = "traction"

class BDMSStatusEnum(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"

class ScheduleStatusEnum(str, enum.Enum):
    draft = "draft"
    shadow_blocked = "shadow_blocked"
    approved = "approved"
    executed = "executed"

class UserRoleEnum(str, enum.Enum):
    control_office = "control_office"
    field_crew = "field_crew"
    admin = "admin"

class TrackSection(Base):
    __tablename__ = "track_sections"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    section_id: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    geometry: Mapped[str] = mapped_column(Text, nullable=False)  # WKT LineString e.g. "LINESTRING(77.2 28.6, 77.3 28.7)"
    zone: Mapped[str] = mapped_column(String(32), nullable=False)
    division: Mapped[str] = mapped_column(String(32), nullable=False)
    start_station: Mapped[str] = mapped_column(String(64), nullable=False)
    end_station: Mapped[str] = mapped_column(String(64), nullable=False)

    train_schedules: Mapped[List["TrainSchedule"]] = relationship("TrainSchedule", back_populates="track_section")
    tms_defects: Mapped[List["TMSDefect"]] = relationship("TMSDefect", back_populates="track_section")
    smms_faults: Mapped[List["SMMSFault"]] = relationship("SMMSFault", back_populates="track_section")
    tdms_faults: Mapped[List["TDMSFault"]] = relationship("TDMSFault", back_populates="track_section")
    bdms_requests: Mapped[List["BDMSRequest"]] = relationship("BDMSRequest", back_populates="track_section")

class TrainSchedule(Base):
    __tablename__ = "train_schedule"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    train_number: Mapped[str] = mapped_column(String(32), index=True, nullable=False)
    section_id: Mapped[str] = mapped_column(String(64), ForeignKey("track_sections.section_id"), nullable=False)
    arrival_time: Mapped[str] = mapped_column(String(8), nullable=False)  # HH:MM format
    departure_time: Mapped[str] = mapped_column(String(8), nullable=False)  # HH:MM format
    days_of_week: Mapped[str] = mapped_column(String(64), nullable=False)  # e.g. "MON,TUE,WED"
    train_type: Mapped[str] = mapped_column(String(32), nullable=False)  # passenger / freight

    track_section: Mapped["TrackSection"] = relationship("TrackSection", back_populates="train_schedules")

class TMSDefect(Base):
    __tablename__ = "tms_defects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    defect_id: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    section_id: Mapped[str] = mapped_column(String(64), ForeignKey("track_sections.section_id"), nullable=False)
    defect_type: Mapped[str] = mapped_column(String(32), nullable=False)  # track, bridge, point_crossing
    severity: Mapped[int] = mapped_column(Integer, nullable=False)  # 1 to 5
    reported_date: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)
    speed_restriction_kmph: Mapped[float] = mapped_column(Float, default=0.0)
    overdue_flag: Mapped[bool] = mapped_column(Boolean, default=False)
    is_simulated: Mapped[bool] = mapped_column(Boolean, default=True)

    track_section: Mapped["TrackSection"] = relationship("TrackSection", back_populates="tms_defects")

class SMMSFault(Base):
    __tablename__ = "smms_faults"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    fault_id: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    section_id: Mapped[str] = mapped_column(String(64), ForeignKey("track_sections.section_id"), nullable=False)
    fault_type: Mapped[str] = mapped_column(String(32), nullable=False)  # signal, interlocking, telecom
    severity: Mapped[int] = mapped_column(Integer, nullable=False)  # 1 to 5
    reported_date: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)
    is_simulated: Mapped[bool] = mapped_column(Boolean, default=True)

    track_section: Mapped["TrackSection"] = relationship("TrackSection", back_populates="smms_faults")

class TDMSFault(Base):
    __tablename__ = "tdms_faults"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    fault_id: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    section_id: Mapped[str] = mapped_column(String(64), ForeignKey("track_sections.section_id"), nullable=False)
    fault_type: Mapped[str] = mapped_column(String(32), nullable=False)  # ohe, substation, power_block
    severity: Mapped[int] = mapped_column(Integer, nullable=False)  # 1 to 5
    reported_date: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)
    is_simulated: Mapped[bool] = mapped_column(Boolean, default=True)

    track_section: Mapped["TrackSection"] = relationship("TrackSection", back_populates="tdms_faults")

class BDMSRequest(Base):
    __tablename__ = "bdms_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    request_id: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    department: Mapped[str] = mapped_column(String(32), nullable=False)  # engineering, signal_telecom, traction
    section_id: Mapped[str] = mapped_column(String(64), ForeignKey("track_sections.section_id"), nullable=False)
    requested_window_start: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False)
    requested_window_end: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False)
    crew_required: Mapped[int] = mapped_column(Integer, default=1)
    machine_required: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String(32), default="pending")  # pending, approved, rejected
    is_simulated: Mapped[bool] = mapped_column(Boolean, default=True)

    track_section: Mapped["TrackSection"] = relationship("TrackSection", back_populates="bdms_requests")

class CorridorEvent(Base):
    __tablename__ = "corridor_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    section_id: Mapped[str] = mapped_column(String(64), ForeignKey("track_sections.section_id"), nullable=False)
    departments: Mapped[Any] = mapped_column(JSON, nullable=False, default=list)  # list of strings
    criticality_score: Mapped[float] = mapped_column(Float, default=0.0)
    confidence: Mapped[float] = mapped_column(Float, default=1.0)
    merged_from: Mapped[Any] = mapped_column(JSON, nullable=False, default=list)  # list of source defect/fault/request IDs
    status: Mapped[str] = mapped_column(String(32), default="synthesized")

class Schedule(Base):
    __tablename__ = "schedules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    horizon_type: Mapped[str] = mapped_column(String(16), nullable=False)  # monthly, weekly
    section_id: Mapped[str] = mapped_column(String(64), ForeignKey("track_sections.section_id"), nullable=False)
    planned_start: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False)
    planned_end: Mapped[datetime.datetime] = mapped_column(DateTime, nullable=False)
    departments: Mapped[Any] = mapped_column(JSON, nullable=False, default=list)
    status: Mapped[str] = mapped_column(String(32), default="draft")  # draft, shadow_blocked, approved, executed

    work_orders: Mapped[List["WorkOrder"]] = relationship("WorkOrder", back_populates="schedule")
    bdms_submissions: Mapped[List["BDMSSubmission"]] = relationship("BDMSSubmission", back_populates="schedule")
    analytics_variances: Mapped[List["AnalyticsVariance"]] = relationship("AnalyticsVariance", back_populates="schedule")

class WorkOrder(Base):
    __tablename__ = "work_orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    schedule_id: Mapped[int] = mapped_column(Integer, ForeignKey("schedules.id"), nullable=False)
    crew_id: Mapped[str] = mapped_column(String(64), nullable=False)
    assigned_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)
    actual_start: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime, nullable=True)
    actual_end: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime, nullable=True)
    actual_status: Mapped[str] = mapped_column(String(32), default="assigned")  # assigned, in_progress, completed
    geo_tag: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # WKT Point or JSON e.g. "POINT(77.2 28.6)"

    schedule: Mapped["Schedule"] = relationship("Schedule", back_populates="work_orders")

class BDMSSubmission(Base):
    __tablename__ = "bdms_submissions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    schedule_id: Mapped[int] = mapped_column(Integer, ForeignKey("schedules.id"), nullable=False)
    submitted_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)
    gateway_status: Mapped[str] = mapped_column(String(32), default="pending")  # pending, approved, rejected
    gateway_response_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime, nullable=True)

    schedule: Mapped["Schedule"] = relationship("Schedule", back_populates="bdms_submissions")

class AnalyticsVariance(Base):
    __tablename__ = "analytics_variance"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    schedule_id: Mapped[int] = mapped_column(Integer, ForeignKey("schedules.id"), nullable=False)
    planned_duration_min: Mapped[float] = mapped_column(Float, nullable=False)
    actual_duration_min: Mapped[float] = mapped_column(Float, nullable=False)
    variance_min: Mapped[float] = mapped_column(Float, nullable=False)
    speed_recovery_score: Mapped[float] = mapped_column(Float, default=100.0)

    schedule: Mapped["Schedule"] = relationship("Schedule", back_populates="analytics_variances")

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(128), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(256), nullable=False)
    role: Mapped[str] = mapped_column(String(32), default="control_office")  # control_office, field_crew, admin
    full_name: Mapped[str] = mapped_column(String(128), nullable=False)
