# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added (2026-05-03) — Energy decomposition bar chart (time-evolution mode)

- **Backend** (`router.py`): `/schrodinger1d/solve/evolve` now returns two new fields:
  `decomp_energies` (Eₙ values) and `decomp_weights` (|cₙ|² = |⟨ψₙ|ψ(0)⟩|²) for the
  lowest 10 eigenstates. For `superposition` initial states the already-computed eigenstates
  are reused; for `gaussian` a separate ARPACK solve runs for `min(10, n//10)` states.
  Weights are time-independent (energy conservation).
- **`EnergyDecompositionPlot.tsx`**: Plotly bar chart showing |cₙ|² per eigenstate.
  Hover text shows Eₙ and the beating period T = 2π/|Eₙ − E₁| for n > 1. An annotation
  displays the total captured weight Σ|cₙ|².
- **`EnergyDecompositionInfoPanel.tsx`**: KaTeX physics explainer covering eigenbasis
  expansion, time-independent weights, Bohr frequencies, and interference cross terms.
  Accessible via the `?` button in the bar chart header.
- **`PlotArea.tsx`**: Bar chart rendered in time-evolution mode, above the main |ψ|² plot.

### Improved (2026-05-03) — Time-evolution animation: five quick-win UX improvements

- **`requestAnimationFrame` loop** (`App.tsx`): Replaced the `setInterval`-based animation
  loop with a timestamp-driven `requestAnimationFrame` loop. Frame advances are locked to the
  monitor refresh rate (60 fps), eliminating timer drift and stutter. The loop auto-pauses
  when the browser tab is hidden. A `loopRef` lets the callback read the latest loop flag
  without being listed as a React dependency.
- **⟨x⟩ position marker** (`MainPlot.tsx`): A red dashed vertical line is drawn at
  `expect_x[currentFrame]` on the `|ψ(x,t)|²` plot at every frame, showing the probability
  centroid moving through the wavepacket envelope.
- **Time cursor on secondary plots** (`SecondaryPlot.tsx`, `ExpectationValuesPlot.tsx`):
  A dotted vertical line tracks the current animation time `t` on both the norm-history plot
  and the two-panel expectation-value plot. The expectation-value panel uses Plotly's
  `yref: 'y domain'` / `yref: 'y2 domain'` to span each subplot independently.
- **Loop / Stop toggle** (`AnimationControls.tsx`, `App.tsx`): A "Loop" checkbox in the
  animation controls; when unchecked the animation stops at the last frame rather than
  wrapping to frame 0. Defaults to checked (original behaviour preserved).
- **0.25× slow-motion speed** (`AnimationControls.tsx`): Added `0.25x` option to the speed
  selector for close study of fast tunneling or phase oscillation events.

---

### Added (2026-05-03) — Classical probability overlay in stationary mode

- **`classicalProbabilityDensity` utility** (`frontend/src/utils/classicalMechanics.ts`):
  Pure function computing P_cl(x) ∝ 1/√(2(E−V(x))) in the classically allowed region,
  normalised so ∫P_cl dx = 1. Returns all zeros when no classically allowed region exists.
- **"Show classical P(x)" checkbox** (`PlotArea.tsx`): Toggle visible only in stationary mode.
  When checked, one dotted P_cl trace per eigenstate is added to the main wavefunction plot,
  scaled so its 90th-percentile matches max(|ψₙ|²). Includes a brief explanatory note about
  the correspondence principle.
- **`MainPlot.tsx`**: `showClassical` prop; classical traces share the Plotly colour cycle
  with their companion ψₙ trace (dotted, 60% opacity).
- **Spec** (`specs/21-classical-overlay.md`) and 15 new tests (TDD) covering normalisation,
  classically-forbidden zeros, HO analytic comparison, ISW uniformity, and UI checkbox state.

---

### Added (2026-05-03) — One-command startup scripts

- **`run.sh`** (Mac / Linux): Creates/reuses `backend/.venv`, installs Python deps, starts
  uvicorn in the background, then starts `npm run dev`. `Ctrl+C` cleanly kills both processes.
- **`run.bat`** (Windows): Equivalent using `start "name" cmd /k ...` to open two labelled
  console windows.
- **README.md**: Quick Start collapsed to four lines (`git clone` + `./run.sh` / `run.bat`);
  original manual steps preserved in a `<details>` block.

---

### Added (2026-05-03) — Spin: φ(t) clock dial in Precession panel

- **φ clock dial** (`PrecessionControls.tsx`): A small SVG clock inset sits beside the Play/Reset buttons. The orange hand sweeps the azimuthal angle φ in real time during Larmor precession, with +x/+y/−x/−y tick labels and a live `φ = X°` readout. Makes the precession rate ω₀ visible at a glance without reading the frame counter.

---

### Added (2026-05-03) — Spin: θ arc on Bloch sphere

- **θ arc** (`BlochSphere.tsx`): A yellow dashed great-circle arc is drawn from the north pole (|↑⟩) to the current state vector, sweeping through angle θ. Computed via spherical linear interpolation (slerp) with 48 segments. A floating HTML label `θ = X°` tracks the arc midpoint as the camera rotates, giving a live readout of the polar angle.

---

### Added (2026-05-03) — Spin: identical preparation experiment

- **"Lock |ψ⟩ as prep state" button** (`SternGerlachPanel.tsx`): Saves the current Bloch vector as the preparation state. A subsequent "Measure N times from |prep⟩" button runs all N trials from that *same* state (not the post-collapse state), accumulating a histogram entirely client-side. After all shots the sphere resets to the preparation state. A note explains that identical preparations still produce random outcomes — quantum randomness is irreducible, not a one-time event.

---

### Improved (2026-05-03) — Spin ½ / Bloch Sphere: five usability and education improvements

- **Degrees alongside radians** (`SpinStateComposer.tsx`): θ and φ slider labels now show both the radian value and the degree equivalent, e.g. `1.571 rad (90.0°)`.
- **Live |ψ⟩ ket display** (`SpinStateComposer.tsx`): A monospace line below the expectation values shows the wavefunction `|ψ⟩ = α|↑⟩ + β|↓⟩` with current numerical α (real) and β (complex) updated in real time as sliders move.
- **Robertson uncertainty relation** (`SpinStateComposer.tsx`): Displays `Δσₓ·Δσᵧ ≥ |⟨σ_z⟩|` with computed LHS and RHS values and a green ✓ / red ✗ indicator. Derived from `[σₓ, σᵧ] = 2iσ_z`; always satisfied for pure states.
- **Eigenstate dots on sphere** (`BlochSphere.tsx`): Small dots at ±x and ±y poles with HTML labels `|+x⟩`, `|−x⟩`, `|+y⟩`, `|−y⟩`. The ±z poles already had `|↑⟩`/`|↓⟩` labels.
- **Projection lines** (`BlochSphere.tsx`): Three colour-coded dashed lines drawn from the tip of the Bloch vector to the foot on each axis (red → x, green → y, blue → z), updated every render frame. Makes `⟨σ_z⟩ = cos θ` visually concrete.

---

### Improved (2026-05-03) — Grotrian diagram: four usability and learning improvements

- **Level hover tooltip** (`GrotrianDiagram.tsx`): Hovering any energy level now shows a tooltip with its quantum numbers, spectroscopic label, and energy in both Eh and eV (e.g. `n=3, ℓ=1 (3p)  E = −0.0556 Eh = −1.51 eV`).
- **Y-axis unit toggle** (`GrotrianDiagram.tsx`): Added a pill button to switch the Y-axis between Hartree (Eh) and eV. Tick values and axis label update immediately.
- **Emission color swatch in arrow tooltip** (`GrotrianDiagram.tsx`): Hovering an allowed transition arrow now shows a colored rectangle of the actual emission color alongside a UV/IR/visible label, making the wavelength→color connection concrete.
- **n= row labels on right-side axis** (`GrotrianDiagram.tsx`): Replaced per-level `n=X` labels (which only appeared next to the rightmost level of each row) with a clean right-side column of aligned `n=1` … `n=5` labels at a fixed x position. SVG width increased from 500 to 530 px to accommodate.

---

### Improved (2026-05-03) — Grotrian diagram: series filter buttons and click-to-deselect

- **Spectral series filter** (`GrotrianDiagram.tsx`): Added four pill buttons — Lyman (→n=1), Balmer (→n=2), Paschen (→n=3), Brackett (→n=4) — above the toggle checkboxes. Clicking a button dims all arrows except those belonging to that series; clicking the active button again clears the filter. Selecting a series clears any level focus, and clicking a level clears the series filter.
- **Click-to-deselect** (`GrotrianDiagram.tsx`): Clicking an already-focused level now clears the focus state (restores all levels and arrows to full opacity) instead of doing nothing.

---


### Added (2026-05-02) — 3D orbital isosurface viewer

- **`orbital_isosurface(n, l, m, Z, grid_size=30)`** (`backend/solvers/hydrogenic/orbitals.py`): New function computing the analytic |ψ_nlm(x,y,z)|² on a uniform 3-D grid using the associated Laguerre and spherical harmonic formulas from SciPy. Returns a 1-D symmetric axis list and a flattened N³ probability density array.
- **Backend endpoint** (`backend/solvers/hydrogenic/router.py`): `POST /hydrogenic/solve` now returns `iso_axis` and `iso_values` fields in `HydrogenicResponse`.
- **`OrbitalIsosurface` component** (`frontend/src/components/OrbitalIsosurface.tsx`): Renders a Plotly `isosurface` 3-D surface at 10% of peak density with Viridis colorscale; integrated into `HydrogenicPanel.tsx` below the 2-D plots.
- **Frontend types** (`frontend/src/types/api.ts`): `HydrogenicResponse` gains `iso_axis: number[]` and `iso_values: number[]`.
- **Backend tests** (`backend/tests/test_hydrogenic_isosurface.py`): 12 new tests covering field presence, axis symmetry, non-negativity, 1s max at origin, 1s spherical symmetry, 2p_z nodal plane, 2s radial node, approximate normalization, and Z-compactness scaling.
- **TODO.md**: Moved 3D isosurface to Completed; moved three earlier items (node counting, Re/Im toggle, sequential spin measurements) to Completed.

---

### Improved (2026-05-02) — Time-evolution control panel UX

- **Inline parameter rows** (`ControlPanel.tsx`, `App.css`): x₀, σ, k₀, and dt now display label and input on the same line using a new `.param-row` flex layout, reducing the vertical space consumed by the Initial State fieldset.
- **dt validation** (`ControlPanel.tsx`): Added `min="0.0001"` and `step="0.001"` to the dt input; the `onChange` handler clamps to ≥ 0.0001, preventing the negative total-time display that appeared when a user typed a negative value.
- **Renamed "save_every" → "Steps per frame"** (`ControlPanel.tsx`): The new label is self-explanatory — one animation frame is recorded every N simulation steps. Updated tooltip accordingly.
- **Dark-mode fixes** (`App.css`): Added dark-mode colour overrides for `.total-time-row` and the new `.param-unit` annotation span.

---

### Fixed (2026-05-02) — Plot layout: restore full height and reduce whitespace

- **PlotArea layout regression** (`PlotArea.tsx`, `App.css`): The `?` info buttons added for Energy Levels and Eigenfunctions had introduced wrapper `<div>` elements that consumed flex column space and broke Plotly's height calculation, causing both plots to shrink. Fixed by using zero-height absolutely-positioned overlays so the buttons cost no layout height. The eigenfunctions `?` button now lives in a `height:0; overflow:visible` div immediately before `<MainPlot>`, and the energy-levels `?` button is absolutely positioned inside the existing `<ul>` wrapper.
- **Compact Plotly margins** (`MainPlot.tsx`, `SecondaryPlot.tsx`, `MomentumPlot.tsx`, `CurrentPlot.tsx`): Replaced Plotly's default margins (~100px top, ~80px sides) with `{ t:36, b:44, l:56, r:12 }` across all plot components, eliminating the large blank bands above plot titles and below axis labels.

---

### Added (2026-05-02) — Three educational quick wins

**Re(ψ) / Im(ψ) toggle** (time-evolution mode)
- Backend (`router.py`): `EvolveResponse` now includes `re_frames` and `im_frames` (real and imaginary parts of ψ at each saved frame), extracted from the already-stored complex `psi_frames`.
- Frontend (`types/api.ts`): `EvolveResponse` interface updated with `re_frames` and `im_frames`.
- Frontend (`PlotArea.tsx`): "Show Re(ψ) and Im(ψ)" checkbox above the main plot. When checked, a help note explains: a stationary state has ψ = φ(x)·e^{−iEt} so Re/Im spin while |ψ|² stays fixed; in a superposition the phase difference oscillates, making |ψ|² slosh — quantum interference.
- Frontend (`MainPlot.tsx`): Re(ψ) rendered as green dashed line, Im(ψ) as orange dotted line, both updating each animation frame.

**Node counting** (stationary mode)
- Frontend (`MainPlot.tsx`): Each eigenfunction legend entry now shows its node count, e.g. "ψ₂ (1 node)". Nodes are counted from zero-crossings of the raw wavefunction, excluding a 5-point boundary margin to avoid counting the Dirichlet BC zeros. The n-th eigenstate always has exactly n−1 nodes (Sturm-Liouville theorem).

**Sequential measurements** (spin Measurement tab)
- Frontend (`SternGerlachPanel.tsx`): "Measure once" now appends each result to a persistent history panel showing axis, prior probability, and outcome for every shot. When two consecutive measurements use different axes, an explanatory note fires: "After measuring along z, the state collapsed to a z-axis eigenstate — it has no memory of its previous direction." A second note fires when the user completes the classic z→x→z sequence, explaining measurement erasure. A "Clear" button resets the history.

---

### Added (2026-05-02) — Spin ½ page: two-tab layout

**Frontend** (`frontend/src/components/SpinPanel.tsx`, `App.css`)
- Split the single control column into two tabs: **Precession** (unitary dynamics) and **Measurement** (Born-rule collapse). The tabs share the State |ψ⟩ composer and the Bloch sphere so the spin state is preserved when switching.
- Each tab opens with a one-line physics note: "Unitary evolution — the Bloch vector stays on the sphere surface" / "Measurement collapses the state randomly. P(+½) = ½(1 + n̂·r̂)".
- Precession tab retains PrecessionControls + Pauli matrix table; Measurement tab retains SternGerlachPanel only.
- Switching to Measurement clears the precession trajectory from the Bloch sphere so the dynamic cone does not clutter the measurement context.
- Tab strip styled with classic browser-tab appearance (active tab merges into content below); full dark-mode variants included.

---

### Fixed (2026-05-02) — Spin precession animation

**Frontend** (`frontend/src/components/PrecessionControls.tsx`)
- **Play button now visibly animates precession.** The trajectory `useEffect` was re-firing on every animation frame because `onFrame` updates `theta`/`phi` in the parent, which flowed back as props and reset `frameRef.current = 0` each tick. Fixed by guarding with `if (playingRef.current) return` so trajectory is only recomputed when the user changes sliders or parameters, never during playback.
- Changed default B̂ preset from `+z` to `+x`. With the spin vector initialised at θ = 0 (pointing along +z) and B̂ also along +z, the Rodrigues rotation is degenerate (vector parallel to axis → no movement). Defaulting to `+x` gives an immediately visible precession cone on the first Play click.

---

### Added (2026-05-02) — Grotrian diagram: selection rules as first-class visual feature

**Frontend** (`frontend/src/components/GrotrianDiagram.tsx`)
- Expanded allowed transitions from Lyman+Balmer only to all series (Lyman, Balmer, Paschen, Brackett, Pfund) — removes the `nLo ≤ 2` restriction and also adds previously missing transitions where the upper state has lower ℓ (e.g. 3s → 2p).
- E1-forbidden transitions (Δℓ = 0 or |Δℓ| > 1) rendered as thin gray dashed lines without arrowheads; toggled off by default via a "Show forbidden (E1)" checkbox. When focused on a level, forbidden arrows from that level brighten while all others fade further.
- SVG `<title>` tooltip on every arrow: allowed arrows show transition label, Δℓ, λ, ΔE in eV, and series name; forbidden arrows show the specific rule violated (e.g. "Δℓ = 0 (parity unchanged — E1 dipole matrix element = 0)").
- Permanent amber `●` marker on the 2s level with a hover tooltip explaining the ~10⁸ lifetime ratio vs 2p and two-photon decay mechanism.
- "λ labels" checkbox (default off) to toggle wavelength annotations on arrows; previously always-on labels would overlap with the expanded transition set.
- Two-section legend below the diagram: **Levels** row (current orbital, reachable, dimmed, metastable) and **Arrows** rows with inline SVG line samples showing exact stroke color and dasharray for each category, plus physics examples (H-α 656 nm for visible, Lyman series for UV, Paschen/Brackett for IR). Gray dashed legend entry appears only when the forbidden toggle is on.
- Caption placed above controls so the checkboxes are unambiguously scoped to the Grotrian diagram.

---

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
