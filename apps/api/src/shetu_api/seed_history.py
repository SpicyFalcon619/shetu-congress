"""Synthetic history for the demo workspace: more colleagues and leaves at every stage, so the
manager's and HR's views look like a team that has used Shetu for a while.

Nusrat's leave stays untouched for the live demo. Every name and figure here is invented.
"""

from dataclasses import dataclass
from datetime import UTC, date, datetime, timedelta

from sqlalchemy.orm import Session

from shetu_api.models import (
    Assignment,
    AssignmentStatus,
    AuditEvent,
    Availability,
    ChangeRequest,
    Duty,
    DutySource,
    Evidence,
    Leave,
    LeaveStatus,
    Person,
    ReturnItem,
    ReturnOutcome,
    Role,
    Speaker,
    TranscriptTurn,
)

NGO = "Shapla Development Foundation (synthetic)"

COLLEAGUES = [
    (
        "farhana",
        "Farhana Islam",
        "Accountant",
        "Finance",
        Role.EMPLOYEE,
        ["payroll", "bank reconciliation"],
    ),
    (
        "imran",
        "Imran Kabir",
        "Grants Accountant",
        "Grants",
        Role.EMPLOYEE,
        ["grant budgets", "donor reporting"],
    ),
    (
        "mahmud",
        "Mahmud Hasan",
        "Procurement Officer",
        "Finance",
        Role.EMPLOYEE,
        ["procurement", "vendor contracts"],
    ),
    (
        "shirin",
        "Shirin Akhter",
        "Finance Associate",
        "Finance",
        Role.EMPLOYEE,
        ["accounts payable"],
    ),
    (
        "nabila",
        "Nabila Rahman",
        "Junior Accountant",
        "Finance",
        Role.COVER,
        ["payroll", "data entry"],
    ),
    (
        "arman",
        "Arman Chowdhury",
        "Budget Analyst",
        "Finance",
        Role.COVER,
        ["budgeting", "reporting"],
    ),
    (
        "jannat",
        "Jannat Ferdous",
        "Compliance Officer",
        "Grants",
        Role.COVER,
        ["grant compliance", "audit"],
    ),
]


@dataclass
class D:
    title: str
    hours: float
    frequency: str
    quote: str | None
    cover: str
    evidence: Evidence = Evidence.SAID


def _leave(
    session: Session,
    *,
    lid: str,
    who: str,
    start: date,
    weeks: int,
    status: LeaveStatus,
    duties: list[D],
    availability: dict[str, float],
    approved: bool,
) -> list[Duty]:
    today = date.today()
    leave = Leave(
        id=lid,
        employee_id=who,
        manager_id="rafiq",
        starts_on=start,
        ends_on=start + timedelta(weeks=weeks) - timedelta(days=1),
        status=status,
        job_description="Synthetic job description.",
    )
    session.add(leave)
    session.flush()
    turns = [
        (Speaker.SHETU, "Apnar kaj er moddhe emon ki ache ja job description e lekha nai?"),
        (Speaker.EMPLOYEE, " ".join(d.quote for d in duties if d.quote)),
        (Speaker.SHETU, "Dhonnobad. Apnar Role Map ready, please confirm koren."),
    ]
    for i, (speaker, text) in enumerate(turns):
        session.add(TranscriptTurn(leave_id=lid, seq=i, speaker=speaker, text=text))
    for pid, hours in availability.items():
        session.add(
            Availability(
                leave_id=lid,
                person_id=pid,
                hours_per_week=hours,
                answered_by_id="rafiq",
                answered_on=today - timedelta(days=6),
            )
        )
    rows = []
    for i, d in enumerate(duties):
        duty = Duty(
            leave_id=lid,
            position=i,
            title=d.title,
            detail="",
            frequency=d.frequency,
            hours_per_week=d.hours,
            evidence=d.evidence,
            quote=d.quote if d.evidence == Evidence.SAID else None,
            source=DutySource.INTERVIEW
            if d.evidence != Evidence.DOCUMENTED
            else DutySource.JOB_DESCRIPTION,
            confirmed=True,
        )
        session.add(duty)
        session.flush()
        session.add(
            Assignment(
                duty_id=duty.id,
                cover_person_id=d.cover,
                starts_on=leave.starts_on,
                ends_on=leave.ends_on,
                status=AssignmentStatus.APPROVED if approved else AssignmentStatus.PROPOSED,
                rationale="Already works on this area.",
            )
        )
        rows.append(duty)
    return rows


def _audit(session: Session, lid: str, actor: str, action: str, days_ago: int) -> None:
    session.add(
        AuditEvent(
            leave_id=lid,
            actor_id=actor,
            action=action,
            detail={},
            at=datetime.now(UTC) - timedelta(days=days_ago),
        )
    )


def seed_history(session: Session) -> None:
    for pid, name, title, team, role, skills in COLLEAGUES:
        session.add(
            Person(
                id=pid,
                name=name,
                job_title=title,
                team=team,
                organization=NGO,
                role=role,
                skills=skills,
            )
        )
    session.flush()
    today = date.today()

    # On leave now, with one open change waiting for Rafiq.
    _leave(
        session,
        lid="leave-farhana",
        who="farhana",
        start=today - timedelta(weeks=7),
        weeks=24,
        status=LeaveStatus.ACTIVE,
        approved=True,
        availability={"nabila": 6, "karim": 4, "arman": 3},
        duties=[
            D(
                "Monthly payroll run",
                5,
                "monthly",
                "protimash er 25 tarikh e payroll ami run kori",
                "nabila",
            ),
            D(
                "Bank reconciliation, operating account",
                3,
                "weekly",
                "operating account er bank reconciliation",
                "karim",
            ),
            D("Staff advance settlements", 2, "weekly", "staff der advance settle kora", "arman"),
            D("Provident fund statement", 1, "monthly", None, "nabila", Evidence.DOCUMENTED),
        ],
    )
    session.add(
        ChangeRequest(
            leave_id="leave-farhana",
            raw_text="Arman next month theke staff advance settlement korte parbe na, budget season.",
            parsed={
                "kind": "cover_unavailable",
                "summary": "Arman can no longer settle staff advances from next month because of budget season.",
                "duty_title": "Staff advance settlements",
                "duty_id": None,
                "person_id": "arman",
                "effective_from": (today + timedelta(days=12)).isoformat(),
            },
            created_by_id="arman",
            created_at=datetime.now(UTC) - timedelta(hours=5),
        )
    )
    for action, days in (("cover.proposed", 60), ("cover.approved", 58), ("change.reported", 0)):
        _audit(
            session,
            "leave-farhana",
            "arman" if action == "change.reported" else "rafiq",
            action,
            days,
        )

    # Back from leave, everything settled: ready to close.
    imran = _leave(
        session,
        lid="leave-imran",
        who="imran",
        start=today - timedelta(weeks=12),
        weeks=12,
        status=LeaveStatus.RETURNING,
        approved=True,
        availability={"jannat": 5, "arman": 4},
        duties=[
            D(
                "Quarterly grant budget review",
                3,
                "quarterly",
                "quarterly grant budget review ami kori",
                "arman",
            ),
            D("Donor portal submissions", 2, "monthly", "donor portal e submission", "jannat"),
            D("Sub-grantee expense checks", 2, "weekly", "sub-grantee der expense check", "jannat"),
        ],
    )
    for i, duty in enumerate(imran):
        session.add(
            ReturnItem(
                leave_id="leave-imran",
                duty_id=duty.id,
                outcome=ReturnOutcome.STAYS_WITH_COVER if i == 2 else ReturnOutcome.RETURNS,
                holder_id="jannat" if i == 2 else None,
                note="He agreed this stays with Jannat." if i == 2 else "Returns to him unchanged.",
                employee_agreed=True,
            )
        )
    for action, days in (("cover.approved", 85), ("return.agree", 1)):
        _audit(
            session, "leave-imran", "imran" if action == "return.agree" else "rafiq", action, days
        )

    # Starting soon: plan proposed, every rule passes, waiting for approval.
    _leave(
        session,
        lid="leave-mahmud",
        who="mahmud",
        start=today + timedelta(weeks=5),
        weeks=6,
        status=LeaveStatus.PLANNING,
        approved=False,
        availability={"arman": 6, "sumaiya": 4},
        duties=[
            D(
                "Vendor quotation comparisons",
                3,
                "weekly",
                "vendor quotation compare kore committee te dei",
                "arman",
            ),
            D(
                "Purchase order approvals under Tk 50,000",
                2,
                "weekly",
                "50 hajar er niche PO ami approve kori",
                "sumaiya",
            ),
            D("Annual vendor list renewal", 1, "yearly", None, "arman", Evidence.DOCUMENTED),
        ],
    )
    _audit(session, "leave-mahmud", "rafiq", "cover.proposed", 1)

    # Last year's leave, closed.
    _leave(
        session,
        lid="leave-shirin",
        who="shirin",
        start=today - timedelta(weeks=40),
        weeks=16,
        status=LeaveStatus.CLOSED,
        approved=True,
        availability={"nabila": 6},
        duties=[
            D(
                "Supplier invoice processing",
                4,
                "weekly",
                "supplier invoice process kori",
                "nabila",
            ),
            D("Month-end payables report", 1, "monthly", "month end payables report", "nabila"),
        ],
    )
    for action, days in (("cover.approved", 290), ("leave.closed", 160)):
        _audit(session, "leave-shirin", "rafiq", action, days)
