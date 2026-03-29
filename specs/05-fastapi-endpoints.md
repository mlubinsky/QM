# FastAPI Backend Endpoints

## Goal
Expose the solver core (eigenstates + time evolution) as a REST API
with typed request/response contracts and automatic docs.

## Setup
- FastAPI + uvicorn
- Pydantic v2 for all request/response models
- No eval() or exec() anywhere — use asteval for custom potential expressions
- CORS enabled for localhost:5173 (Vite dev server)

## Expression parser (potential_parser.py)
Custom potentials are entered as math strings by the user.
Use asteval.Interpreter with a restricted namespace:
```python
from asteval import Interpreter

ALLOWED_SYMBOLS = {
    'x': None,   # will be replaced with grid array
    'np': np,
    'sin': np.sin, 'cos': np.cos, 'exp': np.exp,
    'abs': np.abs, 'sqrt': np.sqrt, 'pi': np.pi,
    'inf': np.inf,
}

def parse_potential(expression: str, x: np.ndarray) -> np.ndarray:
    """Evaluate a potential expression string over grid x.
    Returns np.ndarray of shape (len(x),).
    Raises ValueError on invalid expression or unsafe content.
    """
```

## Preset potentials (presets.py)
Implement these and expose them via the API:
```python
PRESETS = {
    "infinite_square_well": "0",          # walls handled by Dirichlet BC
    "harmonic_oscillator":  "0.5 * x**2",
    "double_well":          "0.5 * (x**2 - 1)**2",
    "finite_square_well":   "-10 * (abs(x) < 1).astype(float)",
    "step_potential":       "10 * (x > 0).astype(float)",
    "gaussian_barrier":     "5 * exp(-x**2 / 0.5)",
}
```

## Request / Response models
```python
class GridConfig(BaseModel):
    x_min: float = -10.0
    x_max: float = 10.0
    n_points: int = Field(500, ge=50, le=2000)

class EigensolveRequest(BaseModel):
    grid: GridConfig
    potential_preset: str | None = "infinite_square_well"
    potential_expr: str | None = None   # overrides preset if provided
    n_states: int = Field(5, ge=1, le=20)

class EigensolveResponse(BaseModel):
    energies: list[float]
    wavefunctions: list[list[float]]    # real part only (already real)
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

class EvolveResponse(BaseModel):
    psi_frames: list[list[float]]       # |ψ(x,t)|², shape (n_frames, n_points)
    times: list[float]
    norm_history: list[float]
    grid_x: list[float]
    potential: list[float]
```

## Endpoints
```
GET  /health
     → {"status": "ok", "version": "0.1.0"}

GET  /presets
     → {"presets": ["infinite_square_well", "harmonic_oscillator", ...]}

POST /solve/eigenstates
     body: EigensolveRequest
     → EigensolveResponse

POST /solve/evolve
     body: EvolveRequest
     → EvolveResponse
```

## Validation rules (raise HTTP 422 with clear message)
- x_min < x_max
- potential_expr and potential_preset cannot both be null
- If potential_expr provided, validate it parses without error before solving
- n_steps * dt <= 100.0 (prevent runaway long computations in MVP)

## Error handling
- Solver convergence failure → HTTP 500 with {"detail": "Eigensolver did not converge. Try increasing n_points or adjusting the potential."}
- Invalid potential expression → HTTP 422 with the parse error message
- All other exceptions → HTTP 500 with generic message, log full traceback

## Tests required
- pytest with httpx AsyncClient (use FastAPI test client)
- POST /solve/eigenstates with harmonic_oscillator returns 5 energies,
  first within 1% of 0.5
- POST /solve/eigenstates with invalid potential_expr returns 422
- POST /solve/evolve returns norm_history all within 1e-4 of 1.0
- GET /presets returns all 6 preset names
- n_steps=10000, dt=0.1 returns 422 (exceeds limit)

## Do not implement
- Authentication
- Database persistence
- SSE streaming (future milestone)
- Any frontend serving

