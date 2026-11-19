"""Use cases. Each function loads data, calls the AI where needed, runs the rules and saves."""

from datetime import date, timedelta
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from shetu_api.ai import tasks
from shetu_api.ai.gateway import Gateway
from shetu_api.domain import rules
from shetu_api.models import (
    Assignment,
    AssignmentStatus,
    AuditEvent,
    Availability,
    ChangeRequest,
    ChangeStatus,
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
from shetu_api.schemas import (
    FindingOut,
    LeaveDetail,
    PersonOut,
    ReturnItemOut,
    ReturnView,
)

MAX_QUESTIONS = 12


def today() -> date:
    return date.today()


def audit(
    session: Session, actor: Person, action: str, leave: Leave | None = None, **detail: Any
) -> None:
    session.add(
        AuditEvent(
            actor_id=actor.id, action=action, leave_id=leave.id if leave else None, detail=detail
        )
    )


# --- facts for the rules -------------------------------------------------------------------------


def window(leave: Leave) -> rules.LeaveWindow:
    return rules.LeaveWindow(leave.employee_id, leave.starts_on, leave.ends_on, leave.handback_days)


def duty_facts(leave: Leave) -> list[rules.DutyFact]:
    return [
        rules.DutyFact(d.id, d.title, d.hours_per_week, d.evidence.value, d.confirmed, d.quote)
        for d in leave.duties
    ]


def assignment_facts(leave: Leave) -> list[rules.AssignmentFact]:
    return [
        rules.AssignmentFact(a.duty_id, a.cover_person_id, a.starts_on, a.ends_on)
        for d in leave.duties
        for a in d.assignments
    ]


def availability_facts(leave: Leave) -> list[rules.AvailabilityFact]:
    return [
        rules.AvailabilityFact(a.person_id, a.hours_per_week, a.answered_on)
        for a in leave.availability
    ]


def team(session: Session, leave: Leave) -> list[Person]:
    return list(
        session.scalars(
            select(Person)
            .where(
                Person.organization == leave.employee.organization,
                Person.id != leave.employee_id,
                Person.role.in_([Role.COVER, Role.EMPLOYEE]),
            )
            .order_by(Person.name)
        )
    )


def names(session: Session, leave: Leave) -> dict[str, str]:
    return {p.id: p.name for p in team(session, leave)} | {leave.employee_id: leave.employee.name}


def findings_out(found: list[rules.Finding]) -> list[FindingOut]:
    return [
        FindingOut(rule=f.rule.value, ok=f.ok, message=f.message, refs=list(f.refs)) for f in found
    ]


def plan_findings(session: Session, leave: Leave) -> list[rules.Finding]:
    return rules.evaluate_plan(
        window(leave),
        duty_facts(leave),
        assignment_facts(leave),
        availability_facts(leave),
        today(),
        names(session, leave),
    )


def leave_detail(session: Session, leave: Leave) -> LeaveDetail:
    session.refresh(leave)
    found = plan_findings(session, leave)
    turns = leave.turns
    asked = sum(1 for t in turns if t.speaker == Speaker.SHETU)
    return LeaveDetail.model_validate(
        {
            **{
                k: getattr(leave, k)
                for k in (
                    "id",
                    "starts_on",
                    "ends_on",
                    "handback_days",
                    "status",
                    "job_description",
                )
            },
            "employee": PersonOut.model_validate(leave.employee),
            "manager": PersonOut.model_validate(leave.manager),
            "duties": leave.duties,
            "assignments": [a for d in leave.duties for a in d.assignments],
            "availability": leave.availability,
            "turns": turns,
            "team": [PersonOut.model_validate(p) for p in team(session, leave)],
            "findings": findings_out(found),
            "can_approve": bool(leave.duties) and all(f.ok for f in found),
            "interview_done": asked >= MAX_QUESTIONS,
        }
    )


# --- interview -----------------------------------------------------------------------------------


def _turn_pairs(leave: Leave) -> list[tuple[str, str]]:
    return [(t.speaker.value, t.text) for t in leave.turns]


def _add_turn(session: Session, leave: Leave, speaker: Speaker, text: str) -> None:
    session.add(TranscriptTurn(leave_id=leave.id, seq=len(leave.turns), speaker=speaker, text=text))
    session.flush()
    session.refresh(leave)


def ask_next(session: Session, gw: Gateway, leave: Leave) -> None:
    q = tasks.next_question(
        gw,
        job_description=leave.job_description,
        turns=_turn_pairs(leave),
        duty_titles=[d.title for d in leave.duties],
    )
    _add_turn(session, leave, Speaker.SHETU, q.question)


def start_interview(session: Session, gw: Gateway, leave: Leave) -> None:
    if not leave.turns:
        ask_next(session, gw, leave)
    session.commit()


def reply_interview(session: Session, gw: Gateway, leave: Leave, text: str) -> None:
    _add_turn(session, leave, Speaker.EMPLOYEE, text)
    refresh_duties(session, gw, leave)
    if sum(1 for t in leave.turns if t.speaker == Speaker.SHETU) < MAX_QUESTIONS:
        ask_next(session, gw, leave)
    session.commit()


def refresh_duties(session: Session, gw: Gateway, leave: Leave) -> None:
    """Re-extract duties from the whole transcript. Confirmed duties are kept as they are."""
    extracted = tasks.extract_duties(
        gw, job_description=leave.job_description, turns=_turn_pairs(leave)
    )
    employee_words = "\n".join(t.text for t in leave.turns if t.speaker == Speaker.EMPLOYEE)
    kept = {rules.normalize(d.title) for d in leave.duties if d.confirmed}
    for d in list(leave.duties):
        if not d.confirmed and not d.assignments:
            session.delete(d)
    session.flush()
    position = len(kept)
    for e in extracted.duties:
        if rules.normalize(e.title) in kept:
            continue
        evidence, quote, flag = Evidence(e.evidence), e.quote, None
        if evidence == Evidence.SAID and not rules.quote_is_grounded(quote, employee_words):  # R1
            evidence, flag = Evidence.SUGGESTED, "Quote not found in the interview (R1)."
            quote = None
        source = (
            DutySource.INTERVIEW if evidence != Evidence.DOCUMENTED else DutySource.JOB_DESCRIPTION
        )
        session.add(
            Duty(
                leave_id=leave.id,
                position=position,
                title=e.title,
                detail=e.detail,
                frequency=e.frequency,
                hours_per_week=e.hours_per_week,
                evidence=evidence,
                quote=quote,
                source=source,
                confirmed=False,
                flag=flag,
            )
        )
        position += 1
    session.flush()
    session.refresh(leave)


# --- cover plan ----------------------------------------------------------------------------------


def _refs(leave: Leave) -> dict[str, Duty]:
    planned = {d.id for d in rules.duties_in_plan(duty_facts(leave))}
    return {f"D{i}": d for i, d in enumerate((d for d in leave.duties if d.id in planned), start=1)}


def propose_cover(session: Session, gw: Gateway, leave: Leave, actor: Person) -> None:
    refs = _refs(leave)
    people = team(session, leave)
    avail = {a.person_id: a.hours_per_week for a in leave.availability}
    proposal = tasks.propose_cover(
        gw,
        employee={"id": leave.employee_id, "name": leave.employee.name},
        duties=[
            {"ref": r, "title": d.title, "detail": d.detail, "hours_per_week": d.hours_per_week}
            for r, d in refs.items()
        ],
        candidates=[
            {
                "id": p.id,
                "name": p.name,
                "job_title": p.job_title,
                "skills": p.skills,
                "spare_hours_per_week": avail.get(p.id),
            }
            for p in people
        ],
    )
    valid_people = {p.id for p in people}
    chosen = {
        pa.duty_ref: (
            pa.cover_person_id if pa.cover_person_id in valid_people else None,
            pa.rationale,
        )
        for pa in proposal.assignments
    }
    for d in refs.values():
        for a in list(d.assignments):
            session.delete(a)
    session.flush()
    for ref, duty in refs.items():
        person_id, rationale = chosen.get(ref, (None, "No proposal for this duty."))
        session.add(
            Assignment(
                duty_id=duty.id,
                cover_person_id=person_id,
                starts_on=leave.starts_on,
                ends_on=leave.ends_on,
                rationale=rationale,
            )
        )
    audit(session, actor, "cover.proposed", leave, count=len(refs))
    session.commit()


def set_availability(
    session: Session, leave: Leave, person_id: str, hours: float, actor: Person
) -> None:
    row = next((a for a in leave.availability if a.person_id == person_id), None)
    if row is None:
        session.add(
            Availability(
                leave_id=leave.id,
                person_id=person_id,
                hours_per_week=hours,
                answered_by_id=actor.id,
                answered_on=today(),
            )
        )
    else:
        row.hours_per_week, row.answered_by_id, row.answered_on = hours, actor.id, today()
    audit(session, actor, "availability.answered", leave, person_id=person_id, hours=hours)
    session.commit()


def approve_plan(session: Session, leave: Leave, actor: Person) -> list[rules.Finding]:
    found = plan_findings(session, leave)
    failing = [f for f in found if not f.ok]
    if failing or not leave.duties:
        return failing
    for d in leave.duties:
        for a in d.assignments:
            a.status = AssignmentStatus.APPROVED
    if leave.status == LeaveStatus.PLANNING:
        leave.status = LeaveStatus.ACTIVE
    audit(session, actor, "cover.approved", leave)
    session.commit()
    return []


# --- changes during leave ------------------------------------------------------------------------


def report_change(
    session: Session, gw: Gateway, leave: Leave, text: str, actor: Person
) -> ChangeRequest:
    refs = _refs(leave)
    parsed = tasks.parse_change(
        gw,
        text=text,
        today=today(),
        duties=[{"ref": r, "title": d.title} for r, d in refs.items()],
        people=[{"id": p.id, "name": p.name} for p in team(session, leave)],
    )
    data = parsed.model_dump(mode="json")
    duty = refs.get(parsed.duty_ref or "")
    data["duty_id"] = duty.id if duty else None
    data["duty_title"] = duty.title if duty else None
    change = ChangeRequest(leave_id=leave.id, raw_text=text, parsed=data, created_by_id=actor.id)
    session.add(change)
    audit(session, actor, "change.reported", leave, kind=parsed.kind)
    session.commit()
    return change


def decide_change(session: Session, change: ChangeRequest, approve: bool, actor: Person) -> None:
    change.status = ChangeStatus.APPROVED if approve else ChangeStatus.REJECTED
    p = change.parsed
    if approve and p.get("kind") == "cover_unavailable" and p.get("duty_id"):
        duty = session.get(Duty, p["duty_id"])
        start = date.fromisoformat(p["effective_from"]) if p.get("effective_from") else today()
        if duty:
            for a in list(duty.assignments):
                if a.cover_person_id == p.get("person_id") or p.get("person_id") is None:
                    if a.starts_on >= start:
                        a.cover_person_id, a.status = None, AssignmentStatus.PROPOSED
                    elif a.ends_on >= start:
                        session.add(
                            Assignment(
                                duty_id=duty.id,
                                cover_person_id=None,
                                starts_on=start,
                                ends_on=a.ends_on,
                                rationale="Needs a new owner after a reported change.",
                            )
                        )
                        a.ends_on = start - timedelta(days=1)
    audit(session, actor, "change.approved" if approve else "change.rejected", change.leave)
    session.commit()


# --- return --------------------------------------------------------------------------------------


def return_view(leave: Leave) -> ReturnView:
    items = [
        ReturnItemOut(
            id=i.id,
            duty_id=i.duty_id,
            duty_title=i.duty.title,
            outcome=i.outcome,
            holder_id=i.holder_id,
            note=i.note,
            employee_agreed=i.employee_agreed,
        )
        for i in leave.return_items
    ]
    finding = rules.check_return(
        [
            rules.ReturnFact(
                i.duty_id,
                i.duty_title,
                i.outcome == ReturnOutcome.STAYS_WITH_COVER,
                i.employee_agreed,
            )
            for i in items
        ]
    )
    return ReturnView(items=items, finding=findings_out([finding])[0], can_close=finding.ok)


def comparison(leave: Leave, people: dict[str, str]) -> list[dict[str, Any]]:
    return [
        {
            "duty": i.duty.title,
            "outcome": i.outcome.value,
            "holder": people.get(i.holder_id or ""),
            "note": i.note,
            "employee_agreed": i.employee_agreed,
        }
        for i in leave.return_items
    ]


def decide_return(session: Session, item: ReturnItem, decision: str, actor: Person) -> None:
    if decision == "agree":
        item.employee_agreed = True
    else:
        item.outcome, item.holder_id, item.employee_agreed = ReturnOutcome.RETURNS, None, True
        item.note = "Returns to the employee, as the handover agreed."
    audit(session, actor, f"return.{decision}", item.leave, duty_id=item.duty_id)
    session.commit()


def close_leave(session: Session, leave: Leave, actor: Person) -> rules.Finding:
    finding = rules.check_return(
        [
            rules.ReturnFact(
                i.duty_id,
                i.duty.title,
                i.outcome == ReturnOutcome.STAYS_WITH_COVER,
                i.employee_agreed,
            )
            for i in leave.return_items
        ]
    )
    if finding.ok:
        leave.status = LeaveStatus.CLOSED
        audit(session, actor, "leave.closed", leave)
        session.commit()
    return finding
