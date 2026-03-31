import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PlotArea } from '../components/PlotArea'
import { mockEigenResult, mockEvolveResult } from '../mock/mockData'

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

describe('PlotArea – CurrentPlot visibility', () => {
  it('renders CurrentPlot in time-evolution mode', () => {
    render(
      <PlotArea
        {...baseProps}
        mode="time-evolution"
        eigenResult={null}
        evolveResult={mockEvolveResult}
      />
    )
    expect(screen.getByTestId('current-plot')).toBeInTheDocument()
  })

  it('does not render CurrentPlot in stationary mode', () => {
    render(
      <PlotArea
        {...baseProps}
        mode="stationary"
        eigenResult={mockEigenResult}
        evolveResult={null}
      />
    )
    expect(screen.queryByTestId('current-plot')).not.toBeInTheDocument()
  })
})
