# Built-in Potentials — Analytical Solvability

Summary of which potentials have exact analytical solutions for the stationary and
time-dependent Schrödinger equations. Relevant for understanding where numerical
results can be validated against theory and where norm conservation is the only check.

## Fully closed-form

Eigenvalues and eigenfunctions in closed form. Both stationary and time-evolution
solutions are exact (time evolution via superposition of exact eigenstates).

| Potential | Eigenvalues | Eigenfunctions |
|---|---|---|
| Infinite square well | E_n = n²π²/2L² (atomic units) | ψ_n = √(2/L) sin(nπx/L) |
| Harmonic oscillator | E_n = n + ½ (atomic units) | Hermite polynomials × Gaussian |

The harmonic oscillator also admits exact coherent-state time evolution: a Gaussian
wavepacket that oscillates without spreading.

## Piecewise analytical, eigenvalues from transcendental equations

Eigenfunctions are exact piecewise expressions (sinusoids / exponentials), but
eigenvalue energies have no closed form — they satisfy transcendental equations
that must be solved numerically.

| Potential | Transcendental condition |
|---|---|
| Finite square well | z·tan(z) = √(z₀²−z²) (even); −z·cot(z) = √(z₀²−z²) (odd) |
| Step potential | Continuity + derivative matching at the step; eigenvalues from root-finding |

Time evolution for these potentials requires the numerically-obtained eigenvalues and
is therefore semi-analytical, not closed-form.

## No exact analytical solutions

Numerical methods (Crank-Nicolson, matrix diagonalisation) are the only rigorous
approach. For these potentials, **norm conservation** (‖ψ(t)‖² within 1×10⁻⁶ of 1.0)
is the primary validation check; there is no analytical ground truth for eigenvalues.

| Potential | Why no exact solution |
|---|---|
| Double well | Quartic potential V ~ A(x²−a²)² — no closed-form eigenfunctions |
| Deep double well | Same family, different depth/width parameters |
| Gaussian barrier | V ~ V₀ exp(−x²/2σ²) — Schrödinger equation has no known closed form |

WKB and perturbation theory give useful approximations for these (e.g. tunnel
splitting in the double well) but are not exact.

## Validation strategy per potential

| Potential | Primary validation | Secondary |
|---|---|---|
| Infinite square well | E_n = n²π²/2L² | norm conservation |
| Harmonic oscillator | E_n = n + ½ | norm conservation, coherent-state trajectory |
| Finite square well | Transcendental eigenvalue check | norm conservation |
| Step potential | Transcendental eigenvalue check | norm conservation |
| Double well | norm conservation only | tunnel-splitting WKB estimate (approximate) |
| Deep double well | norm conservation only | — |
| Gaussian barrier | norm conservation only | WKB transmission coefficient (approximate) |
