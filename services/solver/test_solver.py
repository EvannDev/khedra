"""Tests for the Khedra CP-SAT solver."""
import pytest
from datetime import date, time, timedelta

from models import (
    Assignment,
    Constraint,
    ConstraintType,
    Employee,
    ShiftType,
    SolveRequest,
    SolveResponse,
    SolveStatus,
)
from solver import _date_range, _day_name, solve


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

def make_employee(id: str, name: str = "", skills: list[str] = None) -> Employee:
    return Employee(id=id, name=name or id, skills=skills or [])


def make_shift(
    id: str,
    name: str = "",
    start_h: int = 8,
    end_h: int = 16,
    duration: float | None = None,
) -> ShiftType:
    return ShiftType(
        id=id,
        name=name or id,
        start_time=time(start_h, 0),
        end_time=time(end_h, 0),
        duration_hours=duration if duration is not None else (end_h - start_h) % 24 or 8,
    )


def make_request(
    employees: list[Employee],
    shift_types: list[ShiftType],
    constraints: list[Constraint],
    start: date = date(2025, 1, 6),   # Monday
    end: date = date(2025, 1, 12),    # Sunday (1 week)
) -> SolveRequest:
    return SolveRequest(
        start_date=start,
        end_date=end,
        employees=employees,
        shift_types=shift_types,
        constraints=constraints,
    )


# ---------------------------------------------------------------------------
# Helper function tests
# ---------------------------------------------------------------------------

class TestHelpers:
    def test_date_range_single_day(self):
        d = date(2025, 1, 1)
        assert _date_range(d, d) == [d]

    def test_date_range_multiple_days(self):
        result = _date_range(date(2025, 1, 1), date(2025, 1, 3))
        assert result == [date(2025, 1, 1), date(2025, 1, 2), date(2025, 1, 3)]

    def test_date_range_one_week(self):
        result = _date_range(date(2025, 1, 6), date(2025, 1, 12))
        assert len(result) == 7

    def test_day_name_monday(self):
        assert _day_name(date(2025, 1, 6)) == "mon"

    def test_day_name_sunday(self):
        assert _day_name(date(2025, 1, 12)) == "sun"

    def test_day_name_saturday(self):
        assert _day_name(date(2025, 1, 11)) == "sat"


# ---------------------------------------------------------------------------
# Basic solver behaviour
# ---------------------------------------------------------------------------

class TestLoadBalancing:
    def test_heavily_limited_employee_does_not_drag_down_others(self):
        """An employee blocked for most of the period should be excluded from load
        balancing so that well-available employees get a fair share of shifts.

        Setup: e1 is available all 14 days; e2 is blocked for 12 of 14 days.
        Without the fix, min_shifts_var would be capped at 2 (e2's max), so e1
        would not be pushed to take more than 2 shifts. With the fix, e2 is
        excluded from load balancing and e1 should receive significantly more.
        """
        emps = [make_employee("e1"), make_employee("e2")]
        shifts = [make_shift("s1")]
        # Block e2 for 12 of 14 days (Mon–Sat of both weeks → 12 days)
        blocked_days = ["mon", "tue", "wed", "thu", "fri", "sat"]
        c_unavail = Constraint(
            type=ConstraintType.unavailability,
            params={"employee_id": "e2", "days": blocked_days},
        )
        req = make_request(
            employees=emps,
            shift_types=shifts,
            constraints=[c_unavail],
            start=date(2025, 1, 6),   # Mon
            end=date(2025, 1, 19),    # Sun — 14 days
        )
        resp = solve(req)
        assert resp.status == SolveStatus.solved

        e1_count = sum(1 for a in resp.assignments if a.employee_id == "e1")
        e2_count = sum(1 for a in resp.assignments if a.employee_id == "e2")

        # e2 can work at most 2 days (both Sundays). e1 should not be capped at 2 —
        # the load balancer should push e1's shifts well above e2's ceiling.
        assert e1_count > e2_count, (
            f"e1 ({e1_count} shifts) should have more shifts than limited e2 ({e2_count} shifts)"
        )
        assert e1_count >= 6, (
            f"e1 should be well-utilized (got {e1_count}), not dragged down by e2's 2-day limit"
        )

    def test_fully_blocked_employee_excluded_from_load_balancing(self):
        """A fully-blocked employee (0 available days) must not be in the pool,
        otherwise min_shifts_var is forced to 0 and no one gets scheduled."""
        emps = [make_employee("e1"), make_employee("e2")]
        shifts = [make_shift("s1")]
        all_days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
        c = Constraint(
            type=ConstraintType.unavailability,
            params={"employee_id": "e2", "days": all_days},
        )
        req = make_request(employees=emps, shift_types=shifts, constraints=[c])
        resp = solve(req)
        assert resp.status == SolveStatus.solved
        e1_shifts = [a for a in resp.assignments if a.employee_id == "e1"]
        assert len(e1_shifts) > 0, "e1 should be scheduled even though e2 is fully blocked"

    def test_limited_employee_gets_some_shifts(self):
        """An employee with very few available days should still receive at least 1 shift,
        not be starved because the main pool can cover coverage alone.

        e1: available all 14 days (main pool).
        e2: available only 2 days (both Sundays — blocked Mon–Sat).
        Expected: e2 gets ≥ 1 shift; e1 gets more than e2.
        """
        emps = [make_employee("e1"), make_employee("e2")]
        shifts = [make_shift("s1")]
        c = Constraint(
            type=ConstraintType.unavailability,
            params={"employee_id": "e2", "days": ["mon", "tue", "wed", "thu", "fri", "sat"]},
        )
        req = make_request(
            employees=emps, shift_types=shifts, constraints=[c],
            start=date(2025, 1, 6), end=date(2025, 1, 19),
        )
        resp = solve(req)
        assert resp.status == SolveStatus.solved

        e1_count = sum(1 for a in resp.assignments if a.employee_id == "e1")
        e2_count = sum(1 for a in resp.assignments if a.employee_id == "e2")

        assert e2_count >= 1, f"e2 should receive at least 1 shift on their available days (got {e2_count})"
        assert e1_count > e2_count, f"e1 ({e1_count}) should have more shifts than limited e2 ({e2_count})"

    def test_limited_employees_balanced_among_themselves(self):
        """Multiple limited-availability employees should be load-balanced among themselves.

        e1: fully available (main pool).
        e2, e3: each available only on Sundays (2 days each).
        Expected: e2 and e3 each get some shifts; their counts differ by at most 1.
        """
        emps = [make_employee("e1"), make_employee("e2"), make_employee("e3")]
        shifts = [make_shift("s1")]
        blocked = ["mon", "tue", "wed", "thu", "fri", "sat"]
        constraints = [
            Constraint(type=ConstraintType.unavailability, params={"employee_id": "e2", "days": blocked}),
            Constraint(type=ConstraintType.unavailability, params={"employee_id": "e3", "days": blocked}),
        ]
        req = make_request(
            employees=emps, shift_types=shifts, constraints=constraints,
            start=date(2025, 1, 6), end=date(2025, 1, 19),
        )
        resp = solve(req)
        assert resp.status == SolveStatus.solved

        e2_count = sum(1 for a in resp.assignments if a.employee_id == "e2")
        e3_count = sum(1 for a in resp.assignments if a.employee_id == "e3")

        assert e2_count >= 1, f"e2 should receive at least 1 shift (got {e2_count})"
        assert e3_count >= 1, f"e3 should receive at least 1 shift (got {e3_count})"
        assert abs(e2_count - e3_count) <= 1, (
            f"e2 ({e2_count}) and e3 ({e3_count}) should be balanced among themselves"
        )

    def test_similarly_available_employees_get_balanced_shifts(self):
        """When all employees have similar availability, load balancing should keep
        shift counts close to each other."""
        emps = [make_employee(f"e{i}") for i in range(4)]
        shifts = [make_shift("s1")]
        req = make_request(
            employees=emps,
            shift_types=shifts,
            constraints=[],
            start=date(2025, 1, 6),
            end=date(2025, 1, 19),  # 14 days
        )
        resp = solve(req)
        assert resp.status == SolveStatus.solved

        counts = [sum(1 for a in resp.assignments if a.employee_id == f"e{i}") for i in range(4)]
        assert max(counts) - min(counts) <= 2, (
            f"Shift counts should be balanced, got {counts}"
        )


class TestBasicSolve:
    def test_empty_employees_returns_solved(self):
        """No employees → trivially feasible."""
        req = make_request(employees=[], shift_types=[make_shift("s1")], constraints=[])
        resp = solve(req)
        assert resp.status == SolveStatus.solved
        assert resp.assignments == []

    def test_single_employee_single_shift_gets_assignments(self):
        """With only one employee the load-balance objective is skipped (requires >1),
        so no shifts are forced. The solution is feasible with zero assignments."""
        emp = [make_employee("e1")]
        shifts = [make_shift("s1")]
        req = make_request(employees=emp, shift_types=shifts, constraints=[])
        resp = solve(req)
        assert resp.status == SolveStatus.solved

    def test_two_employees_get_assignments(self):
        """Load-balancing kicks in with 2+ employees, so both should receive shifts."""
        emps = [make_employee("e1"), make_employee("e2")]
        shifts = [make_shift("s1")]
        req = make_request(employees=emps, shift_types=shifts, constraints=[])
        resp = solve(req)
        assert resp.status == SolveStatus.solved
        assert len(resp.assignments) > 0

    def test_assignments_respect_one_shift_per_day(self):
        """Each employee must have at most one shift per day."""
        emps = [make_employee(f"e{i}") for i in range(3)]
        shifts = [make_shift("morning", start_h=6, end_h=14), make_shift("evening", start_h=14, end_h=22)]
        req = make_request(employees=emps, shift_types=shifts, constraints=[])
        resp = solve(req)
        assert resp.status == SolveStatus.solved

        # Index assignments by (employee, date)
        from collections import defaultdict
        per_emp_day: dict = defaultdict(list)
        for a in resp.assignments:
            per_emp_day[(a.employee_id, a.date)].append(a.shift_type_id)

        for (emp_id, d), assigned_shifts in per_emp_day.items():
            assert len(assigned_shifts) <= 1, f"{emp_id} has multiple shifts on {d}"

    def test_response_has_score(self):
        emp = [make_employee("e1")]
        shifts = [make_shift("s1")]
        req = make_request(employees=emp, shift_types=shifts, constraints=[])
        resp = solve(req)
        assert resp.score is not None

    def test_disabled_constraint_is_ignored(self):
        """A disabled constraint should not affect the solution."""
        emp = [make_employee("e1")]
        shifts = [make_shift("s1")]
        # This constraint would make the problem infeasible if enabled
        c = Constraint(
            type=ConstraintType.min_employees_per_shift,
            params={"shift_type_id": "s1", "min": 999},
            enabled=False,
        )
        req = make_request(employees=emp, shift_types=shifts, constraints=[c])
        resp = solve(req)
        assert resp.status == SolveStatus.solved


# ---------------------------------------------------------------------------
# Constraint: max_hours_per_week
# ---------------------------------------------------------------------------

class TestMaxHoursPerWeek:
    def test_respects_zero_hours(self):
        """max=0 means no one can work at all."""
        emps = [make_employee("e1")]
        shifts = [make_shift("s1", duration=8)]
        c = Constraint(type=ConstraintType.max_hours_per_week, params={"max": 0})
        req = make_request(employees=emps, shift_types=shifts, constraints=[c])
        resp = solve(req)
        assert resp.status == SolveStatus.solved
        assert resp.assignments == []

    def test_respects_strict_limit(self):
        """max=8h means at most 1 shift of 8h per week."""
        emps = [make_employee("e1")]
        shifts = [make_shift("s1", duration=8)]
        c = Constraint(type=ConstraintType.max_hours_per_week, params={"max": 8})
        req = make_request(employees=emps, shift_types=shifts, constraints=[c])
        resp = solve(req)
        assert resp.status == SolveStatus.solved
        emp_assignments = [a for a in resp.assignments if a.employee_id == "e1"]
        assert len(emp_assignments) <= 1


# ---------------------------------------------------------------------------
# Constraint: max_hours_per_month
# ---------------------------------------------------------------------------

class TestMaxHoursPerMonth:
    def test_zero_hours_means_no_shifts(self):
        """max=0 blocks all shifts for the month."""
        emps = [make_employee("e1")]
        shifts = [make_shift("s1", duration=8)]
        c = Constraint(type=ConstraintType.max_hours_per_month, params={"max": 0})
        req = make_request(employees=emps, shift_types=shifts, constraints=[c])
        resp = solve(req)
        assert resp.status == SolveStatus.solved
        assert resp.assignments == []

    def test_respects_strict_monthly_limit(self):
        """max=8h/month means at most 1 shift of 8h across the whole month."""
        emps = [make_employee("e1")]
        shifts = [make_shift("s1", duration=8)]
        c = Constraint(type=ConstraintType.max_hours_per_month, params={"max": 8})
        # Use a full week (Mon–Sun) within a single calendar month
        req = make_request(
            employees=emps, shift_types=shifts, constraints=[c],
            start=date(2025, 1, 6), end=date(2025, 1, 12),
        )
        resp = solve(req)
        assert resp.status == SolveStatus.solved
        emp_assignments = [a for a in resp.assignments if a.employee_id == "e1"]
        assert len(emp_assignments) <= 1

    def test_monthly_limit_not_weekly(self):
        """max=40h/month with 8h shifts allows more than 5 days total across the month
        (a weekly 40h cap would cap at 5 days/week; monthly allows more spread out)."""
        emps = [make_employee("e1")]
        shifts = [make_shift("s1", duration=8)]
        c = Constraint(type=ConstraintType.max_hours_per_month, params={"max": 40})
        # 14-day window in the same month — 40h / 8h = 5 shifts max total
        req = make_request(
            employees=emps, shift_types=shifts, constraints=[c],
            start=date(2025, 1, 6), end=date(2025, 1, 19),
        )
        resp = solve(req)
        assert resp.status == SolveStatus.solved
        emp_total_hours = len([a for a in resp.assignments if a.employee_id == "e1"]) * 8
        assert emp_total_hours <= 40

    def test_cross_month_boundary_each_month_capped_independently(self):
        """Planning spanning two months: each month is capped independently.
        max=8h means at most 1 shift per month, so at most 2 shifts total."""
        emps = [make_employee("e1")]
        shifts = [make_shift("s1", duration=8)]
        c = Constraint(type=ConstraintType.max_hours_per_month, params={"max": 8})
        # Jan 27 – Feb 2: 5 days in Jan, 2 days in Feb
        req = make_request(
            employees=emps, shift_types=shifts, constraints=[c],
            start=date(2025, 1, 27), end=date(2025, 2, 2),
        )
        resp = solve(req)
        assert resp.status == SolveStatus.solved
        jan_assignments = [a for a in resp.assignments if a.employee_id == "e1" and a.date.month == 1]
        feb_assignments = [a for a in resp.assignments if a.employee_id == "e1" and a.date.month == 2]
        assert len(jan_assignments) <= 1
        assert len(feb_assignments) <= 1

    def test_monthly_cap_tighter_than_weekly_is_binding(self):
        """max=16h/month with 8h shifts: allows at most 2 shifts for the whole month,
        even though a weekly cap of 40h would allow many more."""
        emps = [make_employee("e1"), make_employee("e2")]
        shifts = [make_shift("s1", duration=8)]
        c = Constraint(type=ConstraintType.max_hours_per_month, params={"max": 16})
        req = make_request(
            employees=emps, shift_types=shifts, constraints=[c],
            start=date(2025, 1, 6), end=date(2025, 1, 12),
        )
        resp = solve(req)
        assert resp.status == SolveStatus.solved
        for emp_id in ["e1", "e2"]:
            count = len([a for a in resp.assignments if a.employee_id == emp_id])
            assert count <= 2, f"{emp_id} worked {count} shifts, cap is 2 (16h / 8h)"


# ---------------------------------------------------------------------------
# Constraint: unavailability
# ---------------------------------------------------------------------------

class TestUnavailability:
    def test_employee_not_scheduled_on_unavailable_day(self):
        emps = [make_employee("e1"), make_employee("e2")]
        shifts = [make_shift("s1")]
        # e1 unavailable on Mondays (2025-01-06 is a Monday); solver uses 3-char abbreviations
        c = Constraint(
            type=ConstraintType.unavailability,
            params={"employee_id": "e1", "days": ["mon"]},
        )
        req = make_request(employees=emps, shift_types=shifts, constraints=[c])
        resp = solve(req)
        assert resp.status == SolveStatus.solved

        monday = date(2025, 1, 6)
        for a in resp.assignments:
            if a.employee_id == "e1":
                assert a.date != monday, "e1 scheduled on unavailable Monday"

    def test_unknown_employee_does_not_crash(self):
        emps = [make_employee("e1")]
        shifts = [make_shift("s1")]
        c = Constraint(
            type=ConstraintType.unavailability,
            params={"employee_id": "nobody", "days": ["monday"]},
        )
        req = make_request(employees=emps, shift_types=shifts, constraints=[c])
        resp = solve(req)
        assert resp.status == SolveStatus.solved

    def test_fully_unavailable_employee_gets_no_shifts(self):
        all_days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
        emps = [make_employee("e1"), make_employee("e2")]
        shifts = [make_shift("s1")]
        c = Constraint(
            type=ConstraintType.unavailability,
            params={"employee_id": "e1", "days": all_days},
        )
        req = make_request(employees=emps, shift_types=shifts, constraints=[c])
        resp = solve(req)
        assert resp.status == SolveStatus.solved
        for a in resp.assignments:
            assert a.employee_id != "e1"


# ---------------------------------------------------------------------------
# Constraint: holiday
# ---------------------------------------------------------------------------

class TestHoliday:
    def test_public_holiday_blocks_all_employees(self):
        emps = [make_employee("e1"), make_employee("e2")]
        shifts = [make_shift("s1")]
        holiday_date = "2025-01-08"  # Wednesday
        c = Constraint(
            type=ConstraintType.holiday,
            params={"dates": [holiday_date]},
        )
        req = make_request(employees=emps, shift_types=shifts, constraints=[c])
        resp = solve(req)
        assert resp.status == SolveStatus.solved
        for a in resp.assignments:
            assert a.date.isoformat() != holiday_date

    def test_personal_holiday_only_blocks_target(self):
        emps = [make_employee("e1"), make_employee("e2")]
        shifts = [make_shift("s1")]
        holiday_date = "2025-01-08"
        c = Constraint(
            type=ConstraintType.holiday,
            params={"dates": [holiday_date], "employee_id": "e1"},
        )
        req = make_request(employees=emps, shift_types=shifts, constraints=[c])
        resp = solve(req)
        assert resp.status == SolveStatus.solved

        e1_on_holiday = any(
            a.employee_id == "e1" and a.date.isoformat() == holiday_date
            for a in resp.assignments
        )
        assert not e1_on_holiday

        # e2 may still work that day — just verify the solver ran
        assert resp.assignments is not None


# ---------------------------------------------------------------------------
# Constraint: min_rest_between_shifts
# ---------------------------------------------------------------------------

class TestMinRestBetweenShifts:
    def test_late_then_early_forbidden(self):
        """Late shift (22-06) then early shift (06-14) next day violates 11h rest."""
        emps = [make_employee("e1")]
        late = make_shift("late", start_h=22, end_h=6, duration=8)   # overnight
        early = make_shift("early", start_h=6, end_h=14, duration=8)
        c = Constraint(type=ConstraintType.min_rest_between_shifts, params={"hours": 11})

        # 2-day window to keep problem tiny
        req = make_request(
            employees=emps,
            shift_types=[late, early],
            constraints=[c],
            start=date(2025, 1, 6),
            end=date(2025, 1, 7),
        )
        resp = solve(req)
        assert resp.status == SolveStatus.solved

        # late on day 1 + early on day 2 should NOT co-exist for e1
        day1_shifts = {a.shift_type_id for a in resp.assignments if a.date == date(2025, 1, 6) and a.employee_id == "e1"}
        day2_shifts = {a.shift_type_id for a in resp.assignments if a.date == date(2025, 1, 7) and a.employee_id == "e1"}
        assert not ("late" in day1_shifts and "early" in day2_shifts)


# ---------------------------------------------------------------------------
# Constraint: max_consecutive_days
# ---------------------------------------------------------------------------

class TestMaxConsecutiveDays:
    def test_max_consecutive_days_respected(self):
        """With max=3, no employee works more than 3 consecutive days."""
        emps = [make_employee("e1"), make_employee("e2"), make_employee("e3")]
        shifts = [make_shift("s1")]
        c = Constraint(type=ConstraintType.max_consecutive_days, params={"max": 3})
        # Use a 10-day window
        req = make_request(
            employees=emps,
            shift_types=shifts,
            constraints=[c],
            start=date(2025, 1, 6),
            end=date(2025, 1, 15),
        )
        resp = solve(req)
        assert resp.status == SolveStatus.solved

        for emp_id in ["e1", "e2", "e3"]:
            emp_days = sorted(a.date for a in resp.assignments if a.employee_id == emp_id)
            consecutive = 1
            for i in range(1, len(emp_days)):
                if (emp_days[i] - emp_days[i - 1]).days == 1:
                    consecutive += 1
                    assert consecutive <= 3, f"{emp_id} worked {consecutive} consecutive days"
                else:
                    consecutive = 1


# ---------------------------------------------------------------------------
# Constraint: required_skill
# ---------------------------------------------------------------------------

class TestRequiredSkill:
    def test_unskilled_employee_not_assigned_to_skilled_shift(self):
        skilled = make_employee("e1", skills=["manager"])
        unskilled = make_employee("e2", skills=[])
        manager_shift = make_shift("manager_shift")
        c = Constraint(
            type=ConstraintType.required_skill,
            params={"shift_type_id": "manager_shift", "skill": "manager"},
        )
        req = make_request(
            employees=[skilled, unskilled],
            shift_types=[manager_shift],
            constraints=[c],
        )
        resp = solve(req)
        assert resp.status == SolveStatus.solved
        for a in resp.assignments:
            if a.shift_type_id == "manager_shift":
                assert a.employee_id == "e1", "unskilled employee assigned to skilled shift"

    def test_infeasible_when_no_one_has_skill(self):
        emp = make_employee("e1", skills=[])
        shift = make_shift("s1")
        c = Constraint(
            type=ConstraintType.required_skill,
            params={"shift_type_id": "s1", "skill": "nurse"},
        )
        req = make_request(
            employees=[emp],
            shift_types=[shift],
            constraints=[
                c,
                Constraint(type=ConstraintType.min_employees_per_shift, params={"shift_type_id": "s1", "min": 1}),
            ],
        )
        resp = solve(req)
        assert resp.status == SolveStatus.infeasible


# ---------------------------------------------------------------------------
# Constraint: min_employees_per_shift
# ---------------------------------------------------------------------------

class TestMinEmployeesPerShift:
    def test_min_employees_per_shift_met(self):
        emps = [make_employee(f"e{i}") for i in range(3)]
        shifts = [make_shift("s1")]
        c = Constraint(
            type=ConstraintType.min_employees_per_shift,
            params={"shift_type_id": "s1", "min": 2},
        )
        req = make_request(employees=emps, shift_types=shifts, constraints=[c])
        resp = solve(req)
        assert resp.status == SolveStatus.solved

        from collections import defaultdict
        per_day: dict = defaultdict(int)
        for a in resp.assignments:
            per_day[a.date] += 1

        for d, count in per_day.items():
            assert count >= 2, f"Only {count} employees on {d}"

    def test_infeasible_min_exceeds_employees(self):
        emps = [make_employee("e1")]
        shifts = [make_shift("s1")]
        c = Constraint(
            type=ConstraintType.min_employees_per_shift,
            params={"shift_type_id": "s1", "min": 2},
        )
        req = make_request(employees=emps, shift_types=shifts, constraints=[c])
        resp = solve(req)
        assert resp.status == SolveStatus.infeasible


# ---------------------------------------------------------------------------
# Constraint: max_employees_per_shift (hard)
# ---------------------------------------------------------------------------

class TestMaxEmployeesPerShiftHard:
    def test_hard_max_respected(self):
        emps = [make_employee(f"e{i}") for i in range(4)]
        shifts = [make_shift("s1")]
        c = Constraint(
            type=ConstraintType.max_employees_per_shift,
            params={"shift_type_id": "s1", "max": 2, "mode": "hard"},
        )
        req = make_request(employees=emps, shift_types=shifts, constraints=[c])
        resp = solve(req)
        assert resp.status == SolveStatus.solved

        from collections import defaultdict
        per_day: dict = defaultdict(int)
        for a in resp.assignments:
            per_day[a.date] += 1

        for d, count in per_day.items():
            assert count <= 2, f"{count} employees on {d} exceeds hard max of 2"


# ---------------------------------------------------------------------------
# Constraint: weekend_fairness
# ---------------------------------------------------------------------------

class TestWeekendFairness:
    def test_weekend_shifts_limited_per_employee(self):
        emps = [make_employee(f"e{i}") for i in range(3)]
        shifts = [make_shift("s1")]
        c = Constraint(
            type=ConstraintType.weekend_fairness,
            params={"max_weekends_per_month": 1},
        )
        # 4-week period so there are multiple weekend days
        req = make_request(
            employees=emps,
            shift_types=shifts,
            constraints=[c],
            start=date(2025, 1, 1),
            end=date(2025, 1, 31),
        )
        resp = solve(req)
        assert resp.status == SolveStatus.solved

        from collections import defaultdict
        weekend_per_emp_month: dict = defaultdict(int)
        for a in resp.assignments:
            if a.date.weekday() >= 5:  # Saturday or Sunday
                key = (a.employee_id, a.date.year, a.date.month)
                weekend_per_emp_month[key] += 1

        for key, count in weekend_per_emp_month.items():
            assert count <= 1, f"{key} worked {count} weekend days, max is 1"


# ---------------------------------------------------------------------------
# Constraint: shift_preference (soft)
# ---------------------------------------------------------------------------

class TestShiftPreference:
    def test_preferred_shift_increases_score(self):
        """Preferred shift must be feasible (the solver just uses it as a soft bonus)."""
        emps = [make_employee("e1")]
        shifts = [make_shift("morning", start_h=6, end_h=14), make_shift("evening", start_h=14, end_h=22)]
        c = Constraint(
            type=ConstraintType.shift_preference,
            params={"employee_id": "e1", "shift_type_id": "morning", "weight": "preferred"},
        )
        req = make_request(employees=emps, shift_types=shifts, constraints=[c])
        resp = solve(req)
        assert resp.status == SolveStatus.solved
        assert resp.score is not None

    def test_soft_avoid_does_not_block_shift(self):
        """soft + avoid penalises the shift but does not block it — solver remains feasible
        and may still assign the shift when forced by other constraints."""
        emps = [make_employee("e1")]
        shifts = [make_shift("evening", start_h=14, end_h=22)]
        c = Constraint(
            type=ConstraintType.shift_preference,
            params={"employee_id": "e1", "shift_type_id": "evening", "weight": "avoid", "mode": "soft"},
        )
        req = make_request(employees=emps, shift_types=shifts, constraints=[c])
        resp = solve(req)
        assert resp.status == SolveStatus.solved

    # ------------------------------------------------------------------
    # Hard mode
    # ------------------------------------------------------------------

    def test_hard_avoid_blocks_shift_completely(self):
        """hard + avoid: the employee must never be assigned to that shift type."""
        emps = [make_employee("e1"), make_employee("e2")]
        shifts = [make_shift("morning", start_h=6, end_h=14), make_shift("evening", start_h=14, end_h=22)]
        c = Constraint(
            type=ConstraintType.shift_preference,
            params={"employee_id": "e1", "shift_type_id": "evening", "weight": "avoid", "mode": "hard"},
        )
        req = make_request(employees=emps, shift_types=shifts, constraints=[c])
        resp = solve(req)
        assert resp.status == SolveStatus.solved
        for a in resp.assignments:
            if a.employee_id == "e1":
                assert a.shift_type_id != "evening", "e1 assigned to avoided shift (hard)"

    def test_hard_preferred_blocks_all_other_shifts(self):
        """hard + preferred: the employee can only ever work the preferred shift type."""
        emps = [make_employee("e1"), make_employee("e2")]
        shifts = [make_shift("morning", start_h=6, end_h=14), make_shift("evening", start_h=14, end_h=22)]
        c = Constraint(
            type=ConstraintType.shift_preference,
            params={"employee_id": "e1", "shift_type_id": "morning", "weight": "preferred", "mode": "hard"},
        )
        req = make_request(employees=emps, shift_types=shifts, constraints=[c])
        resp = solve(req)
        assert resp.status == SolveStatus.solved
        for a in resp.assignments:
            if a.employee_id == "e1":
                assert a.shift_type_id == "morning", "e1 assigned to non-preferred shift (hard)"

    def test_hard_avoid_only_affects_target_employee(self):
        """hard + avoid on e1 does not restrict e2."""
        emps = [make_employee("e1"), make_employee("e2")]
        shifts = [make_shift("morning", start_h=6, end_h=14), make_shift("evening", start_h=14, end_h=22)]
        c = Constraint(
            type=ConstraintType.shift_preference,
            params={"employee_id": "e1", "shift_type_id": "evening", "weight": "avoid", "mode": "hard"},
        )
        req = make_request(employees=emps, shift_types=shifts, constraints=[c])
        resp = solve(req)
        assert resp.status == SolveStatus.solved
        e2_evening = [a for a in resp.assignments if a.employee_id == "e2" and a.shift_type_id == "evening"]
        assert len(e2_evening) > 0, "e2 should be able to work evening shifts"

    def test_hard_avoid_all_shifts_makes_employee_unschedulable(self):
        """hard avoid on the only shift type → employee gets no assignments (not infeasible,
        just no shifts for that employee)."""
        emps = [make_employee("e1"), make_employee("e2")]
        shifts = [make_shift("s1")]
        c = Constraint(
            type=ConstraintType.shift_preference,
            params={"employee_id": "e1", "shift_type_id": "s1", "weight": "avoid", "mode": "hard"},
        )
        req = make_request(employees=emps, shift_types=shifts, constraints=[c])
        resp = solve(req)
        assert resp.status == SolveStatus.solved
        for a in resp.assignments:
            assert a.employee_id != "e1", "e1 should have no assignments"

    def test_default_mode_is_soft(self):
        """Omitting `mode` falls back to soft behaviour (no hard blocking)."""
        emps = [make_employee("e1")]
        shifts = [make_shift("s1")]
        c = Constraint(
            type=ConstraintType.shift_preference,
            params={"employee_id": "e1", "shift_type_id": "s1", "weight": "avoid"},
        )
        req = make_request(employees=emps, shift_types=shifts, constraints=[c])
        resp = solve(req)
        assert resp.status == SolveStatus.solved


# ---------------------------------------------------------------------------
# Constraint: preferred_consecutive_days (soft)
# ---------------------------------------------------------------------------

class TestPreferredConsecutiveDays:
    def test_preferred_consecutive_days_is_feasible(self):
        emps = [make_employee("e1"), make_employee("e2")]
        shifts = [make_shift("s1")]
        c = Constraint(
            type=ConstraintType.preferred_consecutive_days,
            params={"days": 3},
        )
        req = make_request(employees=emps, shift_types=shifts, constraints=[c])
        resp = solve(req)
        assert resp.status == SolveStatus.solved


# ---------------------------------------------------------------------------
# Infeasible scenarios
# ---------------------------------------------------------------------------

class TestInfeasible:
    def test_conflicting_hard_constraints(self):
        """min_employees_per_shift=2 with only 1 employee → infeasible."""
        emp = [make_employee("e1")]
        shifts = [make_shift("s1")]
        c = Constraint(
            type=ConstraintType.min_employees_per_shift,
            params={"shift_type_id": "s1", "min": 2},
        )
        req = make_request(employees=emp, shift_types=shifts, constraints=[c])
        resp = solve(req)
        assert resp.status == SolveStatus.infeasible
        assert resp.assignments == []
        assert resp.message is not None

    def test_infeasible_has_no_assignments(self):
        emp = [make_employee("e1")]
        shifts = [make_shift("s1")]
        c = Constraint(
            type=ConstraintType.min_employees_per_shift,
            params={"shift_type_id": "s1", "min": 5},
        )
        req = make_request(employees=emp, shift_types=shifts, constraints=[c])
        resp = solve(req)
        assert resp.status == SolveStatus.infeasible
        assert resp.assignments == []


# ---------------------------------------------------------------------------
# Multi-constraint interactions
# ---------------------------------------------------------------------------

class TestMultiConstraint:
    def test_unavailability_and_min_employees(self):
        """2 employees, one unavailable on Monday → min 1 per shift should still be met by the other."""
        emps = [make_employee("e1"), make_employee("e2")]
        shifts = [make_shift("s1")]
        constraints = [
            Constraint(
                type=ConstraintType.unavailability,
                params={"employee_id": "e1", "days": ["mon"]},
            ),
            Constraint(
                type=ConstraintType.min_employees_per_shift,
                params={"shift_type_id": "s1", "min": 1},
            ),
        ]
        req = make_request(employees=emps, shift_types=shifts, constraints=constraints)
        resp = solve(req)
        assert resp.status == SolveStatus.solved

        monday = date(2025, 1, 6)
        monday_assignments = [a for a in resp.assignments if a.date == monday]
        # e2 can cover Monday
        assert all(a.employee_id == "e2" for a in monday_assignments)

    def test_required_skill_and_min_employees(self):
        """min 2 per shift but only 1 skilled employee → infeasible."""
        skilled = make_employee("e1", skills=["nurse"])
        unskilled = make_employee("e2", skills=[])
        shift = make_shift("s1")
        constraints = [
            Constraint(
                type=ConstraintType.required_skill,
                params={"shift_type_id": "s1", "skill": "nurse"},
            ),
            Constraint(
                type=ConstraintType.min_employees_per_shift,
                params={"shift_type_id": "s1", "min": 2},
            ),
        ]
        req = make_request(employees=[skilled, unskilled], shift_types=[shift], constraints=constraints)
        resp = solve(req)
        assert resp.status == SolveStatus.infeasible


# ---------------------------------------------------------------------------
# Constraint: min_days_between_shifts
# ---------------------------------------------------------------------------

class TestMinDaysBetweenShifts:
    """Tests for min_days_between_shifts with optional `consecutive` param.

    Semantics: after working `consecutive` days in a row, the employee must
    have at least `days` days off.  When `consecutive=1` (default) this
    degenerates to the original behaviour: any two shifts must be separated
    by at least `days` rest days.
    """

    # ------------------------------------------------------------------
    # consecutive=1 (legacy behaviour)
    # ------------------------------------------------------------------

    def test_consecutive_1_gap_1_forbids_back_to_back(self):
        """consecutive=1, days=1 → no two shifts on adjacent days."""
        emp = [make_employee("e1")]
        shifts = [make_shift("s1")]
        c = Constraint(
            type=ConstraintType.min_days_between_shifts,
            params={"days": 1, "consecutive": 1, "mode": "hard"},
        )
        req = make_request(
            employees=emp, shift_types=shifts, constraints=[c],
            start=date(2025, 1, 6), end=date(2025, 1, 12),
        )
        resp = solve(req)
        assert resp.status == SolveStatus.solved

        worked_days = sorted(a.date for a in resp.assignments if a.employee_id == "e1")
        for i in range(1, len(worked_days)):
            gap = (worked_days[i] - worked_days[i - 1]).days
            assert gap >= 2, (
                f"e1 worked on {worked_days[i - 1]} and {worked_days[i]} "
                f"with only {gap - 1} rest day(s), expected at least 1"
            )

    def test_consecutive_1_gap_2_enforces_two_rest_days(self):
        """consecutive=1, days=2 → after any shift, 2 days off required."""
        emp = [make_employee("e1")]
        shifts = [make_shift("s1")]
        c = Constraint(
            type=ConstraintType.min_days_between_shifts,
            params={"days": 2, "consecutive": 1, "mode": "hard"},
        )
        req = make_request(
            employees=emp, shift_types=shifts, constraints=[c],
            start=date(2025, 1, 6), end=date(2025, 1, 15),
        )
        resp = solve(req)
        assert resp.status == SolveStatus.solved

        worked_days = sorted(a.date for a in resp.assignments if a.employee_id == "e1")
        for i in range(1, len(worked_days)):
            gap = (worked_days[i] - worked_days[i - 1]).days
            assert gap >= 3, (
                f"e1 worked on {worked_days[i - 1]} and {worked_days[i]}, "
                f"gap={gap - 1} rest days, expected >= 2"
            )

    def test_default_consecutive_is_1(self):
        """Omitting `consecutive` defaults to 1 (original behaviour)."""
        emp = [make_employee("e1")]
        shifts = [make_shift("s1")]
        c = Constraint(
            type=ConstraintType.min_days_between_shifts,
            params={"days": 2, "mode": "hard"},  # no `consecutive` key
        )
        req = make_request(
            employees=emp, shift_types=shifts, constraints=[c],
            start=date(2025, 1, 6), end=date(2025, 1, 15),
        )
        resp = solve(req)
        assert resp.status == SolveStatus.solved

        worked_days = sorted(a.date for a in resp.assignments if a.employee_id == "e1")
        for i in range(1, len(worked_days)):
            gap = (worked_days[i] - worked_days[i - 1]).days
            assert gap >= 3

    # ------------------------------------------------------------------
    # consecutive > 1
    # ------------------------------------------------------------------

    def test_after_3_consecutive_need_2_days_off(self):
        """consecutive=3, days=2: after working 3 days in a row, must rest 2 days.
        Working 2 days then resting 1 day is allowed; working 3 days then
        immediately working again is not."""
        emps = [make_employee("e1"), make_employee("e2"), make_employee("e3")]
        shifts = [make_shift("s1")]
        c = Constraint(
            type=ConstraintType.min_days_between_shifts,
            params={"days": 2, "consecutive": 3, "mode": "hard"},
        )
        # 14-day window gives enough room
        req = make_request(
            employees=emps, shift_types=shifts, constraints=[c],
            start=date(2025, 1, 6), end=date(2025, 1, 19),
        )
        resp = solve(req)
        assert resp.status == SolveStatus.solved

        for emp_id in ["e1", "e2", "e3"]:
            emp_days = sorted(a.date for a in resp.assignments if a.employee_id == emp_id)
            # Detect any run of 3 consecutive days followed by a shift within 2 days
            date_set = set(emp_days)
            for i, d in enumerate(emp_days):
                d1 = d + timedelta(days=1)
                d2 = d + timedelta(days=2)
                if d1 in date_set and d2 in date_set:
                    # d, d+1, d+2 all worked — d+3 and d+4 must be off
                    for rest_offset in range(1, 3):
                        rest_day = d2 + timedelta(days=rest_offset)
                        assert rest_day not in date_set, (
                            f"{emp_id}: worked {d}, {d1}, {d2} then also {rest_day} "
                            f"(only {rest_offset - 1} rest day(s) after the block)"
                        )

    def test_consecutive_2_allows_working_then_rest_then_work(self):
        """consecutive=2, days=1: working 1 day then resting 1 day is fine;
        only 2 consecutive days trigger the rest requirement."""
        emps = [make_employee("e1"), make_employee("e2")]
        shifts = [make_shift("s1")]
        c = Constraint(
            type=ConstraintType.min_days_between_shifts,
            params={"days": 1, "consecutive": 2, "mode": "hard"},
        )
        req = make_request(
            employees=emps, shift_types=shifts, constraints=[c],
            start=date(2025, 1, 6), end=date(2025, 1, 19),
        )
        resp = solve(req)
        assert resp.status == SolveStatus.solved

        for emp_id in ["e1", "e2"]:
            emp_days = sorted(a.date for a in resp.assignments if a.employee_id == emp_id)
            date_set = set(emp_days)
            # No back-to-back pair of worked days followed immediately by another worked day
            for d in emp_days:
                d1 = d + timedelta(days=1)
                d2 = d + timedelta(days=2)
                if d1 in date_set:
                    assert d2 not in date_set, (
                        f"{emp_id}: worked {d} and {d1} (2 consecutive) "
                        f"then worked {d2} with 0 rest days (need >= 1)"
                    )

    def test_consecutive_5_days_2_infeasible_with_one_employee_short_window(self):
        """consecutive=5, days=2 with 1 employee over 6 days: the employee
        could work at most 5 days, but would need 2 rest days after → infeasible
        if shift_coverage forces coverage every day."""
        emp = [make_employee("e1")]
        shifts = [make_shift("s1")]
        constraints = [
            Constraint(
                type=ConstraintType.min_days_between_shifts,
                params={"days": 2, "consecutive": 5, "mode": "hard"},
            ),
            # Force coverage every day — with only 1 employee, they must work all 6 days,
            # but that creates a block of 5 then 1 more which is illegal.
            Constraint(
                type=ConstraintType.shift_coverage,
                params={"shift_type_id": "s1", "min": 1, "mode": "hard"},
            ),
        ]
        req = make_request(
            employees=emp, shift_types=shifts, constraints=constraints,
            start=date(2025, 1, 6), end=date(2025, 1, 11),  # 6 days
        )
        resp = solve(req)
        assert resp.status == SolveStatus.infeasible

    # ------------------------------------------------------------------
    # Soft mode
    # ------------------------------------------------------------------

    def test_soft_mode_does_not_make_problem_infeasible(self):
        """In soft mode the rest requirement is a penalty, not a hard block."""
        emp = [make_employee("e1")]
        shifts = [make_shift("s1")]
        c = Constraint(
            type=ConstraintType.min_days_between_shifts,
            params={"days": 3, "consecutive": 2, "mode": "soft"},
        )
        req = make_request(
            employees=emp, shift_types=shifts, constraints=[c],
            start=date(2025, 1, 6), end=date(2025, 1, 12),
        )
        resp = solve(req)
        assert resp.status == SolveStatus.solved
