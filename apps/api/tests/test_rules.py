"""Two or more tests per rule: one that passes and one that fails, plus boundaries."""

from datetime import date, timedelta

from shetu_api.domain import rules
from shetu_api.domain.rules import (
    AssignmentFact,
    AvailabilityFact,
    DutyFact,
    LeaveWindow,
    ReturnFact,
)

START = date(2027, 1, 4)  # a Monday
LEAVE = LeaveWindow("nusrat", START, START + timedelta(weeks=8) - timedelta(days=1))


def duty(
    id_: str,
    hours: float = 2,
    evidence: str = "said",
    confirmed: bool = False,
    quote: str | None = None,
) -> DutyFact:
    return DutyFact(id_, f"Duty {id_}", hours, evidence, confirmed, quote)


def assign(
    duty_id: str, person: str | None, start: date = LEAVE.starts_on, end: date = LEAVE.ends_on
) -> AssignmentFact:
    return AssignmentFact(duty_id, person, start, end)


# R1 ---------------------------------------------------------------------------------------------


def test_r1_quote_found_ignoring_case_spacing_and_quotes() -> None:
    transcript = "EMPLOYEE: Ami  protimash er 10 tarikh er age Donor A er expense reconcile kori."
    assert rules.quote_is_grounded("“protimash er 10 tarikh er AGE donor a”", transcript)


def test_r1_invented_quote_fails() -> None:
    finding = rules.check_quotes(
        [duty("d1", quote="I approve all payments")], "EMPLOYEE: I do the payroll."
    )
    assert finding[0].ok is False
    assert finding[0].rule == rules.Rule.R1_QUOTE


def test_r1_bangla_quote_matches_after_unicode_normalization() -> None:
    assert rules.quote_is_grounded("ব্যাংকের আরএম", "ব্যাংকের   আরএম শুধু আমাকে ফোন দেয়")


# R2 ---------------------------------------------------------------------------------------------


def test_r2_unconfirmed_suggestion_is_left_out_of_plan() -> None:
    ds = [duty("d1"), duty("d2", evidence="suggested")]
    assert [d.id for d in rules.duties_in_plan(ds)] == ["d1"]
    assert rules.check_confirmation(ds).ok is False


def test_r2_confirmed_suggestion_counts() -> None:
    ds = [duty("d2", evidence="suggested", confirmed=True)]
    assert [d.id for d in rules.duties_in_plan(ds)] == ["d2"]
    assert rules.check_confirmation(ds).ok is True


# R3 ---------------------------------------------------------------------------------------------


def test_r3_full_coverage_passes() -> None:
    assert rules.check_coverage(LEAVE, [duty("d1")], [assign("d1", "karim")]).ok


def test_r3_unassigned_duty_fails() -> None:
    f = rules.check_coverage(LEAVE, [duty("d1")], [assign("d1", None)])
    assert not f.ok and f.refs == ("d1",)


def test_r3_gap_between_two_assignments_is_found() -> None:
    mid = START + timedelta(days=20)
    f = rules.check_coverage(
        LEAVE,
        [duty("d1")],
        [assign("d1", "karim", end=mid), assign("d1", "tanvir", start=mid + timedelta(days=3))],
    )
    assert not f.ok
    assert (mid + timedelta(days=1)).strftime("%d %b") in f.message


def test_r3_consecutive_assignments_leave_no_gap() -> None:
    mid = START + timedelta(days=20)
    f = rules.check_coverage(
        LEAVE,
        [duty("d1")],
        [assign("d1", "karim", end=mid), assign("d1", "tanvir", start=mid + timedelta(days=1))],
    )
    assert f.ok


# R4 ---------------------------------------------------------------------------------------------


def test_r4_load_at_exact_availability_passes() -> None:
    ds = [duty("d1", 4), duty("d2", 2)]
    f = rules.check_capacity(
        LEAVE,
        ds,
        [assign("d1", "karim"), assign("d2", "karim")],
        [AvailabilityFact("karim", 6, START)],
    )
    assert f.ok


def test_r4_overload_reports_hours_and_weeks() -> None:
    ds = [duty("d1", 4), duty("d2", 3), duty("d3", 2)]
    f = rules.check_capacity(
        LEAVE,
        ds,
        [assign(d.id, "karim") for d in ds],
        [AvailabilityFact("karim", 6, START)],
        names={"karim": "Karim"},
    )
    assert not f.ok
    assert "Karim: 9 h a week needed, 6 h available, weeks 1 to 8" in f.message


def test_r4_missing_availability_fails() -> None:
    f = rules.check_capacity(LEAVE, [duty("d1")], [assign("d1", "karim")], [])
    assert not f.ok and "no availability answer" in f.message


def test_r4_overload_only_in_overlapping_weeks() -> None:
    week3 = START + timedelta(weeks=2)
    ds = [duty("d1", 4), duty("d2", 4)]
    f = rules.check_capacity(
        LEAVE,
        ds,
        [assign("d1", "karim"), assign("d2", "karim", start=week3, end=week3 + timedelta(days=6))],
        [AvailabilityFact("karim", 6, START)],
    )
    assert not f.ok and "weeks 3." in f.message


# R5 ---------------------------------------------------------------------------------------------


def test_r5_assignment_to_person_on_leave_fails() -> None:
    assert not rules.check_no_work_to_absent(LEAVE, [assign("d1", "nusrat")]).ok


def test_r5_assignment_to_colleague_passes() -> None:
    assert rules.check_no_work_to_absent(LEAVE, [assign("d1", "karim")]).ok


# R6 ---------------------------------------------------------------------------------------------


def test_r6_ending_on_last_handback_day_passes() -> None:
    assert rules.check_assignments_end(
        LEAVE, [assign("d1", "karim", end=LEAVE.latest_assignment_end)]
    ).ok


def test_r6_one_day_past_handback_fails() -> None:
    late = LEAVE.latest_assignment_end + timedelta(days=1)
    assert not rules.check_assignments_end(LEAVE, [assign("d1", "karim", end=late)]).ok


# R7 ---------------------------------------------------------------------------------------------


def test_r7_thirty_day_old_answer_is_still_fresh() -> None:
    today = date(2027, 1, 31)
    assert rules.check_stale([AvailabilityFact("karim", 6, today - timedelta(days=30))], today).ok


def test_r7_older_answer_must_be_asked_again() -> None:
    today = date(2027, 1, 31)
    f = rules.check_stale(
        [AvailabilityFact("karim", 6, today - timedelta(days=31))], today, names={"karim": "Karim"}
    )
    assert not f.ok and "Karim" in f.message


# R8 ---------------------------------------------------------------------------------------------


def test_r8_duty_kept_without_agreement_blocks_closing() -> None:
    f = rules.check_return([ReturnFact("d1", "Petty cash", True, None)])
    assert not f.ok and "Petty cash" in f.message


def test_r8_agreed_or_returned_duties_pass() -> None:
    f = rules.check_return(
        [ReturnFact("d1", "VAT", True, True), ReturnFact("d2", "Bank", False, None)]
    )
    assert f.ok


# Plan --------------------------------------------------------------------------------------------


def test_evaluate_plan_runs_every_plan_rule() -> None:
    found = rules.evaluate_plan(
        LEAVE, [duty("d1")], [assign("d1", "karim")], [AvailabilityFact("karim", 6, START)], START
    )
    assert [f.rule.value for f in found] == ["R2", "R3", "R4", "R5", "R6", "R7"]
    assert all(f.ok for f in found)
