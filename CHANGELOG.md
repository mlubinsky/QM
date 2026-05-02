# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added (2026-05-01) — Spherical harmonic polar diagram

**Backend** (`backend/solvers/hydrogenic/orbitals.py`, `router.py`)
- New `spherical_harmonic_polar(l, m)` function computes the closed `(x, z)` Cartesian curve of `|Y_lm(θ)|²`, normalised to max = 1, using the existing `scipy.special.sph_harm` call.
- `HydrogenicResponse` gains `sph_harm_x` and `sph_harm_z` fields.
- 4 new backend tests: field presence, curve closure, s-orbital is a perfect circle, normalisation holds for all tested (l, m) pairs.

**Frontend** (`frontend/src/components/HydrogenicPanel.tsx`, `SphericalHarmonicInfoPanel.tsx`)
- Orbital density heatmap and the new `|Y_lm(θ)|²` polar plot are displayed side-by-side, making the wavefunction factorisation ψ = R·Y visually explicit.
- Polar plot is a filled Plotly scatter on equal-aspect Cartesian axes; z is the quantisation axis.
- New `SphericalHarmonicInfoPanel` modal explains φ-independence of `|Y_lm|²`, angular nodes, and normalisation.

---

### Added (2026-04-28) — Spin-½ / Bloch Sphere / Stern-Gerlach module (spec 20)

**Backend** (`backend/solvers/spin/`, `app.py`)
- New `spin` router mounted at `/spin` with two endpoints:
  - `GET /spin/pauli` — returns the three Pauli matrices (real and imaginary parts), their eigenvalues, and eigenvectors.
  - `POST /spin/measure` — given a spin state `(θ, φ)` and measurement axis, returns exact Born-rule probabilities, axis label, and shot-count histogram for N shots (max 10 000). Zero axis vector and N = 0 both return 422.
- 24 backend tests covering Pauli matrix values, eigenvalues, eigenvectors, Born-rule certainty cases (spin-up along z, spin-down along z, ±x along x, ±y along y), 50/50 case, axis normalisation, and all 422 validation paths.

**Frontend** (`frontend/src/components/SpinPanel.tsx`, `SternGerlachPanel.tsx`, `BlochSphere.tsx`, `SpinInfoPanel.tsx`, `spinMath.ts`)
- `SpinPanel` — top-level spin mode panel hosting the Bloch sphere, state controls, SG device, and Pauli matrix table.
- `BlochSphere` — interactive 3-D Bloch sphere rendered with Three.js / react-three-fiber; spin state vector updates in real time as `(θ, φ)` sliders move.
- `SternGerlachPanel` — choose measurement axis (x / y / z / custom), see exact Born-rule probability bar, click "Measure once" to sample an outcome and collapse the Bloch sphere state, or run N shots and view the histogram.
- `SpinInfoPanel` — help modal covering Bloch sphere geometry, Born rule, state collapse, and the Pauli matrix table.
- `spinMath.ts` — pure-TypeScript `collapseState(axis, outcome)` utility: given measurement axis and ± outcome, returns the post-measurement `(θ, φ)`.
- Mode dropdown extended with "Spin-½" entry; Grid and Potential fieldsets hidden in spin mode.

---

### Added (2026-04-14) — Hydrogen-like atom module (spec 19)

**Backend** (`backend/solvers/hydrogenic/`, `app.py`)
- New `hydrogenic` router mounted at `/hydrogenic` with endpoint `POST /hydrogenic/solve`.
- `radial_solver.py` — solves the radial Schrödinger equation for hydrogen-like atoms by substituting `u(r) = r·R(r)` and reusing the existing 1-D Hamiltonian builder with effective potential `V_eff = −Z/r + l(l+1)/(2r²)`. Grid extent and resolution adapt automatically to `(n, l, Z)`.
- `orbitals.py` — computes the 2-D cross-section `|ψ(x,0,z)|²` on a square grid using `scipy.special.sph_harm`; the φ = 0 slice is exact for complex spherical harmonics because `|Y_lm|²` is φ-independent.
- Supports Z = 1–10 (H through Ne⁹⁺), n = 1–5, l = 0…n−1, m = −l…l; all invalid combinations return 422.
- Response includes: radial grid, radial probability density `u²`, 2-D orbital density, energy in Hartree and eV, exact analytical energy, ion symbol/name, orbital label.
- 35 backend tests across `test_hydrogenic_api.py` and `test_hydrogenic_radial.py`: energy accuracy, radial normalisation, energy ordering, orbital density non-negativity, ion/orbital labels, and all 422 validation paths.

**Frontend** (`frontend/src/components/HydrogenicPanel.tsx`, `GrotrianDiagram.tsx`, `RadialDensityInfoPanel.tsx`, `OrbitalDensityInfoPanel.tsx`, `SelectionRulesPanel.tsx`)
- `HydrogenicPanel` — hosts radial probability density plot (with ⟨r⟩ dashed line and Å top axis), 2-D orbital density heatmap (Viridis, normalised 0–1), and Grotrian diagram.
- `GrotrianDiagram` — SVG energy-level diagram for n = 1–5. Transition arrows are coloured by emission wavelength (visible = solid, UV/IR = dashed). Clicking any level highlights it as the focus, dims forbidden levels to 0.18 opacity, and marks reachable levels (Δℓ = ±1) in green; a "metastable" label appears when no single-photon decay is allowed. Only Lyman and Balmer series arrows are drawn to avoid clutter.
- `SelectionRulesPanel` — modal reference card for electric-dipole selection rules, accessible via the `?` button on the Grotrian diagram.
- Help modals for radial density (`RadialDensityInfoPanel`) and orbital density (`OrbitalDensityInfoPanel`) plots.
- Mode dropdown includes "Hydrogenic" entry; Grid and Potential fieldsets hidden in hydrogenic mode; m slider dimmed and disabled when l = 0.

---

### Added (2026-03-30) — Momentum-space view

**Backend** (`backend/momentum.py`, `crank_nicolson.py`, `app.py`)
- New module `momentum.py` with two functions:
  - `k_axis(n, dx)` — fftshifted wavenumber axis in rad/a.u., spacing Δk = 2π/(N·Δx).
  - `density(psi, dx)` — momentum-space probability density |φ(k)|² = (Δx²/2π)|FFT(ψ)|², normalised so Σ|φ(k_j)|²·Δk = 1 (Parseval's theorem).
- `TimeEvolutionResult` gains `momentum_frames` (shape n_frames × N) and `momentum_k` (shape N); the k-axis is computed once before the evolution loop and |φ(k,t)|² is stored at every saved frame.
- `EvolveResponse` returns `momentum_frames: list[list[float]]` and `momentum_k: list[float]`.
- 10 new backend tests in `test_momentum.py` covering all spec requirements (k-axis length, spacing, symmetry; density normalization; peak location; zero-momentum symmetry; result shapes; API response fields).

**Frontend** (`frontend/src/components/MomentumPlot.tsx`, `PlotArea.tsx`, `types/api.ts`)
- New `MomentumPlot` component renders |φ(k,t)|² vs k (rad/a.u.) for the current animation frame, updating in sync with the wavepacket animation.
- `PlotArea` renders `MomentumPlot` below the main |ψ(x,t)|² plot in time-evolution mode.
- `EvolveResponse` TypeScript interface updated with `momentum_frames` and `momentum_k`.
- 5 new frontend tests covering render/null/empty-array behaviour and PlotArea visibility rules.

### Added (2026-03-30)

**Expectation values** (`backend/expectation_values.py`, `crank_nicolson.py`, `app.py`)
- New module `expectation_values.py` exposes `compute(psi, grid_x, dx, hamiltonian, potential)`
  returning ⟨x⟩, ⟨x²⟩, ⟨p⟩, ⟨p²⟩, ⟨H⟩, Δx, Δp, and Δx·Δp for any normalized state.
- `crank_nicolson.evolve()` gains a required `potential` parameter and populates five new
  arrays in `TimeEvolutionResult`: `expect_x`, `expect_p`, `expect_x2`, `expect_p2`, `expect_H`.
- `EvolveResponse` returns all five expectation value arrays to the frontend.
- 10 new backend tests in `test_expectation_values.py`:
  - Harmonic Oscillator ground state: ⟨x⟩ = 0, ⟨p⟩ = 0, ⟨H⟩ = ½
  - Harmonic Oscillator ground state saturates Heisenberg bound: Δx·Δp = ½
  - Infinite Square Well ground state: ⟨x⟩ = center of well (symmetry)
  - Δx·Δp ≥ ½ for Harmonic Oscillator excited states and displaced Gaussian
  - Ehrenfest theorem: ⟨x(t)⟩ = x₀ cos(t) for Harmonic Oscillator coherent state
  - ⟨H(t)⟩ constant during time evolution of an energy eigenstate

**Exact-solution panel** (`frontend/src/components/ExactSolutionPanel.tsx`)
- Stationary mode shows exact energy formula and numerical vs analytic energy error table
  for infinite square well (Eₙ = n²π²/2L²) and harmonic oscillator (Eₙ = n + ½).

**Documentation**
- `README.md`, `CONTRIBUTING.md`, `LICENSE` added for JOSS submission readiness.

### Added (2026-03-29)

**Plot improvements** (`frontend/src/components/MainPlot.tsx`, `SecondaryPlot.tsx`)
- Clip V(x) in the main plot so infinite/large potential walls no longer compress the wavefunction traces. Ceiling is computed as `E_max + 50%·|E_max| + 1` (stationary) or the 90th-percentile of V values (time-evolution).
- Add thin dashed horizontal lines at each energy level in the main stationary plot, showing the baseline each eigenfunction is offset from.
- Add V(x) as a light filled background trace in the secondary energy-levels plot, producing the classic energy-level-diagram appearance.

**UI controls** (`frontend/src/components/ControlPanel.tsx`, `App.tsx`, `App.css`)
- Display the current numeric value next to each range slider: `n_points`, `n_states`, `n_steps`.
- Solve/Run button now changes color to communicate solver state:
  - **Green** — parameters not yet submitted (initial state).
  - **Amber** — parameters have changed since the last successful solve; a re-run is needed.
  - **Gray** — displayed results are up to date with current parameters.
- Changed `ControlPanel` prop from `loading: boolean` to `status: AppStatus` so the component can distinguish idle / loading / success / error states.

## [0.1.0] — 2026-03-28

### Added

- Initial release: FastAPI backend with Crank-Nicolson time evolution and eigenstate solver; React + TypeScript frontend with Plotly-based plots, animation controls, CSV/JSON export, and URL-state persistence.
