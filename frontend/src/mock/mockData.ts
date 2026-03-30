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
export const mockEvolveResult: EvolveResponse = {
  psi_frames: Array.from({ length: nFrames }, () =>
    normalize(gaussian(x, 0, 1), dx).map(v => v * v)
  ),
  times: Array.from({ length: nFrames }, (_, i) => i * 0.01),
  norm_history: Array.from({ length: nFrames }, () => 1.0),
  grid_x: x,
  potential: x.map(() => 0),
}
