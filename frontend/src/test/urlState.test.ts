import { describe, it, expect } from 'vitest'
import { serializeUrlParams, parseUrlParams } from '../utils/urlState'
import type { UrlParams } from '../utils/urlState'

describe('URL state round-trip', () => {
  const cases: UrlParams[] = [
    { potential: 'harmonic_oscillator', xmin: -8,  xmax: 8,  n: 500, mode: 'stationary' },
    { potential: 'infinite_square_well', xmin: 0,  xmax: 1,  n: 200, mode: 'stationary' },
    { potential: 'gaussian_barrier',    xmin: -10, xmax: 10, n: 300, mode: 'time-evolution' },
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
