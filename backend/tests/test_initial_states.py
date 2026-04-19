"""Tests for initial_states module (Spec 16, item 10).

All solver quantities in atomic units: ħ = m_e = 1.
"""

import numpy as np
import pytest

from initial_states import gaussian_packet, eigenstate_superposition


# Shared grid
X = np.linspace(-10.0, 10.0, 500)
DX = X[1] - X[0]


# ── gaussian_packet ───────────────────────────────────────────────────────────

def test_gaussian_packet_normalized():
    """||ψ||² * dx == 1 to machine precision."""
    psi = gaussian_packet(X, DX, x0=0.0, sigma=1.0, k0=0.0)
    norm = np.sum(np.abs(psi) ** 2) * DX
    assert abs(norm - 1.0) < 1e-10


def test_gaussian_packet_centre():
    """⟨x⟩ ≈ x0."""
    x0 = 2.0
    psi = gaussian_packet(X, DX, x0=x0, sigma=1.0, k0=0.0)
    prob = np.abs(psi) ** 2
    x_mean = np.sum(X * prob) * DX
    assert abs(x_mean - x0) < 1e-3


def test_gaussian_packet_is_complex_with_nonzero_k0():
    """Non-zero k0 gives a complex wave packet."""
    psi = gaussian_packet(X, DX, x0=0.0, sigma=1.0, k0=5.0)
    assert np.iscomplexobj(psi)
    assert np.any(np.imag(psi) != 0)


def test_gaussian_packet_real_for_k0_zero():
    """k0=0 should give a real-valued (purely real) packet."""
    psi = gaussian_packet(X, DX, x0=0.0, sigma=1.0, k0=0.0)
    # imaginary part should be zero to float precision
    np.testing.assert_allclose(np.imag(psi), 0.0, atol=1e-15)


def test_gaussian_packet_width():
    """Standard deviation of |ψ|² ≈ σ for our packet convention.

    ψ ∝ exp(-(x-x0)²/4σ²)  →  |ψ|² ∝ exp(-(x-x0)²/2σ²)
    This is a Gaussian with variance σ², so Δx = σ.
    """
    sigma = 1.5
    psi = gaussian_packet(X, DX, x0=0.0, sigma=sigma, k0=0.0)
    prob = np.abs(psi) ** 2
    x_mean = np.sum(X * prob) * DX
    x2_mean = np.sum(X ** 2 * prob) * DX
    delta_x = np.sqrt(x2_mean - x_mean ** 2)
    expected = sigma
    assert abs(delta_x - expected) / expected < 0.01  # within 1%


def test_gaussian_packet_narrow_sigma_still_normalised():
    """Very narrow packet (sigma = 0.1) should still be normalized."""
    psi = gaussian_packet(X, DX, x0=0.0, sigma=0.1, k0=0.0)
    norm = np.sum(np.abs(psi) ** 2) * DX
    assert abs(norm - 1.0) < 1e-6


# ── eigenstate_superposition ──────────────────────────────────────────────────

def test_eigenstate_superposition_normalized():
    """Superposition of two normalized real states is normalized."""
    # Construct two orthonormal test states (box eigenstates)
    L = X[-1] - X[0]
    psi1 = np.sqrt(2 / L) * np.sin(np.pi * (X - X[0]) / L)
    psi2 = np.sqrt(2 / L) * np.sin(2 * np.pi * (X - X[0]) / L)
    wavefunctions = np.stack([psi1, psi2])
    coefficients = np.array([1.0, 1.0])  # equal mix, not pre-normalized

    psi = eigenstate_superposition(wavefunctions, coefficients, DX)
    norm = np.sum(np.abs(psi) ** 2) * DX
    assert abs(norm - 1.0) < 1e-10


def test_eigenstate_superposition_single_state():
    """Superposition of a single state returns that state (normalized)."""
    L = X[-1] - X[0]
    psi1 = np.sqrt(2 / L) * np.sin(np.pi * (X - X[0]) / L)
    wavefunctions = np.stack([psi1])
    coefficients = np.array([2.0])   # arbitrary non-unit coefficient

    psi = eigenstate_superposition(wavefunctions, coefficients, DX)
    norm = np.sum(np.abs(psi) ** 2) * DX
    assert abs(norm - 1.0) < 1e-10
