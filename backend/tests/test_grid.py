import numpy as np
import pytest

from grid import Grid


def test_dx():
    assert Grid(100, -10, 10).dx == pytest.approx(20 / 99)


def test_shape():
    assert Grid(100, -10, 10).shape == (100,)


def test_x_monotonically_increasing():
    g = Grid(100, -10, 10)
    assert np.all(np.diff(g.x) > 0)
