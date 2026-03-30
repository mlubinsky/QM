# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added (2026-03-30)

**Expectation values** (`backend/expectation_values.py`, `crank_nicolson.py`, `app.py`)
- New module `expectation_values.py` exposes `compute(psi, grid_x, dx, hamiltonian, potential)`
  returning ⟨x⟩, ⟨x²⟩, ⟨p⟩, ⟨p²⟩, ⟨H⟩, Δx, Δp, and Δx·Δp for any normalized state.
- `crank_nicolson.evolve()` gains a required `potential` parameter and populates five new
  arrays in `TimeEvolutionResult`: `expect_x`, `expect_p`, `expect_x2`, `expect_p2`, `expect_H`.
- `EvolveResponse` returns all five expectation value arrays to the frontend.
- 10 new backend tests in `test_expectation_values.py`:
  - HO ground state: ⟨x⟩ = 0, ⟨p⟩ = 0, ⟨H⟩ = ½
  - HO ground state saturates Heisenberg bound: Δx·Δp = ½
  - ISW ground state: ⟨x⟩ = center of well (symmetry)
  - Δx·Δp ≥ ½ for HO excited states and displaced Gaussian
  - Ehrenfest theorem: ⟨x(t)⟩ = x₀ cos(t) for HO coherent state
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
