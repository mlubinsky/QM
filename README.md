# Schrödinger Solver

A browser-based quantum mechanics explorer. Run the backend and frontend locally, choose a mode from the dropdown, and explore.

![Stationary mode showing harmonic oscillator eigenfunctions and energy levels](docs/screenshot_stationary.png)

---

## Features

**Stationary mode** — solve for energy eigenstates:
- Seven built-in potentials: infinite square well, harmonic oscillator, double well, deep double well, finite square well, step potential, Gaussian barrier
- Adjustable parameters (barrier height, well separation, …) via sliders for each potential
- Custom potential via a safe math expression (e.g. `0.5*x**2 + 0.1*x**4`)
- Eigenfunctions plotted offset by energy (standard physics convention)
- Exact-solution comparison table for infinite square well and harmonic oscillator
- Physics reference modal (? button) for each potential: Hamiltonian, key formula, description

**Time-evolution mode** — evolve a wave packet under the chosen potential:
- Crank-Nicolson integrator — unconditionally stable, norm-conserving
- Animated |ψ(x,t)|² with play/pause/speed controls
- Two initial-state choices:
  - **Gaussian packet** — adjustable centre x₀, width σ, momentum k₀
  - **Superposition of eigenstates** — up to 20 eigenstates with real coefficients cₙ
- Expectation values ⟨x⟩, ⟨p⟩, ⟨x²⟩, ⟨p²⟩, ⟨H⟩ and uncertainties Δx, Δp at every frame
- Momentum-space density |φ(k,t)|² and probability current J(x,t) animated in sync
- Norm history plot showing ‖ψ(t)‖² − 1 (conservation diagnostic)

**Hydrogenic mode** — hydrogen-like ions (one electron, nuclear charge Z = 1–10):
- Solves the radial Schrödinger equation for u(r) = r·R_nl(r) with effective potential V_eff = −Z/r + l(l+1)/(2r²)
- Quantum numbers n = 1–5, l = 0…n−1, m = −l…l; nuclear charge Z up to Ne⁹⁺
- Radial density plot r²|R_nl(r)|² with ⟨r⟩ marker and exact analytic comparison
- 2-D electron density cross-section |ψ(x,0,z)|² in the xz-plane
- Grotrian diagram — all levels n=1–5, l=0–4; Lyman and Balmer transition arrows coloured by wavelength; click any level to jump to that orbital
- Energies in Hartree and eV alongside the exact value E_n = −Z²/(2n²) Eh
- Physics reference modal (? button)

**Spin ½ / Bloch Sphere** — spin-½ quantum mechanics:
- Interactive 3-D Bloch sphere (Three.js) with OrbitControls (mouse drag/zoom)
- State input via θ/φ sliders or Re(α)/Re(β)/Im(β) complex components
- Preset states: |↑⟩, |↓⟩, |±x⟩, |±y⟩
- Live expectation value readout ⟨σ_x⟩, ⟨σ_y⟩, ⟨σ_z⟩
- Larmor precession: choose B̂ direction (x/y/z/custom) and ω₀; play/pause animation at 30 fps; trajectory arc drawn on sphere
- Precession computed analytically client-side (Rodrigues' rotation formula — |r| = 1 exactly)
- Pauli matrix reference panel (collapsible): σ_x, σ_y, σ_z with eigenvalues and eigenvectors
- Stern-Gerlach simulator:
  - Measurement axis selector (x/y/z/custom θ_n, φ_n)
  - Live exact probability bar P(+½) = (1 + n̂·r)/2
  - **Measure once** — single Bernoulli draw; state collapses to the post-measurement eigenstate on the sphere
  - **Run N shots** — calls backend; shows histogram alongside exact probabilities
- Physics reference modal (? button): Bloch parameterisation, Pauli matrices, precession formula, measurement rule, collapse

**General:**
- All quantities in atomic units (ħ = mₑ = 1)
- Mode selection via grouped dropdown (1D Solvers / Atomic / Spin) — scales to future modes without cluttering the header
- URL state persistence for 1D and hydrogenic modes — share a configuration via URL
- Export results as CSV or JSON
- Interactive API docs at `/docs` (Swagger UI)

---

## Quick start

You need Python ≥ 3.10 and Node.js ≥ 18.

### 1. Clone

```bash
git clone https://github.com/mlubinsky/QM.git
cd QM
```

### 2. Start the backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

The backend allows `http://localhost:5173` by default. To allow additional
origins set the `CORS_ORIGINS` environment variable as a comma-separated list:

```bash
CORS_ORIGINS=http://localhost:5173,https://your-frontend.example.com uvicorn app:app --reload --port 8000
```

Verify:
```bash
curl http://localhost:8000/health
# → {"status":"ok","version":"0.1.0"}
```

### 3. Start the frontend

```bash
cd frontend
npm install
npm run dev
# → open http://localhost:5173
```

---

## Project structure

```
QM/
├── backend/
│   ├── app.py                        # FastAPI application, mounts all routers
│   ├── shared/
│   │   ├── grid.py                   # Uniform 1D grid
│   │   ├── potential_parser.py       # Safe expression evaluator (asteval)
│   │   └── units.py                  # Unit conversion constants
│   ├── solvers/
│   │   ├── schrodinger_1d/
│   │   │   ├── router.py             # /schrodinger1d endpoints
│   │   │   ├── hamiltonian.py        # Finite-difference Hamiltonian (sparse)
│   │   │   ├── eigenvalue_solver.py  # ARPACK eigensolver
│   │   │   ├── crank_nicolson.py     # Crank-Nicolson time stepper
│   │   │   ├── initial_states.py     # Gaussian packet + superposition
│   │   │   ├── expectation_values.py # ⟨x⟩, ⟨p⟩, ⟨H⟩, uncertainties
│   │   │   ├── momentum.py           # Momentum-space density |φ(k)|²
│   │   │   ├── probability_current.py# J(x,t)
│   │   │   └── presets.py            # Built-in potential expressions
│   │   ├── hydrogenic/
│   │   │   ├── router.py             # /hydrogenic endpoints
│   │   │   ├── radial_solver.py      # Radial eq. for u(r)=r·R_nl
│   │   │   └── orbitals.py           # 2-D xz cross-section
│   │   └── spin/
│   │       ├── router.py             # /spin endpoints
│   │       └── physics.py            # Bloch vector, measurement probabilities
│   └── tests/                        # pytest test suite
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── BlochSphere.tsx        # Three.js Bloch sphere canvas
│       │   ├── SpinPanel.tsx          # Spin mode top-level layout
│       │   ├── SpinStateComposer.tsx  # θ/φ sliders + presets
│       │   ├── PrecessionControls.tsx # B̂, ω₀, play/pause animation
│       │   ├── SternGerlachPanel.tsx  # Measurement simulator + histogram
│       │   ├── PauliMatrixDisplay.tsx # Collapsible matrix reference
│       │   ├── SpinInfoPanel.tsx      # Physics reference modal content
│       │   ├── HydrogenicPanel.tsx    # Radial + orbital density + Grotrian
│       │   ├── GrotriaDiagram.tsx     # SVG Grotrian diagram
│       │   └── ...                    # Other components
│       ├── api/client.ts              # Backend API client
│       ├── types/api.ts               # TypeScript interfaces
│       └── utils/
│           ├── spinMath.ts            # Client-side spin math (pure functions)
│           ├── urlState.ts            # URL serialisation / deserialisation
│           └── ...
├── specs/                             # Design specs (one per feature)
│   └── spin-future-scope.md           # Deferred spin features
├── CHANGELOG.md
├── DEPENDENCIES.md
└── TESTING.md
```

---

## Running the tests

### Backend (pytest)

```bash
cd backend
pip install -r requirements-dev.txt  # adds httpx and pytest on top of runtime deps
python -m pytest tests/ -v
```

| Test file | What it covers |
|---|---|
| `test_grid.py` | Grid spacing and shape |
| `test_hamiltonian.py` | Symmetry, sparsity, ISW ground-state energy |
| `test_eigenvalue_solver.py` | ISW and HO energies, normalization, orthogonality |
| `test_crank_nicolson.py` | Norm conservation, energy conservation, tunneling, coherent-state trajectory |
| `test_expectation_values.py` | ⟨x⟩, ⟨p⟩, ⟨H⟩; Heisenberg bound; Ehrenfest theorem |
| `test_momentum.py` | k-axis, |φ(k)|² normalization, peak location |
| `test_probability_current.py` | J sign, continuity equation, zero current for real ψ |
| `test_api.py` | All 1D HTTP endpoints |
| `test_hydrogenic_radial.py` | Radial solver: energy accuracy, normalization, Z-scaling |
| `test_hydrogenic_api.py` | `/hydrogenic/solve` status codes, labels, energies |
| `test_spin_api.py` | `GET /spin/pauli` matrix values; `POST /spin/measure` probabilities, shot counts, axis labels, validation |

### Frontend (Vitest)

```bash
cd frontend
npm test
```

| Test file | What it covers |
|---|---|
| `spinMath.test.ts` | `blochVector`, `rodriguezRotate`, `computeTrajectory`, `collapseState` — 25 tests |
| `spinClient.test.ts` | `spinMeasure` and `spinPauli` API client functions |
| `apiClient.test.ts` | Fetch wiring, error handling |
| `wiring.test.tsx` | App-level mode switching, URL state after solve |
| `matrixElements.test.ts` | Heisenberg-picture matrix elements |
| Other `*.test.tsx` | Component rendering and interaction |

---

## URL sharing

Every 1D and hydrogenic configuration is encoded in the URL so you can bookmark or share an exact setup. Spin mode state is not persisted in the URL (page refresh returns to |↑⟩).

**Click "Copy link"** in the plot area to copy the current URL to the clipboard.

### URL parameter reference

| Key | Type | Description | Default |
|-----|------|-------------|---------|
| `mode` | `stationary` \| `time-evolution` \| `hydrogenic` | solver mode | `stationary` |
| `potential` | string | preset key (e.g. `harmonic_oscillator`) | `infinite_square_well` |
| `expr` | string | custom potential expression | — |
| `xmin` | float | grid left edge (a.u.) | `-10` |
| `xmax` | float | grid right edge (a.u.) | `10` |
| `n` | int 50–2000 | number of grid points | `500` |
| `n_states` | int 1–20 | eigenstates to compute | `5` |
| `p_<name>` | float | potential slider value (e.g. `p_omega=2.0`) | slider default |
| `x0` | float | Gaussian packet centre (a.u.) | `0` |
| `sigma` | float | Gaussian width (a.u.) | `1` |
| `k0` | float | initial wavenumber (a.u.) | `0` |
| `dt` | float 1e-6–0.1 | time step (a.u.) | `0.001` |
| `n_steps` | int 10–10000 | number of time steps | `1000` |
| `save_every` | int | frame decimation | `10` |
| `hydro_Z` | int 1–10 | nuclear charge (hydrogenic mode) | `1` |
| `hydro_N` | int 1–5 | principal quantum number | `1` |
| `hydro_L` | int 0–n−1 | angular quantum number | `0` |
| `hydro_M` | int −l…l | magnetic quantum number | `0` |

---

## API overview

Full interactive docs at `http://localhost:8000/docs` (Swagger UI).

### `POST /schrodinger1d/solve/eigenstates`

Solve for the lowest `n_states` energy eigenstates.

```json
{ "grid": {"x_min": -8.0, "x_max": 8.0, "n_points": 500},
  "potential_preset": "harmonic_oscillator", "n_states": 5 }
```

### `POST /schrodinger1d/solve/evolve`

Evolve a wave packet (Crank-Nicolson). Supports `gaussian` and `superposition` initial states.

### `POST /hydrogenic/solve`

Solve a hydrogen-like orbital (Z, n, l, m). Returns radial density, 2-D orbital density, energies, and labels.

### `GET /spin/pauli`

Return the three Pauli matrices (real and imaginary parts separately), eigenvalues, and eigenvectors.

### `POST /spin/measure`

Measure a spin-½ state along an arbitrary axis.

```json
{ "theta": 1.5708, "phi": 0.0, "axis": [0, 0, 1], "n_shots": 1000 }
```

Returns exact probabilities P(+½), P(−½), and Binomial shot counts.
Validation: axis must be non-zero; 1 ≤ n_shots ≤ 100 000.

---

## How it works

### Atomic units

All internal quantities use **atomic units** (ħ = mₑ = e = 1):

| Quantity | Atomic unit | SI equivalent |
|---|---|---|
| Length | Bohr radius a₀ | 0.529 Å |
| Energy | Hartree Eₕ | 27.21 eV |
| Time | ħ/Eₕ | 24.19 attoseconds |
| Frequency | Eₕ/ħ | 41.34 PHz |

### Spatial discretisation (1D solver)

The 1-D domain [x_min, x_max] is divided into N uniform grid points. The kinetic energy operator is approximated by a 3-point central-difference stencil giving a sparse tridiagonal Hamiltonian. Dirichlet boundary conditions (ψ = 0 at walls) are enforced.

### Stationary states

Solved with **ARPACK** (`scipy.sparse.linalg.eigsh`, `which='SM'`). Wavefunctions are normalised so Σ|ψₙ|²·dx = 1.

### Time evolution

**Crank-Nicolson** implicit scheme — unconditionally stable, exactly unitary (norm-conserving to machine precision), O(N) per step.

### Spin-½ precession

Computed **analytically client-side** using Rodrigues' rotation formula. The Bloch vector rotates rigidly around B̂ at rate ω₀ — |r| = 1 is preserved exactly with no numerical integration.

### Measurement

Probabilities are computed from P(+n̂) = (1 + n̂·r)/2. Shot counts are drawn from a Binomial(N, P) distribution on the backend.

---

## Validation

**Infinite square well** (L = x_max − x_min):  Eₙ = n²π² / 2L²

**Harmonic oscillator** (ω = 1):  Eₙ = n + ½

**Norm conservation:** ‖ψ(t)‖² stays within 10⁻⁶ of 1.0 across all time steps.

**Hydrogenic energies:** numerical energy agrees with E_n = −Z²/(2n²) Hartree to within 0.1 % for n=1–4, l=0–3, Z=1–6.

**Spin:** |↑⟩ along z → P(+z) = 1.0; |+x⟩ along x → P(+x) = 1.0; |+x⟩ along z → P(+z) = 0.5; precession |r| = 1 at every frame. All verified by the test suite.

---

## Built-in potentials

| Name | Expression | Notes |
|---|---|---|
| `infinite_square_well` | `0` | Walls enforced by BCs |
| `harmonic_oscillator` | `0.5 * x**2` | ω = 1 |
| `double_well` | `λ(x²−a²)²` | Default λ=0.5, a=1 |
| `deep_double_well` | `λ(x²−a²)²` | Default λ=2, a=√2 |
| `finite_square_well` | `−10 if |x|<3 else 0` | Depth 10 a.u. |
| `step_potential` | `5 if x>0 else 0` | Step height 5 a.u. |
| `gaussian_barrier` | `5 exp(−x²/2)` | Height 5, width σ=1 |

Custom expressions may use `x`, standard math functions, and numpy ufuncs. `import` and attribute access are blocked (asteval).

---

## License

[MIT](LICENSE)

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
