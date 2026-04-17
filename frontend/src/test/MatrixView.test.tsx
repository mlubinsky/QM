/**
 * Tests for MatrixPanel (spec items 9–13) and MatrixHeatmap (spec items 14–16).
 */

import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MatrixPanel } from '../components/MatrixPanel'
import { MatrixHeatmap } from '../components/MatrixHeatmap'
import { mockEigenResult } from '../mock/mockData'

// ---------------------------------------------------------------------------
// MatrixPanel — spec items 9–12
// ---------------------------------------------------------------------------

describe('MatrixPanel', () => {
  // 9. Renders without error when given a valid eigenResult
  it('renders without error with valid eigenResult', () => {
    const { container } = render(<MatrixPanel eigenResult={mockEigenResult} />)
    expect(container.firstChild).not.toBeNull()
  })

  // 10. Operator selector buttons H, X, P are all present
  it('shows operator buttons H, X, P', () => {
    render(<MatrixPanel eigenResult={mockEigenResult} />)
    expect(screen.getByRole('button', { name: 'H' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'X' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'P' })).toBeInTheDocument()
  })

  // 11. Clicking X shows the X heatmap title (match the bold title, not the physics note)
  it('clicking X button shows X matrix title', async () => {
    const user = userEvent.setup()
    render(<MatrixPanel eigenResult={mockEigenResult} />)
    await user.click(screen.getByRole('button', { name: 'X' }))
    expect(screen.getByText('⟨ψₘ|x|ψₙ⟩ — real, symmetric')).toBeInTheDocument()
  })

  // 11 (cont). Clicking H button shows H matrix title
  it('clicking H button shows H matrix title', async () => {
    const user = userEvent.setup()
    render(<MatrixPanel eigenResult={mockEigenResult} />)
    await user.click(screen.getByRole('button', { name: 'H' }))
    expect(screen.getByText('⟨ψₘ|Ĥ|ψₙ⟩ — diagonal in its own eigenbasis')).toBeInTheDocument()
  })

  // 11 (cont). Clicking P button shows P matrix title
  it('clicking P button shows P matrix title', async () => {
    const user = userEvent.setup()
    render(<MatrixPanel eigenResult={mockEigenResult} />)
    await user.click(screen.getByRole('button', { name: 'P' }))
    expect(screen.getByText('Im⟨ψₘ|p|ψₙ⟩ — purely imaginary, antisymmetric')).toBeInTheDocument()
  })

  // 12. Clicking "animated" view shows the Play button
  it('clicking Time evolution view shows Play button', async () => {
    const user = userEvent.setup()
    render(<MatrixPanel eigenResult={mockEigenResult} />)
    await user.click(screen.getByRole('button', { name: /time evolution/i }))
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument()
  })

  // 12 (cont). Play button toggles to Pause when clicked
  it('Play button toggles to Pause', async () => {
    const user = userEvent.setup()
    render(<MatrixPanel eigenResult={mockEigenResult} />)
    await user.click(screen.getByRole('button', { name: /time evolution/i }))
    const playBtn = screen.getByRole('button', { name: /play/i })
    await user.click(playBtn)
    expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument()
  })

  // 12 (cont). Reset button is present in animated view (unique to animation controls)
  it('animated view shows Reset button', async () => {
    const user = userEvent.setup()
    render(<MatrixPanel eigenResult={mockEigenResult} />)
    await user.click(screen.getByRole('button', { name: /time evolution/i }))
    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument()
  })

  // Bohr frequency table is present (collapsed)
  it('shows Bohr frequency table summary', () => {
    render(<MatrixPanel eigenResult={mockEigenResult} />)
    expect(screen.getByText(/bohr frequencies/i)).toBeInTheDocument()
  })

  // N < 2 warning
  it('shows warning when only 1 eigenstate is provided', () => {
    const singleState = {
      ...mockEigenResult,
      energies: [0.5],
      wavefunctions: [mockEigenResult.wavefunctions[0]],
      norm_errors: [0],
    }
    render(<MatrixPanel eigenResult={singleState} />)
    expect(screen.getByText(/at least 2 eigenstates/i)).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// MatrixHeatmap — spec items 14–16
// ---------------------------------------------------------------------------

describe('MatrixHeatmap', () => {
  const data3x3 = [
    [1.0,  0.5, -0.5],
    [0.5,  2.0,  0.3],
    [-0.5, 0.3,  1.5],
  ]
  const labels3 = ['ψ₁', 'ψ₂', 'ψ₃']

  // 14. Renders an N×N table for N=3 input
  it('renders a table with 3 data rows for 3×3 input', () => {
    render(
      <MatrixHeatmap
        data={data3x3}
        rowLabels={labels3}
        colLabels={labels3}
        title="Test matrix"
      />
    )
    const table = screen.getByRole('table')
    // thead (1 header row) + tbody (3 data rows)
    const rows = within(table).getAllByRole('row')
    expect(rows).toHaveLength(4)  // 1 header + 3 data
  })

  it('renders 3 data cells per row (plus 1 label cell)', () => {
    render(
      <MatrixHeatmap
        data={data3x3}
        rowLabels={labels3}
        colLabels={labels3}
        title="Test matrix"
      />
    )
    const table = screen.getByRole('table')
    const rows = within(table).getAllByRole('row')
    // First data row: 1 header cell + 3 data cells
    const firstDataRow = rows[1]
    const cells = within(firstDataRow).getAllByRole('cell')
    expect(cells).toHaveLength(4)
  })

  // 15. Cell tooltip (title attribute) contains the numeric value
  it('cell title attribute contains the raw numeric value', () => {
    render(
      <MatrixHeatmap
        data={data3x3}
        rowLabels={labels3}
        colLabels={labels3}
        title="Test matrix"
      />
    )
    const table = screen.getByRole('table')
    const cells = within(table).getAllByRole('cell')
    // Find a data cell with a title (data cells have title, header cells don't)
    const dataCells = cells.filter(c => c.getAttribute('title'))
    expect(dataCells.length).toBeGreaterThan(0)
    // Every data cell title should contain a decimal number
    dataCells.forEach(cell => {
      expect(cell.getAttribute('title')).toMatch(/-?\d+\.\d+/)
    })
  })

  // 16. Values below threshold are displayed as "0.000"
  it('values below threshold are displayed as 0', () => {
    const dataWithTiny = [
      [1.0,   1e-15],
      [1e-15, 2.0  ],
    ]
    render(
      <MatrixHeatmap
        data={dataWithTiny}
        rowLabels={['ψ₁', 'ψ₂']}
        colLabels={['ψ₁', 'ψ₂']}
        title="Threshold test"
        threshold={1e-10}
      />
    )
    // The off-diagonal tiny values should display as "0.000"
    const zeroCells = screen.getAllByText('0.000')
    expect(zeroCells.length).toBeGreaterThanOrEqual(2)
  })

  // Title is rendered
  it('renders the title text', () => {
    render(
      <MatrixHeatmap
        data={data3x3}
        rowLabels={labels3}
        colLabels={labels3}
        title="My operator title"
      />
    )
    expect(screen.getByText('My operator title')).toBeInTheDocument()
  })

  // Row and column labels appear
  it('renders row and column labels', () => {
    render(
      <MatrixHeatmap
        data={data3x3}
        rowLabels={labels3}
        colLabels={labels3}
        title="Labels test"
      />
    )
    // ψ₁ appears at least twice (once as row label, once as column label)
    expect(screen.getAllByText('ψ₁').length).toBeGreaterThanOrEqual(2)
  })
})
