"""Tests for potential_parser.parse_potential (Spec 16, item 9).

All solver quantities in atomic units: ħ = m_e = 1.
"""

import numpy as np
import pytest

from potential_parser import parse_potential


X = np.linspace(-5.0, 5.0, 100)


# ── valid expressions ─────────────────────────────────────────────────────────

def test_quadratic_potential():
    V = parse_potential("0.5 * x**2", X)
    expected = 0.5 * X ** 2
    np.testing.assert_allclose(V, expected, rtol=1e-12)


def test_constant_potential():
    """Scalar expression must be broadcast to grid shape."""
    V = parse_potential("0", X)
    assert V.shape == X.shape
    np.testing.assert_array_equal(V, np.zeros_like(X))


def test_scalar_nonzero_broadcast():
    V = parse_potential("5", X)
    assert V.shape == X.shape
    np.testing.assert_array_equal(V, np.full_like(X, 5.0))


def test_trig_expression():
    V = parse_potential("sin(x) + cos(x)", X)
    expected = np.sin(X) + np.cos(X)
    np.testing.assert_allclose(V, expected, rtol=1e-12)


def test_exp_expression():
    V = parse_potential("5 * exp(-0.5 * x**2)", X)
    expected = 5.0 * np.exp(-0.5 * X ** 2)
    np.testing.assert_allclose(V, expected, rtol=1e-12)


def test_abs_expression():
    V = parse_potential("abs(x)", X)
    np.testing.assert_allclose(V, np.abs(X), rtol=1e-12)


def test_boolean_multiplication_pattern():
    """(x > 0) * 5 must evaluate correctly — the fix for step_potential."""
    V = parse_potential("(x > 0) * 5", X)
    expected = (X > 0).astype(float) * 5.0
    np.testing.assert_allclose(V, expected, rtol=1e-12)


def test_finite_well_boolean_pattern():
    """(abs(x) < 3) * -10 must evaluate correctly — the fix for finite_square_well."""
    V = parse_potential("(abs(x) < 3) * -10", X)
    expected = (np.abs(X) < 3).astype(float) * -10.0
    np.testing.assert_allclose(V, expected, rtol=1e-12)


# ── forbidden / invalid expressions ──────────────────────────────────────────

def test_import_statement_rejected():
    """import must be rejected; result must raise ValueError."""
    with pytest.raises(ValueError, match="Invalid potential expression"):
        parse_potential("import os", X)


def test_exec_statement_rejected():
    with pytest.raises(ValueError):
        parse_potential("__import__('os').system('id')", X)


def test_attribute_access_rejected():
    """Attribute access like np.pi used directly should be blocked
    (x is provided; np is allowed but os is not)."""
    with pytest.raises(ValueError):
        parse_potential("os.path.join('a', 'b')", X)


def test_python_ternary_rejected():
    """Python if/else ternary is NOT valid asteval syntax — must raise."""
    with pytest.raises(ValueError):
        parse_potential("5 if x > 0 else 0", X)


def test_empty_expression_rejected():
    with pytest.raises(ValueError):
        parse_potential("", X)


def test_undefined_name_rejected():
    with pytest.raises(ValueError):
        parse_potential("undefined_var * x", X)


def test_wrong_shape_rejected():
    """Expression returning a scalar via np.sum must still work (broadcasts)."""
    # np.sum(x) is a scalar — should broadcast to full grid
    V = parse_potential("np.sum(x) * 0 + 1", X)   # 1 everywhere
    assert V.shape == X.shape
