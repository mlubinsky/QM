# Spec 18 — Solver Namespace Refactoring

## Goal

Reorganise `backend/` from a flat-file layout into a `shared/` + `solvers/` namespace so that adding new physics phases (hydrogen, spin, perturbation, …) requires only a new `solvers/<name>/` subdirectory and two lines in `app.py`.  The 1D Schrödinger solver is the first module moved; its public behaviour is unchanged.

## Motivation

The current flat layout has 11 Python files at `backend/` root.  Spec 19 (hydrogen atom) adds at least 3 more; spec 20 (spin) another 2.  Without a namespace, the root becomes unnavigable and import collisions become likely.

## Target layout

```
backend/
├── app.py                              ← mounts all solver routers
├── shared/
│   ├── __init__.py
│   ├── grid.py                         ← unchanged Grid class
│   ├── potential_parser.py             ← unchanged asteval wrapper
│   └── units.py                        ← atomic-unit constants (new)
├── solvers/
│   ├── __init__.py
│   └── schrodinger_1d/
│       ├── __init__.py
│       ├── hamiltonian.py
│       ├── eigenvalue_solver.py
│       ├── crank_nicolson.py
│       ├── expectation_values.py
│       ├── momentum.py
│       ├── probability_current.py
│       ├── initial_states.py
│       ├── presets.py
│       └── router.py                   ← APIRouter (new)
└── tests/
    ├── test_regression_refactor.py     ← regression suite (new)
    └── … (existing tests, imports updated)
```

## File disposition

| Old path | New path | Change |
|---|---|---|
| `backend/grid.py` | `backend/shared/grid.py` | move, no edits |
| `backend/potential_parser.py` | `backend/shared/potential_parser.py` | move, no edits |
| *(absent)* | `backend/shared/units.py` | new |
| `backend/hamiltonian.py` | `backend/solvers/schrodinger_1d/hamiltonian.py` | move, no edits |
| `backend/eigenvalue_solver.py` | `backend/solvers/schrodinger_1d/eigenvalue_solver.py` | move, no edits |
| `backend/expectation_values.py` | `backend/solvers/schrodinger_1d/expectation_values.py` | move, no edits |
| `backend/momentum.py` | `backend/solvers/schrodinger_1d/momentum.py` | move, no edits |
| `backend/probability_current.py` | `backend/solvers/schrodinger_1d/probability_current.py` | move, no edits |
| `backend/initial_states.py` | `backend/solvers/schrodinger_1d/initial_states.py` | move, no edits |
| `backend/presets.py` | `backend/solvers/schrodinger_1d/presets.py` | move, no edits |
| `backend/crank_nicolson.py` | `backend/solvers/schrodinger_1d/crank_nicolson.py` | move, update 3 internal imports → relative |
| `backend/app.py` (endpoints) | `backend/solvers/schrodinger_1d/router.py` | extract into APIRouter |
| `backend/app.py` | `backend/app.py` | rewrite: CORS + health + mount router |

## Import changes

### `crank_nicolson.py` — only file with internal cross-module imports

Before:
```python
from expectation_values import compute as compute_ev
import momentum as _momentum
import probability_current as _current
```

After (relative imports within the package):
```python
from .expectation_values import compute as compute_ev
from . import momentum as _momentum
from . import probability_current as _current
```

### `solvers/schrodinger_1d/router.py` — uses both namespaces

```python
from shared.grid import Grid
from shared.potential_parser import parse_potential
from solvers.schrodinger_1d.hamiltonian import build_hamiltonian
from solvers.schrodinger_1d.eigenvalue_solver import solve_eigenstates
from solvers.schrodinger_1d.crank_nicolson import evolve
from solvers.schrodinger_1d.initial_states import gaussian_packet, eigenstate_superposition
from solvers.schrodinger_1d.presets import PRESETS
```

### `app.py` — pure orchestration

```python
from solvers.schrodinger_1d.router import router as schrodinger_router
app.include_router(schrodinger_router, prefix="/schrodinger1d")
```

## URL changes

| Old URL | New URL |
|---|---|
| `GET /health` | `GET /health` (unchanged) |
| `GET /presets` | `GET /schrodinger1d/presets` |
| `POST /solve/eigenstates` | `POST /schrodinger1d/solve/eigenstates` |
| `POST /solve/evolve` | `POST /schrodinger1d/solve/evolve` |

The old URLs return 404 after the refactor — there are no redirects.

## Frontend changes

`frontend/src/api/client.ts`: three URL string changes.

| Function | Old fetch path | New fetch path |
|---|---|---|
| `fetchPresets` | `/presets` | `/schrodinger1d/presets` |
| `solveEigenstates` | `/solve/eigenstates` | `/schrodinger1d/solve/eigenstates` |
| `solveEvolve` | `/solve/evolve` | `/schrodinger1d/solve/evolve` |

## pyproject.toml

No changes needed.  `pythonpath = ["backend"]` keeps working because `backend/` is still the Python root and `shared/` / `solvers/` are importable packages from there.

## Test changes

All existing test files in `backend/tests/` have their flat imports updated to the new namespaced paths:

| Old import | New import |
|---|---|
| `from grid import Grid` | `from shared.grid import Grid` |
| `from potential_parser import parse_potential` | `from shared.potential_parser import parse_potential` |
| `from hamiltonian import build_hamiltonian` | `from solvers.schrodinger_1d.hamiltonian import build_hamiltonian` |
| `from eigenvalue_solver import solve_eigenstates` | `from solvers.schrodinger_1d.eigenvalue_solver import solve_eigenstates` |
| `from crank_nicolson import evolve` | `from solvers.schrodinger_1d.crank_nicolson import evolve` |
| `from expectation_values import compute, ExpectationValues` | `from solvers.schrodinger_1d.expectation_values import compute, ExpectationValues` |
| `import momentum` | `from solvers.schrodinger_1d import momentum` |
| `import probability_current` | `from solvers.schrodinger_1d import probability_current` |
| `from initial_states import gaussian_packet, eigenstate_superposition` | `from solvers.schrodinger_1d.initial_states import gaussian_packet, eigenstate_superposition` |

API test files also update endpoint URLs from `/presets`, `/solve/eigenstates`, `/solve/evolve` to their `/schrodinger1d/` prefixed equivalents.

Test files are kept flat in `backend/tests/` for now; subdivision into `tests/schrodinger_1d/` is deferred to a later spec.

## Done criteria

- [ ] `python -m pytest backend/tests/ -v` passes with zero failures
- [ ] `GET /health` → 200
- [ ] `GET /schrodinger1d/presets` → 200 with all 7 preset names
- [ ] `GET /presets` → 404 (old URL gone)
- [ ] `POST /solve/eigenstates` → 404 (old URL gone)
- [ ] ISW energies: |E_n_num − n²π²/2L²| / E_exact < 0.5 %
- [ ] HO energies: |E_n_num − (n+½)| / E_exact < 0.5 %
- [ ] Norm conservation: |‖ψ(t)‖² − 1| < 1e-4 throughout evolution
- [ ] Frontend dev server loads without errors (client.ts URLs updated)

## Adding a new solver (post-refactor recipe)

```
backend/solvers/hydrogen/
├── __init__.py
├── wavefunctions.py
├── energy_levels.py
└── router.py
```

`app.py`:
```python
from solvers.hydrogen.router import router as hydrogen_router
app.include_router(hydrogen_router, prefix="/hydrogen")
```

That's the entire integration cost.
