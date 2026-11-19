"""Request and response models for the HTTP API."""

from datetime import date, datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

from shetu_api.ai.schemas import ReturnExplanation
from shetu_api.models import (
    AssignmentStatus,
    ChangeStatus,
    DutySource,
    Evidence,
    LeaveStatus,
    ReturnOutcome,
    Role,
    Speaker,
)


class ORM(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class PersonOut(ORM):
    id: str
    name: str
    job_title: str
    team: str
    organization: str
    role: Role
    skills: list[str]


class DutyOut(ORM):
    id: str
    title: str
    detail: str
    frequency: str
    hours_per_week: float
    evidence: Evidence
    quote: str | None
    source: DutySource
    confirmed: bool
    flag: str | None


class AssignmentOut(ORM):
    id: str
    duty_id: str
    cover_person_id: str | None
    starts_on: date
    ends_on: date
    status: AssignmentStatus
    rationale: str


class AvailabilityOut(ORM):
    person_id: str
    hours_per_week: float
    answered_on: date


class TurnOut(ORM):
    speaker: Speaker
    text: str


class FindingOut(BaseModel):
    rule: str
    ok: bool
    message: str
    refs: list[str]


class LeaveSummary(ORM):
    id: str
    employee: PersonOut
    manager: PersonOut
    starts_on: date
    ends_on: date
    handback_days: int
    status: LeaveStatus


class LeaveDetail(LeaveSummary):
    job_description: str
    duties: list[DutyOut]
    assignments: list[AssignmentOut]
    availability: list[AvailabilityOut]
    turns: list[TurnOut]
    team: list[PersonOut]
    findings: list[FindingOut]
    can_approve: bool
    interview_done: bool


class ChangeOut(ORM):
    id: str
    raw_text: str
    parsed: dict[str, Any]
    status: ChangeStatus
    created_by_id: str
    created_at: datetime


class ReturnItemOut(BaseModel):
    id: str
    duty_id: str
    duty_title: str
    outcome: ReturnOutcome
    holder_id: str | None
    note: str
    employee_agreed: bool | None


class ReturnView(BaseModel):
    items: list[ReturnItemOut]
    finding: FindingOut
    can_close: bool


class AuditOut(ORM):
    actor_id: str
    action: str
    detail: dict[str, Any]
    at: datetime


# --- requests ------------------------------------------------------------------------------------


class InterviewReply(BaseModel):
    text: str = Field(min_length=1, max_length=4000)


class DutyPatch(BaseModel):
    title: str | None = Field(default=None, max_length=200)
    hours_per_week: float | None = Field(default=None, ge=0, le=40)
    confirmed: bool | None = None


class AvailabilityIn(BaseModel):
    hours_per_week: float = Field(ge=0, le=40)


class AssignmentPatch(BaseModel):
    cover_person_id: str | None


class ChangeIn(BaseModel):
    text: str = Field(min_length=3, max_length=1000)


class ChangeDecision(BaseModel):
    approve: bool


class ReturnDecision(BaseModel):
    decision: Literal["agree", "return"]


__all__ = ["ReturnExplanation"]
