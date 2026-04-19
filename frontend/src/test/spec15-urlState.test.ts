/**
 * Spec 15 — tests for extended urlState (items 1–6).
 */
import { describe, it, expect } from 'vitest'
import {
  serializeUrlParams,
  parseUrlParams,
  hasNonDefaultUrl,
  DEFAULTS,
} from '../utils/urlState'
import type { UrlParams } from '../utils/urlState'

// A fully-populated non-default UrlParams for round-trip tests
const full: UrlParams = {
  mode: 'time-evolution',
  potential: 'double_well',
  expr: null,
  xmin: -6,
  xmax: 6,
  n: 300,
  nStates: 3,
  potentialParams: { lambda: 2.0, a: 1.5 },
  x0: -3,
  sigma: 0.8,
  k0: 3.0,
  dt: 0.002,
  nSteps: 500,
  saveEvery: 5,
}

// ── 1. Round-trip: all fields survive serialize → parse ───────────────────────

describe('Spec 15 — urlState round-trip', () => {
  it('recovers all scalar fields exactly', () => {
    const qs = serializeUrlParams(full)
    const restored = parseUrlParams(new URLSearchParams(qs))
    expect(restored.mode).toBe(full.mode)
    expect(restored.potential).toBe(full.potential)
    expect(restored.xmin).toBe(full.xmin)
    expect(restored.xmax).toBe(full.xmax)
    expect(restored.n).toBe(full.n)
    expect(restored.nStates).toBe(full.nStates)
    expect(restored.x0).toBe(full.x0)
    expect(restored.sigma).toBeCloseTo(full.sigma, 6)
    expect(restored.k0).toBe(full.k0)
    expect(restored.dt).toBeCloseTo(full.dt, 6)
    expect(restored.nSteps).toBe(full.nSteps)
    expect(restored.saveEvery).toBe(full.saveEvery)
  })

  // ── 2. p_* keys ─────────────────────────────────────────────────────────────

  it('serializes potentialParams as p_* keys', () => {
    const qs = serializeUrlParams(full)
    const sp = new URLSearchParams(qs)
    expect(sp.get('p_lambda')).toBe('2')
    expect(sp.get('p_a')).toBe('1.5')
  })

  it('parses p_* keys back into potentialParams', () => {
    const qs = serializeUrlParams(full)
    const restored = parseUrlParams(new URLSearchParams(qs))
    expect(restored.potentialParams).toEqual({ lambda: 2.0, a: 1.5 })
  })
})

// ── 3. Clamping ──────────────────────────────────────────────────────────────

describe('Spec 15 — urlState clamping', () => {
  it('clamps n > 2000 to 2000', () => {
    const sp = new URLSearchParams('n=99999')
    expect(parseUrlParams(sp).n).toBe(2000)
  })

  it('clamps n < 50 to 50', () => {
    const sp = new URLSearchParams('n=5')
    expect(parseUrlParams(sp).n).toBe(50)
  })

  it('clamps nStates > 20 to 20', () => {
    const sp = new URLSearchParams('n_states=999')
    expect(parseUrlParams(sp).nStates).toBe(20)
  })

  it('clamps nStates < 1 to 1', () => {
    const sp = new URLSearchParams('n_states=0')
    expect(parseUrlParams(sp).nStates).toBe(1)
  })

  it('swaps xmin and xmax when xmin >= xmax', () => {
    const sp = new URLSearchParams('xmin=5&xmax=-5')
    const p = parseUrlParams(sp)
    expect(p.xmin).toBe(-5)
    expect(p.xmax).toBe(5)
  })

  it('clamps dt above 0.1 to 0.1', () => {
    const sp = new URLSearchParams('dt=999')
    expect(parseUrlParams(sp).dt).toBeLessThanOrEqual(0.1)
  })

  it('clamps nSteps > 10000 to 10000', () => {
    const sp = new URLSearchParams('n_steps=99999')
    expect(parseUrlParams(sp).nSteps).toBe(10000)
  })
})

// ── 4. Defaults ──────────────────────────────────────────────────────────────

describe('Spec 15 — urlState defaults', () => {
  it('returns full default UrlParams for empty string', () => {
    const p = parseUrlParams(new URLSearchParams(''))
    expect(p.mode).toBe(DEFAULTS.mode)
    expect(p.potential).toBe(DEFAULTS.potential)
    expect(p.expr).toBe(DEFAULTS.expr)
    expect(p.xmin).toBe(DEFAULTS.xmin)
    expect(p.xmax).toBe(DEFAULTS.xmax)
    expect(p.n).toBe(DEFAULTS.n)
    expect(p.nStates).toBe(DEFAULTS.nStates)
    expect(p.potentialParams).toEqual({})
    expect(p.x0).toBe(DEFAULTS.x0)
    expect(p.sigma).toBe(DEFAULTS.sigma)
    expect(p.k0).toBe(DEFAULTS.k0)
    expect(p.dt).toBe(DEFAULTS.dt)
    expect(p.nSteps).toBe(DEFAULTS.nSteps)
  })
})

// ── 5. expr with special characters round-trips ──────────────────────────────

describe('Spec 15 — expr encoding', () => {
  it('round-trips a custom expression with + and spaces', () => {
    const params: UrlParams = { ...DEFAULTS, potential: 'custom', expr: '0.5*x**2 + 0.1*x**4' }
    const qs = serializeUrlParams(params)
    const restored = parseUrlParams(new URLSearchParams(qs))
    expect(restored.expr).toBe('0.5*x**2 + 0.1*x**4')
  })

  it('round-trips null expr when not custom', () => {
    const params: UrlParams = { ...DEFAULTS, expr: null }
    const qs = serializeUrlParams(params)
    const restored = parseUrlParams(new URLSearchParams(qs))
    expect(restored.expr).toBeNull()
  })
})

// ── 6. hasNonDefaultUrl ──────────────────────────────────────────────────────

describe('Spec 15 — hasNonDefaultUrl', () => {
  it('returns false for all-default params', () => {
    expect(hasNonDefaultUrl(DEFAULTS)).toBe(false)
  })

  it('returns false for empty URLSearchParams', () => {
    expect(hasNonDefaultUrl(parseUrlParams(new URLSearchParams('')))).toBe(false)
  })

  it('returns true when potential differs from default', () => {
    expect(hasNonDefaultUrl({ ...DEFAULTS, potential: 'harmonic_oscillator' })).toBe(true)
  })

  it('returns true when mode differs from default', () => {
    expect(hasNonDefaultUrl({ ...DEFAULTS, mode: 'time-evolution' })).toBe(true)
  })

  it('returns true when potentialParams is non-empty', () => {
    expect(hasNonDefaultUrl({ ...DEFAULTS, potentialParams: { lambda: 2 } })).toBe(true)
  })

  it('returns true when xmin differs', () => {
    expect(hasNonDefaultUrl({ ...DEFAULTS, xmin: -8 })).toBe(true)
  })
})
