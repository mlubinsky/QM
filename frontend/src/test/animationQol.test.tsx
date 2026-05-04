/**
 * Tests for the five animation quick-win improvements (TDD):
 * 1. requestAnimationFrame loop — tested indirectly via render/no-crash
 * 2. ⟨x⟩ marker on main plot — MainPlot renders with evolveResult
 * 3. Time cursor on secondary/expectation plots — new currentTime prop
 * 4. Loop/Stop toggle — AnimationControls checkbox
 * 5. 0.25× slow-motion — AnimationControls speed option
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AnimationControls } from '../components/AnimationControls'
import { ExpectationValuesPlot } from '../components/ExpectationValuesPlot'
import { SecondaryPlot } from '../components/SecondaryPlot'
import { mockEvolveResult } from '../mock/mockData'

vi.mock('react-plotly.js', () => ({
  default: ({ 'data-testid': testId }: { 'data-testid'?: string }) => (
    <div data-testid={testId ?? 'plotly-mock'} />
  ),
}))

const baseControls = {
  nFrames: 100,
  currentFrame: 5,
  playing: false,
  currentTime: 0.05,
  onFrameChange: vi.fn(),
  onPlayPause: vi.fn(),
  onSpeedChange: vi.fn(),
}

// ── Loop / Stop toggle ────────────────────────────────────────────────────────

describe('AnimationControls — loop toggle', () => {
  it('renders a "Loop" checkbox', () => {
    render(
      <AnimationControls
        {...baseControls}
        loop={true}
        onLoopToggle={vi.fn()}
      />
    )
    expect(screen.getByLabelText(/loop/i)).toBeInTheDocument()
  })

  it('checkbox is checked when loop=true', () => {
    render(
      <AnimationControls
        {...baseControls}
        loop={true}
        onLoopToggle={vi.fn()}
      />
    )
    const cb = screen.getByLabelText(/loop/i) as HTMLInputElement
    expect(cb.checked).toBe(true)
  })

  it('checkbox is unchecked when loop=false', () => {
    render(
      <AnimationControls
        {...baseControls}
        loop={false}
        onLoopToggle={vi.fn()}
      />
    )
    const cb = screen.getByLabelText(/loop/i) as HTMLInputElement
    expect(cb.checked).toBe(false)
  })
})

// ── 0.25× speed option ────────────────────────────────────────────────────────

describe('AnimationControls — 0.25x slow-motion speed', () => {
  it('has a 0.25x option in the speed select', () => {
    render(<AnimationControls {...baseControls} />)
    expect(screen.getByRole('option', { name: '0.25x' })).toBeInTheDocument()
  })
})

// ── Time cursor: ExpectationValuesPlot ────────────────────────────────────────

describe('ExpectationValuesPlot — currentTime prop', () => {
  it('renders without error when currentTime is provided', () => {
    render(
      <ExpectationValuesPlot
        evolveResult={mockEvolveResult}
        currentTime={0.05}
      />
    )
    expect(screen.getByTestId('expectation-values-plot')).toBeInTheDocument()
  })

  it('renders without error when currentTime is undefined', () => {
    render(
      <ExpectationValuesPlot
        evolveResult={mockEvolveResult}
      />
    )
    expect(screen.getByTestId('expectation-values-plot')).toBeInTheDocument()
  })
})

// ── Time cursor: SecondaryPlot (norm history) ─────────────────────────────────

describe('SecondaryPlot — currentTime prop', () => {
  it('renders without error in time-evolution mode with currentTime', () => {
    render(
      <SecondaryPlot
        mode="time-evolution"
        eigenResult={null}
        evolveResult={mockEvolveResult}
        currentTime={0.05}
      />
    )
    expect(screen.getByTestId('secondary-plot')).toBeInTheDocument()
  })
})
