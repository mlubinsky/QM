/**
 * Classical probability density P_cl(x) for a particle in potential V(x) at energy E.
 *
 * P_cl(x) ∝ 1/v(x) = 1/√(2(E−V(x)))  where V(x) ≤ E  (classically allowed)
 * P_cl(x) = 0                           where V(x) > E  (classically forbidden)
 *
 * Normalised so ∫ P_cl(x) dx = 1. Returns all zeros when no classically allowed
 * region exists (fully unbound or E below the potential minimum).
 *
 * All quantities in atomic units (ħ = m_e = 1).
 */
export function classicalProbabilityDensity(
  potential: number[],
  energy: number,
  dx: number,
): number[] {
  const N = potential.length
  const density = new Array<number>(N).fill(0)

  for (let i = 0; i < N; i++) {
    const ke = energy - potential[i]
    if (ke > 0) {
      density[i] = 1 / Math.sqrt(2 * ke)
    }
  }

  const total = density.reduce((sum, d) => sum + d * dx, 0)
  if (total > 0) {
    for (let i = 0; i < N; i++) {
      density[i] /= total
    }
  }

  return density
}
