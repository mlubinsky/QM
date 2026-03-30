# Spec 10 — Momentum-Space View: Backend

## Goal

Compute the momentum-space probability density |φ(k,t)|² at every saved
frame of a time evolution and return it in the API response.  The frontend
(spec 11) will use this data to animate |φ(k,t)|² alongside |ψ(x,t)|².

## Physics

The momentum-space wavefunction is the Fourier transform of ψ(x,t):

    φ(k) = (1/√2π) ∫ ψ(x) e^{−ikx} dx

Discrete approximation on a uniform grid of N points with spacing Δx:

    φ(k_j) ≈ (Δx/√2π) · FFT(ψ)[j] · e^{−ik_j x_min}

The phase factor e^{−ik_j x_min} drops out when taking the modulus, so:

    |φ(k_j)|² = (Δx² / 2π) · |FFT(ψ)[j]|²

The k-axis (rad / a.u.) after fftshift:

    k_j = 2π · fftfreq(N, d=Δx)   (shifted to [−k_max, k_max])

Normalization check (Parseval / unitarity):

    Σ_j |φ(k_j)|² · Δk = 1    where Δk = 2π / (N · Δx)

## Why backend is required

The frontend receives psi_frames as |ψ(x,t)|² (real, probability density).
The FFT of |ψ|² is the autocorrelation function — not the momentum
distribution.  The complex ψ is only available inside evolve(), so the
computation must happen there.

## New module: `backend/momentum.py`

```python
def k_axis(n: int, dx: float) -> np.ndarray:
    """Wavenumber axis in rad/a.u., shifted so zero is in the centre."""

def density(psi: np.ndarray, dx: float) -> np.ndarray:
    """Momentum-space probability density |φ(k)|², fftshifted.

    Normalised so that sum(density) * dk = 1  (where dk = 2π/(N·dx)).
    """
```

## Changes to `crank_nicolson.py`

- Import `momentum` module.
- Compute `momentum_k = momentum.k_axis(n, dx)` once before the evolution loop.
- In `_save_frame`: compute `momentum.density(psi_f, dx)` and store it.
- `TimeEvolutionResult` gains two new fields:
  - `momentum_frames: np.ndarray`  — shape (n_frames, n), |φ(k,t)|²
  - `momentum_k: np.ndarray`       — shape (n,), k values (same for all frames)

## Changes to `app.py`

- `EvolveResponse` gains two new fields:
  - `momentum_frames: list[list[float]]`
  - `momentum_k: list[float]`
- The evolve endpoint populates them from `result.momentum_frames` and
  `result.momentum_k`.

## Validation requirements (must be covered by tests)

1. `k_axis` has length N and is symmetric around 0.
2. `k_axis` spacing equals 2π/(N·Δx).
3. `density` integrates to 1 for a normalized input wavefunction.
4. `density` peaks near k₀ for a Gaussian packet with momentum k₀.
5. `density` for k₀ = 0 is symmetric and peaked at k = 0.
6. `TimeEvolutionResult` contains `momentum_frames` and `momentum_k`
   with correct shapes after `evolve()`.
7. `/solve/evolve` API response includes `momentum_frames` and `momentum_k`.
