/**
 * Tests for matrixElements.ts — Heisenberg picture matrix computations.
 *
 * All quantities in atomic units (ħ = m_e = 1).
 *
 * Analytic reference values used below:
 *   Harmonic oscillator (ω = 1) on a large grid:
 *     X₀₁ = ⟨ψ₀|x|ψ₁⟩ = 1/√2 ≈ 0.7071
 *     X₀₀ = ⟨ψ₀|x|ψ₀⟩ = 0  (by parity)
 *     P₀₁ = ⟨ψ₀|p|ψ₁⟩ = i/√2  →  Im[P₀₁] = 1/√2 ≈ 0.7071
 */

import { describe, it, expect } from 'vitest'
import { buildH, buildX, buildP, heisenbergRe } from '../utils/matrixElements'

// ---------------------------------------------------------------------------
// Shared harmonic oscillator fixtures (analytic eigenfunctions on a grid)
// ψ₀(x) ∝ exp(−x²/2),  ψ₁(x) ∝ x·exp(−x²/2)
// ---------------------------------------------------------------------------

function makeGrid(xMin: number, xMax: number, n: number): number[] {
  const dx = (xMax - xMin) / (n - 1)
  return Array.from({ length: n }, (_, i) => xMin + i * dx)
}

function normalise(psi: number[], dx: number): number[] {
  const norm = Math.sqrt(psi.reduce((s, v) => s + v * v, 0) * dx)
  return psi.map(v => v / norm)
}

const N_GRID = 800
const X_MIN = -8
const X_MAX = 8
const grid_x = makeGrid(X_MIN, X_MAX, N_GRID)
const dx = (X_MAX - X_MIN) / (N_GRID - 1)

// ψ₀ and ψ₁ for harmonic oscillator (ω = 1, a.u.)
const psi0_raw = grid_x.map(x => Math.exp(-x * x / 2))
const psi1_raw = grid_x.map(x => x * Math.exp(-x * x / 2))
const psi0 = normalise(psi0_raw, dx)
const psi1 = normalise(psi1_raw, dx)
const wavefunctions = [psi0, psi1]
const energies = [0.5, 1.5]   // E₀ = ½, E₁ = 3/2  (ħω(n + ½), ω = 1)

// ---------------------------------------------------------------------------
// buildH
// ---------------------------------------------------------------------------

describe('buildH', () => {
  it('returns the energies array unchanged', () => {
    const H = buildH(energies)
    expect(H).toHaveLength(2)
    expect(H[0]).toBeCloseTo(0.5, 10)
    expect(H[1]).toBeCloseTo(1.5, 10)
  })

  it('works for a single eigenstate', () => {
    const H = buildH([2.467])
    expect(H[0]).toBeCloseTo(2.467, 10)
  })
})

// ---------------------------------------------------------------------------
// buildX
// ---------------------------------------------------------------------------

describe('buildX', () => {
  it('returns an N×N matrix (array of N arrays each length N)', () => {
    const X = buildX(wavefunctions, grid_x, dx)
    expect(X).toHaveLength(2)
    expect(X[0]).toHaveLength(2)
    expect(X[1]).toHaveLength(2)
  })

  it('is symmetric: X[m][n] === X[n][m]', () => {
    const X = buildX(wavefunctions, grid_x, dx)
    expect(X[0][1]).toBeCloseTo(X[1][0], 8)
  })

  it('diagonal X[0][0] ≈ 0 (parity: ψ₀ is even, x is odd)', () => {
    const X = buildX(wavefunctions, grid_x, dx)
    expect(Math.abs(X[0][0])).toBeLessThan(1e-6)
  })

  it('diagonal X[1][1] ≈ 0 (parity: ψ₁ is odd, x is odd)', () => {
    const X = buildX(wavefunctions, grid_x, dx)
    expect(Math.abs(X[1][1])).toBeLessThan(1e-6)
  })

  it('off-diagonal X[0][1] ≈ 1/√2 (harmonic oscillator analytic result)', () => {
    const X = buildX(wavefunctions, grid_x, dx)
    expect(X[0][1]).toBeCloseTo(1 / Math.sqrt(2), 3)
  })
})

// ---------------------------------------------------------------------------
// buildP
// ---------------------------------------------------------------------------

describe('buildP', () => {
  it('returns an N×N matrix', () => {
    const P = buildP(wavefunctions, dx)
    expect(P).toHaveLength(2)
    expect(P[0]).toHaveLength(2)
  })

  it('is antisymmetric: P[m][n] === −P[n][m]', () => {
    const P = buildP(wavefunctions, dx)
    expect(P[0][1]).toBeCloseTo(-P[1][0], 8)
  })

  it('diagonal P[m][m] === 0 (antisymmetry requires P_mm = −P_mm = 0)', () => {
    const P = buildP(wavefunctions, dx)
    expect(Math.abs(P[0][0])).toBeLessThan(1e-10)
    expect(Math.abs(P[1][1])).toBeLessThan(1e-10)
  })

  it('off-diagonal |P[0][1]| ≈ 1/√2 (harmonic oscillator analytic result)', () => {
    const P = buildP(wavefunctions, dx)
    // Im[P₀₁] = 1/√2 for HO; buildP stores Im[P_mn]
    expect(Math.abs(P[0][1])).toBeCloseTo(1 / Math.sqrt(2), 3)
  })
})

// ---------------------------------------------------------------------------
// heisenbergRe
// ---------------------------------------------------------------------------

describe('heisenbergRe', () => {
  const X = buildX(wavefunctions, grid_x, dx)

  it('at t = 0, Re[O(0)] equals the static matrix', () => {
    const Xt = heisenbergRe(X, energies, 0)
    expect(Xt[0][0]).toBeCloseTo(X[0][0], 10)
    expect(Xt[0][1]).toBeCloseTo(X[0][1], 10)
    expect(Xt[1][0]).toBeCloseTo(X[1][0], 10)
    expect(Xt[1][1]).toBeCloseTo(X[1][1], 10)
  })

  it('diagonal elements are unchanged at any t (ω_nn = 0)', () => {
    const t = 3.7
    const Xt = heisenbergRe(X, energies, t)
    expect(Xt[0][0]).toBeCloseTo(X[0][0], 10)
    expect(Xt[1][1]).toBeCloseTo(X[1][1], 10)
  })

  it('off-diagonal (0,1) flips sign at t = π / ω₀₁', () => {
    // ω₀₁ = E₀ − E₁ = 0.5 − 1.5 = −1.0,  |ω₀₁| = 1.0
    // Re[X₀₁(t)] = X₀₁ · cos(ω₀₁ · t) = X₀₁ · cos(−t)
    // At t = π: cos(−π) = −1  →  Re[X₀₁(π)] = −X₀₁
    const t = Math.PI
    const Xt = heisenbergRe(X, energies, t)
    expect(Xt[0][1]).toBeCloseTo(-X[0][1], 3)
  })

  it('off-diagonal (0,1) returns to original at t = 2π / |ω₀₁|', () => {
    // Full period: t = 2π / |ω₀₁| = 2π
    const t = 2 * Math.PI
    const Xt = heisenbergRe(X, energies, t)
    expect(Xt[0][1]).toBeCloseTo(X[0][1], 3)
  })
})
