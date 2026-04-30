"""Preset potential expressions for common quantum systems.

Expressions are evaluated by potential_parser.parse_potential() over a
numpy grid array x.  All quantities in atomic units (ħ = m_e = 1).

double_well / deep_double_well encode the default parameter values;
when the UI sends parameterized sliders it always sends potential_expr
instead, so these presets serve as the /presets listing and fallback.
"""

PRESETS: dict[str, str] = {
    # Infinite square well — walls enforced by Dirichlet BCs; V=0 inside
    "infinite_square_well": "0",
    # Harmonic oscillator — ω = 1 a.u.
    "harmonic_oscillator":  "0.5 * x**2",
    # Double well — default λ=0.5, a=1  →  barrier height V(0) = 0.5 a.u.
    "double_well":          "0.5 * (x**2 - 1)**2",
    # Deep double well — default λ=2, a=√2  →  barrier height V(0) ≈ 8 a.u.
    "deep_double_well":     "2.0 * (x**2 - 2.0)**2",
    # Finite square well — depth 10 a.u., half-width 3 a.u.
    "finite_square_well":   "-10 * (abs(x) < 3).astype(float)",
    # Step potential — height 5 a.u. at x = 0
    "step_potential":       "5 * (x > 0).astype(float)",
    # Gaussian barrier — height 5 a.u., width σ = 1 a.u.
    "gaussian_barrier":     "5 * exp(-0.5 * x**2)",
}
