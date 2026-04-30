"""FastAPI router for the hydrogenic solver.

Single endpoint:  POST /hydrogenic/solve

Mounted at /hydrogenic in app.py.
"""

from fastapi import APIRouter
from pydantic import BaseModel, field_validator, model_validator

from shared.units import HARTREE_TO_EV
from .radial_solver import solve as radial_solve
from .orbitals import xz_cross_section

router = APIRouter()

# ── Ion metadata ──────────────────────────────────────────────────────────────

_ION_NAMES: dict[int, tuple[str, str]] = {
    1:  ("H",    "hydrogen"),
    2:  ("He⁺",  "helium"),
    3:  ("Li²⁺", "lithium"),
    4:  ("Be³⁺", "beryllium"),
    5:  ("B⁴⁺",  "boron"),
    6:  ("C⁵⁺",  "carbon"),
    7:  ("N⁶⁺",  "nitrogen"),
    8:  ("O⁷⁺",  "oxygen"),
    9:  ("F⁸⁺",  "fluorine"),
    10: ("Ne⁹⁺", "neon"),
}

_L_LABELS = ["s", "p", "d", "f", "g"]


# ── Pydantic models ───────────────────────────────────────────────────────────

class HydrogenicRequest(BaseModel):
    Z: int = 1
    n: int = 1
    l: int = 0
    m: int = 0
    n_points: int = 800
    grid_2d_points: int = 120

    @field_validator("Z")
    @classmethod
    def _z_range(cls, v: int) -> int:
        if not (1 <= v <= 10):
            raise ValueError("Z must be between 1 and 10")
        return v

    @field_validator("n")
    @classmethod
    def _n_range(cls, v: int) -> int:
        if not (1 <= v <= 5):
            raise ValueError("n must be between 1 and 5")
        return v

    @model_validator(mode="after")
    def _check_quantum_numbers(self) -> "HydrogenicRequest":
        if self.l >= self.n:
            raise ValueError(f"l must be < n (got l={self.l}, n={self.n})")
        if abs(self.m) > self.l:
            raise ValueError(f"|m| must be ≤ l (got m={self.m}, l={self.l})")
        return self


class HydrogenicResponse(BaseModel):
    r: list[float]
    radial_density: list[float]
    energy_hartree: float
    energy_exact_hartree: float
    energy_ev: float
    x_axis: list[float]
    z_axis: list[float]
    orbital_density: list[list[float]]
    ion_symbol: str
    ion_name: str
    orbital_label: str


# ── Endpoint ──────────────────────────────────────────────────────────────────

@router.post("/solve", response_model=HydrogenicResponse)
def solve_hydrogenic(req: HydrogenicRequest) -> HydrogenicResponse:
    """Solve the radial Schrödinger equation for a hydrogen-like atom.

    Returns radial probability density, 2-D orbital cross-section,
    and energy in both Hartree and eV.
    """
    # Number of radial eigenstates needed to reach principal number n
    # (for angular momentum l, state n has radial index n-l-1).
    n_states = req.n - req.l
    radial = radial_solve(req.Z, req.l, n_states=n_states, n_points=req.n_points)

    # Index of the (n, l) state within the sorted eigenspectrum for this l
    state_idx = req.n - req.l - 1
    u = radial.u_frames[state_idx]
    density_1d = radial.radial_density[state_idx]
    energy = float(radial.energies[state_idx])

    # 2-D cross-section
    orbital = xz_cross_section(radial.r, u, req.l, req.m, req.grid_2d_points)

    # Exact analytical energy
    energy_exact = -(req.Z ** 2) / (2 * req.n ** 2)

    # Labels
    ion_symbol, ion_name = _ION_NAMES[req.Z]
    l_label = _L_LABELS[req.l] if req.l < len(_L_LABELS) else str(req.l)
    orbital_label = f"{req.n}{l_label}"

    return HydrogenicResponse(
        r=radial.r.tolist(),
        radial_density=density_1d.tolist(),
        energy_hartree=energy,
        energy_exact_hartree=float(energy_exact),
        energy_ev=float(energy * HARTREE_TO_EV),
        x_axis=orbital.x_axis.tolist(),
        z_axis=orbital.z_axis.tolist(),
        orbital_density=orbital.density.tolist(),
        ion_symbol=ion_symbol,
        ion_name=ion_name,
        orbital_label=orbital_label,
    )
