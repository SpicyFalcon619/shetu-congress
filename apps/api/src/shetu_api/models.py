"""ORM models.

Deliberately absent: any field for the reason for leave, health, pregnancy or family, and any
score or ranking of people. Shetu works on dates, duties, availability and agreements only.
"""

from datetime import UTC, date, datetime
from enum import StrEnum
from typing import Any
from uuid import uuid4

from sqlalchemy import JSON, Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from shetu_api.db import Base


def _id() -> str:
    return uuid4().hex


def _now() -> datetime:
    return datetime.now(UTC)


class Role(StrEnum):
    EMPLOYEE = "employee"
    MANAGER = "manager"
    COVER = "cover"
    HR = "hr"


class LeaveStatus(StrEnum):
    PLANNING = "planning"
    ACTIVE = "active"
    RETURNING = "returning"
    CLOSED = "closed"


class Evidence(StrEnum):
    SAID = "said"
    DOCUMENTED = "documented"
    SUGGESTED = "suggested"


class DutySource(StrEnum):
    INTERVIEW = "interview"
    JOB_DESCRIPTION = "job_description"
    MANUAL = "manual"


class AssignmentStatus(StrEnum):
    PROPOSED = "proposed"
    APPROVED = "approved"


class ChangeStatus(StrEnum):
    PROPOSED = "proposed"
    APPROVED = "approved"
    REJECTED = "rejected"


class ReturnOutcome(StrEnum):
    RETURNS = "returns"
    CHANGED = "changed"
    STAYS_WITH_COVER = "stays_with_cover"


class Speaker(StrEnum):
    SHETU = "shetu"
    EMPLOYEE = "employee"


def _enum(e: type[StrEnum]) -> SAEnum:
    return SAEnum(e, native_enum=False, length=32, values_callable=lambda x: [m.value for m in x])


class Person(Base):
    __tablename__ = "people"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_id)
    name: Mapped[str] = mapped_column(String(120))
    job_title: Mapped[str] = mapped_column(String(160))
    team: Mapped[str] = mapped_column(String(120))
    organization: Mapped[str] = mapped_column(String(160))
    role: Mapped[Role] = mapped_column(_enum(Role))
    skills: Mapped[list[str]] = mapped_column(JSON, default=list)


class Leave(Base):
    __tablename__ = "leaves"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_id)
    employee_id: Mapped[str] = mapped_column(ForeignKey("people.id"))
    manager_id: Mapped[str] = mapped_column(ForeignKey("people.id"))
    starts_on: Mapped[date] = mapped_column(Date)
    ends_on: Mapped[date] = mapped_column(Date)
    handback_days: Mapped[int] = mapped_column(Integer, default=14)
    status: Mapped[LeaveStatus] = mapped_column(_enum(LeaveStatus), default=LeaveStatus.PLANNING)
    job_description: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    employee: Mapped[Person] = relationship(foreign_keys=[employee_id])
    manager: Mapped[Person] = relationship(foreign_keys=[manager_id])
    duties: Mapped[list["Duty"]] = relationship(
        back_populates="leave", cascade="all, delete-orphan", order_by="Duty.position"
    )
    turns: Mapped[list["TranscriptTurn"]] = relationship(
        back_populates="leave", cascade="all, delete-orphan", order_by="TranscriptTurn.seq"
    )
    availability: Mapped[list["Availability"]] = relationship(
        back_populates="leave", cascade="all, delete-orphan"
    )
    changes: Mapped[list["ChangeRequest"]] = relationship(
        back_populates="leave", cascade="all, delete-orphan"
    )
    return_items: Mapped[list["ReturnItem"]] = relationship(
        back_populates="leave", cascade="all, delete-orphan"
    )


class Duty(Base):
    __tablename__ = "duties"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_id)
    leave_id: Mapped[str] = mapped_column(ForeignKey("leaves.id", ondelete="CASCADE"))
    position: Mapped[int] = mapped_column(Integer, default=0)
    title: Mapped[str] = mapped_column(String(200))
    detail: Mapped[str] = mapped_column(Text, default="")
    frequency: Mapped[str] = mapped_column(String(32), default="weekly")
    hours_per_week: Mapped[float] = mapped_column(Float, default=1.0)
    evidence: Mapped[Evidence] = mapped_column(_enum(Evidence))
    quote: Mapped[str | None] = mapped_column(Text, nullable=True)
    source: Mapped[DutySource] = mapped_column(_enum(DutySource))
    confirmed: Mapped[bool] = mapped_column(default=False)
    flag: Mapped[str | None] = mapped_column(String(200), nullable=True)

    leave: Mapped[Leave] = relationship(back_populates="duties")
    assignments: Mapped[list["Assignment"]] = relationship(
        back_populates="duty", cascade="all, delete-orphan"
    )


class TranscriptTurn(Base):
    __tablename__ = "transcript_turns"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_id)
    leave_id: Mapped[str] = mapped_column(ForeignKey("leaves.id", ondelete="CASCADE"))
    seq: Mapped[int] = mapped_column(Integer)
    speaker: Mapped[Speaker] = mapped_column(_enum(Speaker))
    text: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    leave: Mapped[Leave] = relationship(back_populates="turns")


class Availability(Base):
    __tablename__ = "availability"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_id)
    leave_id: Mapped[str] = mapped_column(ForeignKey("leaves.id", ondelete="CASCADE"))
    person_id: Mapped[str] = mapped_column(ForeignKey("people.id"))
    hours_per_week: Mapped[float] = mapped_column(Float)
    answered_by_id: Mapped[str] = mapped_column(ForeignKey("people.id"))
    answered_on: Mapped[date] = mapped_column(Date)

    leave: Mapped[Leave] = relationship(back_populates="availability")


class Assignment(Base):
    __tablename__ = "assignments"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_id)
    duty_id: Mapped[str] = mapped_column(ForeignKey("duties.id", ondelete="CASCADE"))
    cover_person_id: Mapped[str | None] = mapped_column(ForeignKey("people.id"), nullable=True)
    starts_on: Mapped[date] = mapped_column(Date)
    ends_on: Mapped[date] = mapped_column(Date)
    status: Mapped[AssignmentStatus] = mapped_column(
        _enum(AssignmentStatus), default=AssignmentStatus.PROPOSED
    )
    rationale: Mapped[str] = mapped_column(Text, default="")

    duty: Mapped[Duty] = relationship(back_populates="assignments")


class ChangeRequest(Base):
    __tablename__ = "change_requests"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_id)
    leave_id: Mapped[str] = mapped_column(ForeignKey("leaves.id", ondelete="CASCADE"))
    raw_text: Mapped[str] = mapped_column(Text)
    parsed: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    status: Mapped[ChangeStatus] = mapped_column(_enum(ChangeStatus), default=ChangeStatus.PROPOSED)
    created_by_id: Mapped[str] = mapped_column(ForeignKey("people.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    leave: Mapped[Leave] = relationship(back_populates="changes")


class ReturnItem(Base):
    __tablename__ = "return_items"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_id)
    leave_id: Mapped[str] = mapped_column(ForeignKey("leaves.id", ondelete="CASCADE"))
    duty_id: Mapped[str] = mapped_column(ForeignKey("duties.id", ondelete="CASCADE"))
    outcome: Mapped[ReturnOutcome] = mapped_column(_enum(ReturnOutcome))
    holder_id: Mapped[str | None] = mapped_column(ForeignKey("people.id"), nullable=True)
    note: Mapped[str] = mapped_column(Text, default="")
    employee_agreed: Mapped[bool | None] = mapped_column(nullable=True)

    leave: Mapped[Leave] = relationship(back_populates="return_items")
    duty: Mapped[Duty] = relationship()


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_id)
    leave_id: Mapped[str | None] = mapped_column(ForeignKey("leaves.id"), nullable=True)
    actor_id: Mapped[str] = mapped_column(ForeignKey("people.id"))
    action: Mapped[str] = mapped_column(String(80))
    detail: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
