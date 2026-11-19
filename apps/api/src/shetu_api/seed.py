"""Synthetic demo data. Every person, organization and figure here is invented.

Two cases run on the same engine: Nusrat (maternity leave, about 6 months) and Arif (study leave,
6 weeks). The leave type is never stored; it appears only in this comment.
"""

from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from shetu_api.models import (
    Availability,
    Leave,
    LeaveStatus,
    Person,
    ReturnItem,
    ReturnOutcome,
    Role,
)

NGO = "Shapla Development Foundation (synthetic)"
UNI = "Meghna University (synthetic)"

PEOPLE = [
    (
        "nusrat",
        "Nusrat Jahan",
        "Senior Executive, Finance and Grants",
        "Finance",
        NGO,
        Role.EMPLOYEE,
        ["donor reporting", "reconciliation", "VAT and TDS"],
    ),
    (
        "rafiq",
        "Rafiq Ahmed",
        "Head of Finance",
        "Finance",
        NGO,
        Role.MANAGER,
        ["finance management"],
    ),
    (
        "karim",
        "Karim Hossain",
        "Accounts Officer",
        "Finance",
        NGO,
        Role.COVER,
        ["reconciliation", "vendor payments", "VAT and TDS"],
    ),
    (
        "sumaiya",
        "Sumaiya Akter",
        "Finance Officer",
        "Finance",
        NGO,
        Role.COVER,
        ["petty cash", "payroll", "field office accounts"],
    ),
    (
        "tanvir",
        "Tanvir Rahman",
        "Grants Officer",
        "Grants",
        NGO,
        Role.COVER,
        ["donor reporting", "grant compliance", "audit preparation"],
    ),
    ("farzana", "Farzana Haque", "HR Manager", "People", NGO, Role.HR, []),
    (
        "arif",
        "Arif Hasan",
        "Lecturer, Computer Science and Engineering",
        "CSE",
        UNI,
        Role.EMPLOYEE,
        ["software engineering", "lab systems"],
    ),
    ("selina", "Dr. Selina Kabir", "Head of Department, CSE", "CSE", UNI, Role.MANAGER, []),
    (
        "mehedi",
        "Mehedi Hasan",
        "Lecturer, CSE",
        "CSE",
        UNI,
        Role.COVER,
        ["databases", "lab systems"],
    ),
    (
        "ritu",
        "Ritu Chowdhury",
        "Senior Lecturer, CSE",
        "CSE",
        UNI,
        Role.COVER,
        ["thesis supervision", "exam committee"],
    ),
]

NUSRAT_JD = """Senior Executive, Finance and Grants
- Prepare monthly financial statements for the programme budget.
- Process vendor payments and maintain payment records.
- Prepare quarterly donor financial reports.
- Monitor budget against actuals and flag variances to the Head of Finance.
- Support annual external audit."""

ARIF_JD = """Lecturer, CSE
- Teach two undergraduate courses per trimester (Software Engineering, Software Engineering Lab).
- Hold weekly office hours.
- Set and grade assessments for assigned courses.
- Supervise final-year projects as assigned."""


def seed(session: Session) -> bool:
    """Insert demo data if the database is empty. Returns True if it seeded."""
    if session.scalar(select(Person.id).limit(1)) is not None:
        return False
    for pid, name, title, team, org, role, skills in PEOPLE:
        session.add(
            Person(
                id=pid,
                name=name,
                job_title=title,
                team=team,
                organization=org,
                role=role,
                skills=skills,
            )
        )
    session.flush()

    start = date.today() + timedelta(days=26)
    session.add(
        Leave(
            id="leave-nusrat",
            employee_id="nusrat",
            manager_id="rafiq",
            starts_on=start,
            ends_on=start + timedelta(weeks=25),
            job_description=NUSRAT_JD,
        )
    )
    arif_start = date.today() + timedelta(days=40)
    session.add(
        Leave(
            id="leave-arif",
            employee_id="arif",
            manager_id="selina",
            starts_on=arif_start,
            ends_on=arif_start + timedelta(weeks=6) - timedelta(days=1),
            job_description=ARIF_JD,
        )
    )
    session.flush()
    # Rafiq has already said how much Sumaiya and Tanvir can spare. Shetu will ask about Karim.
    for pid, hours in (("sumaiya", 5.0), ("tanvir", 6.0)):
        session.add(
            Availability(
                leave_id="leave-nusrat",
                person_id=pid,
                hours_per_week=hours,
                answered_by_id="rafiq",
                answered_on=date.today(),
            )
        )
    session.add(
        Availability(
            leave_id="leave-arif",
            person_id="ritu",
            hours_per_week=4.0,
            answered_by_id="selina",
            answered_on=date.today(),
        )
    )
    session.commit()
    return True


def fast_forward_to_return(session: Session, leave: Leave) -> None:
    """Demo only: jump to the return day with a scripted set of outcomes.

    The first planned duty changed while she was away, the second stays with its cover person
    with her agreement, the third stays with its cover person without anyone asking her (R8),
    and the rest return unchanged.
    """
    for item in list(leave.return_items):
        session.delete(item)
    session.flush()
    planned = [d for d in leave.duties if d.assignments]
    for i, duty in enumerate(planned):
        holder = next((a.cover_person_id for a in duty.assignments if a.cover_person_id), None)
        if i == 0:
            item = ReturnItem(
                leave_id=leave.id,
                duty_id=duty.id,
                outcome=ReturnOutcome.CHANGED,
                note="How this is done changed while she was away: a new reporting template since month 3.",
                employee_agreed=True,
            )
        elif i == 1 and holder:
            item = ReturnItem(
                leave_id=leave.id,
                duty_id=duty.id,
                outcome=ReturnOutcome.STAYS_WITH_COVER,
                holder_id=holder,
                note="She agreed in month 4 that this can stay.",
                employee_agreed=True,
            )
        elif i == 2 and holder:
            item = ReturnItem(
                leave_id=leave.id,
                duty_id=duty.id,
                outcome=ReturnOutcome.STAYS_WITH_COVER,
                holder_id=holder,
                note="Kept by the cover person. Nobody asked her.",
                employee_agreed=None,
            )
        else:
            item = ReturnItem(
                leave_id=leave.id,
                duty_id=duty.id,
                outcome=ReturnOutcome.RETURNS,
                note="Returns to her unchanged.",
                employee_agreed=True,
            )
        session.add(item)
    leave.status = LeaveStatus.RETURNING
    session.commit()
