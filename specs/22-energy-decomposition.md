# Spec 22 — Energy Decomposition Bar Chart (Time-Evolution Mode)

## Goal

Show the expansion of ψ(x,0) in the energy eigenbasis as a bar chart in
time-evolution mode, with a ? physics helper panel.  Connects the visible
animation to superposition, phase evolution, interference, and dispersion.

## Physics

Any state can be written as:

    ψ(x,0) = Σₙ cₙ ψₙ(x)    with  cₙ = ⟨ψₙ|ψ(0)⟩ = ∫ ψₙ*(x) ψ(x,0) dx

Time evolution is exact in the eigenbasis:

    ψ(x,t) = Σₙ cₙ e^{−iEₙt} ψₙ(x)

The weights |cₙ|² are **time-independent** (energy is conserved).

The probability density contains interference terms:

    |ψ(x,t)|² = Σₙ |cₙ|² |ψₙ|²  +  2 Σₘ>ₙ Re[cₘ cₙ* e^{−i(Eₘ−Eₙ)t} ψₘ ψₙ*]

The cross terms oscillate at the **Bohr frequencies** ωₘₙ = Eₘ − Eₙ (atomic units).
The beating period between modes m and n is T = 2π / |Eₘ − Eₙ|.

## Scope

**Backend** — minimal addition to the evolve endpoint:
- Compute the lowest 10 eigenstates (ARPACK). For the `superposition` initial
  state, reuse the eigenstates already computed; no extra solver call.
- Compute cₙ = Σᵢ ψₙ*(xᵢ) ψ₀(xᵢ) · dx for each eigenstate.
- Add two new fields to `EvolveResponse`:
  - `decomp_energies: list[float]`  — Eₙ values (length ≤ 10)
  - `decomp_weights: list[float]`   — |cₙ|² values (length ≤ 10)

**Frontend** — two new components:
- `EnergyDecompositionPlot.tsx` — Plotly bar chart + ? button
- `EnergyDecompositionInfoPanel.tsx` — physics explainer with KaTeX
- `PlotArea.tsx` — render the bar chart in time-evolution mode, below the
  Re/Im toggle and above the main animation plot.

## Bar chart design

- x-axis: eigenstate labels ψ₁, ψ₂, …
- y-axis: weight |cₙ|² (0–1)
- Hover: Eₙ value; beating period T = 2π/|Eₙ − E₁| for n > 1
- Annotation: total captured weight Σ|cₙ|²
- data-testid: `energy-decomp-plot`

## Acceptance criteria

1. Backend: `decomp_energies` and `decomp_weights` present in every
   `/schrodinger1d/solve/evolve` response.
2. Backend: weights are non-negative and sum to ≤ 1.01.
3. Backend: pure-ground-state superposition → weight[0] ≈ 1.
4. Backend: equal c₁=c₂ superposition → weight[0] ≈ weight[1] ≈ 0.5.
5. Frontend: `EnergyDecompositionPlot` renders when `decomp_weights` is
   non-empty; returns null when empty.
6. Frontend: ? button opens the info modal.
