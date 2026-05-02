/**
 * Spec 16 — ControlPanel sends save_every in evolve request (item 3).
 * Extended: save_every slider is now visible and interactive in the UI.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ControlPanel } from '../components/ControlPanel'
import { DEFAULTS } from '../utils/urlState'

vi.mock('react-plotly.js', () => ({
  default: () => <div data-testid="plotly-mock" />,
}))

describe('Spec 16 — ControlPanel save_every', () => {
  it('includes save_every in onSolve payload (time-evolution mode)', () => {
    const onSolve = vi.fn()
    render(
      <ControlPanel
        mode="time-evolution"
        onSolve={onSolve}
        initialParams={{ ...DEFAULTS, mode: 'time-evolution', saveEvery: 5 }}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /run evolution/i }))
    expect(onSolve).toHaveBeenCalledWith(
      expect.objectContaining({ save_every: 5 })
    )
  })

  it('uses default saveEvery (10) when initialParams not provided', () => {
    const onSolve = vi.fn()
    render(
      <ControlPanel mode="time-evolution" onSolve={onSolve} />
    )
    fireEvent.click(screen.getByRole('button', { name: /run evolution/i }))
    expect(onSolve).toHaveBeenCalledWith(
      expect.objectContaining({ save_every: 10 })
    )
  })

  it('does NOT include save_every in stationary onSolve payload', () => {
    const onSolve = vi.fn()
    render(
      <ControlPanel mode="stationary" onSolve={onSolve} />
    )
    fireEvent.click(screen.getByRole('button', { name: /solve eigenstates/i }))
    const payload = onSolve.mock.calls[0][0]
    expect(payload).not.toHaveProperty('save_every')
  })

  // ── slider visibility ─────────────────────────────────────────────────────

  it('renders a save_every slider in time-evolution mode', () => {
    render(<ControlPanel mode="time-evolution" onSolve={vi.fn()} />)
    expect(screen.getByLabelText(/steps per frame/i)).toBeInTheDocument()
  })

  it('does not render save_every slider in stationary mode', () => {
    render(<ControlPanel mode="stationary" onSolve={vi.fn()} />)
    expect(screen.queryByLabelText(/steps per frame/i)).not.toBeInTheDocument()
  })

  it('moving save_every slider updates the payload', () => {
    const onSolve = vi.fn()
    render(<ControlPanel mode="time-evolution" onSolve={onSolve} />)
    fireEvent.change(screen.getByLabelText(/steps per frame/i), { target: { value: '25' } })
    fireEvent.click(screen.getByRole('button', { name: /run evolution/i }))
    expect(onSolve).toHaveBeenCalledWith(
      expect.objectContaining({ save_every: 25 })
    )
  })

  // ── frames-stored display ─────────────────────────────────────────────────

  it('shows correct initial frames-stored count (default n_steps=1000, save_every=10)', () => {
    render(<ControlPanel mode="time-evolution" onSolve={vi.fn()} />)
    // floor(1000 / 10) + 1 = 101
    expect(screen.getByTestId('frames-stored')).toHaveTextContent('101')
  })

  it('frames-stored updates when save_every slider moves', () => {
    render(<ControlPanel mode="time-evolution" onSolve={vi.fn()} />)
    fireEvent.change(screen.getByLabelText(/steps per frame/i), { target: { value: '100' } })
    // floor(1000 / 100) + 1 = 11
    expect(screen.getByTestId('frames-stored')).toHaveTextContent('11')
  })

  // ── auto-clamp: save_every must never exceed n_steps ─────────────────────

  it('clamps save_every down when n_steps slider drops below it', () => {
    const onSolve = vi.fn()
    render(
      <ControlPanel
        mode="time-evolution"
        onSolve={onSolve}
        initialParams={{ ...DEFAULTS, mode: 'time-evolution', saveEvery: 50, nSteps: 1000 }}
      />
    )
    // Drop n_steps to 20 — save_every=50 should clamp to 20
    fireEvent.change(screen.getByLabelText(/n_steps/i), { target: { value: '20' } })
    fireEvent.click(screen.getByRole('button', { name: /run evolution/i }))
    const call = onSolve.mock.calls[0][0]
    expect(call.save_every).toBeLessThanOrEqual(call.n_steps)
  })
})
