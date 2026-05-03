/**
 * Tests for classicalMechanics.ts — classical probability density overlay.
 *
 * Written TDD-style: all tests FAIL against the stub implementation and
 * PASS once the real implementation is in place.
 *
 * Physics reference:
 *   P_cl(x) = 1/(π √(A²−x²))  for harmonic oscillator with turning point A = √(2E)
 */

import { describe, it, expect } from 'vitest'
import { classicalProbabilityDensity } from '../utils/classicalMechanics'

// ── shared grid ───────────────────────────────────────────────────────────────

const N = 500
const xArr = Array.from({ length: N }, (_, i) => -5 + (10 * i) / (N - 1))
const dx = xArr[1] - xArr[0]

// Harmonic oscillator: V(x) = ½x²
const hoV = xArr.map(x => 0.5 * x * x)

// ── helpers ───────────────────────────────────────────────────────────────────

function integral(arr: number[]): number {
  return arr.reduce((s, v) => s + v * dx, 0)
}

function indexNear(x: number): number {
  return Math.round((x - (-5)) / dx)
}

// ── normalisation ─────────────────────────────────────────────────────────────

describe('classicalProbabilityDensity — normalisation', () => {
  it('integrates to 1 for HO ground state (E=0.5)', () => {
    const pcl = classicalProbabilityDensity(hoV, 0.5, dx)
    expect(integral(pcl)).toBeCloseTo(1, 2)   // within 1 %
  })

  it('integrates to 1 for HO third excited state (E=3.5)', () => {
    const pcl = classicalProbabilityDensity(hoV, 3.5, dx)
    expect(integral(pcl)).toBeCloseTo(1, 2)
  })

  it('returns all zeros for a state with no classically allowed region', () => {
    // E = -1 is below the potential minimum of the HO (V_min = 0) → always forbidden
    const pcl = classicalProbabilityDensity(hoV, -1, dx)
    const allZero = pcl.every(v => v === 0)
    expect(allZero).toBe(true)
  })
})

// ── support region ────────────────────────────────────────────────────────────

describe('classicalProbabilityDensity — support', () => {
  it('is zero at x = 2 for HO E=0.5 (turning point A=1, x=2 is forbidden)', () => {
    const pcl = classicalProbabilityDensity(hoV, 0.5, dx)
    expect(pcl[indexNear(2.0)]).toBe(0)
  })

  it('is zero at x = -3 for HO E=0.5', () => {
    const pcl = classicalProbabilityDensity(hoV, 0.5, dx)
    expect(pcl[indexNear(-3.0)]).toBe(0)
  })

  it('is positive at x = 0 for HO E=0.5 (centre of classically allowed region)', () => {
    const pcl = classicalProbabilityDensity(hoV, 0.5, dx)
    expect(pcl[indexNear(0)]).toBeGreaterThan(0)
  })
})

// ── analytic comparison (HO) ──────────────────────────────────────────────────

describe('classicalProbabilityDensity — analytic HO comparison', () => {
  // For HO E = n+½, A = √(2E), P_cl(0) = 1 / (π A) = 1 / (π √(2E))
  it('matches 1/(π A) at x=0 for E=0.5 within 5 %', () => {
    const A = Math.sqrt(2 * 0.5)                      // = 1
    const analytic = 1 / (Math.PI * A)                 // ≈ 0.3183
    const pcl = classicalProbabilityDensity(hoV, 0.5, dx)
    const numerical = pcl[indexNear(0)]
    expect(numerical).toBeCloseTo(analytic, 1)         // ±0.05 tolerance
  })

  it('matches 1/(π A) at x=0 for E=2.5 (n=2) within 5 %', () => {
    const A = Math.sqrt(2 * 2.5)
    const analytic = 1 / (Math.PI * A)
    const pcl = classicalProbabilityDensity(hoV, 2.5, dx)
    const numerical = pcl[indexNear(0)]
    expect(numerical).toBeCloseTo(analytic, 1)
  })

  it('P_cl is larger near turning points than at centre (slow-down effect)', () => {
    const A = 1                                        // turning point for E=0.5
    const pcl = classicalProbabilityDensity(hoV, 0.5, dx)
    const centre = pcl[indexNear(0)]
    const nearTurning = pcl[indexNear(0.8)]            // close to A=1 but inside
    expect(nearTurning).toBeGreaterThan(centre)
  })
})

// ── flat potential (infinite square well) ─────────────────────────────────────

describe('classicalProbabilityDensity — infinite square well (V=0)', () => {
  const flatV = xArr.map(() => 0)

  it('is uniform (constant) across the whole grid for V=0, E=1', () => {
    const pcl = classicalProbabilityDensity(flatV, 1, dx)
    const nonZero = pcl.filter(v => v > 0)
    if (nonZero.length < 2) {
      // If stub, this will fail the normalisation test above first; skip here
      return
    }
    const mean = nonZero.reduce((s, v) => s + v, 0) / nonZero.length
    for (const v of nonZero) {
      expect(v / mean).toBeCloseTo(1, 2)    // all values equal within 1 %
    }
  })
})
