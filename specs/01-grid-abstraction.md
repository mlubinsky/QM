# Grid Abstraction

## Goal
A Grid class that the Hamiltonian builder accepts.
Must work for 1D now, extensible to 2D without interface change.

## Interface
Grid(n_points, x_min, x_max) 
- .x  → ndarray of spatial coordinates
- .dx → grid spacing
- .n  → number of points
- .shape → tuple (n,) in 1D, (nx, ny) in 2D later

## Tests required
- Grid(100, -10, 10).dx == 20/99
- Grid(100, -10, 10).shape == (100,)
- x array is monotonically increasing

## Do not implement
- Any Hamiltonian logic in this file
```


