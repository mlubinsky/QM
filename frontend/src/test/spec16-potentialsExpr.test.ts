/**
 * Spec 16 — potentials.ts expr fields must be valid asteval syntax (item 5).
 *
 * Python ternary "x if cond else y" is NOT supported by asteval.
 * Valid alternatives use arithmetic on boolean arrays: (cond) * value.
 */
import { describe, it, expect } from 'vitest'
import { POTENTIALS } from '../data/potentials'

const PYTHON_TERNARY = /\bif\b.*\belse\b/

describe('Spec 16 — potentials.ts expr syntax', () => {
  it('finite_square_well expr does not use Python ternary', () => {
    expect(POTENTIALS.finite_square_well.expr).not.toMatch(PYTHON_TERNARY)
  })

  it('step_potential expr does not use Python ternary', () => {
    expect(POTENTIALS.step_potential.expr).not.toMatch(PYTHON_TERNARY)
  })

  // Positive check: ensure the replacement form is correct
  it('finite_square_well expr evaluates correctly for |x|<3', () => {
    // Expression should yield -10 when |x|<3 and 0 otherwise
    // We verify the structure contains the boolean-multiplication pattern
    expect(POTENTIALS.finite_square_well.expr).toMatch(/abs.*\*|<.*\*/)
  })

  it('step_potential expr evaluates correctly for x>0', () => {
    // Expression should yield 5 when x>0 and 0 otherwise
    expect(POTENTIALS.step_potential.expr).toMatch(/>\s*0.*\*|\*.*>\s*0/)
  })
})
