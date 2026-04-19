// Static mock data matching real API response shapes exactly.
// Uses harmonic oscillator analytic values for eigenstates.

import type { EigensolveResponse, EvolveResponse } from '../types/api'

const N = 100
const x = Array.from({ length: N }, (_, i) => -5 + (10 * i) / (N - 1))

// Harmonic Oscillator analytic energies: E_n = n + 0.5
const energies = [0.5, 1.5, 2.5, 3.5, 4.5]

// Gaussian approximations for Harmonic Oscillator ground and first excited states
function gaussian(x: number[], x0: number, sigma: number): number[] {
  return x.map(xi => Math.exp(-((xi - x0) ** 2) / (2 * sigma ** 2)))
}

function normalize(arr: number[], dx: number): number[] {
  const norm = Math.sqrt(arr.reduce((s, v) => s + v * v, 0) * dx)
  return arr.map(v => v / norm)
}

const dx = x[1] - x[0]

export const mockEigenResult: EigensolveResponse = {
  energies,
  wavefunctions: energies.map((_, i) =>
    normalize(gaussian(x, 0, 1 / (i + 1)), dx)
  ),
  grid_x: x,
  dx,
  potential: x.map(xi => 0.5 * xi * xi),
  converged: true,
  norm_errors: energies.map(() => 0),
}

const nFrames = 11

// Mock momentum-space k-axis: N evenly-spaced values centred on 0
const kMax = Math.PI / dx
const momentumK = Array.from({ length: N }, (_, i) => -kMax + (2 * kMax * i) / (N - 1))

// Mock momentum density: Gaussian centred at k=0
const momentumDensity = normalize(gaussian(momentumK, 0, 1), momentumK[1] - momentumK[0]).map(v => v * v)

export const mockEvolveResult: EvolveResponse = {
  psi_frames: Array.from({ length: nFrames }, () =>
    normalize(gaussian(x, 0, 1), dx).map(v => v * v)
  ),
  times: Array.from({ length: nFrames }, (_, i) => i * 0.01),
  norm_history: Array.from({ length: nFrames }, () => 1.0),
  grid_x: x,
  potential: x.map(() => 0),
  // Mock: packet centered at x=0, k0=0 — ⟨x⟩≈0, ⟨p⟩≈0, Δx·Δp≈0.5
  expect_x:  Array.from({ length: nFrames }, () => 0.0),
  expect_p:  Array.from({ length: nFrames }, () => 0.0),
  expect_x2: Array.from({ length: nFrames }, () => 0.5),   // Δx = √0.5 = 1/√2
  expect_p2: Array.from({ length: nFrames }, () => 0.5),   // Δp = √0.5 = 1/√2
  expect_H:  Array.from({ length: nFrames }, () => 0.5),
  momentum_k: momentumK,
  momentum_frames: Array.from({ length: nFrames }, () => momentumDensity),
  // Mock current: J ≈ k₀·|ψ|² — use psi density scaled by a small constant
  current_frames: Array.from({ length: nFrames }, () =>
    normalize(gaussian(x, 0, 1), dx).map(v => v * v * 1.5)
  ),
  delta_x:         Array.from({ length: nFrames }, () => Math.SQRT1_2),
  delta_p:         Array.from({ length: nFrames }, () => Math.SQRT1_2),
  delta_x_delta_p: Array.from({ length: nFrames }, () => 0.5),
}
