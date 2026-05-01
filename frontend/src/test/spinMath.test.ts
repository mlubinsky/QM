/**
 * Tests for spinMath.ts — client-side spin-½ math.
 *
 * Written before the implementation (TDD). All should FAIL until
 * src/utils/spinMath.ts exists.
 *
 * All quantities in atomic units (ħ = m_e = 1).
 */

import { describe, it, expect } from 'vitest'
import { blochVector, rodriguezRotate, computeTrajectory, collapseState } from '../utils/spinMath'

const PI = Math.PI
const SQRT2 = Math.sqrt(2)

function norm(v: [number, number, number]): number {
  return Math.sqrt(v[0] ** 2 + v[1] ** 2 + v[2] ** 2)
}

// ── blochVector ───────────────────────────────────────────────────────────────

describe('blochVector', () => {
  it('θ=0 → north pole (0, 0, 1) = |↑⟩', () => {
    const r = blochVector(0, 0)
    expect(r[0]).toBeCloseTo(0, 12)
    expect(r[1]).toBeCloseTo(0, 12)
    expect(r[2]).toBeCloseTo(1, 12)
  })

  it('θ=π → south pole (0, 0, -1) = |↓⟩', () => {
    const r = blochVector(PI, 0)
    expect(r[0]).toBeCloseTo(0, 10)
    expect(r[1]).toBeCloseTo(0, 12)
    expect(r[2]).toBeCloseTo(-1, 12)
  })

  it('θ=π/2, φ=0 → (1, 0, 0) = |+x⟩', () => {
    const r = blochVector(PI / 2, 0)
    expect(r[0]).toBeCloseTo(1, 12)
    expect(r[1]).toBeCloseTo(0, 12)
    expect(r[2]).toBeCloseTo(0, 12)
  })

  it('θ=π/2, φ=π/2 → (0, 1, 0) = |+y⟩', () => {
    const r = blochVector(PI / 2, PI / 2)
    expect(r[0]).toBeCloseTo(0, 12)
    expect(r[1]).toBeCloseTo(1, 12)
    expect(r[2]).toBeCloseTo(0, 12)
  })

  it('θ=π/2, φ=π → (-1, 0, 0) = |−x⟩', () => {
    const r = blochVector(PI / 2, PI)
    expect(r[0]).toBeCloseTo(-1, 12)
    expect(r[1]).toBeCloseTo(0, 10)
    expect(r[2]).toBeCloseTo(0, 12)
  })

  it('|r| = 1 for arbitrary angles', () => {
    expect(norm(blochVector(1.2, 2.4))).toBeCloseTo(1, 12)
    expect(norm(blochVector(0.5, 5.1))).toBeCloseTo(1, 12)
  })
})

// ── rodriguezRotate ───────────────────────────────────────────────────────────

describe('rodriguezRotate', () => {
  const xhat: [number, number, number] = [1, 0, 0]
  const yhat: [number, number, number] = [0, 1, 0]
  const zhat: [number, number, number] = [0, 0, 1]

  it('rotation by 0 returns the same vector', () => {
    const r = rodriguezRotate([1, 0.5, -0.3], zhat, 0)
    expect(r[0]).toBeCloseTo(1,   12)
    expect(r[1]).toBeCloseTo(0.5, 12)
    expect(r[2]).toBeCloseTo(-0.3, 12)
  })

  it('rotation by 2π returns the same vector', () => {
    const r = rodriguezRotate(xhat, zhat, 2 * PI)
    expect(r[0]).toBeCloseTo(1, 10)
    expect(r[1]).toBeCloseTo(0, 10)
    expect(r[2]).toBeCloseTo(0, 10)
  })

  it('(1,0,0) rotated π/2 around z → (0,1,0)', () => {
    const r = rodriguezRotate(xhat, zhat, PI / 2)
    expect(r[0]).toBeCloseTo(0, 12)
    expect(r[1]).toBeCloseTo(1, 12)
    expect(r[2]).toBeCloseTo(0, 12)
  })

  it('(1,0,0) rotated π around z → (-1,0,0)', () => {
    const r = rodriguezRotate(xhat, zhat, PI)
    expect(r[0]).toBeCloseTo(-1, 12)
    expect(r[1]).toBeCloseTo(0,  10)
    expect(r[2]).toBeCloseTo(0,  12)
  })

  it('(1,0,0) rotated π/2 around y → (0,0,-1)', () => {
    const r = rodriguezRotate(xhat, yhat, PI / 2)
    expect(r[0]).toBeCloseTo(0,  12)
    expect(r[1]).toBeCloseTo(0,  12)
    expect(r[2]).toBeCloseTo(-1, 12)
  })

  it('vector along rotation axis is unchanged', () => {
    const r = rodriguezRotate(zhat, zhat, 1.23)
    expect(r[0]).toBeCloseTo(0, 12)
    expect(r[1]).toBeCloseTo(0, 12)
    expect(r[2]).toBeCloseTo(1, 12)
  })

  it('|r| is preserved after rotation', () => {
    const v: [number, number, number] = [0.6, 0.8, 0]
    const axis: [number, number, number] = [1 / SQRT2, 1 / SQRT2, 0]
    const r = rodriguezRotate(v, axis, 1.7)
    expect(norm(r)).toBeCloseTo(norm(v), 12)
  })
})

// ── computeTrajectory ─────────────────────────────────────────────────────────

describe('computeTrajectory', () => {
  const zhat: [number, number, number] = [0, 0, 1]
  const omega0 = 1.0
  const tMax   = 2 * PI          // one full period
  const nFrames = 60

  it('returns exactly nFrames points', () => {
    const traj = computeTrajectory(PI / 2, 0, zhat, omega0, tMax, nFrames)
    expect(traj).toHaveLength(nFrames)
  })

  it('first frame equals blochVector(theta, phi)', () => {
    const theta = 1.1, phi = 0.7
    const traj = computeTrajectory(theta, phi, zhat, omega0, tMax, nFrames)
    const r0 = blochVector(theta, phi)
    expect(traj[0][0]).toBeCloseTo(r0[0], 12)
    expect(traj[0][1]).toBeCloseTo(r0[1], 12)
    expect(traj[0][2]).toBeCloseTo(r0[2], 12)
  })

  it('|r| = 1 for every frame', () => {
    const traj = computeTrajectory(PI / 2, 0, zhat, omega0, tMax, nFrames)
    for (const r of traj) {
      expect(norm(r)).toBeCloseTo(1, 12)
    }
  })

  it('precession under B̂=ẑ: z-component stays constant at cos(θ)', () => {
    const theta = PI / 3
    const traj = computeTrajectory(theta, 0, zhat, omega0, tMax, nFrames)
    const expectedZ = Math.cos(theta)
    for (const r of traj) {
      expect(r[2]).toBeCloseTo(expectedZ, 12)
    }
  })

  it('after one full period (t = 2π/ω₀) state returns to start', () => {
    const theta = PI / 3, phi = 0.4
    const traj = computeTrajectory(theta, phi, zhat, omega0, 2 * PI / omega0, nFrames)
    const r0 = traj[0]
    const rLast = traj[nFrames - 1]
    expect(rLast[0]).toBeCloseTo(r0[0], 6)
    expect(rLast[1]).toBeCloseTo(r0[1], 6)
    expect(rLast[2]).toBeCloseTo(r0[2], 12)
  })

  it('|↑⟩ on z-axis does not precess (degenerate case)', () => {
    const traj = computeTrajectory(0, 0, zhat, omega0, tMax, nFrames)
    for (const r of traj) {
      expect(r[0]).toBeCloseTo(0, 12)
      expect(r[1]).toBeCloseTo(0, 12)
      expect(r[2]).toBeCloseTo(1, 12)
    }
  })
})

// ── collapseState ─────────────────────────────────────────────────────────────

describe('collapseState', () => {
  const zhat: [number, number, number] = [0, 0, 1]
  const xhat: [number, number, number] = [1, 0, 0]
  const yhat: [number, number, number] = [0, 1, 0]

  it('+z measurement → |↑⟩: θ=0', () => {
    const { theta } = collapseState(zhat, '+')
    expect(theta).toBeCloseTo(0, 12)
  })

  it('-z measurement → |↓⟩: θ=π', () => {
    const { theta } = collapseState(zhat, '-')
    expect(theta).toBeCloseTo(PI, 12)
  })

  it('+x measurement → |+x⟩: θ=π/2, φ=0', () => {
    const { theta, phi } = collapseState(xhat, '+')
    expect(theta).toBeCloseTo(PI / 2, 12)
    expect(phi).toBeCloseTo(0, 12)
  })

  it('-x measurement → |−x⟩: θ=π/2, φ=π', () => {
    const { theta, phi } = collapseState(xhat, '-')
    expect(theta).toBeCloseTo(PI / 2, 12)
    expect(Math.abs(phi)).toBeCloseTo(PI, 12)
  })

  it('+y measurement → |+y⟩: θ=π/2, φ=π/2', () => {
    const { theta, phi } = collapseState(yhat, '+')
    expect(theta).toBeCloseTo(PI / 2, 12)
    expect(phi).toBeCloseTo(PI / 2, 12)
  })

  it('collapsed Bloch vector matches ±axis direction', () => {
    const axis: [number, number, number] = [1 / SQRT2, 0, 1 / SQRT2]
    const { theta: tp, phi: pp } = collapseState(axis, '+')
    const rp = blochVector(tp, pp)
    expect(rp[0]).toBeCloseTo(axis[0], 10)
    expect(rp[1]).toBeCloseTo(axis[1], 10)
    expect(rp[2]).toBeCloseTo(axis[2], 10)

    const { theta: tm, phi: pm } = collapseState(axis, '-')
    const rm = blochVector(tm, pm)
    expect(rm[0]).toBeCloseTo(-axis[0], 10)
    expect(rm[1]).toBeCloseTo(-axis[1], 10)
    expect(rm[2]).toBeCloseTo(-axis[2], 10)
  })
})
