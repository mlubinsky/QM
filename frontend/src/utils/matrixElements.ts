/**
 * Matrix elements of quantum operators in the energy eigenbasis.
 *
 * All quantities in atomic units: ħ = m_e = 1.
 *
 * For an operator Ô, the matrix element is:
 *   O_mn = ⟨ψ_m | Ô | ψ_n⟩ = Σ_j ψ_m[j] · (Ô ψ_n)[j] · Δx
 *
 * Heisenberg time evolution:
 *   O_mn(t) = O_mn(0) · exp(i · ω_mn · t),   ω_mn = E_m − E_n
 *   Re[O_mn(t)] = O_mn(0) · cos(ω_mn · t)    (for real O_mn)
 */

/**
 * Hamiltonian matrix in its own eigenbasis — diagonal, entries are energies.
 *
 * @param energies  Array of eigenvalues E_n, length N
 * @returns         Length-N array where H[n] = E_n
 */
export function buildH(energies: number[]): number[] {
  return energies.slice()
}

/**
 * Position operator matrix X_mn = ⟨ψ_m | x | ψ_n⟩.
 *
 * Result is real and symmetric for real eigenfunctions.
 * Off-diagonal structure encodes selection rules.
 *
 * @param wavefunctions  N arrays each of length G (grid points)
 * @param grid_x         Grid x-coordinates, length G
 * @param dx             Grid spacing
 * @returns              N×N matrix (array of N arrays of length N), real values
 */
export function buildX(
  wavefunctions: number[][],
  grid_x: number[],
  dx: number,
): number[][] {
  const N = wavefunctions.length
  const matrix: number[][] = Array.from({ length: N }, () => new Array(N).fill(0))

  for (let m = 0; m < N; m++) {
    for (let n = m; n < N; n++) {
      let sum = 0
      const psim = wavefunctions[m]
      const psin = wavefunctions[n]
      for (let j = 0; j < grid_x.length; j++) {
        sum += psim[j] * grid_x[j] * psin[j]
      }
      const val = sum * dx
      matrix[m][n] = val
      matrix[n][m] = val   // symmetry
    }
  }
  return matrix
}

/**
 * Momentum operator matrix: stores Im[P_mn] where P_mn = ⟨ψ_m | −i d/dx | ψ_n⟩.
 *
 * For real eigenfunctions P_mn is purely imaginary and antisymmetric:
 *   P_mn = i · Im[P_mn],   Im[P_mn] = −Im[P_nm]
 *
 * The returned matrix contains Im[P_mn] (real values).
 * Derivative computed via central finite differences; boundary points use
 * one-sided differences.
 *
 * @param wavefunctions  N arrays each of length G
 * @param dx             Grid spacing
 * @returns              N×N matrix of Im[P_mn] (real, antisymmetric)
 */
export function buildP(
  wavefunctions: number[][],
  dx: number,
): number[][] {
  const N = wavefunctions.length
  const G = wavefunctions[0].length
  const matrix: number[][] = Array.from({ length: N }, () => new Array(N).fill(0))

  // Precompute dψ_n/dx for each eigenstate using central differences
  const dpsi: number[][] = wavefunctions.map(psi => {
    const d = new Array(G).fill(0)
    for (let j = 1; j < G - 1; j++) {
      d[j] = (psi[j + 1] - psi[j - 1]) / (2 * dx)
    }
    // One-sided at boundaries (ψ ≈ 0 at walls, so these are ~0 anyway)
    d[0] = (psi[1] - psi[0]) / dx
    d[G - 1] = (psi[G - 1] - psi[G - 2]) / dx
    return d
  })

  // P_mn = ⟨ψ_m | −i d/dx | ψ_n⟩
  //      = −i · Σ_j ψ_m[j] · (dψ_n/dx)[j] · Δx
  // Im[P_mn] = −Σ_j ψ_m[j] · (dψ_n/dx)[j] · Δx   (sign from −i)
  for (let m = 0; m < N; m++) {
    for (let n = m + 1; n < N; n++) {
      let sum = 0
      const psim = wavefunctions[m]
      const dpsinn = dpsi[n]
      for (let j = 0; j < G; j++) {
        sum += psim[j] * dpsinn[j]
      }
      const val = -sum * dx   // Im[P_mn] = −∫ ψ_m (dψ_n/dx) dx
      matrix[m][n] = val
      matrix[n][m] = -val     // antisymmetry
    }
    // diagonal is 0 by antisymmetry
  }
  return matrix
}

/**
 * Heisenberg time evolution: compute Re[O_mn(t)] for a real matrix O.
 *
 *   O_mn(t) = O_mn(0) · exp(i · ω_mn · t),   ω_mn = E_m − E_n
 *   Re[O_mn(t)] = O_mn(0) · cos((E_m − E_n) · t)
 *
 * Diagonal elements are time-independent (ω_nn = 0 → cos = 1).
 *
 * @param O        N×N real matrix at t = 0 (e.g. from buildX or buildP)
 * @param energies Array of eigenvalues length N
 * @param t        Time in atomic units
 * @returns        N×N matrix of Re[O_mn(t)]
 */
export function heisenbergRe(
  O: number[][],
  energies: number[],
  t: number,
): number[][] {
  const N = O.length
  return Array.from({ length: N }, (_, m) =>
    Array.from({ length: N }, (_, n) =>
      O[m][n] * Math.cos((energies[m] - energies[n]) * t)
    )
  )
}
