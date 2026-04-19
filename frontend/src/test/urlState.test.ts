import { describe, it, expect } from 'vitest'
import { serializeUrlParams, parseUrlParams, DEFAULTS } from '../utils/urlState'

describe('URL state round-trip', () => {
  const cases = [
    { ...DEFAULTS, potential: 'harmonic_oscillator', xmin: -8, xmax: 8, n: 500, mode: 'stationary' as const },
    { ...DEFAULTS, potential: 'infinite_square_well', xmin: -10, xmax: 10, n: 200, mode: 'stationary' as const },
    { ...DEFAULTS, potential: 'gaussian_barrier', xmin: -10, xmax: 10, n: 300, mode: 'time-evolution' as const },
  ]

  cases.forEach(params => {
    it(`round-trips ${params.potential} / ${params.mode}`, () => {
      const qs = serializeUrlParams(params)
      const restored = parseUrlParams(new URLSearchParams(qs))
      expect(restored).toEqual(params)
    })
  })

  it('returns defaults when URLSearchParams is empty', () => {
    const defaults = parseUrlParams(new URLSearchParams(''))
    expect(defaults.mode).toBe('stationary')
    expect(defaults.potential).toBe('infinite_square_well')
    expect(defaults.n).toBe(500)
  })
})
