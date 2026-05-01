"""FastAPI router for the spin-½ module.

Endpoints:
  GET  /spin/pauli    — static Pauli matrix reference data
  POST /spin/measure  — measurement probabilities + shot histogram

Mounted at /spin in app.py.
All quantities in atomic units (ħ = m_e = 1).
"""

import numpy as np
from fastapi import APIRouter
from pydantic import BaseModel, field_validator, model_validator

from .physics import bloch_vector, measure_probabilities, axis_label, PAULI_DATA

router = APIRouter()


# ── Pydantic models ───────────────────────────────────────────────────────────

class SpinMeasureRequest(BaseModel):
    theta: float
    phi: float
    axis: list[float]
    n_shots: int = 1000

    @field_validator("n_shots")
    @classmethod
    def _shots_range(cls, v: int) -> int:
        if not (1 <= v <= 100_000):
            raise ValueError("n_shots must be between 1 and 100000")
        return v

    @model_validator(mode="after")
    def _check_axis(self) -> "SpinMeasureRequest":
        if len(self.axis) != 3:
            raise ValueError("axis must have exactly 3 components")
        norm = float(np.linalg.norm(self.axis))
        if norm < 1e-12:
            raise ValueError("axis must be a non-zero vector")
        return self


class SpinMeasureResponse(BaseModel):
    p_plus: float
    p_minus: float
    shots_plus: int
    shots_minus: int
    axis_label: str


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/pauli")
def get_pauli() -> dict:
    """Return the three Pauli matrices with eigenvalues and eigenvectors."""
    return PAULI_DATA


@router.post("/measure", response_model=SpinMeasureResponse)
def spin_measure(req: SpinMeasureRequest) -> SpinMeasureResponse:
    """Compute measurement probabilities for state (θ,φ) along axis n̂.

    Draws n_shots Bernoulli samples and returns the exact probabilities
    alongside the simulated shot counts.
    """
    raw_axis = np.array(req.axis, dtype=float)
    unit_axis = raw_axis / np.linalg.norm(raw_axis)

    p_plus, p_minus = measure_probabilities(req.theta, req.phi, unit_axis)

    rng = np.random.default_rng()
    shots_plus = int(rng.binomial(req.n_shots, p_plus))
    shots_minus = req.n_shots - shots_plus

    return SpinMeasureResponse(
        p_plus=p_plus,
        p_minus=p_minus,
        shots_plus=shots_plus,
        shots_minus=shots_minus,
        axis_label=axis_label(unit_axis),
    )
