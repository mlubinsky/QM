"""FastAPI application exposing the Schrödinger solver core.

All solver quantities in atomic units: ħ = m_e = 1.
"""

import logging
import os
import traceback
from typing import Literal

import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, model_validator

from grid import Grid
from hamiltonian import build_hamiltonian
from eigenvalue_solver import solve_eigenstates
from crank_nicolson import evolve
from initial_states import gaussian_packet
from potential_parser import parse_potential
from presets import PRESETS

logger = logging.getLogger(__name__)

app = FastAPI(title="Schrödinger Solver", version="0.1.0")

_cors_origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Pydantic models ──────────────────────────────────────────────────────────

class GridConfig(BaseModel):
    x_min: float = -10.0
    x_max: float = 10.0
    n_points: int = Field(500, ge=50, le=2000)

    @model_validator(mode="after")
    def check_x_range(self):
        if self.x_min >= self.x_max:
            raise ValueError("x_min must be strictly less than x_max")
        return self


class EigensolveRequest(BaseModel):
    grid: GridConfig
    potential_preset: str | None = "infinite_square_well"
    potential_expr: str | None = None
    n_states: int = Field(5, ge=1, le=20)

    @model_validator(mode="after")
    def check_potential_source(self):
        if self.potential_expr is None and self.potential_preset is None:
            raise ValueError("One of potential_expr or potential_preset must be provided")
        return self


class EigensolveResponse(BaseModel):
    energies: list[float]
    wavefunctions: list[list[float]]
    grid_x: list[float]
    dx: float
    potential: list[float]
    converged: bool
    norm_errors: list[float]


class EvolveRequest(BaseModel):
    grid: GridConfig
    potential_preset: str | None = "infinite_square_well"
    potential_expr: str | None = None
    initial_state: Literal["gaussian"] = "gaussian"
    gaussian_x0: float = 0.0
    gaussian_sigma: float = 1.0
    gaussian_k0: float = 0.0
    dt: float = Field(0.001, gt=0, le=0.1)
    n_steps: int = Field(1000, ge=10, le=10000)
    save_every: int = Field(10, ge=1, le=100)

    @model_validator(mode="after")
    def check_potential_source(self):
        if self.potential_expr is None and self.potential_preset is None:
            raise ValueError("One of potential_expr or potential_preset must be provided")
        return self

    @model_validator(mode="after")
    def check_runaway(self):
        if self.n_steps * self.dt > 100.0:
            raise ValueError(
                f"n_steps * dt = {self.n_steps * self.dt:.1f} exceeds limit of 100.0"
            )
        return self


class EvolveResponse(BaseModel):
    psi_frames: list[list[float]]
    times: list[float]
    norm_history: list[float]
    grid_x: list[float]
    potential: list[float]
    expect_x: list[float]
    expect_p: list[float]
    expect_x2: list[float]
    expect_p2: list[float]
    expect_H: list[float]
    momentum_frames: list[list[float]]
    momentum_k: list[float]
    current_frames: list[list[float]]
    delta_x: list[float]
    delta_p: list[float]
    delta_x_delta_p: list[float]


# ── helpers ──────────────────────────────────────────────────────────────────

def _resolve_potential(expr: str | None, preset: str | None, x: np.ndarray) -> np.ndarray:
    """Return V(x) from an expression string or a named preset."""
    source = expr if expr is not None else PRESETS.get(preset or "", None)
    if source is None:
        raise HTTPException(status_code=422, detail=f"Unknown preset: '{preset}'")
    try:
        return parse_potential(source, x)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


# ── endpoints ────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "version": "0.1.0"}


@app.get("/presets")
def presets():
    return {"presets": list(PRESETS.keys())}


@app.post("/solve/eigenstates", response_model=EigensolveResponse)
def solve_eigenstates_endpoint(req: EigensolveRequest):
    try:
        g = Grid(req.grid.n_points, req.grid.x_min, req.grid.x_max)
        V = _resolve_potential(req.potential_expr, req.potential_preset, g.x)
        H = build_hamiltonian(g, V)
        result = solve_eigenstates(H, g.x, g.dx, k=req.n_states)
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Eigensolve failed:\n%s", traceback.format_exc())
        raise HTTPException(status_code=500, detail="Internal solver error.") from exc

    if not result.converged:
        raise HTTPException(
            status_code=500,
            detail="Eigensolver did not converge. Try increasing n_points or adjusting the potential.",
        )

    return EigensolveResponse(
        energies=result.energies.tolist(),
        wavefunctions=[wf.tolist() for wf in result.wavefunctions],
        grid_x=result.grid_x.tolist(),
        dx=result.dx,
        potential=V.tolist(),
        converged=result.converged,
        norm_errors=result.norm_errors.tolist(),
    )


@app.post("/solve/evolve", response_model=EvolveResponse)
def evolve_endpoint(req: EvolveRequest):
    try:
        g = Grid(req.grid.n_points, req.grid.x_min, req.grid.x_max)
        V = _resolve_potential(req.potential_expr, req.potential_preset, g.x)
        H = build_hamiltonian(g, V)
        psi0 = gaussian_packet(g.x, g.dx, x0=req.gaussian_x0,
                               sigma=req.gaussian_sigma, k0=req.gaussian_k0)
        result = evolve(H, psi0, g.x, g.dx,
                        dt=req.dt, n_steps=req.n_steps,
                        potential=V, save_every=req.save_every)
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Time evolution failed:\n%s", traceback.format_exc())
        raise HTTPException(status_code=500, detail="Internal solver error.") from exc

    prob_frames = (np.abs(result.psi_frames) ** 2).tolist()

    return EvolveResponse(
        psi_frames=prob_frames,
        times=result.times.tolist(),
        norm_history=result.norm_history.tolist(),
        grid_x=result.grid_x.tolist(),
        potential=V.tolist(),
        expect_x=result.expect_x.tolist(),
        expect_p=result.expect_p.tolist(),
        expect_x2=result.expect_x2.tolist(),
        expect_p2=result.expect_p2.tolist(),
        expect_H=result.expect_H.tolist(),
        momentum_frames=result.momentum_frames.tolist(),
        momentum_k=result.momentum_k.tolist(),
        current_frames=result.current_frames.tolist(),
        delta_x=result.delta_x.tolist(),
        delta_p=result.delta_p.tolist(),
        delta_x_delta_p=result.delta_x_delta_p.tolist(),
    )
