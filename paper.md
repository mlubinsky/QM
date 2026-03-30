---
title: 'Schrödinger Solver: A Browser-Based Tool for 1D Quantum Mechanics'
tags:
  - quantum mechanics
  - Schrödinger equation
  - Crank-Nicolson
  - wavefunction
  - Python
  - React
authors:
  - name: Michael Lubinsky
    orcid: 0000-0000-0000-0000   # TODO: replace with actual ORCID
    affiliation: 1
affiliations:
  - name: Independent Researcher   # TODO: replace with actual affiliation
    index: 1
date: 30 March 2026
bibliography: paper.bib
---

# Summary

Schrödinger Solver is an open-source, browser-based tool for solving the
one-dimensional Schrödinger equation, both in stationary and time-dependent
form. Users select a potential energy function, set grid and packet
parameters, and immediately see wavefunctions, energy levels, and animated
probability densities — all without installing any software.

The backend is a Python REST API built with FastAPI [@fastapi] that exposes
two solvers: a sparse eigensolver for bound-state energies and wavefunctions,
and a Crank-Nicolson time stepper for wavepacket dynamics. The frontend is a
React [@react] single-page application that renders interactive Plotly
[@plotly] figures and communicates with the backend over HTTP. All physical
quantities are in atomic units ($\hbar = m_e = 1$).

Six built-in potentials are provided (infinite square well, harmonic
oscillator, double well, finite square well, step potential, Gaussian
barrier), together with a safe custom-expression parser so users can define
their own $V(x)$. The tool displays exact analytic energies alongside
numerical results for the infinite square well and harmonic oscillator,
enabling immediate quantitative validation. For time-evolution runs, the
expectation values $\langle x(t) \rangle$, $\langle p(t) \rangle$, and
$\Delta x \cdot \Delta p$ are computed at every saved frame and plotted
alongside the animated wavepacket.

# Statement of Need

Interactive visualization of quantum mechanics is widely used in physics
education, yet existing tools each cover only part of the workflow a
researcher or student needs:

- **PhET simulations** [@phet] are visually engaging but provide no
  quantitative output, no API, and no ability to define custom potentials.
- **QuTiP** [@qutip] is a powerful Python library for open quantum systems
  but has no browser interface and is not aimed at 1D single-particle
  problems.
- **qmsolve** [@qmsolve] offers Python-based 1D and 3D solvers with
  Matplotlib output but requires a local Python environment and does not
  expose an HTTP API.
- **Visual Quantum Mechanics** and similar browser tools are fixed-scenario
  demonstrations, not general solvers.

Schrödinger Solver fills this gap by combining:

1. **Zero-installation access** — the browser UI requires only a running
   backend; end users need no Python or Node.js knowledge.
2. **Quantitative validation built in** — exact analytic energies and
   relative errors are displayed alongside every numerical result for known
   potentials.
3. **Programmable access** — the REST API (documented at `/docs` via Swagger
   UI) allows scripted parameter sweeps, notebook integration, and automated
   testing without going through the browser.
4. **Physically complete output** — norm history, expectation values,
   uncertainties, and Ehrenfest trajectories are all returned in the API
   response and displayed in the UI, going beyond a simple wavefunction plot.

The primary audience is advanced undergraduates, graduate students, and
researchers who want to explore quantum dynamics interactively and verify
solver correctness quantitatively.

# Methods

## Hamiltonian

The spatial domain $[x_{\min}, x_{\max}]$ is discretised onto a uniform
grid of $N$ points with spacing $\Delta x$. The Hamiltonian
$\hat{H} = -\tfrac{1}{2}\partial^2/\partial x^2 + V(x)$
is approximated by the sparse tridiagonal matrix

$$H_{ij} = \frac{1}{\Delta x^2}\delta_{ij} - \frac{1}{2\Delta x^2}\delta_{i,j\pm 1} + V_i\delta_{ij}$$

with Dirichlet boundary conditions ($\psi = 0$ at both walls). The matrix
is stored in CSR format using SciPy [@scipy].

## Eigenvalue Solver

Bound-state energies and wavefunctions are obtained from the lowest $k$
eigenvalues of $H$ using `scipy.sparse.linalg.eigsh` (ARPACK, shift-invert
mode) [@arpack]. Each wavefunction is normalised so that
$\sum_i |\psi_i|^2\,\Delta x = 1$.

## Crank-Nicolson Time Stepper

Time evolution under the time-dependent Schrödinger equation
$i\partial_t\psi = H\psi$ uses the implicit Crank-Nicolson scheme
[@crank1947]:

$$(I + \tfrac{i\,\Delta t}{2}H)\,\psi(t+\Delta t) = (I - \tfrac{i\,\Delta t}{2}H)\,\psi(t)$$

This scheme is second-order accurate in time, unconditionally stable, and
exactly unitary — the norm $\|\psi(t)\|^2$ is preserved up to floating-point
rounding regardless of the time step. The left-hand matrix is factorised
once via sparse LU decomposition (`scipy.sparse.linalg.splu`), giving
$O(N)$ cost per time step after the factorisation.

## Expectation Values

At each saved frame the following observables are computed:

$$\langle x \rangle = \int x\,|\psi|^2\,dx, \quad
\langle p \rangle = -i\int \psi^*\frac{\partial\psi}{\partial x}\,dx$$

$$\langle H \rangle = \langle\psi|H|\psi\rangle\,\Delta x, \quad
\langle p^2 \rangle = 2(\langle H \rangle - \langle V \rangle)$$

The first derivative of $\psi$ is evaluated by central differences
(`numpy.gradient`) [@numpy]. The uncertainty product
$\Delta x\,\Delta p = \sqrt{\langle x^2\rangle - \langle x\rangle^2}\cdot
\sqrt{\langle p^2\rangle - \langle p\rangle^2}$
is returned in the API response and plotted alongside a reference line at
$\tfrac{1}{2}$ (Heisenberg bound).

## Expression Safety

User-supplied potential expressions are evaluated by `asteval` [@asteval],
which does not permit `import`, attribute access, or arbitrary Python
execution.

# Validation

The solver is validated against exact analytic solutions by an automated
test suite (pytest, 37 backend tests).

**Infinite square well** ($L = x_{\max} - x_{\min}$):

$$E_n = \frac{n^2\pi^2}{2L^2}, \quad n = 1,2,3,\ldots$$

Numerical energies agree to within 0.5 % for $N = 500$ grid points.

**Harmonic oscillator** ($\omega = 1$):

$$E_n = n + \tfrac{1}{2}, \quad n = 0,1,2,\ldots$$

Numerical energies agree to within 0.5 % for $N = 500$ grid points. The
in-browser exact-solution panel displays the relative error for each
computed eigenstate.

**Norm conservation:** $\|\psi(t)\|^2$ remains within $10^{-6}$ of 1.0
across all time steps, confirmed by an automated test.

**Coherent state trajectory:** For a Gaussian packet with width
$\sigma = 1/\sqrt{2}$ (ground-state width) displaced to $x_0$ in the
harmonic oscillator potential, the exact solution predicts
$\langle x(t)\rangle = x_0\cos(t)$ and $\sigma(t) = \sigma$ (no spreading).
The numerical centre and width both agree with the analytic values to within
0.05 a.u. after $t = \pi$ (half period), confirmed by an automated test.

**Ehrenfest theorem:** $\langle x(t)\rangle = x_0\cos(t)$ is verified at
$t \approx \pi/2$ and $t \approx \pi$ to within 0.1 a.u.

**Heisenberg bound:** $\Delta x\,\Delta p \geq \tfrac{1}{2}$ is verified
for harmonic oscillator eigenstates and displaced Gaussian packets, with the
ground state saturating the bound to within $10^{-3}$ (the residual
discrepancy is a finite-grid discretisation artefact).

# Acknowledgements

The author thanks the open-source communities behind NumPy, SciPy, FastAPI,
React, and Plotly, without which this project would not have been possible.

# References
