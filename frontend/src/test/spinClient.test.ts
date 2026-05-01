/**
 * Tests for spin API client functions — spinMeasure and spinPauli.
 * Written before the implementation (TDD).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { spinMeasure, spinPauli } from '../api/client'
import type { SpinMeasureRequest } from '../types/api'

const MEASURE_REQ: SpinMeasureRequest = {
  theta: 0,
  phi: 0,
  axis: [0, 0, 1],
  n_shots: 100,
}

const MOCK_MEASURE_RESPONSE = {
  p_plus: 1.0,
  p_minus: 0.0,
  shots_plus: 100,
  shots_minus: 0,
  axis_label: 'z',
}

const MOCK_PAULI_RESPONSE = {
  sigma_x: { re: [[0, 1], [1, 0]], im: [[0, 0], [0, 0]] },
  sigma_y: { re: [[0, 0], [0, 0]], im: [[0, -1], [1, 0]] },
  sigma_z: { re: [[1, 0], [0, -1]], im: [[0, 0], [0, 0]] },
  eigenvalues: [-1, 1],
  eigenvectors: {
    sigma_x: { plus: [0.707, 0.707],  minus: [0.707, -0.707] },
    sigma_y: { plus: [0.707, 0.707],  minus: [0.707, -0.707] },
    sigma_z: { plus: [1, 0],          minus: [0, 1] },
  },
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

describe('spinMeasure', () => {
  it('POSTs to /spin/measure and returns the response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_MEASURE_RESPONSE,
    } as Response)

    const result = await spinMeasure(MEASURE_REQ)
    expect(result.p_plus).toBeCloseTo(1.0, 10)
    expect(result.p_minus).toBeCloseTo(0.0, 10)
    expect(result.shots_plus).toBe(100)
    expect(result.shots_minus).toBe(0)
    expect(result.axis_label).toBe('z')

    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(String(url)).toContain('/spin/measure')
    expect(init?.method).toBe('POST')
    expect(JSON.parse(init?.body as string)).toMatchObject(MEASURE_REQ)
  })

  it('throws ApiError on non-2xx response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: async () => ({ detail: 'axis must be a non-zero vector' }),
    } as Response)

    const { ApiError } = await import('../api/client')
    const err = await spinMeasure(MEASURE_REQ).catch(e => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err.status).toBe(422)
  })
})

describe('spinPauli', () => {
  it('GETs /spin/pauli and returns the response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_PAULI_RESPONSE,
    } as Response)

    const result = await spinPauli()
    expect(result.sigma_x).toBeDefined()
    expect(result.sigma_y).toBeDefined()
    expect(result.sigma_z).toBeDefined()
    expect(result.eigenvalues).toEqual([-1, 1])

    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(String(url)).toContain('/spin/pauli')
    expect(init).toBeUndefined()
  })

  it('throws ApiError on non-2xx response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ detail: 'Internal server error' }),
    } as Response)

    const { ApiError } = await import('../api/client')
    const err = await spinPauli().catch(e => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err.status).toBe(500)
  })
})
