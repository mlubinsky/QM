import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MainPlot } from '../components/MainPlot'
import { mockEigenResult, mockEvolveResult } from '../mock/mockData'

// Plotly renders a canvas/SVG in real browsers but nothing useful in jsdom.
// We just need to confirm the component mounts without throwing.
vi.mock('react-plotly.js', () => ({
  default: ({ 'data-testid': testId }: { 'data-testid'?: string }) => (
    <div data-testid={testId ?? 'plotly-mock'} />
  ),
}))

describe('MainPlot', () => {
  it('renders without crashing in stationary mode with mock data', () => {
    render(
      <MainPlot mode="stationary" eigenResult={mockEigenResult} evolveResult={null} currentFrame={0} />
    )
    expect(screen.getByTestId('main-plot')).toBeInTheDocument()
  })

  it('renders without crashing in time-evolution mode with mock data', () => {
    render(
      <MainPlot mode="time-evolution" eigenResult={null} evolveResult={mockEvolveResult} currentFrame={0} />
    )
    expect(screen.getByTestId('main-plot')).toBeInTheDocument()
  })

  it('renders without crashing when result is null', () => {
    render(
      <MainPlot mode="stationary" eigenResult={null} evolveResult={null} currentFrame={0} />
    )
    expect(screen.getByTestId('main-plot')).toBeInTheDocument()
  })
})
