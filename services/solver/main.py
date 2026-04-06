from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from models import SolveRequest, SolveResponse
from solver import solve

app = FastAPI(title="Khedra Solver", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/solve", response_model=SolveResponse)
def solve_planning(request: SolveRequest) -> SolveResponse:
    return solve(request)
