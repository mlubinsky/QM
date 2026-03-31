import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MomentumPlot } from '../components/MomentumPlot'
import { mockEvolveResult } from '../mock/mockData'
import type { EvolveResponse } from '../types/api'

vi.mock('react-plotly.js', () => ({
  default: ({ 'data-testid': testId }: { 'data-testid'?: string }) => (
    <div data-testid={testId ?? 'plotly-mock'} />
  ),
}))

describe('MomentumPlot', () => {
  it('renders the plot when given valid evolveResult', () => {
    render(<MomentumPlot evolveResult={mockEvolveResult} currentFrame={0} />)
    expect(screen.getByTestId('momentum-plot')).toBeInTheDocument()
  })

  it('renders nothing when evolveResult is null', () => {
    render(<MomentumPlot evolveResult={null} currentFrame={0} />)
    expect(screen.queryByTestId('momentum-plot')).not.toBeInTheDocument()
  })

  it('does not throw when momentum_frames is empty', () => {
    const empty: EvolveResponse = {
      ...mockEvolveResult,
      momentum_frames: [],
      momentum_k: [],
    }
    expect(() =>
      render(<MomentumPlot evolveResult={empty} currentFrame={0} />)
    ).not.toThrow()
  })
})
