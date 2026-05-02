---
title: 'Schrödinger Solver: A Browser-Based Interactive Tool for Quantum Mechanics'
tags:
  - quantum mechanics
  - Schrödinger equation
  - Crank-Nicolson
  - hydrogenic atoms
  - spin-half
  - Bloch sphere
  - Python
  - React
authors:
  - name: Michael Lubinsky
    orcid: 0000-0000-0000-0000   # TODO: replace with actual ORCID
    affiliation: 1
affiliations:
  - name: Independent Researcher   # TODO: replace with actual affiliation
    index: 1
date: 2 May 2026
bibliography: paper.bib
---

# Summary

Schrödinger Solver is an open-source, browser-based tool for exploring
quantum mechanics interactively across three complementary domains: one-dimensional
wave mechanics, hydrogen-like atomic orbitals, and spin-½ dynamics.

The backend is a Python REST API built with FastAPI [@fastapi] that exposes
solvers for each domain. The frontend is a React [@react] single-page
application that renders interactive Plotly [@plotly] and Three.js figures
and communicates with the backend over HTTP. All physical quantities are in
atomic units ($\hbar = m_e = 1$).

**1D mode** offers two solvers sharing a common grid and potential infrastructure.
The *stationary* solver finds bound-state energies and wavefunctions for
seven built-in potentials (infinite square well, harmonic oscillator, double
well, finite square well, step potential, Gaussian barrier) plus any
user-defined $V(x)$ entered as a safe math expression. The *time-evolution*
solver animates wavepacket dynamics under the same potentials, reporting
expectation values $\langle x \rangle$, $\langle p \rangle$, $\langle H \rangle$,
uncertainties $\Delta x \cdot \Delta p$, and the momentum-space density
$|\phi(k,t)|^2$ at every saved frame.

**Hydrogenic mode** solves the radial Schrödinger equation for hydrogen-like
ions (nuclear charge $Z = 1$–10, quantum numbers $n \leq 5$). Results include
the radial probability density $r^2|R_{nl}|^2$, the 2-D electron density
cross-section $|\psi(x,0,z)|^2$, the angular density $|Y_{lm}(\theta)|^2$
as a polar plot, and a Grotrian energy-level diagram with transition arrows
for all spectral series (Lyman through Pfund), coloured by emission wavelength.
Numerically computed energies are compared to the exact values
$E_n = -Z^2/(2n^2)$ Hartree.

**Spin-½ mode** provides an interactive Bloch sphere rendered in Three.js.
The *Precession* tab animates Larmor precession around a user-chosen magnetic
field direction $\hat{B}$ using the Rodrigues rotation formula, preserving
$|\mathbf{r}| = 1$ exactly. The *Measurement* tab implements a
Stern-Gerlach simulator: the exact Born-rule probability $P(+\hat{n}) =
\tfrac{1}{2}(1 + \hat{n} \cdot \hat{r})$ is displayed as a live bar, a
single-shot measurement collapses the Bloch vector to the post-measurement
eigenstate, and a multi-shot experiment draws from the binomial distribution
and displays the result histogram alongside the exact probability.

# Statement of Need

Interactive visualization tools for quantum mechanics are widely used in
physics education, but existing tools each cover only part of the conceptual
landscape a student or researcher needs, and most require either a heavy
local installation or accept significant restrictions on quantitative output:

- **PhET simulations** [@phet] are visually engaging but provide no
  quantitative output, no API, and no ability to define custom potentials.
- **QuTiP** [@qutip] is a powerful Python library for open quantum systems
  but has no browser interface and is not aimed at single-particle 1D problems.
- **qmsolve** [@qmsolve] offers Python-based 1D and 3D solvers with
  Matplotlib output but requires a local Python environment and does not
  expose an HTTP API.
- Browser-based atomic orbital viewers exist but are fixed-scenario
  demonstrations, not general solvers, and do not support time evolution
  or spin dynamics.

Schrödinger Solver addresses these gaps through four design choices:

1. **Unified scope** — 1D wave mechanics, hydrogenic atoms, and spin-½ are
   covered in a single coherent interface with a shared visual language,
   making the connections between representations explicit (e.g. the
   wavefunction factorisation $\psi = R \cdot Y$ is shown visually by
   placing the radial density and the $|Y_{lm}|^2$ polar plot side by side).
2. **Quantitative validation built in** — exact analytic energies and
   relative errors are displayed alongside every numerical result for known
   potentials, enabling immediate verification without switching tools.
3. **Programmable access** — the REST API (documented at `/docs` via Swagger
   UI) allows scripted parameter sweeps, notebook integration, and automated
   testing without going through the browser.
4. **Explorer workflow** — parameters can be varied continuously via sliders;
   results update immediately, supporting the compare-and-contrast style of
   learning recommended by physics education research.

The primary audience is advanced undergraduates, graduate students, and
researchers who want to explore quantum dynamics interactively and verify
solver correctness quantitatively.

# Methods

## 1D Hamiltonian

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

## Radial Solver (Hydrogenic)

The substitution $u(r) = r R_{nl}(r)$ reduces the radial Schrödinger
equation to the 1D form

$$-\frac{1}{2}\frac{d^2u}{dr^2} + V_{\text{eff}}(r)\,u = E\,u, \quad
V_{\text{eff}} = -\frac{Z}{r} + \frac{l(l+1)}{2r^2}$$

which is solved on an adaptive radial grid using the same sparse eigensolver
as the 1D stationary solver. The 2-D electron density on the $xz$-plane is
computed from the exact spherical harmonics $Y_{lm}$ via
`scipy.special.sph_harm` [@scipy]. The angular density $|Y_{lm}(\theta)|^2$
is evaluated on a dense $\theta$ grid and returned as a closed Cartesian
curve for the polar plot.

## Spin-½ Precession

Larmor precession is computed analytically client-side using Rodrigues'
rotation formula. The Bloch vector $\mathbf{r}$ rotates around $\hat{B}$
at rate $\omega_0$:

$$\mathbf{r}(t) = \mathbf{r}(0)\cos(\omega_0 t)
  + (\hat{B}\times\mathbf{r}(0))\sin(\omega_0 t)
  + \hat{B}(\hat{B}\cdot\mathbf{r}(0))(1-\cos(\omega_0 t))$$

This preserves $|\mathbf{r}| = 1$ exactly with no numerical integration error.

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
test suite (pytest, 100+ backend tests across all modules).

## 1D Solvers

**Infinite square well** ($L = x_{\max} - x_{\min}$):
$$E_n = \frac{n^2\pi^2}{2L^2}, \quad n = 1,2,3,\ldots$$
Numerical energies agree to within 0.5% for $N = 500$ grid points.

**Harmonic oscillator** ($\omega = 1$):
$$E_n = n + \tfrac{1}{2}, \quad n = 0,1,2,\ldots$$
Numerical energies agree to within 0.5% for $N = 500$ grid points.

**Norm conservation:** $\|\psi(t)\|^2$ remains within $10^{-6}$ of 1.0
across all time steps.

**Coherent state trajectory:** For a Gaussian packet with ground-state
width $\sigma = 1/\sqrt{2}$ displaced to $x_0$ in the harmonic oscillator,
the numerical centre $\langle x(t)\rangle$ and width $\sigma(t)$ agree with
the analytic values to within 0.05 a.u. after $t = \pi$ (half period).

**Ehrenfest theorem:** $\langle x(t)\rangle = x_0\cos(t)$ is verified at
$t \approx \pi/2$ and $t \approx \pi$ to within 0.1 a.u.

**Heisenberg bound:** $\Delta x\,\Delta p \geq \tfrac{1}{2}$ is verified
for harmonic oscillator eigenstates and displaced Gaussian packets, with
the ground state saturating the bound to within $10^{-3}$.

## Hydrogenic Solver

Numerical energies agree with $E_n = -Z^2/(2n^2)$ Hartree to within 0.1%
for $n = 1$–4, $l = 0$–3, $Z = 1$–6. Radial wavefunctions satisfy
$\int_0^\infty |u_{nl}(r)|^2\,dr = 1$ to within $10^{-4}$.
Energy ordering $E_{n,l} < E_{n',l'}$ for $n < n'$ is verified for all
tested combinations.

## Spin-½

Certainty cases verified: $|\!\uparrow\rangle$ along $z$ gives $P(+z) = 1$;
$|\!+x\rangle$ along $x$ gives $P(+x) = 1$; $|\!+x\rangle$ along $z$
gives $P(+z) = 0.5$. Precession preserves $|\mathbf{r}| = 1$ at every frame
by construction (Rodrigues formula). Post-measurement state collapse verified
by checking that a second measurement along the same axis always returns the
same outcome.

# Acknowledgements

The author thanks the open-source communities behind NumPy, SciPy, FastAPI,
React, Plotly, and Three.js, without which this project would not have been
possible.

# References
