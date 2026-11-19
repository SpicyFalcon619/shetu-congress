"""Typed outputs for every AI task. Replies that do not validate are rejected."""

from datetime import date
from typing import Literal

from pydantic import BaseModel, Field

Area = Literal[
    "recurring_reports",
    "approvals",
    "external_contacts",
    "seasonal_tasks",
    "informal_help",
    "tools_and_access",
    "what_breaks_first",
    "wrap_up",
]
Frequency = Literal["daily", "weekly", "monthly", "quarterly", "yearly", "ad_hoc"]


class NextQuestion(BaseModel):
    question: str = Field(description="One question, in the employee's own language and register.")
    area: Area
    done: bool = Field(description="True when every area has been covered.")


class ExtractedDuty(BaseModel):
    title: str = Field(description="Short name of the responsibility, 3 to 8 words.")
    detail: str
    frequency: Frequency
    hours_per_week: float = Field(ge=0, le=40, description="Average hours a week, estimated.")
    evidence: Literal["said", "documented", "suggested"]
    quote: str | None = Field(
        default=None,
        description="Exact words from the employee for 'said'; null otherwise.",
    )


class ExtractedDuties(BaseModel):
    duties: list[ExtractedDuty]


class ProposedAssignment(BaseModel):
    duty_ref: str = Field(description="The duty's reference, e.g. D3.")
    cover_person_id: str
    rationale: str = Field(description="One sentence: why this person fits this duty.")


class CoverProposal(BaseModel):
    assignments: list[ProposedAssignment]


class ParsedChange(BaseModel):
    kind: Literal["cover_unavailable", "duty_changed", "new_duty", "date_change", "other"]
    duty_ref: str | None = None
    person_id: str | None = None
    effective_from: date | None = None
    summary: str = Field(description="One plain sentence describing the change.")


class ReturnExplanation(BaseModel):
    summary_en: str
    summary_bn: str
