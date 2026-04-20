/**
 * Spec 17 — URL state: initState and coefficients round-trip.
 */
import { describe, it, expect } from 'vitest'
import { parseUrlParams, serializeUrlParams, hasNonDefaultUrl, DEFAULTS } from '../utils/urlState'

describe('spec17 urlState: initState', () => {
  it('default initState is gaussian', () => {
    const sp = new URLSearchParams()
    const p = parseUrlParams(sp)
    expect(p.initState).toBe('gaussian')
  })

  it('parses init=superposition', () => {
    const sp = new URLSearchParams('init=superposition')
    const p = parseUrlParams(sp)
    expect(p.initState).toBe('superposition')
  })

  it('serializes superposition', () => {
    const p = { ...DEFAULTS, initState: 'superposition' as const, nSuperStates: 2, coefficients: [1, 0] }
    const qs = serializeUrlParams(p)
    expect(qs).toContain('init=superposition')
  })

  it('does not include init= when gaussian (default)', () => {
    const p = { ...DEFAULTS }
    const qs = serializeUrlParams(p)
    expect(qs).not.toContain('init=')
  })
})

describe('spec17 urlState: nSuperStates', () => {
  it('default nSuperStates is 2', () => {
    const sp = new URLSearchParams()
    expect(parseUrlParams(sp).nSuperStates).toBe(2)
  })

  it('parses n_super=3', () => {
    const sp = new URLSearchParams('n_super=3')
    expect(parseUrlParams(sp).nSuperStates).toBe(3)
  })

  it('clamps n_super below 1 to 1', () => {
    const sp = new URLSearchParams('n_super=0')
    expect(parseUrlParams(sp).nSuperStates).toBe(1)
  })

  it('clamps n_super above 20 to 20', () => {
    const sp = new URLSearchParams('n_super=99')
    expect(parseUrlParams(sp).nSuperStates).toBe(20)
  })

  it('serializes n_super when superposition', () => {
    const p = { ...DEFAULTS, initState: 'superposition' as const, nSuperStates: 3, coefficients: [1, 0, 0] }
    const qs = serializeUrlParams(p)
    expect(qs).toContain('n_super=3')
  })

  it('does not include n_super when gaussian', () => {
    const p = { ...DEFAULTS }
    const qs = serializeUrlParams(p)
    expect(qs).not.toContain('n_super=')
  })
})

describe('spec17 urlState: coefficients', () => {
  it('default coefficients is empty array', () => {
    const sp = new URLSearchParams()
    expect(parseUrlParams(sp).coefficients).toEqual([])
  })

  it('parses c0=1&c1=0', () => {
    const sp = new URLSearchParams('c0=1&c1=0')
    const p = parseUrlParams(sp)
    expect(p.coefficients).toEqual([1, 0])
  })

  it('parses three coefficients', () => {
    const sp = new URLSearchParams('c0=1&c1=0.5&c2=0.25')
    const p = parseUrlParams(sp)
    expect(p.coefficients).toEqual([1, 0.5, 0.25])
  })

  it('round-trips coefficients', () => {
    const p = { ...DEFAULTS, initState: 'superposition' as const, nSuperStates: 3, coefficients: [0.5, 0.5, 0.0] }
    const qs = serializeUrlParams(p)
    const sp = new URLSearchParams(qs)
    const parsed = parseUrlParams(sp)
    expect(parsed.coefficients).toEqual([0.5, 0.5, 0])
  })

  it('does not serialize coefficients when gaussian', () => {
    const p = { ...DEFAULTS }
    const qs = serializeUrlParams(p)
    expect(qs).not.toContain('c0=')
  })
})

describe('spec17 urlState: hasNonDefaultUrl', () => {
  it('superposition triggers hasNonDefaultUrl', () => {
    const p = { ...DEFAULTS, initState: 'superposition' as const }
    expect(hasNonDefaultUrl(p)).toBe(true)
  })

  it('non-empty coefficients trigger hasNonDefaultUrl', () => {
    const p = { ...DEFAULTS, coefficients: [1, 0] }
    expect(hasNonDefaultUrl(p)).toBe(true)
  })

  it('default params do not trigger hasNonDefaultUrl', () => {
    expect(hasNonDefaultUrl(DEFAULTS)).toBe(false)
  })
})
