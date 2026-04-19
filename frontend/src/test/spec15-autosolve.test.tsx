/**
 * Spec 15 — auto-solve on mount when URL has non-default params (item 10).
 *
 * readUrlParams is mocked to return non-default params so that
 * App calls solveEigenstates on mount without any user interaction.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import * as apiClient from '../api/client'
import { mockEigenResult, mockEvolveResult } from '../mock/mockData'

// Mock urlState so readUrlParams returns non-default potential
vi.mock('../utils/urlState', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../utils/urlState')>()
  return {
    ...actual,
    readUrlParams: vi.fn(() => ({
      ...actual.DEFAULTS,
      potential: 'harmonic_oscillator',
      xmin: -8,
      xmax: 8,
    })),
    pushUrlParams: vi.fn(),
  }
})

vi.mock('react-plotly.js', () => ({
  default: () => <div data-testid="plotly-mock" />,
}))

vi.mock('../api/client', () => {
  class ApiError extends Error {
    status: number; detail: string
    constructor(status: number, detail: string) { super(detail); this.status = status; this.detail = detail }
  }
  return { ApiError, fetchPresets: vi.fn(), solveEigenstates: vi.fn(), solveEvolve: vi.fn() }
})

beforeEach(() => {
  vi.mocked(apiClient.solveEigenstates).mockResolvedValue(mockEigenResult)
  vi.mocked(apiClient.solveEvolve).mockResolvedValue(mockEvolveResult)
})

// ── 10. App auto-solves on mount when URL has non-default params ──────────────

describe('Spec 15 — auto-solve on mount', () => {
  it('calls solveEigenstates on mount without user interaction', async () => {
    // Dynamic import so the vi.mock above is applied before App module loads
    const { default: App } = await import('../App')
    render(<App />)
    await waitFor(() => {
      expect(apiClient.solveEigenstates).toHaveBeenCalled()
    })
  })
})
