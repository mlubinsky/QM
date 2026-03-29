import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchPresets, solveEigenstates, ApiError } from '../api/client'
import { mockEigenResult } from '../mock/mockData'
import type { EigensolveRequest } from '../types/api'

const REQ: EigensolveRequest = {
  grid: { x_min: -8, x_max: 8, n_points: 100 },
  potential_preset: 'harmonic_oscillator',
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

describe('fetchPresets', () => {
  it('calls /presets and returns the array', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ presets: ['harmonic_oscillator', 'infinite_square_well'] }),
    } as Response)

    const result = await fetchPresets()
    expect(result).toEqual(['harmonic_oscillator', 'infinite_square_well'])
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/presets'))
  })
})

describe('solveEigenstates', () => {
  it('POSTs to /solve/eigenstates and returns response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockEigenResult,
    } as Response)

    const result = await solveEigenstates(REQ)
    expect(result.energies[0]).toBeCloseTo(0.5, 1)
    const call = vi.mocked(fetch).mock.calls[0]
    expect(call[0]).toContain('/solve/eigenstates')
    expect(call[1]?.method).toBe('POST')
  })

  it('throws ApiError with status and detail on non-2xx', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: async () => ({ detail: 'Invalid potential expression' }),
    } as Response)

    const err = await solveEigenstates(REQ).catch(e => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err.status).toBe(422)
    expect(err.detail).toMatch(/Invalid potential expression/)
  })
})
