"""Eigenvalue solver for stationary quantum states.

Solves the time-independent Schrödinger equation:

    H ψₙ = Eₙ ψₙ

using ARPACK via ``scipy.sparse.linalg.eigsh`` to find the lowest k
eigenvalues and eigenvectors of the sparse Hamiltonian.

All quantities in atomic units: ħ = m_e = 1.
"""

import logging
import warnings
from dataclasses import dataclass

import numpy as np
from scipy.sparse import spmatrix
from scipy.sparse.linalg import eigsh, ArpackNoConvergence

logger = logging.getLogger(__name__)


@dataclass
class EigenstateResult:
    """Result of an eigenvalue solve.

    Attributes
    ----------
    energies : np.ndarray
        Shape ``(k,)``.  Energy eigenvalues in ascending order, in
        atomic units (Hartree).
    wavefunctions : np.ndarray
        Shape ``(k, grid.n)``.  Each row is one normalised eigenstate ψₙ,
        ordered to match ``energies``.  Normalised so that
        ``sum(|ψₙ|²) * dx == 1``.
    grid_x : np.ndarray
        Shape ``(grid.n,)``.  Grid x-coordinates in atomic units.
    dx : float
        Grid spacing in atomic units.
    converged : bool
        ``True`` if ARPACK converged to all k requested eigenpairs.
    norm_errors : np.ndarray
        Shape ``(k,)``.  Per-state normalisation residual
        ``|1 - sum(|ψₙ|²) * dx|``.  Should be < 1e-10 for a well-resolved
        grid.
    """

    energies: np.ndarray
    wavefunctions: np.ndarray
    grid_x: np.ndarray
    dx: float
    converged: bool
    norm_errors: np.ndarray


def solve_eigenstates(
    hamiltonian: spmatrix,
    grid_x: np.ndarray,
    dx: float,
    k: int = 5,
) -> EigenstateResult:
    """Solve H ψ = E ψ and return the lowest k eigenstates.

    Parameters
    ----------
    hamiltonian : scipy.sparse.spmatrix
        Sparse Hamiltonian matrix of shape ``(N, N)``, built by
        ``hamiltonian.build_hamiltonian``.
    grid_x : np.ndarray
        Grid coordinates, shape ``(N,)``, in atomic units.
    dx : float
        Grid spacing in atomic units.  Used for normalisation.
    k : int, optional
        Number of lowest eigenstates to compute.  Must satisfy
        ``1 <= k < N``.  Default 5.

    Returns
    -------
    EigenstateResult
        Dataclass containing energies (ascending), normalised
        wavefunctions, convergence flag, and per-state norm errors.

    Notes
    -----
    Uses ``scipy.sparse.linalg.eigsh`` with ``which='SM'`` (smallest
    magnitude eigenvalues).  This is efficient for sparse matrices because
    ARPACK only needs matrix-vector products, not the full matrix.

    Post-processing:

    - Eigenvalues sorted ascending.
    - Each eigenfunction normalised so ``sum(|ψ|²) * dx == 1``.
    - Sign convention: the first element with ``|ψ| > 1e-10`` is made
      positive, ensuring consistent orientation across runs.

    If ARPACK does not converge, any partial results are returned with
    ``converged=False`` and a warning is logged.

    All quantities in atomic units: ħ = m_e = 1.
    """
    converged = True
    try:
        eigenvalues, eigenvectors = eigsh(hamiltonian, k=k, which="SA")
    except ArpackNoConvergence as exc:
        logger.warning("eigsh did not converge: %s", exc)
        eigenvalues = exc.eigenvalues
        eigenvectors = exc.eigenvectors
        converged = False

    # Sort by energy ascending
    order = np.argsort(eigenvalues)
    eigenvalues = eigenvalues[order]
    eigenvectors = eigenvectors[:, order]  # columns are eigenvectors

    # Normalize and apply sign convention
    wavefunctions = []
    for i in range(eigenvectors.shape[1]):
        psi = eigenvectors[:, i]
        psi /= np.sqrt(np.sum(np.abs(psi) ** 2) * dx)
        # Sign: first element with |ψ| > 1e-10 should be positive
        first_sig = psi[np.abs(psi) > 1e-10]
        if len(first_sig) > 0 and first_sig[0] < 0:
            psi = -psi
        wavefunctions.append(psi)

    wavefunctions = np.array(wavefunctions)  # shape (k, n)
    norm_errors = np.array([abs(1.0 - np.sum(np.abs(psi) ** 2) * dx) for psi in wavefunctions])

    return EigenstateResult(
        energies=eigenvalues,
        wavefunctions=wavefunctions,
        grid_x=grid_x,
        dx=dx,
        converged=converged,
        norm_errors=norm_errors,
    )
