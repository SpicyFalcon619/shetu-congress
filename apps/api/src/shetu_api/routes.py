"""HTTP routes, version 1. Permissions are checked here on every call (rule R9)."""

from collections.abc import Callable
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select

from shetu_api import services
from shetu_api.ai import tasks
from shetu_api.ai.gateway import AIError, Gateway, get_gateway
from shetu_api.ai.schemas import ReturnExplanation
from shetu_api.auth import Me, SessionDep, can_view, is_cover_on, require
from shetu_api.models import AuditEvent, ChangeRequest, Duty, Leave, Person, ReturnItem, Role
from shetu_api.schemas import (
    AssignmentPatch,
    AuditOut,
    AvailabilityIn,
    ChangeDecision,
    ChangeIn,
    ChangeOut,
    DutyPatch,
    FindingOut,
    InterviewReply,
    LeaveDetail,
    LeaveSummary,
    PersonOut,
    ReturnDecision,
    ReturnView,
)
from shetu_api.seed import fast_forward_to_return

router = APIRouter(prefix="/api/v1")
GatewayDep = Annotated[Gateway, Depends(get_gateway)]


def _leave(session: SessionDep, leave_id: str) -> Leave:
    leave = session.get(Leave, leave_id)
    if leave is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Leave not found.")
    return leave


def _ai[**P, R](fn: Callable[P, R], *args: P.args, **kwargs: P.kwargs) -> R:
    """Run a step that calls the model; a model failure becomes a 502 with a clear message."""
    try:
        return fn(*args, **kwargs)
    except AIError as exc:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, f"The AI step failed: {exc}") from exc


def _manager(leave: Leave, me: Person) -> None:
    require(me.id == leave.manager_id, "Only this leave's manager can do that.")


def _employee(leave: Leave, me: Person) -> None:
    require(me.id == leave.employee_id, "Only the employee on leave can do that.")


# --- people and leaves ---------------------------------------------------------------------------


@router.get("/personas", response_model=list[PersonOut], tags=["people"])
def personas(session: SessionDep) -> list[Person]:
    return list(
        session.scalars(select(Person).order_by(Person.organization, Person.role, Person.name))
    )


@router.get("/leaves", response_model=list[LeaveSummary], tags=["leaves"])
def list_leaves(session: SessionDep, me: Me) -> list[Leave]:
    leaves = session.scalars(select(Leave).order_by(Leave.starts_on)).all()
    return [lv for lv in leaves if can_view(session, lv, me)]


@router.get("/leaves/{leave_id}", response_model=LeaveDetail, tags=["leaves"])
def get_leave(leave_id: str, session: SessionDep, me: Me) -> LeaveDetail:
    leave = _leave(session, leave_id)
    require(can_view(session, leave, me), "You are not part of this leave.")
    return services.leave_detail(session, leave)


@router.get("/leaves/{leave_id}/audit", response_model=list[AuditOut], tags=["leaves"])
def audit_log(leave_id: str, session: SessionDep, me: Me) -> list[AuditEvent]:
    leave = _leave(session, leave_id)
    require(
        me.id == leave.manager_id or me.role == Role.HR, "Only the manager or HR can read the log."
    )
    return list(
        session.scalars(
            select(AuditEvent).where(AuditEvent.leave_id == leave.id).order_by(AuditEvent.at)
        )
    )


# --- interview (employee) ------------------------------------------------------------------------


@router.post("/leaves/{leave_id}/interview/start", response_model=LeaveDetail, tags=["interview"])
def interview_start(leave_id: str, session: SessionDep, me: Me, gw: GatewayDep) -> LeaveDetail:
    leave = _leave(session, leave_id)
    _employee(leave, me)
    _ai(services.start_interview, session, gw, leave)
    return services.leave_detail(session, leave)


@router.post("/leaves/{leave_id}/interview/reply", response_model=LeaveDetail, tags=["interview"])
def interview_reply(
    leave_id: str, body: InterviewReply, session: SessionDep, me: Me, gw: GatewayDep
) -> LeaveDetail:
    leave = _leave(session, leave_id)
    _employee(leave, me)
    _ai(services.reply_interview, session, gw, leave, body.text)
    return services.leave_detail(session, leave)


@router.patch("/duties/{duty_id}", response_model=LeaveDetail, tags=["interview"])
def patch_duty(duty_id: str, body: DutyPatch, session: SessionDep, me: Me) -> LeaveDetail:
    duty = session.get(Duty, duty_id)
    if duty is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Duty not found.")
    _employee(duty.leave, me)
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(duty, field, value)
    if body.title is not None:
        duty.quote, duty.flag = duty.quote, None
    session.commit()
    return services.leave_detail(session, duty.leave)


@router.delete("/duties/{duty_id}", response_model=LeaveDetail, tags=["interview"])
def delete_duty(duty_id: str, session: SessionDep, me: Me) -> LeaveDetail:
    duty = session.get(Duty, duty_id)
    if duty is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Duty not found.")
    leave = duty.leave
    _employee(leave, me)
    session.delete(duty)
    session.commit()
    return services.leave_detail(session, leave)


# --- cover plan (manager) ------------------------------------------------------------------------


@router.post("/leaves/{leave_id}/cover/propose", response_model=LeaveDetail, tags=["cover"])
def cover_propose(leave_id: str, session: SessionDep, me: Me, gw: GatewayDep) -> LeaveDetail:
    leave = _leave(session, leave_id)
    _manager(leave, me)
    _ai(services.propose_cover, session, gw, leave, me)
    return services.leave_detail(session, leave)


@router.put(
    "/leaves/{leave_id}/availability/{person_id}", response_model=LeaveDetail, tags=["cover"]
)
def put_availability(
    leave_id: str, person_id: str, body: AvailabilityIn, session: SessionDep, me: Me
) -> LeaveDetail:
    leave = _leave(session, leave_id)
    _manager(leave, me)
    require(person_id != leave.employee_id, "The person on leave has no spare hours to give.")
    services.set_availability(session, leave, person_id, body.hours_per_week, me)
    return services.leave_detail(session, leave)


@router.patch("/assignments/{assignment_id}", response_model=LeaveDetail, tags=["cover"])
def patch_assignment(
    assignment_id: str, body: AssignmentPatch, session: SessionDep, me: Me
) -> LeaveDetail:
    from shetu_api.models import Assignment, AssignmentStatus

    a = session.get(Assignment, assignment_id)
    if a is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Assignment not found.")
    leave = a.duty.leave
    _manager(leave, me)
    a.cover_person_id, a.status = body.cover_person_id, AssignmentStatus.PROPOSED
    a.rationale = "Changed by the manager."
    services.audit(
        session, me, "assignment.changed", leave, duty_id=a.duty_id, to=body.cover_person_id
    )
    session.commit()
    return services.leave_detail(session, leave)


@router.post(
    "/leaves/{leave_id}/cover/approve",
    response_model=LeaveDetail,
    responses={409: {"model": list[FindingOut]}},
    tags=["cover"],
)
def cover_approve(leave_id: str, session: SessionDep, me: Me) -> LeaveDetail:
    leave = _leave(session, leave_id)
    _manager(leave, me)
    failing = services.approve_plan(session, leave, me)
    if failing:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            [f.model_dump() for f in services.findings_out(failing)] or "Nothing to approve yet.",
        )
    return services.leave_detail(session, leave)


# --- changes during leave ------------------------------------------------------------------------


@router.get("/leaves/{leave_id}/changes", response_model=list[ChangeOut], tags=["changes"])
def list_changes(leave_id: str, session: SessionDep, me: Me) -> list[ChangeRequest]:
    leave = _leave(session, leave_id)
    require(can_view(session, leave, me), "You are not part of this leave.")
    return sorted(leave.changes, key=lambda c: c.created_at, reverse=True)


@router.post("/leaves/{leave_id}/changes", response_model=ChangeOut, tags=["changes"])
def post_change(
    leave_id: str, body: ChangeIn, session: SessionDep, me: Me, gw: GatewayDep
) -> ChangeRequest:
    leave = _leave(session, leave_id)
    require(
        me.id == leave.manager_id or is_cover_on(session, leave, me),
        "Only the manager or a covering colleague can report a change.",
    )
    change: ChangeRequest = _ai(services.report_change, session, gw, leave, body.text, me)
    return change


@router.post("/changes/{change_id}/decision", response_model=LeaveDetail, tags=["changes"])
def change_decision(
    change_id: str, body: ChangeDecision, session: SessionDep, me: Me
) -> LeaveDetail:
    change = session.get(ChangeRequest, change_id)
    if change is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Change not found.")
    _manager(change.leave, me)
    services.decide_change(session, change, body.approve, me)
    return services.leave_detail(session, change.leave)


# --- return --------------------------------------------------------------------------------------


@router.post("/leaves/{leave_id}/demo/fast-forward", response_model=ReturnView, tags=["return"])
def demo_fast_forward(leave_id: str, session: SessionDep, me: Me) -> ReturnView:
    """Demo only: jump to the return day with scripted outcomes."""
    leave = _leave(session, leave_id)
    _manager(leave, me)
    require(any(d.assignments for d in leave.duties), "Approve a cover plan first.")
    fast_forward_to_return(session, leave)
    session.refresh(leave)
    return services.return_view(leave)


@router.get("/leaves/{leave_id}/return", response_model=ReturnView, tags=["return"])
def get_return(leave_id: str, session: SessionDep, me: Me) -> ReturnView:
    leave = _leave(session, leave_id)
    require(can_view(session, leave, me), "You are not part of this leave.")
    return services.return_view(leave)


@router.post("/leaves/{leave_id}/return/explain", response_model=ReturnExplanation, tags=["return"])
def explain_return(leave_id: str, session: SessionDep, me: Me, gw: GatewayDep) -> ReturnExplanation:
    leave = _leave(session, leave_id)
    _employee(leave, me)
    people = services.names(session, leave)
    result: ReturnExplanation = _ai(
        tasks.explain_return,
        gw,
        employee_name=leave.employee.name,
        comparison=services.comparison(leave, people),
    )
    return result


@router.post("/return-items/{item_id}/decision", response_model=ReturnView, tags=["return"])
def return_decision(item_id: str, body: ReturnDecision, session: SessionDep, me: Me) -> ReturnView:
    item = session.get(ReturnItem, item_id)
    if item is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Return item not found.")
    _employee(item.leave, me)
    services.decide_return(session, item, body.decision, me)
    session.refresh(item.leave)
    return services.return_view(item.leave)


@router.post(
    "/leaves/{leave_id}/close",
    response_model=LeaveDetail,
    responses={409: {"model": FindingOut}},
    tags=["return"],
)
def close(leave_id: str, session: SessionDep, me: Me) -> LeaveDetail:
    leave = _leave(session, leave_id)
    _manager(leave, me)
    finding = services.close_leave(session, leave, me)
    if not finding.ok:
        raise HTTPException(
            status.HTTP_409_CONFLICT, services.findings_out([finding])[0].model_dump()
        )
    return services.leave_detail(session, leave)
