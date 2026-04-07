import os

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from models import SolveRequest, SolveResponse
from solver import solve

app = FastAPI(title="Khedra Solver", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["POST"],
    allow_headers=["content-type", "x-internal-token"],
)


def verify_internal_token(x_internal_token: str = Header(...)):
    secret = os.environ.get("INTERNAL_API_SECRET", "")
    if not secret or x_internal_token != secret:
        raise HTTPException(status_code=401, detail="Unauthorized")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/solve", response_model=SolveResponse, dependencies=[Depends(verify_internal_token)])
def solve_planning(request: SolveRequest) -> SolveResponse:
    return solve(request)
