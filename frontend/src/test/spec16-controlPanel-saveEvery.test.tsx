/**
 * Spec 16 — ControlPanel sends save_every in evolve request (item 3).
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
})
