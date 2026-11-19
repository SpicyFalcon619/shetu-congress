"""Deterministic rules. The model proposes; these functions decide whether a plan is acceptable.

Every function is pure: plain data in, findings out. No database, no network, no model calls.
Rule R9 (only a manager approves) is an authorization rule and lives in the API layer.
"""

import re
import unicodedata
from collections.abc import Iterable, Sequence
from dataclasses import dataclass, field
from datetime import date, timedelta
from enum import StrEnum


class Rule(StrEnum):
    R1_QUOTE = "R1"
    R2_CONFIRMATION = "R2"
    R3_COVERAGE = "R3"
    R4_CAPACITY = "R4"
    R5_NO_WORK_TO_ABSENT = "R5"
    R6_ASSIGNMENT_ENDS = "R6"
    R7_STALE_FACT = "R7"
    R8_RETURN_GUARD = "R8"


@dataclass(frozen=True)
class Finding:
    rule: Rule
    ok: bool
    message: str
    refs: tuple[str, ...] = field(default_factory=tuple)


@dataclass(frozen=True)
class LeaveWindow:
    employee_id: str
    starts_on: date
    ends_on: date
    handback_days: int = 14

    @property
    def latest_assignment_end(self) -> date:
        return self.ends_on + timedelta(days=self.handback_days)


@dataclass(frozen=True)
class DutyFact:
    id: str
    title: str
    hours_per_week: float
    evidence: str  # "said" | "documented" | "suggested"
    confirmed: bool
    quote: str | None = None


@dataclass(frozen=True)
class AssignmentFact:
    duty_id: str
    person_id: str | None
    starts_on: date
    ends_on: date


@dataclass(frozen=True)
class AvailabilityFact:
    person_id: str
    hours_per_week: float
    answered_on: date


@dataclass(frozen=True)
class ReturnFact:
    duty_id: str
    title: str
    stays_with_cover: bool
    employee_agreed: bool | None


# --- R1 ------------------------------------------------------------------------------------------

_WS = re.compile(r"\s+")
QUOTE_MARKS = "\"'\u201c\u201d\u2018\u2019"  # straight and curly quotes


def normalize(text: str) -> str:
    """Normalize for quote matching: Unicode NFKC, case-folded, whitespace collapsed."""
    folded = unicodedata.normalize("NFKC", text).casefold()
    return _WS.sub(" ", folded).strip().strip(QUOTE_MARKS)


def quote_is_grounded(quote: str | None, transcript: str) -> bool:
    if not quote or not quote.strip():
        return False
    return normalize(quote) in normalize(transcript)


def check_quotes(duties: Iterable[DutyFact], transcript: str) -> list[Finding]:
    """R1: a duty marked 'said' must quote words that really appear in the transcript."""
    findings = []
    for d in duties:
        if d.evidence != "said":
            continue
        ok = quote_is_grounded(d.quote, transcript)
        msg = (
            f"Quote for “{d.title}” found in the interview."
            if ok
            else f"Quote for “{d.title}” is not in the interview. Downgraded to suggested."
        )
        findings.append(Finding(Rule.R1_QUOTE, ok, msg, (d.id,)))
    return findings


# --- R2 ------------------------------------------------------------------------------------------


def duties_in_plan(duties: Iterable[DutyFact]) -> list[DutyFact]:
    """R2: suggested duties count only after the employee confirms them."""
    return [d for d in duties if d.evidence != "suggested" or d.confirmed]


def check_confirmation(duties: Sequence[DutyFact]) -> Finding:
    pending = [d for d in duties if d.evidence == "suggested" and not d.confirmed]
    if not pending:
        return Finding(Rule.R2_CONFIRMATION, True, "Every suggested duty has been answered.")
    titles = ", ".join(d.title for d in pending)
    return Finding(
        Rule.R2_CONFIRMATION,
        False,
        f"{len(pending)} suggested duties still need her answer: {titles}.",
        tuple(d.id for d in pending),
    )


# --- R3 ------------------------------------------------------------------------------------------


def _uncovered(
    window_start: date, window_end: date, spans: Sequence[tuple[date, date]]
) -> list[tuple[date, date]]:
    cursor = window_start
    gaps: list[tuple[date, date]] = []
    for start, end in sorted(spans):
        if end < cursor:
            continue
        if start > cursor:
            gaps.append((cursor, min(start - timedelta(days=1), window_end)))
        cursor = max(cursor, end + timedelta(days=1))
        if cursor > window_end:
            break
    if cursor <= window_end:
        gaps.append((cursor, window_end))
    return gaps


def check_coverage(
    leave: LeaveWindow, duties: Sequence[DutyFact], assignments: Sequence[AssignmentFact]
) -> Finding:
    """R3: every duty in the plan has an owner for every day of the leave."""
    problems: list[str] = []
    refs: list[str] = []
    for d in duties_in_plan(duties):
        spans = [
            (a.starts_on, a.ends_on)
            for a in assignments
            if a.duty_id == d.id and a.person_id is not None
        ]
        gaps = _uncovered(leave.starts_on, leave.ends_on, spans)
        if gaps:
            refs.append(d.id)
            first = gaps[0]
            problems.append(f"{d.title} has no owner from {first[0]:%d %b} to {first[1]:%d %b %Y}")
    if not problems:
        return Finding(
            Rule.R3_COVERAGE, True, "Every duty has an owner for every day of the leave."
        )
    return Finding(Rule.R3_COVERAGE, False, "; ".join(problems) + ".", tuple(refs))


# --- R4 ------------------------------------------------------------------------------------------


def _weeks(leave: LeaveWindow) -> list[tuple[int, date, date]]:
    weeks = []
    start, n = leave.starts_on, 1
    while start <= leave.ends_on:
        end = min(start + timedelta(days=6), leave.ends_on)
        weeks.append((n, start, end))
        start, n = start + timedelta(days=7), n + 1
    return weeks


def _ranges(nums: list[int]) -> str:
    """[1, 2, 3, 7] -> '1 to 3, 7'."""
    parts: list[str] = []
    start = prev = nums[0]
    for n in nums[1:]:
        if n == prev + 1:
            prev = n
            continue
        parts.append(str(start) if start == prev else f"{start} to {prev}")
        start = prev = n
    parts.append(str(start) if start == prev else f"{start} to {prev}")
    return ", ".join(parts)


def check_capacity(
    leave: LeaveWindow,
    duties: Sequence[DutyFact],
    assignments: Sequence[AssignmentFact],
    availability: Sequence[AvailabilityFact],
    names: dict[str, str] | None = None,
) -> Finding:
    """R4: no cover person carries more weekly hours than they said they can spare."""
    names = names or {}
    hours = {d.id: d.hours_per_week for d in duties_in_plan(duties)}
    avail = {a.person_id: a.hours_per_week for a in availability}
    people = sorted({a.person_id for a in assignments if a.person_id and a.duty_id in hours})
    problems: list[str] = []
    refs: list[str] = []
    for pid in people:
        name = names.get(pid, pid)
        if pid not in avail:
            problems.append(f"{name}: no availability answer yet")
            refs.append(pid)
            continue
        over: list[int] = []
        peak = 0.0
        for n, ws, we in _weeks(leave):
            load = sum(
                hours[a.duty_id]
                for a in assignments
                if a.person_id == pid
                and a.duty_id in hours
                and a.starts_on <= we
                and a.ends_on >= ws
            )
            if load > avail[pid]:
                over.append(n)
                peak = max(peak, load)
        if over:
            refs.append(pid)
            problems.append(
                f"{name}: {peak:g} h a week needed, {avail[pid]:g} h available, weeks {_ranges(over)}"
            )
    if not problems:
        return Finding(
            Rule.R4_CAPACITY, True, "No one is asked for more hours than they can spare."
        )
    return Finding(Rule.R4_CAPACITY, False, "; ".join(problems) + ".", tuple(refs))


# --- R5 ------------------------------------------------------------------------------------------


def check_no_work_to_absent(leave: LeaveWindow, assignments: Sequence[AssignmentFact]) -> Finding:
    """R5: nothing is assigned to the person on leave while she is away."""
    bad = [
        a
        for a in assignments
        if a.person_id == leave.employee_id
        and a.starts_on <= leave.ends_on
        and a.ends_on >= leave.starts_on
    ]
    if not bad:
        return Finding(Rule.R5_NO_WORK_TO_ABSENT, True, "Nothing is sent to her during her leave.")
    return Finding(
        Rule.R5_NO_WORK_TO_ABSENT,
        False,
        f"{len(bad)} duties are assigned to her while she is on leave.",
        tuple(a.duty_id for a in bad),
    )


# --- R6 ------------------------------------------------------------------------------------------


def check_assignments_end(leave: LeaveWindow, assignments: Sequence[AssignmentFact]) -> Finding:
    """R6: every temporary assignment ends by the return date plus the handback window."""
    limit = leave.latest_assignment_end
    late = [a for a in assignments if a.ends_on > limit]
    if not late:
        return Finding(Rule.R6_ASSIGNMENT_ENDS, True, f"Every assignment ends by {limit:%d %b %Y}.")
    return Finding(
        Rule.R6_ASSIGNMENT_ENDS,
        False,
        f"{len(late)} assignments run past {limit:%d %b %Y}. Temporary cover must end.",
        tuple(a.duty_id for a in late),
    )


# --- R7 ------------------------------------------------------------------------------------------


def check_stale(
    availability: Sequence[AvailabilityFact],
    today: date,
    max_age_days: int = 30,
    names: dict[str, str] | None = None,
) -> Finding:
    """R7: availability answers older than the limit must be asked again before use."""
    names = names or {}
    stale = [a for a in availability if (today - a.answered_on).days > max_age_days]
    if not stale:
        return Finding(Rule.R7_STALE_FACT, True, "Every availability answer is recent.")
    who = ", ".join(names.get(a.person_id, a.person_id) for a in stale)
    return Finding(
        Rule.R7_STALE_FACT,
        False,
        f"Ask again: availability for {who} is more than {max_age_days} days old.",
        tuple(a.person_id for a in stale),
    )


# --- R8 ------------------------------------------------------------------------------------------


def check_return(items: Sequence[ReturnFact]) -> Finding:
    """R8: nothing moves to someone else for good without her agreement."""
    moved = [i for i in items if i.stays_with_cover and i.employee_agreed is not True]
    if not moved:
        return Finding(
            Rule.R8_RETURN_GUARD, True, "Nothing has moved for good without her agreement."
        )
    titles = ", ".join(i.title for i in moved)
    return Finding(
        Rule.R8_RETURN_GUARD,
        False,
        f"Moved for good without her agreement: {titles}. The leave cannot close.",
        tuple(i.duty_id for i in moved),
    )


# --- Plan evaluation -----------------------------------------------------------------------------


def evaluate_plan(
    leave: LeaveWindow,
    duties: Sequence[DutyFact],
    assignments: Sequence[AssignmentFact],
    availability: Sequence[AvailabilityFact],
    today: date,
    names: dict[str, str] | None = None,
) -> list[Finding]:
    """All checks a cover plan must pass before a manager can approve it."""
    return [
        check_confirmation(duties),
        check_coverage(leave, duties, assignments),
        check_capacity(leave, duties, assignments, availability, names),
        check_no_work_to_absent(leave, assignments),
        check_assignments_end(leave, assignments),
        check_stale(availability, today, names=names),
    ]
