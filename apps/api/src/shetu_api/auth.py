"""Demo authentication: the caller picks a synthetic persona with the X-Shetu-Persona header.

Every permission check still happens here on the server (rule R9). Swapping this module for a
real identity provider (OIDC) does not change any route.
"""

from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from shetu_api.db import get_session
from shetu_api.models import Assignment, Duty, Leave, Person, Role

SessionDep = Annotated[Session, Depends(get_session)]


def current_person(
    session: SessionDep, x_shetu_persona: Annotated[str | None, Header()] = None
) -> Person:
    if not x_shetu_persona:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Choose a persona first.")
    person = session.get(Person, x_shetu_persona)
    if person is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Unknown persona.")
    return person


Me = Annotated[Person, Depends(current_person)]


def is_cover_on(session: Session, leave: Leave, person: Person) -> bool:
    return (
        session.query(Assignment)
        .join(Duty)
        .filter(Duty.leave_id == leave.id, Assignment.cover_person_id == person.id)
        .first()
        is not None
    )


def can_view(session: Session, leave: Leave, person: Person) -> bool:
    return (
        person.id in (leave.employee_id, leave.manager_id)
        or person.role == Role.HR
        or is_cover_on(session, leave, person)
    )


def require(allowed: bool, message: str) -> None:
    if not allowed:
        raise HTTPException(status.HTTP_403_FORBIDDEN, message)
