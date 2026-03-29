"""Preset potential expressions for common quantum systems."""

PRESETS: dict[str, str] = {
    "infinite_square_well": "0",
    "harmonic_oscillator":  "0.5 * x**2",
    "double_well":          "0.5 * (x**2 - 1)**2",
    "finite_square_well":   "-10 * (abs(x) < 1).astype(float)",
    "step_potential":       "10 * (x > 0).astype(float)",
    "gaussian_barrier":     "5 * exp(-x**2 / 0.5)",
}
