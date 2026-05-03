# Spec 21 — Classical Probability Overlay (Stationary Mode)

## Goal

Overlay the classical probability density P_cl(x) on top of each quantum
eigenfunction in the stationary-mode plot, toggled by a checkbox.
Demonstrates the correspondence principle: for large n, P_cl approaches |ψₙ|².

## Physics

For a bound state with energy E in a potential V(x), a classical particle
spends time proportional to 1/v(x) at position x:

    P_cl(x) = C / v(x) = C / √(2(E − V(x)))   for V(x) ≤ E  (classically allowed)
    P_cl(x) = 0                                 for V(x) > E  (classically forbidden)

C is fixed by normalisation: ∫ P_cl(x) dx = 1.

For the harmonic oscillator (V = ½x², E = n + ½, turning point A = √(2E)):

    P_cl(x) = 1 / (π √(A² − x²))   for |x| ≤ A

which diverges (integrable) at the turning points — classically the particle
slows to rest there.

All computation is **purely frontend** — the required quantities (grid_x,
potential, energies) are already in EigensolveResponse.

## Scope

- Pure frontend: no backend changes.
- New utility: `frontend/src/utils/classicalMechanics.ts`
  - `classicalProbabilityDensity(potential, energy, dx) → number[]`
- `MainPlot.tsx`: accept `showClassical?: boolean` prop; when true, add one
  dashed classical trace per eigenstate, scaled to |ψₙ|² amplitude.
- `PlotArea.tsx`: add "Show classical P(x)" checkbox in stationary mode;
  pass flag to MainPlot.

## Visual design

Each classical trace is plotted as:

    y[i] = scale × P_cl(x[i]) + E_n

where `scale` makes the 90th-percentile of P_cl equal to `max(|ψₙ|²)`, avoiding
the divergence at turning points from dominating. Same x-domain and energy offset
as the quantum wavefunction it accompanies.

Line style: `dash: 'dot'`, `width: 1.5`, same colour as its ψₙ trace but 50%
opacity, labelled "P_cl n" in the legend.

## Acceptance criteria

1. `classicalProbabilityDensity` is normalised: `∑ P_cl[i] · dx ≈ 1` (< 1 % error).
2. P_cl = 0 outside the classically allowed region (V(x) > E).
3. For HO ground state (E=0.5, A=1): P_cl(0) matches analytic 1/π within 5%.
4. PlotArea renders a "Show classical P(x)" checkbox only in stationary mode.
5. MainPlot renders without error with `showClassical={true}`.

## Out of scope

- Scattering states (E > V at boundaries): these have no finite turning points.
  The overlay silently shows nothing (zero array) for such states.
- Tunneling region (exponentially decaying ψ beyond turning point): not shown.
- Time-evolution mode: not applicable.
