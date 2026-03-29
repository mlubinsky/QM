import numpy as np


class Grid:
    def __init__(self, n_points: int, x_min: float, x_max: float):
        self._x = np.linspace(x_min, x_max, n_points)

    @property
    def x(self) -> np.ndarray:
        return self._x

    @property
    def dx(self) -> float:
        return float(self._x[1] - self._x[0])

    @property
    def n(self) -> int:
        return len(self._x)

    @property
    def shape(self) -> tuple:
        return (self.n,)
