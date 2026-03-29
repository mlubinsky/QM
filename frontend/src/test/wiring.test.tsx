/**
 * Integration tests for wired components.
 * fetch is mocked at the module level; react-plotly.js is stubbed.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { PlotArea } from '../components/PlotArea'
import { ErrorBanner } from '../components/ErrorBanner'
import App from '../App'
import { mockEigenResult, mockEvolveResult } from '../mock/mockData'
import * as apiClient from '../api/client'

vi.mock('react-plotly.js', () => ({
  default: (props: { data: unknown[] }) => (
    <div
      data-testid="plotly-mock"
      data-trace-count={String((props.data ?? []).length)}
    />
  ),
}))

// Mock the api/client module so App tests don't need a real server.
// No module-level variables in the factory (hoisting restriction).
vi.mock('../api/client', () => {
  class ApiError extends Error {
    status: number
    detail: string
    constructor(status: number, detail: string) { super(detail); this.status = status; this.detail = detail }
  }
  return {
    ApiError,
    fetchPresets: vi.fn(),
    solveEigenstates: vi.fn(),
    solveEvolve: vi.fn(),
  }
})

// Default mock implementations (using imported mock data, safe outside factory)
beforeEach(() => {
  vi.mocked(apiClient.fetchPresets).mockResolvedValue([
    'infinite_square_well', 'harmonic_oscillator', 'double_well',
    'finite_square_well', 'step_potential', 'gaussian_barrier',
  ])
  vi.mocked(apiClient.solveEigenstates).mockResolvedValue(mockEigenResult)
  vi.mocked(apiClient.solveEvolve).mockResolvedValue(mockEvolveResult)
})

// ── PlotArea: eigenstate mode ──────────────────────────────────────────────

describe('PlotArea – stationary mode', () => {
  it('renders one energy label per eigenstate (5 total)', () => {
    render(
      <PlotArea mode="stationary" eigenResult={mockEigenResult}
        evolveResult={null} currentFrame={0}
        onFrameChange={vi.fn()} onPlayPause={vi.fn()} onSpeedChange={vi.fn()} playing={false} />
    )
    expect(screen.getAllByTestId('energy-label')).toHaveLength(5)
  })

  it('displayed E_0 is within 1% of 0.5 a.u.', () => {
    render(
      <PlotArea mode="stationary" eigenResult={mockEigenResult}
        evolveResult={null} currentFrame={0}
        onFrameChange={vi.fn()} onPlayPause={vi.fn()} onSpeedChange={vi.fn()} playing={false} />
    )
    const label = screen.getAllByTestId('energy-label')[0]
    const value = parseFloat(label.textContent ?? '0')
    expect(Math.abs(value - 0.5) / 0.5).toBeLessThan(0.01)
  })

  it('renders export buttons', () => {
    render(
      <PlotArea mode="stationary" eigenResult={mockEigenResult}
        evolveResult={null} currentFrame={0}
        onFrameChange={vi.fn()} onPlayPause={vi.fn()} onSpeedChange={vi.fn()} playing={false} />
    )
    expect(screen.getByRole('button', { name: /export csv/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /export json/i })).toBeInTheDocument()
  })
})

// ── PlotArea: evolve mode ──────────────────────────────────────────────────

describe('PlotArea – time-evolution mode', () => {
  it('shows norm near 1.000 for first frame', () => {
    render(
      <PlotArea mode="time-evolution" eigenResult={null}
        evolveResult={mockEvolveResult} currentFrame={0}
        onFrameChange={vi.fn()} onPlayPause={vi.fn()} onSpeedChange={vi.fn()} playing={false} />
    )
    const display = screen.getByTestId('norm-display')
    const norm = parseFloat(display.textContent ?? '0')
    expect(Math.abs(norm - 1.0)).toBeLessThan(1e-4)
  })
})

// ── ErrorBanner ────────────────────────────────────────────────────────────

describe('ErrorBanner', () => {
  it('renders the error message', () => {
    render(<ErrorBanner message="Invalid expression: bad" onDismiss={vi.fn()} />)
    expect(screen.getByRole('alert')).toHaveTextContent(/Invalid expression/)
  })

  it('calls onDismiss when dismiss button is clicked', async () => {
    const onDismiss = vi.fn()
    render(<ErrorBanner message="Oops" onDismiss={onDismiss} />)
    await userEvent.click(screen.getByRole('button', { name: /dismiss/i }))
    expect(onDismiss).toHaveBeenCalledOnce()
  })
})

// ── App: error flow ────────────────────────────────────────────────────────

describe('App – error handling', () => {
  beforeEach(() => {
    // Override the default success mock with a failure
    vi.mocked(apiClient.solveEigenstates).mockRejectedValue(
      Object.assign(new Error('Invalid potential expression: syntax error'), {
        status: 422,
        detail: 'Invalid potential expression: syntax error',
      })
    )
  })

  it('shows ErrorBanner when API returns an error', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: /solve eigenstates/i }))
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })
})
