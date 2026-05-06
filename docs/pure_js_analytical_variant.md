# Pure-JavaScript Analytical QM Project — Feasibility Notes

A variant of this project limited to potentials with exact analytical solutions,
implemented entirely in the browser with no Python backend.

## Concept

Instead of a general numerical solver (Crank-Nicolson, matrix diagonalisation),
implement only features where the physics is known in closed form. Everything runs
as a static site — no server, no CORS, instant load.

## Fully analytical features

### Stationary states

| Potential | What is exact |
|---|---|
| Infinite square well | Eigenvalues E_n = n²π²/2L², eigenfunctions sin(nπx/L), any superposition |
| Harmonic oscillator | E_n = n+½, Hermite polynomial eigenfunctions exact up to n ≈ 50 (float precision) |
| Free particle | Plane waves, Gaussian wavepackets |
| Delta function potential | Exact bound state energy and scattering amplitudes |
| Step potential | Exact transmission T and reflection R coefficients (piecewise plane waves) |
| Rectangular barrier | Exact T and R via transfer matrix |

### Time evolution

| Scenario | Method |
|---|---|
| Coherent state in HO | Exact: Gaussian oscillates without spreading, one closed-form formula |
| Free particle Gaussian wavepacket | Exact: closed-form spreading |
| ISW superposition | Exact: Σ c_n ψ_n e^{−iE_n t}, beating and quantum revivals |
| Two-level system / Rabi oscillations | Exact: 2×2 matrix, no numerics at all |

### Observables (exact, real-time)

- ⟨x⟩, ⟨p⟩, σ_x, σ_p, ⟨E⟩ for all analytical states
- Uncertainty product Δx·Δp ≥ ½ shown as animation plays
- Ehrenfest's theorem demonstration

## Hydrogenic atom

Fully analytical in closed form. A genuine 3D problem — a scope extension beyond the
1D wavefunctions above, but all math remains exact.

**What is exact:**
- Energy levels: E_n = −1/(2n²) in atomic units, exact for all n
- Radial wavefunctions R_nl(r): associated Laguerre polynomials, computed via recurrence
- Angular wavefunctions Y_lm(θ,φ): associated Legendre polynomials, same
- Expectation values ⟨r⟩, ⟨r²⟩, etc.: exact closed-form formulas
- Selection rules and transition dipole matrix elements: exact
- Hydrogenic ions (Z > 1): scale r → r/Z, E → Z²E — no extra work

**Visualization tiers:**

| Feature | Complexity | Notes |
|---|---|---|
| Energy level diagram + transitions | Easy | 2D SVG/canvas, pure math |
| Radial probability P(r) = r²\|R_nl\|² | Easy | 1D plot, analytical evaluation |
| 2D cross-section \|ψ_nlm\|² in xz-plane | Moderate | Canvas heatmap, analytical |
| 3D orbital isosurfaces | Hard | WebGL + marching cubes (Three.js) |

Note: `docs/grotrian.png` and `docs/hydrogenic.png` already exist in this repo,
suggesting some of this may be planned or partially present in the current project.
Check for overlap before implementing.

## Spin-½ / Bloch sphere

The ideal pure-JS QM feature — all math is 2×2 complex matrices, zero heavy numerics.

**What is exact:**
- Any state |ψ⟩ = α|↑⟩ + β|↓⟩ maps exactly to a point on the Bloch sphere
- Time evolution under H = −γ**B**·**σ**: exact rotation on the sphere at Larmor frequency ω = γB
- Rabi oscillations under a rotating field: P(t) = (Ω²/Ω²_eff) sin²(Ω_eff t/2), fully closed form
- Expectation values ⟨σ_x⟩, ⟨σ_y⟩, ⟨σ_z⟩: exact at all times
- Detuning δ = ω − ω₀ effects on Rabi flopping: exact

The only engineering challenge is rendering the 3D sphere; Three.js / react-three-fiber
handles this with ~50 lines of setup. The physics computation itself is trivial.

Note: `docs/spin.png` already exists in this repo — same overlap check applies.

## Feature summary

| Feature | Analytical? | JS feasibility | 3D needed? |
|---|---|---|---|
| 1D potentials (ISW, HO, etc.) | 100% | High | No |
| Spin-½ / Bloch sphere | 100% | High | Yes — easy with Three.js |
| Hydrogenic energy levels + radial | 100% | High | No |
| Hydrogenic 2D orbital cross-sections | 100% | Medium | No |
| Hydrogenic 3D orbital shapes | 100% | Medium-hard | Yes — WebGL required |

Spin-½ is the quickest win with the highest pedagogical payoff per line of code.
Hydrogen radial/energy-level features are easy additions. Full 3D orbitals require
more engineering (WebGL) but no new physics — all math remains the same recurrences.

## Additional analytical solutions worth implementing

### Additional 1D potentials

**Morse potential** — V(x) = D_e(1 − e^{−a(x−x_e)})²
- Exact eigenvalues: E_n = ħω(n+½) − [ħω(n+½)]²/(4D_e)
- Eigenfunctions: associated Laguerre polynomials (same recurrence as hydrogen radial)
- Finite number of bound states — more physical than HO for diatomic molecule vibration
- Key feature: anharmonicity and dissociation are visible directly

**Pöschl-Teller potential** — V(x) = −V₀/cosh²(x/a)
- Exact eigenvalues and eigenfunctions
- Reflectionless for certain energies: T = 1 exactly despite a non-zero barrier
- Exact scattering amplitudes for all E — counterintuitive physics, good demo

**Kronig-Penney model** (periodic delta functions)
- Exact band structure: cos(kd) = cos(qd) + (mVa/ħ²q)sin(qd)
- Demonstrates band gaps and Bloch states from first principles
- Very high pedagogical value — solid-state physics from scratch, one formula

**Particle on a ring** (circular geometry, periodic BCs)
- E_m = m²ħ²/(2MR²), ψ_m = e^{imφ}/√(2π), m = 0, ±1, ±2, …
- Add magnetic flux Φ: E_m = (m − Φ/Φ₀)²ħ²/(2MR²) — exact Aharonov-Bohm effect
- Energy levels shift continuously with flux but observables remain periodic

**Squeezed states** (harmonic oscillator extension)
- Beyond coherent states: Δx reduced below ground-state value, Δx·Δp = ħ/2 still holds
- Exact time evolution: wavepacket width oscillates at 2ω (breathing motion)
- Relevant to quantum optics and gravitational wave interferometry

**Quantum bouncer** — V = mgx (x > 0), ∞ (x < 0)
- Eigenfunctions: Airy functions Ai(z), computable via power series in JS
- Eigenvalues from zeros of Ai — not closed-form but well-defined and tabulated
- Demonstrates gravity quantisation; shown experimentally with ultracold neutrons

### Hydrogen atom extensions

**Zeeman effect**
- Normal: E → E_n + m_l μ_B B — exact level splitting, visualise with B-field slider
- Anomalous: adds spin contribution via g-factor, still exact
- Spectral lines split into 3 (normal) or more (anomalous) — animate as B increases

**Stark effect (first-order perturbation theory)**
- Linear Stark shift for degenerate n = 2 states: exact via degenerate perturbation theory
- Mixes 2s and 2p₀ states with exact mixing coefficients
- Lifts four-fold degeneracy: two shifted, two unshifted levels

**Hydrogen emission spectra**
- Lyman / Balmer / Paschen series: λ = 1/R∞(1/n₁² − 1/n₂²) — exact
- Interactive Grotrian diagram: click a transition, see both wavefunctions and the photon energy
- Oscillator strengths (transition dipole matrix elements) are also exact closed-form

**Momentum-space wavefunctions**
- ψ_nlm(p): Fourier transform of position-space wavefunction, exact closed form
- Pedagogically valuable contrast: s-orbitals look qualitatively different in momentum space

**Hydrogenic ions (Z > 1)**
- Scale r → r/Z, E → Z²E — no extra implementation, just a Z slider
- Covers He⁺, Li²⁺, etc.

### Spin extensions

**Two spin-½ particles — entanglement and Bell states**
- Bell states: |Φ±⟩ = (|↑↑⟩ ± |↓↓⟩)/√2, |Ψ±⟩ = (|↑↓⟩ ± |↓↑⟩)/√2 — exact
- Singlet correlation function: ⟨σ_A·n̂ σ_B·m̂⟩ = −cos θ — exact
- Bell inequality violation S = 2√2 — exact maximum, no numerics
- Highest relevance given quantum computing interest

**Single-qubit gates on Bloch sphere**
- Every unitary U = e^{−iθ n̂·σ/2} is a rotation on Bloch sphere — exact
- X, Y, Z, H, S, T gates all visualisable as rotations; compose gates as sequential rotations
- Bridges QM pedagogy to quantum computing naturally

**NMR / spin echo**
- Free precession, π-pulse refocusing, Hahn echo — all exact 2×2 matrix sequences
- Bloch equations with T₁/T₂ relaxation: exact analytical solution
- Explains MRI physics; high practical relevance

**Berry phase / geometric phase**
- Spin-½ cycled adiabatically around a closed loop in parameter space
- Geometric phase: γ = −Ω/2 where Ω = solid angle subtended on Bloch sphere — exact
- Purely geometric, independent of dynamics — elegant Bloch sphere visualisation

**Heisenberg dimer** (two coupled spins)
- H = J S₁·S₂, exact eigenvalues: singlet E = −3J/4, triplet E = +J/4
- Exact time evolution for any initial state; demonstrates exchange interaction

**Spin-1 system**
- 3×3 matrices, m = −1, 0, +1
- Exact eigenstates and time evolution under B field
- Relevant for deuterium, bosonic atoms, NV centres in diamond

### Higher-dimensional extensions

**2D infinite square well**
- E_nx,ny = π²(nx²/Lx² + ny²/Ly²)/2 — exact
- When Lx = Ly: accidental degeneracy; a small asymmetry lifts it (exact perturbation theory)
- Heatmap of |ψ|² — visually striking, pure arithmetic

**2D harmonic oscillator**
- E = (nx + ny + 1)ħω; degeneracy N+1 at level N — exact
- Natural introduction to higher-dimensional QM and degeneracy counting

**Rigid rotor** (particle on a sphere)
- ψ = Y_lm(θ,φ), E_l = l(l+1)ħ²/(2I) — exact
- Same spherical harmonics as hydrogen's angular part — no extra implementation
- Relevant for molecular rotation spectra

## Prioritised shortlist

Ranked by pedagogical value versus implementation effort:

| Feature | Category | Value | Effort |
|---|---|---|---|
| Kronig-Penney band structure | 1D | Very high | Low |
| Two-spin entanglement + Bell states | Spin | Very high | Low |
| Single-qubit gates on Bloch sphere | Spin | Very high | Low |
| Hydrogen emission spectra (interactive) | Hydrogen | High | Low |
| Zeeman effect | Hydrogen | High | Low |
| Morse potential | 1D | High | Low |
| Particle on a ring + AB effect | 1D | High | Low |
| NMR / spin echo | Spin | High | Medium |
| Squeezed states | 1D/HO | Medium | Low |
| Berry phase | Spin | Medium | Medium |
| Pöschl-Teller potential | 1D | Medium | Low |
| Stark effect (1st order) | Hydrogen | Medium | Medium |
| 2D square well / 2D HO | 2D | Medium | Medium |
| Quantum bouncer (Airy) | 1D | Medium | Medium |
| Heisenberg dimer | Spin | Medium | Low |

The top three (Kronig-Penney, Bell states, qubit gates) are low-effort, high-payoff, and
together span solid-state physics, quantum information, and atomic physics — making this
project substantially richer than a pure wavefunction viewer.

## Gray area — trivial numerics, not heavy

These require minimal computation and are acceptable:

- **Finite square well bound state energies** — Newton's method on one transcendental
  equation, ~10 iterations.
- **Overlap integrals** ∫ψ_n\* ψ₀ dx for arbitrary initial states — simple Gaussian
  quadrature, O(N), not O(N²) linear algebra.

Neither feels like "heavy numerics" in the Crank-Nicolson sense.

## Excluded

- Double well, deep double well, Gaussian barrier — no exact solutions exist.
- Real-time wavepacket tunneling dynamics through a smooth potential barrier.
- General initial conditions not analytically decomposable into known eigenstates.

Note: the three excluded potentials are exactly the ones with no analytical solutions
(see `docs/potentials.md`). This is not a coincidence.

## What this buys over the current project

| Property | Current project | JS-only variant |
|---|---|---|
| Backend | FastAPI + Python | None |
| Deployment | Server required | Static site (GitHub Pages, Netlify) |
| Potentials | 7 (including non-analytical) | ~6 analytical only |
| Observables | Numerical approximation | Exact closed-form |
| Time evolution | Crank-Nicolson (general) | Analytical formulas only |
| Pedagogy | General solver | Exact-physics explorer |

The two projects are complementary: this project is better for the analytically solvable
cases (exact expectation values, exact revival times, exact tunneling coefficients);
the current project handles the cases where numerics are unavoidable.

## Recommended stack

- **Framework**: React + TypeScript (same as current project)
- **Complex arithmetic**: `mathjs`
- **Plotting**: Plotly.js or a thin canvas renderer
- **3D (Bloch sphere, orbitals)**: Three.js or react-three-fiber
- **Hosting**: GitHub Pages (static, no server needed)

Hermite, Laguerre, and Legendre polynomials are all computed via standard recurrence
relations — no external math library needed for those.

## Verdict

High feasibility. The features most worth animating analytically (coherent states,
wavepacket spreading, quantum revivals, Rabi oscillations, tunneling coefficients)
all fit comfortably in a browser with no backend.
