/**
 * Spec 17 — ControlPanel: superposition initial state UI.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ControlPanel } from '../components/ControlPanel'
import { DEFAULTS } from '../utils/urlState'

function renderPanel(onSolve = vi.fn()) {
  return render(
    <ControlPanel
      mode="time-evolution"
      onSolve={onSolve}
      status="idle"
      initialParams={{ ...DEFAULTS, mode: 'time-evolution' }}
    />
  )
}

describe('spec17 ControlPanel: initial state selector', () => {
  it('shows an initial-state selector in time-evolution mode', () => {
    renderPanel()
    // Should have a select or labeled control for initial state
    expect(screen.getByLabelText(/initial state/i)).toBeInTheDocument()
  })

  it('defaults to Gaussian', () => {
    renderPanel()
    const select = screen.getByLabelText(/initial state/i) as HTMLSelectElement
    expect(select.value).toBe('gaussian')
  })

  it('does not show initial-state selector in stationary mode', () => {
    render(
      <ControlPanel
        mode="stationary"
        onSolve={vi.fn()}
        status="idle"
        initialParams={{ ...DEFAULTS, mode: 'stationary' }}
      />
    )
    expect(screen.queryByLabelText(/initial state/i)).toBeNull()
  })
})

describe('spec17 ControlPanel: gaussian mode (default)', () => {
  it('shows x0, sigma, k0 inputs when Gaussian selected', () => {
    renderPanel()
    expect(screen.getByLabelText(/x₀/)).toBeInTheDocument()
    expect(screen.getByLabelText(/σ/)).toBeInTheDocument()
    expect(screen.getByLabelText(/k₀/)).toBeInTheDocument()
  })

  it('does not show coefficient inputs in gaussian mode', () => {
    renderPanel()
    expect(screen.queryByLabelText(/c₀/i)).toBeNull()
  })

  it('submits with initial_state: gaussian', () => {
    const onSolve = vi.fn()
    renderPanel(onSolve)
    fireEvent.click(screen.getByRole('button', { name: /run evolution/i }))
    expect(onSolve).toHaveBeenCalledOnce()
    const payload = onSolve.mock.calls[0][0]
    expect(payload.initial_state).toBe('gaussian')
  })
})

describe('spec17 ControlPanel: superposition mode', () => {
  function switchToSuperposition(onSolve = vi.fn()) {
    renderPanel(onSolve)
    const select = screen.getByLabelText(/initial state/i)
    fireEvent.change(select, { target: { value: 'superposition' } })
    return onSolve
  }

  it('shows n_super_states slider when superposition selected', () => {
    switchToSuperposition()
    expect(screen.getByLabelText(/n_super_states/i)).toBeInTheDocument()
  })

  it('hides x0, sigma, k0 when superposition selected', () => {
    switchToSuperposition()
    expect(screen.queryByLabelText(/x₀/)).toBeNull()
    expect(screen.queryByLabelText(/σ/)).toBeNull()
    expect(screen.queryByLabelText(/k₀/)).toBeNull()
  })

  it('shows coefficient inputs equal to nSuperStates', () => {
    switchToSuperposition()
    // default nSuperStates = 2, so c₀ and c₁
    expect(screen.getByLabelText(/c₀/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/c₁/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/c₂/i)).toBeNull()
  })

  it('shows quick-select ψ buttons equal to nSuperStates', () => {
    switchToSuperposition()
    // ψ₀ and ψ₁ buttons
    expect(screen.getByRole('button', { name: /ψ₀/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ψ₁/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /ψ₂/ })).toBeNull()
  })

  it('quick-select ψ₀ sets c₀=1 and c₁=0', () => {
    switchToSuperposition()
    // First click ψ₁ to set a different state
    fireEvent.click(screen.getByRole('button', { name: /ψ₁/ }))
    const c0 = screen.getByLabelText(/c₀/i) as HTMLInputElement
    const c1 = screen.getByLabelText(/c₁/i) as HTMLInputElement
    expect(c0.value).toBe('0')
    expect(c1.value).toBe('1')

    // Now click ψ₀
    fireEvent.click(screen.getByRole('button', { name: /ψ₀/ }))
    expect(c0.value).toBe('1')
    expect(c1.value).toBe('0')
  })

  it('submits with initial_state: superposition and coefficients', () => {
    const onSolve = switchToSuperposition()
    fireEvent.click(screen.getByRole('button', { name: /run evolution/i }))
    const payload = onSolve.mock.calls[0][0]
    expect(payload.initial_state).toBe('superposition')
    expect(Array.isArray(payload.coefficients)).toBe(true)
    expect(payload.n_super_states).toBe(2)
  })

  it('increasing n_super_states adds a coefficient input', () => {
    switchToSuperposition()
    const slider = screen.getByLabelText(/n_super_states/i)
    fireEvent.change(slider, { target: { value: '3' } })
    expect(screen.getByLabelText(/c₂/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ψ₂/ })).toBeInTheDocument()
  })

  it('decreasing n_super_states removes coefficient inputs', () => {
    switchToSuperposition()
    // Start at 2, set to 1
    const slider = screen.getByLabelText(/n_super_states/i)
    fireEvent.change(slider, { target: { value: '1' } })
    expect(screen.getByLabelText(/c₀/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/c₁/i)).toBeNull()
  })

  it('initialises with default coefficients [1, 0] (ground state)', () => {
    switchToSuperposition()
    const c0 = screen.getByLabelText(/c₀/i) as HTMLInputElement
    const c1 = screen.getByLabelText(/c₁/i) as HTMLInputElement
    expect(parseFloat(c0.value)).toBe(1)
    expect(parseFloat(c1.value)).toBe(0)
  })
})

describe('spec17 ControlPanel: URL initialisation', () => {
  it('restores superposition mode from URL params', () => {
    render(
      <ControlPanel
        mode="time-evolution"
        onSolve={vi.fn()}
        status="idle"
        initialParams={{
          ...DEFAULTS,
          mode: 'time-evolution',
          initState: 'superposition',
          nSuperStates: 3,
          coefficients: [0.5, 0.5, 0.0],
        }}
      />
    )
    const select = screen.getByLabelText(/initial state/i) as HTMLSelectElement
    expect(select.value).toBe('superposition')
    const c0 = screen.getByLabelText(/c₀/i) as HTMLInputElement
    expect(parseFloat(c0.value)).toBe(0.5)
  })
})
