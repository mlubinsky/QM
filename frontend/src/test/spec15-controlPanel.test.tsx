/**
 * Spec 15 — ControlPanel initialParams tests (items 7–9).
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ControlPanel } from '../components/ControlPanel'
import { DEFAULTS } from '../utils/urlState'

// ── 7. initialParams.potential pre-selects the dropdown ──────────────────────

describe('Spec 15 — ControlPanel initialParams', () => {
  it('pre-selects the potential from initialParams', () => {
    render(
      <ControlPanel
        mode="stationary"
        onSolve={vi.fn()}
        initialParams={{ ...DEFAULTS, potential: 'harmonic_oscillator' }}
      />
    )
    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select.value).toBe('harmonic_oscillator')
  })

  // ── 8. initialParams.xmin populates the xMin input ───────────────────────────

  it('pre-fills xmin from initialParams', () => {
    render(
      <ControlPanel
        mode="stationary"
        onSolve={vi.fn()}
        initialParams={{ ...DEFAULTS, xmin: -5 }}
      />
    )
    const input = screen.getByLabelText(/x.?min/i) as HTMLInputElement
    expect(Number(input.value)).toBe(-5)
  })

  it('pre-fills xmax from initialParams', () => {
    render(
      <ControlPanel
        mode="stationary"
        onSolve={vi.fn()}
        initialParams={{ ...DEFAULTS, xmax: 8 }}
      />
    )
    const input = screen.getByLabelText(/x.?max/i) as HTMLInputElement
    expect(Number(input.value)).toBe(8)
  })

  it('pre-fills n_states from initialParams', () => {
    render(
      <ControlPanel
        mode="stationary"
        onSolve={vi.fn()}
        initialParams={{ ...DEFAULTS, nStates: 3 }}
      />
    )
    const slider = screen.getByLabelText(/n.?states/i) as HTMLInputElement
    expect(Number(slider.value)).toBe(3)
  })

  // ── 9. initialParams.potentialParams sets slider value ───────────────────────

  it('sets lambda slider to value from initialParams.potentialParams', () => {
    render(
      <ControlPanel
        mode="stationary"
        onSolve={vi.fn()}
        initialParams={{
          ...DEFAULTS,
          potential: 'double_well',
          potentialParams: { lambda: 2.0, a: 1.0 },
        }}
      />
    )
    // ParameterSlider renders "λ = 2.00 a.u." for lambda=2.0
    expect(screen.getByText(/λ = 2\.00/)).toBeInTheDocument()
  })

  // ── Time-evolution params ─────────────────────────────────────────────────

  it('pre-fills x0, sigma, k0 from initialParams in time-evolution mode', () => {
    render(
      <ControlPanel
        mode="time-evolution"
        onSolve={vi.fn()}
        initialParams={{ ...DEFAULTS, mode: 'time-evolution', x0: -3, sigma: 0.8, k0: 4.0 }}
      />
    )
    expect((screen.getByLabelText(/x₀/) as HTMLInputElement).value).toBe('-3')
    expect((screen.getByLabelText(/σ/) as HTMLInputElement).value).toBe('0.8')
    expect((screen.getByLabelText(/k₀/) as HTMLInputElement).value).toBe('4')
  })
})
