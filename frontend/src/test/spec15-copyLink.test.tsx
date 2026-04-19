/**
 * Spec 15 — Copy link button tests (items 11–12).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PlotArea } from '../components/PlotArea'
import { mockEigenResult } from '../mock/mockData'
import * as clipboardUtil from '../utils/clipboard'

vi.mock('react-plotly.js', () => ({
  default: () => <div data-testid="plotly-mock" />,
}))

const baseProps = {
  mode: 'stationary' as const,
  eigenResult: mockEigenResult,
  evolveResult: null,
  potentialPreset: 'harmonic_oscillator',
  currentFrame: 0,
  playing: false,
  onFrameChange: vi.fn(),
  onPlayPause: vi.fn(),
  onSpeedChange: vi.fn(),
}

beforeEach(() => {
  vi.spyOn(clipboardUtil, 'writeToClipboard').mockResolvedValue(undefined)
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

// ── 11. Copy link button calls navigator.clipboard.writeText ─────────────────

describe('Spec 15 — Copy link button', () => {
  it('renders a Copy link button', () => {
    render(<PlotArea {...baseProps} />)
    expect(screen.getByRole('button', { name: /copy link/i })).toBeInTheDocument()
  })

  it('calls clipboard.writeText with current URL on click', async () => {
    const user = userEvent.setup()
    render(<PlotArea {...baseProps} />)
    await user.click(screen.getByRole('button', { name: /copy link/i }))
    expect(clipboardUtil.writeToClipboard).toHaveBeenCalledWith(window.location.href)
  })

  // ── 12. Button text changes to "Copied!" then reverts ───────────────────────

  it('shows "Copied!" immediately after click', async () => {
    const user = userEvent.setup()
    render(<PlotArea {...baseProps} />)
    await user.click(screen.getByRole('button', { name: /copy link/i }))
    expect(screen.getByRole('button', { name: /copied!/i })).toBeInTheDocument()
  })

  it('reverts to "Copy link" after 2 seconds', async () => {
    vi.useFakeTimers()
    render(<PlotArea {...baseProps} />)
    // fireEvent is synchronous — avoids userEvent hanging with fake timers
    fireEvent.click(screen.getByRole('button', { name: /copy link/i }))
    // Flush microtasks from the async handler (writeToClipboard await + setCopied)
    await act(async () => { await Promise.resolve() })
    expect(screen.getByRole('button', { name: /copied!/i })).toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(2001) })
    expect(screen.getByRole('button', { name: /copy link/i })).toBeInTheDocument()
  })
})
