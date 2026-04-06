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
    return d.strftime("%A").lower()


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

    # Hard constraint: at most one shift per employee per day
    for emp_id in emp_ids:
        for d_idx in range(len(days)):
            model.add_at_most_one(x[emp_id][d_idx][s_id] for s_id in shift_ids)

    for constraint in active_constraints:
        params = constraint.params
        ctype = constraint.type

        if ctype == ConstraintType.max_hours_per_week:
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
                            dur = int(shift_by_id[shift_id].duration_hours * 60)
                            worked_minutes.append(x[emp_id][d_idx][shift_id] * dur)
                    model.add(sum(worked_minutes) <= max_minutes)

        elif ctype == ConstraintType.unavailability:
            emp_id = params.get("employee_id")
            unavail_days = [d.lower() for d in params.get("days", [])]
            if emp_id and emp_id in emp_ids:
                for d_idx, d in enumerate(days):
                    if _day_name(d) in unavail_days:
                        for shift_id in shift_ids:
                            model.add(x[emp_id][d_idx][shift_id] == 0)

        elif ctype == ConstraintType.max_consecutive_days:
            max_consec = params.get("max", 5)
            for emp_id in emp_ids:
                for start in range(len(days) - max_consec):
                    window = range(start, start + max_consec + 1)
                    worked = [
                        x[emp_id][d_idx][s_id]
                        for d_idx in window
                        for s_id in shift_ids
                    ]
                    model.add(sum(worked) <= max_consec)

        elif ctype == ConstraintType.required_skill:
            shift_id = params.get("shift_type_id")
            required = params.get("skill")
            if shift_id and required and shift_id in shift_ids:
                for emp_id in emp_ids:
                    emp = emp_by_id[emp_id]
                    if required not in emp.skills:
                        for d_idx in range(len(days)):
                            model.add(x[emp_id][d_idx][shift_id] == 0)

        elif ctype == ConstraintType.min_employees_per_shift:
            shift_id = params.get("shift_type_id")
            min_emp = params.get("min", 1)
            if shift_id and shift_id in shift_ids:
                for d_idx in range(len(days)):
                    model.add(
                        sum(x[emp_id][d_idx][shift_id] for emp_id in emp_ids) >= min_emp
                    )

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

    # Soft constraint: shift_preference (objective)
    preference_terms = []
    for constraint in active_constraints:
        if constraint.type == ConstraintType.shift_preference:
            params = constraint.params
            emp_id = params.get("employee_id")
            shift_id = params.get("shift_type_id")
            weight_str = params.get("weight", "preferred")
            weight = 2 if weight_str == "preferred" else -2
            if emp_id in emp_ids and shift_id in shift_ids:
                for d_idx in range(len(days)):
                    preference_terms.append(weight * x[emp_id][d_idx][shift_id])

    if preference_terms:
        model.maximize(sum(preference_terms))

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
