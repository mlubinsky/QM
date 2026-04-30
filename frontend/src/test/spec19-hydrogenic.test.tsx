/**
 * Spec 19 — Hydrogenic solver UI tests.
 *
 * Covers frontend validation requirements 8–10:
 *   8. ? button present in hydrogenic mode; clicking opens the modal
 *   9. Modal contains "Radial reduction" text
 *  10. Clicking backdrop or ✕ closes the modal
 *
 * Also covers:
 *   - Z slider present with accessible label
 *   - n, l, m selectors present and constrained
 *   - Solve button labelled "Solve orbital"
 *   - l resets to 0 when n decreases below current l+1
 *   - m resets to 0 when l decreases below |m|
 *   - onSolve payload contains Z, n, l, m
 *   - URL state: Z, n, l, m serialised correctly
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ControlPanel } from '../components/ControlPanel'
import { DEFAULTS } from '../utils/urlState'
import { serializeUrlParams, parseUrlParams } from '../utils/urlState'

vi.mock('react-plotly.js', () => ({
  default: () => <div data-testid="plotly-mock" />,
}))

function renderHydrogenic(onSolve = vi.fn()) {
  return render(
    <ControlPanel
      mode={'hydrogenic' as any}
      onSolve={onSolve}
      status="idle"
      initialParams={{ ...DEFAULTS, mode: 'stationary' }}
    />
  )
}

// ── Controls presence ─────────────────────────────────────────────────────────

describe('Spec 19 — hydrogenic controls', () => {
  it('renders a Z slider with accessible label', () => {
    renderHydrogenic()
    expect(screen.getByLabelText(/nuclear charge Z/i)).toBeInTheDocument()
  })

  it('renders an n selector', () => {
    renderHydrogenic()
    expect(screen.getByLabelText(/principal.*n/i)).toBeInTheDocument()
  })

  it('renders an l selector', () => {
    renderHydrogenic()
    expect(screen.getByLabelText(/angular.*l/i)).toBeInTheDocument()
  })

  it('renders an m selector', () => {
    renderHydrogenic()
    expect(screen.getByLabelText(/magnetic.*m/i)).toBeInTheDocument()
  })

  it('shows a "Solve orbital" button', () => {
    renderHydrogenic()
    expect(screen.getByRole('button', { name: /solve orbital/i })).toBeInTheDocument()
  })

  it('does NOT show stationary or time-evolution buttons', () => {
    renderHydrogenic()
    expect(screen.queryByRole('button', { name: /solve eigenstates/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /run evolution/i })).toBeNull()
  })
})

// ── onSolve payload ───────────────────────────────────────────────────────────

describe('Spec 19 — onSolve payload', () => {
  it('calls onSolve with Z, n, l, m when button clicked', () => {
    const onSolve = vi.fn()
    renderHydrogenic(onSolve)
    fireEvent.click(screen.getByRole('button', { name: /solve orbital/i }))
    expect(onSolve).toHaveBeenCalledWith(
      expect.objectContaining({ Z: expect.any(Number), n: expect.any(Number),
                                 l: expect.any(Number), m: expect.any(Number) })
    )
  })

  it('reflects Z slider change in payload', () => {
    const onSolve = vi.fn()
    renderHydrogenic(onSolve)
    fireEvent.change(screen.getByLabelText(/nuclear charge Z/i), { target: { value: '6' } })
    fireEvent.click(screen.getByRole('button', { name: /solve orbital/i }))
    expect(onSolve).toHaveBeenCalledWith(expect.objectContaining({ Z: 6 }))
  })
})

// ── Quantum number constraints ─────────────────────────────────────────────────

describe('Spec 19 — quantum number constraints', () => {
  it('l selector max equals n-1', () => {
    renderHydrogenic()
    const lInput = screen.getByLabelText(/angular.*l/i) as HTMLInputElement
    // Default n=1, so l max should be 0
    expect(Number(lInput.max)).toBe(0)
  })

  it('m selector min/max equal ±l', () => {
    renderHydrogenic()
    const mInput = screen.getByLabelText(/magnetic.*m/i) as HTMLInputElement
    // Default l=0, so m range should be [0, 0]
    expect(Number(mInput.min)).toBe(0)
    expect(Number(mInput.max)).toBe(0)
  })

  it('l resets to 0 when n drops below l+1', () => {
    renderHydrogenic()
    // Set n=3 then l=2
    fireEvent.change(screen.getByLabelText(/principal.*n/i), { target: { value: '3' } })
    fireEvent.change(screen.getByLabelText(/angular.*l/i), { target: { value: '2' } })
    // Drop n to 2 — l should clamp
    fireEvent.change(screen.getByLabelText(/principal.*n/i), { target: { value: '2' } })
    const lInput = screen.getByLabelText(/angular.*l/i) as HTMLInputElement
    expect(Number(lInput.value)).toBeLessThan(2)
  })

  it('m resets to 0 when l drops below |m|', () => {
    renderHydrogenic()
    fireEvent.change(screen.getByLabelText(/principal.*n/i), { target: { value: '3' } })
    fireEvent.change(screen.getByLabelText(/angular.*l/i), { target: { value: '2' } })
    fireEvent.change(screen.getByLabelText(/magnetic.*m/i), { target: { value: '2' } })
    // Drop l to 1 — m should clamp to ≤ 1
    fireEvent.change(screen.getByLabelText(/angular.*l/i), { target: { value: '1' } })
    const mInput = screen.getByLabelText(/magnetic.*m/i) as HTMLInputElement
    expect(Math.abs(Number(mInput.value))).toBeLessThanOrEqual(1)
  })
})

// ── ? button and modal (requirements 8–10) ────────────────────────────────────

describe('Spec 19 — help modal', () => {
  it('renders a ? button in hydrogenic mode (req 8)', () => {
    renderHydrogenic()
    expect(
      screen.getByRole('button', { name: /show hydrogenic reference/i })
    ).toBeInTheDocument()
  })

  it('modal is not visible initially', () => {
    renderHydrogenic()
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('clicking ? opens the modal (req 8)', () => {
    renderHydrogenic()
    fireEvent.click(screen.getByRole('button', { name: /show hydrogenic reference/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('modal contains "Radial reduction" text (req 9)', () => {
    renderHydrogenic()
    fireEvent.click(screen.getByRole('button', { name: /show hydrogenic reference/i }))
    expect(screen.getByText(/radial reduction/i)).toBeInTheDocument()
  })

  it('modal contains "X-ray" scaling section (req 9)', () => {
    renderHydrogenic()
    fireEvent.click(screen.getByRole('button', { name: /show hydrogenic reference/i }))
    const matches = screen.getAllByText(/x-ray/i)
    expect(matches.length).toBeGreaterThan(0)
  })

  it('clicking ✕ closes the modal (req 10)', () => {
    renderHydrogenic()
    fireEvent.click(screen.getByRole('button', { name: /show hydrogenic reference/i }))
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('clicking the backdrop closes the modal (req 10)', () => {
    renderHydrogenic()
    fireEvent.click(screen.getByRole('button', { name: /show hydrogenic reference/i }))
    // The backdrop is the element with class physics-modal-backdrop
    const backdrop = document.querySelector('.physics-modal-backdrop')!
    fireEvent.click(backdrop)
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})

// ── URL state round-trip ──────────────────────────────────────────────────────

describe('Spec 19 — URL state', () => {
  it('Z, n, l, m survive a serialize→parse round-trip', () => {
    const params = {
      ...DEFAULTS,
      mode: 'hydrogenic' as any,
      hydroZ: 6,
      hydroN: 3,
      hydroL: 2,
      hydroM: -1,
    }
    const qs = serializeUrlParams(params)
    const parsed = parseUrlParams(new URLSearchParams(qs))
    expect((parsed as any).hydroZ).toBe(6)
    expect((parsed as any).hydroN).toBe(3)
    expect((parsed as any).hydroL).toBe(2)
    expect((parsed as any).hydroM).toBe(-1)
  })
})
