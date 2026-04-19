/**
 * Spec 16 — custom expression preserved in URL after solve (item 4).
 *
 * When a custom potential expression is used, pushUrlParams must be called
 * with expr set to the expression string (not lost as potential='').
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import * as urlState from '../utils/urlState'
import * as apiClient from '../api/client'
import { mockEigenResult } from '../mock/mockData'

vi.mock('react-plotly.js', () => ({
  default: () => <div data-testid="plotly-mock" />,
}))

vi.mock('../utils/urlState', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../utils/urlState')>()
  return {
    ...actual,
    readUrlParams: vi.fn(() => ({ ...actual.DEFAULTS })),
    pushUrlParams: vi.fn(),
  }
})

vi.mock('../api/client', () => {
  class ApiError extends Error {
    status: number; detail: string
    constructor(status: number, detail: string) { super(detail); this.status = status; this.detail = detail }
  }
  return { ApiError, fetchPresets: vi.fn(), solveEigenstates: vi.fn(), solveEvolve: vi.fn() }
})

beforeEach(() => {
  vi.mocked(apiClient.solveEigenstates).mockResolvedValue(mockEigenResult)
  vi.mocked(apiClient.solveEvolve).mockResolvedValue({} as any)
})

describe('Spec 16 — custom expr preserved in URL', () => {
  it('pushUrlParams is called with expr field when custom expression is used', async () => {
    const { default: App } = await import('../App')
    render(<App />)

    // Type a custom expression
    const exprInput = screen.getByPlaceholderText(/e\.g\./i)
    fireEvent.change(exprInput, { target: { value: '0.5 * x**2 + x**4' } })

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /solve eigenstates/i }))

    await waitFor(() => {
      expect(apiClient.solveEigenstates).toHaveBeenCalled()
    })

    // pushUrlParams must have been called with expr set to the custom expression
    const pushCall = vi.mocked(urlState.pushUrlParams).mock.calls.at(-1)?.[0]
    expect(pushCall?.expr).toBe('0.5 * x**2 + x**4')
    // potential must NOT be '' (which breaks the URL on reload)
    expect(pushCall?.potential).not.toBe('')
  })
})
