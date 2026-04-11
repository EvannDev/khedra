from datetime import date, timedelta
from ortools.sat.python import cp_model

from models import Assignment, Constraint, ConstraintType, Employee, ShiftType, SolveRequest, SolveResponse, SolveStatus


def _date_range(start: date, end: date) -> list[date]:
    days = []
    current = start
    while current <= end:
        days.append(current)
        current += timedelta(days=1)
    return days


def _day_name(d: date) -> str:
    return d.strftime("%A").lower()[:3]  # "monday" → "mon"


def solve(request: SolveRequest) -> SolveResponse:
    model = cp_model.CpModel()

    employees = request.employees
    shifts = request.shift_types
    days = _date_range(request.start_date, request.end_date)
    active_constraints = [c for c in request.constraints if c.enabled]

    emp_ids = [e.id for e in employees]
    shift_ids = [s.id for s in shifts]
    emp_by_id = {e.id: e for e in employees}
    shift_by_id = {s.id: s for s in shifts}

    objective_terms = []

    # x[emp_id][day_idx][shift_id] = BoolVar
    x: dict[str, dict[int, dict[str, cp_model.IntVar]]] = {}
    for emp_id in emp_ids:
        x[emp_id] = {}
        for d_idx, _ in enumerate(days):
            x[emp_id][d_idx] = {}
            for shift_id in shift_ids:
                x[emp_id][d_idx][shift_id] = model.new_bool_var(
                    f"x_{emp_id}_{d_idx}_{shift_id}"
                )

    # Per-employee max shifts per day (default: 1)
    global_max_vals = [
        int(c.params.get("max", 2))
        for c in active_constraints
        if c.type == ConstraintType.max_shifts_per_day and not c.params.get("employee_id")
    ]
    max_shifts_global = min(global_max_vals) if global_max_vals else 1
    max_shifts_by_emp: dict[str, int] = {}
    for c in active_constraints:
        if c.type == ConstraintType.max_shifts_per_day:
            eid = c.params.get("employee_id")
            if eid:
                val = int(c.params.get("max", 2))
                max_shifts_by_emp[eid] = min(max_shifts_by_emp.get(eid, val), val)

    for emp_id in emp_ids:
        limit = max_shifts_by_emp.get(emp_id, max_shifts_global)
        for d_idx in range(len(days)):
            if limit == 1:
                model.add_at_most_one(x[emp_id][d_idx][s_id] for s_id in shift_ids)
            else:
                model.add(sum(x[emp_id][d_idx][s_id] for s_id in shift_ids) <= limit)

    # Pre-compute public holiday dates (no employee_id = applies to all)
    # Used to skip hard coverage minimums that would conflict with holidays.
    public_holiday_dates: set[str] = set()
    for c in active_constraints:
        if c.type == ConstraintType.holiday and not c.params.get("employee_id"):
            public_holiday_dates.update(c.params.get("dates", []))

    for constraint in active_constraints:
        params = constraint.params
        ctype = constraint.type

        if ctype == ConstraintType.max_days_per_week:
            max_days = int(params.get("max", 5))
            mode = params.get("mode", "hard")
            weeks: dict[tuple, list[int]] = {}
            for d_idx, d in enumerate(days):
                key = (d.year, d.isocalendar()[1])
                weeks.setdefault(key, []).append(d_idx)
            for emp_id in emp_ids:
                for week_key, week_day_indices in weeks.items():
                    worked_sum = sum(
                        x[emp_id][d_idx][s_id]
                        for d_idx in week_day_indices
                        for s_id in shift_ids
                    )
                    if mode == "hard":
                        model.add(worked_sum <= max_days)
                    else:
                        violation = model.new_int_var(0, len(week_day_indices), f"maxd_viol_{emp_id}_{week_key[0]}_{week_key[1]}")
                        model.add(violation >= worked_sum - max_days)
                        objective_terms.append(-5 * violation)

        elif ctype == ConstraintType.max_hours_per_week:
            max_h = params.get("max", 35)
            max_minutes = int(max_h * 60)
            # Group days by ISO week
            weeks: dict[tuple, list[int]] = {}
            for d_idx, d in enumerate(days):
                key = (d.year, d.isocalendar()[1])
                weeks.setdefault(key, []).append(d_idx)
            for emp_id in emp_ids:
                for week_days in weeks.values():
                    worked_minutes = []
                    for d_idx in week_days:
                        for shift_id in shift_ids:
                            dur = round(shift_by_id[shift_id].duration_hours * 60)
                            worked_minutes.append(x[emp_id][d_idx][shift_id] * dur)
                    model.add(sum(worked_minutes) <= max_minutes)

        elif ctype == ConstraintType.max_hours_per_month:
            max_h = params.get("max", 140)
            max_minutes = int(max_h * 60)
            # Group days by calendar month
            months: dict[tuple, list[int]] = {}
            for d_idx, d in enumerate(days):
                key = (d.year, d.month)
                months.setdefault(key, []).append(d_idx)
            for emp_id in emp_ids:
                for month_days in months.values():
                    worked_minutes = []
                    for d_idx in month_days:
                        for shift_id in shift_ids:
                            dur = round(shift_by_id[shift_id].duration_hours * 60)
                            worked_minutes.append(x[emp_id][d_idx][shift_id] * dur)
                    model.add(sum(worked_minutes) <= max_minutes)

        elif ctype == ConstraintType.unavailability:
            emp_id = params.get("employee_id")
            unavail_days = [d.lower() for d in params.get("days", [])]
            if emp_id and emp_id in emp_ids:
                for d_idx, d in enumerate(days):
                    # Block all shifts on an unavailable day
                    if _day_name(d) in unavail_days:
                        for shift_id in shift_ids:
                            model.add(x[emp_id][d_idx][shift_id] == 0)

                    # Block overnight shifts from the previous day that extend into an unavailable day
                    if d_idx > 0 and _day_name(d) in unavail_days:
                        for s in shifts:
                            s_end_min = s.end_time.hour * 60 + s.end_time.minute
                            s_start_min = s.start_time.hour * 60 + s.start_time.minute
                            if s_end_min <= s_start_min:  # overnight shift
                                model.add(x[emp_id][d_idx - 1][s.id] == 0)

        elif ctype == ConstraintType.holiday:
            holiday_dates = set(params.get("dates", []))  # "YYYY-MM-DD" strings
            target_emp = params.get("employee_id")        # None = public holiday
            for d_idx, d in enumerate(days):
                blocked = [target_emp] if (target_emp and target_emp in emp_ids) else emp_ids

                # Block all shifts on the holiday date itself
                if d.isoformat() in holiday_dates:
                    for eid in blocked:
                        for shift_id in shift_ids:
                            model.add(x[eid][d_idx][shift_id] == 0)

                # Block overnight shifts from the previous day that extend into this holiday
                if d_idx > 0 and d.isoformat() in holiday_dates:
                    for eid in blocked:
                        for s in shifts:
                            s_end_min = s.end_time.hour * 60 + s.end_time.minute
                            s_start_min = s.start_time.hour * 60 + s.start_time.minute
                            if s_end_min <= s_start_min:  # overnight: ends next day
                                model.add(x[eid][d_idx - 1][s.id] == 0)

        elif ctype == ConstraintType.min_rest_between_shifts:
            min_rest_minutes = int(params.get("hours", 11) * 60)
            # Consecutive-day pairs
            for d_idx in range(len(days) - 1):
                for s1 in shifts:
                    # End of s1 relative to midnight of day d (overnight shifts extend past 24*60)
                    s1_end_min = s1.end_time.hour * 60 + s1.end_time.minute
                    s1_start_min = s1.start_time.hour * 60 + s1.start_time.minute
                    if s1_end_min <= s1_start_min:  # overnight shift
                        s1_end_min += 24 * 60
                    for s2 in shifts:
                        # Start of s2 is on day d+1, so relative to midnight of day d: +24*60
                        s2_start_min = 24 * 60 + s2.start_time.hour * 60 + s2.start_time.minute
                        rest = s2_start_min - s1_end_min
                        if rest < min_rest_minutes:
                            for emp_id in emp_ids:
                                model.add(
                                    x[emp_id][d_idx][s1.id] + x[emp_id][d_idx + 1][s2.id] <= 1
                                )
            # Same-day pairs (relevant when max_shifts_per_day > 1)
            # Pre-compute violating pairs once — shift times don't change per day
            same_day_violations: list[tuple[str, str]] = []
            for s1 in shifts:
                s1_start = s1.start_time.hour * 60 + s1.start_time.minute
                s1_end   = s1.end_time.hour   * 60 + s1.end_time.minute
                if s1_end <= s1_start:  # overnight — skip same-day pairing
                    continue
                for s2 in shifts:
                    if s2.id == s1.id:
                        continue
                    s2_start = s2.start_time.hour * 60 + s2.start_time.minute
                    s2_end   = s2.end_time.hour   * 60 + s2.end_time.minute
                    if s2_end <= s2_start:  # overnight — skip
                        continue
                    if s2_start <= s1_end:  # s2 overlaps or starts before s1 ends
                        continue
                    if s2_start - s1_end < min_rest_minutes:
                        same_day_violations.append((s1.id, s2.id))
            for d_idx in range(len(days)):
                for s1_id, s2_id in same_day_violations:
                    for emp_id in emp_ids:
                        model.add(x[emp_id][d_idx][s1_id] + x[emp_id][d_idx][s2_id] <= 1)

        elif ctype == ConstraintType.max_consecutive_days:
            max_consec = params.get("max", 5)
            mode = params.get("mode", "hard")
            if mode == "hard":
                for emp_id in emp_ids:
                    for start in range(len(days) - max_consec):
                        window = range(start, start + max_consec + 1)
                        worked = [
                            x[emp_id][d_idx][s_id]
                            for d_idx in window
                            for s_id in shift_ids
                        ]
                        model.add(sum(worked) <= max_consec)
            else:  # soft
                for emp_id in emp_ids:
                    for start in range(len(days) - max_consec):
                        window = range(start, start + max_consec + 1)
                        worked_sum = sum(
                            x[emp_id][d_idx][s_id]
                            for d_idx in window
                            for s_id in shift_ids
                        )
                        violation = model.new_int_var(0, 1, f"consec_viol_{emp_id}_{start}")
                        model.add(violation >= worked_sum - max_consec)
                        objective_terms.append(-5 * violation)

        elif ctype == ConstraintType.shift_preference:
            emp_id = params.get("employee_id")
            shift_id = params.get("shift_type_id")
            weight = params.get("weight", "preferred")
            mode = params.get("mode", "soft")
            if mode == "hard" and emp_id in emp_ids and shift_id in shift_ids:
                for d_idx in range(len(days)):
                    if weight == "avoid":
                        # Block the employee from this shift entirely
                        model.add(x[emp_id][d_idx][shift_id] == 0)
                    else:  # preferred → can only work this shift type
                        for s_id in shift_ids:
                            if s_id != shift_id:
                                model.add(x[emp_id][d_idx][s_id] == 0)

        elif ctype == ConstraintType.required_skill:
            shift_id = params.get("shift_type_id")
            required = params.get("skill")
            if shift_id and required and shift_id in shift_ids:
                required_lower = required.lower()
                for emp_id in emp_ids:
                    emp = emp_by_id[emp_id]
                    if required_lower not in [s.lower() for s in emp.skills]:
                        for d_idx in range(len(days)):
                            model.add(x[emp_id][d_idx][shift_id] == 0)

        elif ctype == ConstraintType.shift_coverage:
            shift_id = params.get("shift_type_id")
            min_emp = params.get("min")
            max_emp = params.get("max")
            mode = params.get("mode", "hard")
            if shift_id and shift_id in shift_ids:
                for d_idx, d in enumerate(days):
                    if d.isoformat() in public_holiday_dates:
                        continue
                    count = sum(x[emp_id][d_idx][shift_id] for emp_id in emp_ids)
                    if min_emp is not None:
                        min_emp = int(min_emp)
                        if mode == "hard":
                            model.add(count >= min_emp)
                        else:
                            viol = model.new_int_var(0, len(emp_ids), f"cov_min_viol_{shift_id}_{d_idx}")
                            model.add(viol >= min_emp - count)
                            objective_terms.append(-5 * viol)
                    if max_emp is not None:
                        max_emp = int(max_emp)
                        if mode == "hard":
                            model.add(count <= max_emp)
                        else:
                            viol = model.new_int_var(0, len(emp_ids), f"cov_max_viol_{shift_id}_{d_idx}")
                            model.add(viol >= count - max_emp)
                            objective_terms.append(-20 * viol)

        elif ctype == ConstraintType.min_employees_per_shift:
            shift_id = params.get("shift_type_id")
            min_emp = params.get("min", 1)
            if shift_id and shift_id in shift_ids:
                for d_idx, d in enumerate(days):
                    if d.isoformat() in public_holiday_dates:
                        continue
                    model.add(
                        sum(x[emp_id][d_idx][shift_id] for emp_id in emp_ids) >= min_emp
                    )

        elif ctype == ConstraintType.max_employees_per_shift:
            shift_id = params.get("shift_type_id")
            max_emp = int(params.get("max", 1))
            mode = params.get("mode", "hard")
            if shift_id and shift_id in shift_ids and mode == "hard":
                for d_idx in range(len(days)):
                    model.add(
                        sum(x[emp_id][d_idx][shift_id] for emp_id in emp_ids) <= max_emp
                    )

        elif ctype == ConstraintType.min_days_between_shifts:
            min_gap = int(params.get("days", 2))
            consecutive = int(params.get("consecutive", 1))
            mode = params.get("mode", "hard")
            # For each starting position d: if the employee works `consecutive` days in a row
            # starting at d, then the next `min_gap` days must be off.
            # Linear encoding: block_sum + rest_worked <= consecutive
            # (when block_sum < consecutive the constraint is trivially satisfied)
            for emp_id in emp_ids:
                for d_idx in range(len(days) - consecutive + 1):
                    block_sum = sum(
                        x[emp_id][b][s_id]
                        for b in range(d_idx, d_idx + consecutive)
                        for s_id in shift_ids
                    )
                    for gap in range(min_gap):
                        rest_idx = d_idx + consecutive + gap
                        if rest_idx >= len(days):
                            break
                        rest_worked = sum(x[emp_id][rest_idx][s_id] for s_id in shift_ids)
                        if mode == "hard":
                            model.add(block_sum + rest_worked <= consecutive)
                        else:
                            viol = model.new_bool_var(f"gap_viol_{emp_id}_{d_idx}_{gap}")
                            model.add(viol >= block_sum + rest_worked - consecutive)
                            objective_terms.append(-5 * viol)

        elif ctype == ConstraintType.day_pairing:
            target_days = [d.lower() for d in params.get("days", ["sat", "sun"])]
            mode = params.get("mode", "hard")
            # Group occurrences of each target day by ISO week
            week_map: dict[tuple, dict[str, list[int]]] = {}
            for d_idx, d in enumerate(days):
                key = (d.year, d.isocalendar()[1])
                week_map.setdefault(key, {dn: [] for dn in target_days})
                dn = _day_name(d)
                if dn in target_days:
                    week_map[key][dn].append(d_idx)
            for emp_id in emp_ids:
                for week_key, indices in week_map.items():
                    present = [indices[dn][0] for dn in target_days if indices[dn]]
                    if len(present) < 2:
                        continue  # fewer than 2 target days in this partial week — skip
                    # Chain equality: ref == day2, ref == day3, … enforces all-or-nothing
                    ref_idx = present[0]
                    ref_worked = sum(x[emp_id][ref_idx][s_id] for s_id in shift_ids)
                    for d_idx in present[1:]:
                        d_worked = sum(x[emp_id][d_idx][s_id] for s_id in shift_ids)
                        if mode == "hard":
                            model.add(ref_worked == d_worked)
                        else:
                            mismatch = model.new_bool_var(f"pair_mm_{emp_id}_{ref_idx}_{d_idx}")
                            model.add(mismatch >= ref_worked - d_worked)
                            model.add(mismatch >= d_worked - ref_worked)
                            objective_terms.append(-5 * mismatch)

        elif ctype == ConstraintType.max_shifts_per_day:
            pass  # handled in pre-processing above

        elif ctype == ConstraintType.weekend_fairness:
            max_weekends = params.get("max_weekends_per_month", 2)
            # Group weekend days by month
            months: dict[tuple, list[int]] = {}
            for d_idx, d in enumerate(days):
                if d.weekday() >= 5:  # Saturday=5, Sunday=6
                    key = (d.year, d.month)
                    months.setdefault(key, []).append(d_idx)
            for emp_id in emp_ids:
                for weekend_days in months.values():
                    worked = [
                        x[emp_id][d_idx][s_id]
                        for d_idx in weekend_days
                        for s_id in shift_ids
                    ]
                    model.add(sum(worked) <= max_weekends)

    # === OBJECTIVE SECTION ===

    # 1. Load balancing: maximize minimum shifts per employee (weight 10, always-on)
    # Exclude employees whose availability is too limited to represent a fair baseline:
    # - Fully blocked employees (0 available days) would force min_shifts_var to 0.
    # - Heavily-constrained employees (e.g. on leave for most of the period) drag the
    #   minimum down and cause well-available employees to be under-scheduled.
    # We include only those whose available days >= 50% of the mean available days
    # across all employees with at least 1 day free.
    def _blocked_days(emp_id: str) -> set[int]:
        blocked: set[int] = set()
        for c in active_constraints:
            p = c.params
            if c.type == ConstraintType.unavailability and p.get("employee_id") == emp_id:
                names = [d.lower() for d in p.get("days", [])]
                blocked.update(i for i, d in enumerate(days) if _day_name(d) in names)
            elif c.type == ConstraintType.holiday:
                target = p.get("employee_id")
                if target is None or target == emp_id:
                    dates = set(p.get("dates", []))
                    blocked.update(i for i, d in enumerate(days) if d.isoformat() in dates)
        return blocked

    available_days_map = {e: len(days) - len(_blocked_days(e)) for e in emp_ids}
    schedulable_ids = [e for e in emp_ids if available_days_map[e] > 0]
    if schedulable_ids:
        mean_avail = sum(available_days_map[e] for e in schedulable_ids) / len(schedulable_ids)
        balanceable_ids = [e for e in schedulable_ids if available_days_map[e] >= mean_avail * 0.5]
    else:
        balanceable_ids = []

    if len(balanceable_ids) >= 1:
        min_shifts_var = model.new_int_var(0, len(days) * len(shift_ids), "load_balance")
        for emp_id in balanceable_ids:
            emp_total = sum(
                x[emp_id][d_idx][s_id]
                for d_idx in range(len(days))
                for s_id in shift_ids
            )
            model.add(min_shifts_var <= emp_total)
        objective_terms.append(min_shifts_var * 10)

    # Secondary load balancing for limited-availability employees
    # (have some free days but were excluded from the main pool because their
    # available days < 50% of mean). Weight 8 < 10 keeps the main pool dominant
    # while still pushing limited employees to take shifts on their available days.
    limited_ids = [e for e in schedulable_ids if e not in set(balanceable_ids)]
    if limited_ids:
        max_limited = max(available_days_map[e] for e in limited_ids)
        min_limited_var = model.new_int_var(0, max_limited, "load_balance_limited")
        for emp_id in limited_ids:
            emp_total = sum(
                x[emp_id][d_idx][s_id]
                for d_idx in range(len(days))
                for s_id in shift_ids
            )
            model.add(min_limited_var <= emp_total)
        objective_terms.append(min_limited_var * 8)

    # 2. Soft constraints from user
    worked = None  # lazy-init: emp_id → d_idx → BoolVar (worked any shift that day)

    for constraint in active_constraints:
        params = constraint.params

        if constraint.type == ConstraintType.shift_preference:
            emp_id = params.get("employee_id")
            shift_id = params.get("shift_type_id")
            mode = params.get("mode", "soft")
            if mode == "soft" and emp_id in emp_ids and shift_id in shift_ids:
                weight = 2 if params.get("weight", "preferred") == "preferred" else -2
                for d_idx in range(len(days)):
                    objective_terms.append(weight * x[emp_id][d_idx][shift_id])

        elif constraint.type == ConstraintType.max_employees_per_shift:
            shift_id = params.get("shift_type_id")
            max_emp = int(params.get("max", 1))
            mode = params.get("mode", "hard")
            if shift_id and shift_id in shift_ids and mode == "soft":
                for d_idx in range(len(days)):
                    count = sum(x[emp_id][d_idx][shift_id] for emp_id in emp_ids)
                    violation = model.new_int_var(0, len(emp_ids), f"max_emp_viol_{shift_id}_{d_idx}")
                    model.add(violation >= count - max_emp)
                    objective_terms.append(-violation * 20)

        elif constraint.type == ConstraintType.min_consecutive_days:
            min_consec = int(params.get("min", 2))
            mode = params.get("mode", "soft")
            if mode == "hard":
                # If an employee starts a block on day d (works d, not d-1), they must
                # work the next min_consec-1 days too.
                # Linear form (no aux vars): worked[d+k] >= worked[d] - worked[d-1]
                for emp_id in emp_ids:
                    worked = [
                        sum(x[emp_id][d_idx][s_id] for s_id in shift_ids)
                        for d_idx in range(len(days))
                    ]
                    for d_idx in range(len(days)):
                        prev = worked[d_idx - 1] if d_idx > 0 else 0
                        for k in range(1, min_consec):
                            if d_idx + k < len(days):
                                model.add(worked[d_idx + k] >= worked[d_idx] - prev)
            else:  # soft
                for emp_id in emp_ids:
                    worked = [
                        sum(x[emp_id][d_idx][s_id] for s_id in shift_ids)
                        for d_idx in range(len(days))
                    ]
                    for d_idx in range(len(days)):
                        is_start = model.new_bool_var(f"minc_start_{emp_id}_{d_idx}")
                        if d_idx == 0:
                            model.add(is_start == worked[0])
                        else:
                            model.add(is_start <= worked[d_idx])
                            model.add(is_start <= 1 - worked[d_idx - 1])
                            model.add(is_start >= worked[d_idx] - worked[d_idx - 1])
                        for k in range(1, min_consec):
                            if d_idx + k < len(days):
                                viol = model.new_bool_var(f"minc_viol_{emp_id}_{d_idx}_{k}")
                                model.add(viol >= is_start - worked[d_idx + k])
                                objective_terms.append(-4 * viol)

        elif constraint.type == ConstraintType.no_shift_alternation:
            penalty = int(params.get("penalty", 3))
            for emp_id in emp_ids:
                for d_idx in range(len(days) - 1):
                    for s1 in shifts:
                        for s2 in shifts:
                            if s1.id == s2.id:
                                continue
                            # alt = 1 iff employee works s1 on day d AND s2 on day d+1
                            alt = model.new_bool_var(f"alt_{emp_id}_{d_idx}_{s1.id}_{s2.id}")
                            model.add(alt <= x[emp_id][d_idx][s1.id])
                            model.add(alt <= x[emp_id][d_idx + 1][s2.id])
                            model.add(alt >= x[emp_id][d_idx][s1.id] + x[emp_id][d_idx + 1][s2.id] - 1)
                            objective_terms.append(-penalty * alt)

        elif constraint.type == ConstraintType.preferred_consecutive_days:
            preferred_n = max(2, int(params.get("days", 3)))

            # Lazy-init worked[emp][d] = 1 iff employee works any shift on day d
            if worked is None:
                worked = {}
                for emp_id in emp_ids:
                    worked[emp_id] = {}
                    for d_idx in range(len(days)):
                        w = model.new_bool_var(f"worked_{emp_id}_{d_idx}")
                        model.add(w == sum(x[emp_id][d_idx][s_id] for s_id in shift_ids))
                        worked[emp_id][d_idx] = w

            # For each consecutive pair (d, d+1) both worked → +preferred_n to objective
            for emp_id in emp_ids:
                for d_idx in range(len(days) - 1):
                    consec = model.new_bool_var(f"consec_{emp_id}_{d_idx}")
                    model.add(consec <= worked[emp_id][d_idx])
                    model.add(consec <= worked[emp_id][d_idx + 1])
                    model.add(consec >= worked[emp_id][d_idx] + worked[emp_id][d_idx + 1] - 1)
                    objective_terms.append(consec * preferred_n)

    if objective_terms:
        model.maximize(sum(objective_terms))

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 30.0
    status = solver.solve(model)

    if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        assignments = []
        for emp_id in emp_ids:
            for d_idx, d in enumerate(days):
                for shift_id in shift_ids:
                    if solver.value(x[emp_id][d_idx][shift_id]):
                        assignments.append(
                            Assignment(employee_id=emp_id, date=d, shift_type_id=shift_id)
                        )
        return SolveResponse(
            status=SolveStatus.solved,
            score=solver.objective_value,
            assignments=assignments,
        )
    elif status == cp_model.INFEASIBLE:
        return SolveResponse(status=SolveStatus.infeasible, message="No feasible solution found.")
    else:
        return SolveResponse(status=SolveStatus.failed, message="Solver did not find a solution in time.")
