from datetime import date, time
from enum import Enum
from typing import Any
from pydantic import BaseModel


class ConstraintType(str, Enum):
    max_hours_per_week = "max_hours_per_week"
    unavailability = "unavailability"
    min_rest_between_shifts = "min_rest_between_shifts"
    max_consecutive_days = "max_consecutive_days"
    required_skill = "required_skill"
    weekend_fairness = "weekend_fairness"
    shift_preference = "shift_preference"
    min_employees_per_shift = "min_employees_per_shift"


class Employee(BaseModel):
    id: str
    name: str
    skills: list[str] = []


class ShiftType(BaseModel):
    id: str
    name: str
    start_time: time
    end_time: time
    duration_hours: float


class Constraint(BaseModel):
    type: ConstraintType
    params: dict[str, Any]
    scope: str = "all"
    enabled: bool = True


class SolveRequest(BaseModel):
    start_date: date
    end_date: date
    employees: list[Employee]
    shift_types: list[ShiftType]
    constraints: list[Constraint]


class SolveStatus(str, Enum):
    solved = "solved"
    infeasible = "infeasible"
    failed = "failed"


class Assignment(BaseModel):
    employee_id: str
    date: date
    shift_type_id: str


class SolveResponse(BaseModel):
    status: SolveStatus
    score: float | None = None
    assignments: list[Assignment] = []
    message: str | None = None
