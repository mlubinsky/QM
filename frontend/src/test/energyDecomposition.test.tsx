/**
 * Tests for EnergyDecompositionPlot component (TDD).
 * All tests FAIL until the component and mockData fields are added.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EnergyDecompositionPlot } from '../components/EnergyDecompositionPlot'
import { mockEvolveResult } from '../mock/mockData'

vi.mock('react-plotly.js', () => ({
  default: ({ 'data-testid': testId }: { 'data-testid'?: string }) => (
    <div data-testid={testId ?? 'plotly-mock'} />
  ),
}))

describe('EnergyDecompositionPlot', () => {
  it('renders the bar chart when decomp_weights is non-empty', () => {
    render(<EnergyDecompositionPlot evolveResult={mockEvolveResult} />)
    expect(screen.getByTestId('energy-decomp-plot')).toBeInTheDocument()
  })

  it('returns null when evolveResult is null', () => {
    const { container } = render(<EnergyDecompositionPlot evolveResult={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('returns null when decomp_weights is empty', () => {
    const result = { ...mockEvolveResult, decomp_weights: [], decomp_energies: [] }
    const { container } = render(<EnergyDecompositionPlot evolveResult={result} />)
    expect(container.firstChild).toBeNull()
  })

  it('shows a ? help button', () => {
    render(<EnergyDecompositionPlot evolveResult={mockEvolveResult} />)
    expect(
      screen.getByRole('button', { name: /energy decomposition/i })
    ).toBeInTheDocument()
  })

  it('opens info modal when ? is clicked', () => {
    render(<EnergyDecompositionPlot evolveResult={mockEvolveResult} />)
    fireEvent.click(screen.getByRole('button', { name: /energy decomposition/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('closes info modal when ✕ is clicked', () => {
    render(<EnergyDecompositionPlot evolveResult={mockEvolveResult} />)
    fireEvent.click(screen.getByRole('button', { name: /energy decomposition/i }))
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
