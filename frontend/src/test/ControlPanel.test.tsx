import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ControlPanel } from '../components/ControlPanel'

describe('ControlPanel – stationary mode', () => {
  it('renders grid controls', () => {
    render(<ControlPanel mode="stationary" onSolve={vi.fn()} />)
    expect(screen.getByLabelText(/x.?min/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/x.?max/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/n.?points/i)).toBeInTheDocument()
  })

  it('renders potential selector', () => {
    render(<ControlPanel mode="stationary" onSolve={vi.fn()} />)
    expect(screen.getByLabelText(/potential/i)).toBeInTheDocument()
  })

  it('renders n_states control', () => {
    render(<ControlPanel mode="stationary" onSolve={vi.fn()} />)
    expect(screen.getByLabelText(/n.?states/i)).toBeInTheDocument()
  })

  it('renders Solve Eigenstates button', () => {
    render(<ControlPanel mode="stationary" onSolve={vi.fn()} />)
    expect(screen.getByRole('button', { name: /solve eigenstates/i })).toBeInTheDocument()
  })

  it('does not render GaussianControls', () => {
    render(<ControlPanel mode="stationary" onSolve={vi.fn()} />)
    expect(screen.queryByLabelText(/x₀|σ|k₀/)).not.toBeInTheDocument()
  })

  it('all inputs have accessible labels', () => {
    render(<ControlPanel mode="stationary" onSolve={vi.fn()} />)
    const inputs = screen.getAllByRole('textbox').concat(
      screen.queryAllByRole('spinbutton'),
      screen.queryAllByRole('slider'),
      screen.queryAllByRole('combobox'),
    )
    inputs.forEach(input => {
      const hasLabel =
        input.hasAttribute('aria-label') ||
        input.id && !!document.querySelector(`label[for="${input.id}"]`)
      expect(hasLabel, `Input ${input.outerHTML} has no accessible label`).toBe(true)
    })
  })
})

describe('ControlPanel – time-evolution mode', () => {
  it('renders GaussianControls (x₀, σ, k₀)', () => {
    render(<ControlPanel mode="time-evolution" onSolve={vi.fn()} />)
    expect(screen.getByLabelText(/x₀/)).toBeInTheDocument()
    expect(screen.getByLabelText(/σ/)).toBeInTheDocument()
    expect(screen.getByLabelText(/k₀/)).toBeInTheDocument()
  })

  it('renders dt and n_steps controls', () => {
    render(<ControlPanel mode="time-evolution" onSolve={vi.fn()} />)
    expect(screen.getByLabelText(/^dt/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/n.?steps/i)).toBeInTheDocument()
  })

  it('renders Run Evolution button', () => {
    render(<ControlPanel mode="time-evolution" onSolve={vi.fn()} />)
    expect(screen.getByRole('button', { name: /run evolution/i })).toBeInTheDocument()
  })

  it('does not render n_states control', () => {
    render(<ControlPanel mode="time-evolution" onSolve={vi.fn()} />)
    expect(screen.queryByLabelText(/n.?states/i)).not.toBeInTheDocument()
  })
})

describe('ControlPanel – mode toggle behaviour', () => {
  it('switching mode prop changes rendered controls', () => {
    const { rerender } = render(<ControlPanel mode="stationary" onSolve={vi.fn()} />)
    expect(screen.getByRole('button', { name: /solve eigenstates/i })).toBeInTheDocument()

    rerender(<ControlPanel mode="time-evolution" onSolve={vi.fn()} />)
    expect(screen.getByRole('button', { name: /run evolution/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /solve eigenstates/i })).not.toBeInTheDocument()
  })
})
