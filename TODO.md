# TODO — Feature Backlog

## In Progress

### Spin ½ / Bloch Sphere usability and education improvements

| # | Feature | File(s) | Status |
|---|---------|---------|--------|
| 5 | Degrees alongside radians on θ/φ sliders | SpinStateComposer.tsx | ✅ done 2026-05-03 |
| 4 | Live \|ψ⟩ ket display with numerical α, β | SpinStateComposer.tsx | ✅ done 2026-05-03 |
| 6 | Robertson uncertainty relation Δσₓ·Δσᵧ ≥ \|⟨σ_z⟩\| | SpinStateComposer.tsx | ✅ done 2026-05-03 |
| 3 | Eigenstate dots at ±x, ±y on Bloch sphere | BlochSphere.tsx | ✅ done 2026-05-03 |
| 1 | Projection lines from arrow tip to each axis | BlochSphere.tsx | ✅ done 2026-05-03 |
| 8 | "Identical preparation" reset+measure button | SternGerlachPanel.tsx | ✅ done 2026-05-03 |
| 2 | θ arc on sphere showing polar angle | BlochSphere.tsx | ✅ done 2026-05-03 |
| 7 | Animated N-shot collapse sequence on sphere | BlochSphere.tsx + SternGerlachPanel.tsx | ⬜ planned |

## Planned

### Recommended implementation order (reviewed 2026-05-02)

| Priority | Item | Effort | JOSS value |
|----------|------|--------|-----------|
| ✅ | Classical overlay — stationary mode P_cl(x) | done 2026-05-03 | High |
| 1 | Wave packet group vs. phase velocity (time-evolution) | 1 day | High |
| 2 | Preset labs — 3 experiments using existing solvers | 3–5 days | Very high |
| ✅ | Eigenstate decomposition chart | done 2026-05-03 | Medium |
| 4 | 2D solver | 3–4 weeks | Very high — defer |

---

### Usability and educational improvements (current feature set)

Ordered by priority within each group.

#### Quick wins

**Keyboard shortcuts for animation** (time-evolution mode)
- Space = play/pause
- Left/right arrow = step one frame
Currently there is no keyboard control; students step through frames frequently
during analysis.

**`requestAnimationFrame` for animation loop** (time-evolution mode) — ✅ done 2026-05-03
Replace the current `setInterval`-based loop in App.tsx with
`requestAnimationFrame`. Locks frame advances to the monitor refresh rate
(60 fps), eliminates timer drift and stutter, and auto-pauses when the tab
is hidden. ~10-line change with no backend impact.

**Time cursor on expectation-value and norm plots** (time-evolution mode) — ✅ done 2026-05-03
While the animation plays, draw a vertical dashed line at current `t` on the
`ExpectationValuesPlot` and the norm-history `SecondaryPlot`. Visually connects
the animated wavepacket to the static time-series panels — students can see
exactly when Δx starts growing or when ⟨x⟩ turns around. Purely frontend;
`times[currentFrame]` is already available.

**⟨x⟩ position marker on main |ψ|² plot** (time-evolution mode) — ✅ done 2026-05-03
Overlay a vertical dashed line at `expect_x[currentFrame]` on the main
wavepacket plot. Shows the probability-weighted centroid separate from the
packet envelope — makes Ehrenfest's theorem (centroid follows Newton's law)
directly visible without any extra computation. All data already in
`EvolveResponse`.

**Loop / Stop toggle for animation** (time-evolution mode) — ✅ done 2026-05-03
Currently the animation wraps silently at the last frame. Add a toggle so
students can choose "Loop" (current behaviour) or "Stop at end", which is more
useful when studying a single tunneling event or a dispersion run from start to
finish.

**0.25× slow-motion speed option** (time-evolution mode) — ✅ done 2026-05-03
The speed selector currently bottoms out at 0.5×. Adding 0.25× lets students
watch fast tunneling events or rapid phase oscillations frame-by-frame without
using the scrubber.

**Phase of Bloch vector as a clock** (spin Precession tab) — ✅ done 2026-05-03
φ(t) clock dial inset sits beside the Play/Reset buttons. Hand sweeps live
during animation; label shows φ in degrees and current ω₀.

---

#### High educational value, moderate cost

**Eigenstate decomposition display** (time-evolution mode) — ✅ done 2026-05-03
Bar chart of |cₙ|² = |⟨ψₙ|ψ(0)⟩|², with hover showing Eₙ and beating period.
KaTeX info panel explains eigenbasis expansion, Bohr frequencies, and interference.
Backend adds `decomp_energies` and `decomp_weights` to `EvolveResponse`.

**Classical vs. quantum comparison** (stationary mode + time-evolution mode) — *Priority 1*
Two sub-features sharing the same pedagogical theme (correspondence principle):

- *Harmonic oscillator classical overlay* — ✅ done 2026-05-03. P_cl(x) dotted overlay
  on the stationary-mode wavefunction plot. Toggle checkbox with explanatory note.
  Works for any potential, not just HO.
- *Wave packet group vs. phase velocity* (time-evolution mode) — annotate the
  animated wave packet with the group velocity v_g = ∂ω/∂k ≈ k₀ (slope of ⟨x(t)⟩)
  and the phase velocity v_ph = ω/k. A short label or dashed tangent line on the
  ⟨x(t)⟩ expectation-value subplot makes the distinction concrete without any
  new computation — ⟨x(t)⟩ and ⟨p(t)⟩ are already returned by the backend.

**Ehrenfest theorem: classical trajectory overlay** (time-evolution mode)
Overlay the classical trajectory x_cl(t) on the `⟨x(t)⟩` expectation-value
subplot. For the harmonic oscillator x_cl(t) = x₀cos(ωt) + (p₀/ω)sin(ωt);
for a general potential it can be integrated from Newton's law using the
initial ⟨x⟩ and ⟨p⟩. Demonstrates Ehrenfest's theorem directly: the quantum
centroid tracks the classical path exactly for a coherent state and diverges
for anharmonic or strongly dispersive potentials. `expect_x[0]` and
`expect_p[0]` are already in `EvolveResponse`; ω comes from the potential
slider. Purely frontend for the HO case.

**Quantum revival / autocorrelation |⟨ψ(0)|ψ(t)⟩|²** (time-evolution mode)
The autocorrelation function measures how much the state at time t overlaps
with the initial state. For an ISW packet it drops to near zero then revives
periodically at the revival time T_rev = 4mL²/πħ — a striking all-quantum
effect with no classical analogue. Computable entirely from `re_frames`,
`im_frames`, and the initial wavefunction (already available as
`re_frames[0]`, `im_frames[0]`); one dot-product per frame. Displayed as a
new line in the SecondaryPlot or a dedicated small panel.

**Transmission coefficient for tunneling** (time-evolution mode)
After the wavepacket has passed a barrier or step potential, compute the
fraction of probability on the transmitted side as T. Plot T vs. k₀ (incident
momentum) or vs. barrier height as the slider moves. Tunneling is always
taught abstractly — seeing T(k₀) update live makes it concrete. Small backend
addition to compute the integral; frontend line chart.

---

#### High educational value, higher cost

**3D orbital isosurface** (hydrogenic mode)
Render the iconic |ψ_nlm(x,y,z)|² isosurface — the dumbbell, clover, and ring
shapes every student sees in textbooks — using the closed-form analytic
wavefunction (scipy genlaguerre + sph_harm) on a 3D Cartesian grid.
Backend adds `iso_axis` (1D grid, N points) and `iso_values` (N³ flattened
density) to `HydrogenicResponse`; frontend renders a Plotly `isosurface`
trace. No additional solver needed — purely analytic.



**Physics scenario presets ("labs")** (all modes) — *Priority 2*
Alongside the existing potential presets, add named complete setups that
pre-fill all parameters and show a one-paragraph physics background +
"what to observe" prompt. Scope: 3 labs using only existing solvers — no
new backend physics required. Stark/Zeeman effect and perturbation-theory labs
belong in Phase 2 (see roadmap below).

Recommended first three:
- *Tunneling resonance* — Gaussian packet hitting a rectangular barrier, k₀
  chosen so T ≈ 30%; prompt asks the user to raise/lower barrier and watch T change.
- *Coherent state* — harmonic oscillator, σ = ground-state width, x₀ displaced;
  demonstrates that a minimum-uncertainty state propagates without spreading.
- *Wave packet dispersion* — free particle (flat potential), two different σ values;
  illustrates how a narrow packet (sharp x → broad k spread) disperses faster,
  connecting to the uncertainty principle.

**Perturbation theory comparison** (stationary mode)
Add a perturbation strength ε slider. Show the first-order energy shift
ε·⟨ψₙ|V′|ψₙ⟩ as a dashed line on the energy axis alongside the numerically
computed shifted energy. Makes perturbation theory a live experiment rather
than a pencil-and-paper calculation. Backend addition to compute the matrix
element.

**Hydrogenic: all orbitals for a given n** (hydrogenic mode)
Instead of one orbital at a time, show the complete shell — all (l, m)
combinations for a chosen n arranged in a small grid of density heatmaps.
Makes the degeneracy E_n independent of l visually obvious and lets students
compare orbital shapes within a shell. Frontend layout change; reuses existing
API calls.

**Wigner quasi-probability function W(x,p,t)** (time-evolution mode)
The Wigner function is the closest thing to a classical phase-space
distribution. For a Gaussian packet it is a Gaussian in both x and p, but
interference produces negative regions that have no classical analogue.
Adding it as an optional heatmap in time-evolution mode would be a
distinctive feature no other browser tool currently offers. Moderate backend
cost (2D FFT-based computation); frontend heatmap.

---

### Sequential Stern-Gerlach chain (spin module)

The current SG simulator measures one device at a time. The most striking
quantum result requires a chain of devices with explicit beam blocking:

```
|+z⟩ → [SG-z] → block |−z⟩ → [SG-x] → block |−x⟩ → [SG-z] → 50/50 again
```

The final 50/50 — measuring spin-z on a state already filtered for +z — is
the result that makes state collapse and measurement erasure concrete. The
physics foundation is already in place (collapse correctly updates the Bloch
sphere state); what is needed is a dedicated UI showing:

- Multiple SG boxes in a linear chain
- Per-output blocking/passing controls (block +½, block −½, or pass both)
- State propagating through the chain with running probabilities at each stage
- A clear label explaining why the last SG-z gives 50/50 despite earlier filtering

---

## Deployment / Packaging

### Docker Compose (before JOSS submission)

Add `docker-compose.yml` plus two Dockerfiles so the app starts with a single
command on any machine regardless of Python/Node installation:

```
docker compose up
# → open http://localhost:5173
```

Scope:
- `backend/Dockerfile` — Python slim image, `pip install -r requirements.txt`, `uvicorn`
- `frontend/Dockerfile` — Node image for `npm run build`, then `nginx:alpine` to serve the Vite dist
- `docker-compose.yml` — wires the two services, exposes ports 8000 and 5173
- README: add one-line Docker alternative alongside `run.sh`

Primary motivation: JOSS reviewers need to reproduce the software on an
unfamiliar machine; a working `docker compose up` is a strong reproducibility
signal.

### GitHub Actions: publish Docker image to GHCR (after Docker Compose works)

Add a workflow that builds and pushes a tagged image to GitHub Container
Registry on each release tag. README can then say:

```
docker compose up   # no build step — pulls pre-built image
```

Reduces first-run time from ~2 min (local build) to ~10 s (pull).

---

## Future / Nice-to-Have

### 2D solver (time-dependent + stationary)

The single largest gap vs. QMsolve. Would enable double-slit interference,
2D harmonic oscillator, and quantum billiards — all visually distinctive and
pedagogically iconic.

**Why deferred:** 2D Crank-Nicolson requires ADI (alternating direction implicit)
or split-step Fourier; a 200×200 grid produces 40,000-point frames that stress
the browser's Plotly heatmap renderer. Performance needs a WebGL-based renderer
or server-side frame encoding before this is viable as a web app. Estimate 3–4
weeks of implementation, plus separate frontend performance work.

**When to revisit:** After the current feature set is stable and JOSS submission
is underway (~late 2026). The grid abstraction in the backend was designed to be
dimension-agnostic, so the groundwork is already in place.

Planned visualisation:
- Heatmap + contour for |ψ(x,y,t)|²
- Optional probability current vector field J(x,y,t)
- Presets: double-slit aperture, 2D infinite square well, 2D HO, stadium billiard

---

### Module Sequencing Roadmap

- **Phase 2 — Perturbation Theory** (prerequisite for Zeeman)
  The Zeeman effect is an application of perturbation theory — you cannot
  understand it properly without first learning how small perturbations shift
  energy levels. Fine/hyperfine structure follows naturally from the same toolkit.

- **Phase 3 — Many-Body Physics** (prerequisite for Condensed Matter)
  Hartree-Fock, Slater determinants, and second quantization are the language
  in which crystals, metals, and semiconductors are actually described.

- **Phase 4 — Condensed Matter** (as a block)
  Crystals → Metals → Semiconductors is the canonical order (each builds on
  Bloch's theorem). The Ising model is slightly detached — it is statistical
  physics more than QM — but it is excellent preparation for understanding
  phase transitions before tackling superconductivity.

- **Phase 5 — Dirac Equation** (capstone)
  Requires comfort with all of QM and some exposure to special relativity.
  Natural capstone before quantum field theory.

## Completed

**Node counting annotation** (stationary mode) — 2026-05-02
Each eigenfunction legend entry now shows its node count (e.g. "ψ₂ (1 node)"),
counted from zero-crossings with a boundary margin. Confirms Sturm-Liouville
ordering at a glance.

**Real and imaginary parts of ψ(x,t)** (time-evolution mode) — 2026-05-02
Checkbox "Show Re(ψ) and Im(ψ)" added above the main plot. Re(ψ) shown as a
green dashed line, Im(ψ) as orange dotted. Backend adds `re_frames` and
`im_frames` to `EvolveResponse`; frontend renders them in sync with animation.

**Sequential measurements in spin** (Measurement tab) — 2026-05-02
"Measure once" now appends each result to a persistent history panel. When
consecutive measurements use different axes, an explanatory note fires explaining
state collapse and non-commutativity. A second note fires on the classic z→x→z
sequence to explain measurement erasure.
