import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ExpectationValuesPlot } from '../components/ExpectationValuesPlot'
import { mockEvolveResult } from '../mock/mockData'
import type { EvolveResponse } from '../types/api'

vi.mock('react-plotly.js', () => ({
  default: ({ 'data-testid': testId }: { 'data-testid'?: string }) => (
    <div data-testid={testId ?? 'plotly-mock'} />
  ),
}))

describe('ExpectationValuesPlot', () => {
  it('renders the plot when given valid evolveResult', () => {
    render(<ExpectationValuesPlot evolveResult={mockEvolveResult} />)
    expect(screen.getByTestId('expectation-values-plot')).toBeInTheDocument()
  })

  it('renders nothing when evolveResult is null', () => {
    render(<ExpectationValuesPlot evolveResult={null} />)
    expect(screen.queryByTestId('expectation-values-plot')).not.toBeInTheDocument()
  })

  it('does not throw when expectation value arrays are empty', () => {
    const empty: EvolveResponse = {
      ...mockEvolveResult,
      expect_x: [],
      expect_p: [],
      expect_x2: [],
      expect_p2: [],
      expect_H: [],
      times: [],
    }
    expect(() => render(<ExpectationValuesPlot evolveResult={empty} />)).not.toThrow()
  })
})
