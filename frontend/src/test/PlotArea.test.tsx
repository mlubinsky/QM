import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PlotArea } from '../components/PlotArea'
import { mockEigenResult, mockEvolveResult } from '../mock/mockData'

// Pass-through mock: forwards data-testid so individual plot components are detectable
vi.mock('react-plotly.js', () => ({
  default: ({ 'data-testid': testId }: { 'data-testid'?: string }) => (
    <div data-testid={testId ?? 'plotly-mock'} />
  ),
}))

const baseProps = {
  currentFrame: 0,
  playing: false,
  onFrameChange: vi.fn(),
  onPlayPause: vi.fn(),
  onSpeedChange: vi.fn(),
  potentialPreset: null,
}

describe('PlotArea – MomentumPlot visibility', () => {
  it('renders MomentumPlot in time-evolution mode', () => {
    render(
      <PlotArea
        {...baseProps}
        mode="time-evolution"
        eigenResult={null}
        evolveResult={mockEvolveResult}
      />
    )
    expect(screen.getByTestId('momentum-plot')).toBeInTheDocument()
  })

  it('does not render MomentumPlot in stationary mode', () => {
    render(
      <PlotArea
        {...baseProps}
        mode="stationary"
        eigenResult={mockEigenResult}
        evolveResult={null}
      />
    )
    expect(screen.queryByTestId('momentum-plot')).not.toBeInTheDocument()
  })
})
