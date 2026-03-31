import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CurrentPlot } from '../components/CurrentPlot'
import { mockEvolveResult } from '../mock/mockData'
import type { EvolveResponse } from '../types/api'

vi.mock('react-plotly.js', () => ({
  default: ({ 'data-testid': testId }: { 'data-testid'?: string }) => (
    <div data-testid={testId ?? 'plotly-mock'} />
  ),
}))

describe('CurrentPlot', () => {
  it('renders the plot when given valid evolveResult', () => {
    render(<CurrentPlot evolveResult={mockEvolveResult} currentFrame={0} />)
    expect(screen.getByTestId('current-plot')).toBeInTheDocument()
  })

  it('renders nothing when evolveResult is null', () => {
    render(<CurrentPlot evolveResult={null} currentFrame={0} />)
    expect(screen.queryByTestId('current-plot')).not.toBeInTheDocument()
  })

  it('does not throw when current_frames is empty', () => {
    const empty: EvolveResponse = {
      ...mockEvolveResult,
      current_frames: [],
    }
    expect(() =>
      render(<CurrentPlot evolveResult={empty} currentFrame={0} />)
    ).not.toThrow()
  })
})
