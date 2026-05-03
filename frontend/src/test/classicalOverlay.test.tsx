/**
 * Component tests for the classical overlay UI.
 *
 * Written TDD-style: tests FAIL against the current PlotArea/MainPlot
 * and PASS once the checkbox and showClassical prop are added.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PlotArea } from '../components/PlotArea'
import { MainPlot } from '../components/MainPlot'
import { mockEigenResult, mockEvolveResult } from '../mock/mockData'

vi.mock('react-plotly.js', () => ({
  default: ({ 'data-testid': testId }: { 'data-testid'?: string }) => (
    <div data-testid={testId ?? 'plotly-mock'} />
  ),
}))

const basePlotAreaProps = {
  currentFrame: 0,
  playing: false,
  onFrameChange: vi.fn(),
  onPlayPause: vi.fn(),
  onSpeedChange: vi.fn(),
  potentialPreset: 'harmonic_oscillator',
}

describe('Classical overlay — PlotArea checkbox', () => {
  it('shows "Show classical P(x)" checkbox in stationary mode', () => {
    render(
      <PlotArea
        {...basePlotAreaProps}
        mode="stationary"
        eigenResult={mockEigenResult}
        evolveResult={null}
      />
    )
    expect(
      screen.getByLabelText(/show classical/i)
    ).toBeInTheDocument()
  })

  it('checkbox is unchecked by default', () => {
    render(
      <PlotArea
        {...basePlotAreaProps}
        mode="stationary"
        eigenResult={mockEigenResult}
        evolveResult={null}
      />
    )
    const checkbox = screen.getByLabelText(/show classical/i) as HTMLInputElement
    expect(checkbox.checked).toBe(false)
  })

  it('does NOT show classical checkbox in time-evolution mode', () => {
    render(
      <PlotArea
        {...basePlotAreaProps}
        mode="time-evolution"
        eigenResult={null}
        evolveResult={mockEvolveResult}
      />
    )
    expect(screen.queryByLabelText(/show classical/i)).not.toBeInTheDocument()
  })
})

describe('Classical overlay — MainPlot prop', () => {
  it('renders without error when showClassical is true', () => {
    render(
      <MainPlot
        mode="stationary"
        eigenResult={mockEigenResult}
        evolveResult={null}
        currentFrame={0}
        showClassical={true}
      />
    )
    expect(screen.getByTestId('main-plot')).toBeInTheDocument()
  })

  it('renders without error when showClassical is false', () => {
    render(
      <MainPlot
        mode="stationary"
        eigenResult={mockEigenResult}
        evolveResult={null}
        currentFrame={0}
        showClassical={false}
      />
    )
    expect(screen.getByTestId('main-plot')).toBeInTheDocument()
  })
})
