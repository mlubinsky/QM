import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PhysicsPanel } from '../components/PhysicsPanel'
import { POTENTIALS, POTENTIAL_KEYS } from '../data/potentials'

describe('PhysicsPanel – rendering', () => {
  it.each(POTENTIAL_KEYS)('renders preset "%s" without crashing', (key) => {
    const { container } = render(<PhysicsPanel potentialKey={key} />)
    expect(container.firstChild).not.toBeNull()
  })

  it.each(['step_potential', 'gaussian_barrier'])('shows warning for scattering preset "%s"', (key) => {
    render(<PhysicsPanel potentialKey={key} />)
    expect(screen.getByText(/no bound states/i)).toBeInTheDocument()
  })

  it.each(['infinite_square_well', 'harmonic_oscillator'])('does not show warning for bound-state preset "%s"', (key) => {
    render(<PhysicsPanel potentialKey={key} />)
    expect(screen.queryByText(/no bound states/i)).not.toBeInTheDocument()
  })

  it('returns null for unknown key', () => {
    const { container } = render(<PhysicsPanel potentialKey="unknown_preset_xyz" />)
    expect(container.firstChild).toBeNull()
  })

  it.each(POTENTIAL_KEYS)('shows correct title for "%s"', (key) => {
    render(<PhysicsPanel potentialKey={key} />)
    expect(screen.getByText(POTENTIALS[key].label)).toBeInTheDocument()
  })
})

describe('PhysicsPanel – data integrity', () => {
  it.each(POTENTIAL_KEYS)('preset "%s" has non-empty hamiltonian_latex', (key) => {
    expect(POTENTIALS[key].hamiltonian_latex.length).toBeGreaterThan(0)
  })

  it.each(POTENTIAL_KEYS)('preset "%s" has non-empty formula_label', (key) => {
    expect(POTENTIALS[key].formula_label.length).toBeGreaterThan(0)
  })

  it.each(POTENTIAL_KEYS)('preset "%s" has non-empty key_formula_latex', (key) => {
    expect(POTENTIALS[key].key_formula_latex.length).toBeGreaterThan(0)
  })

  it.each(POTENTIAL_KEYS)('preset "%s" has at least one interesting feature', (key) => {
    expect(POTENTIALS[key].interesting_features.length).toBeGreaterThan(0)
  })

  it('step_potential and gaussian_barrier have has_bound_states === false', () => {
    expect(POTENTIALS['step_potential'].has_bound_states).toBe(false)
    expect(POTENTIALS['gaussian_barrier'].has_bound_states).toBe(false)
  })

  it('bound-state presets have has_bound_states === true', () => {
    const boundPresets = ['infinite_square_well', 'harmonic_oscillator', 'double_well', 'finite_square_well']
    boundPresets.forEach(key => {
      expect(POTENTIALS[key].has_bound_states).toBe(true)
    })
  })

  it('scattering presets have non-empty scattering_note', () => {
    expect(POTENTIALS['step_potential'].scattering_note?.length).toBeGreaterThan(0)
    expect(POTENTIALS['gaussian_barrier'].scattering_note?.length).toBeGreaterThan(0)
  })

  it('POTENTIAL_KEYS contains all 7 presets in order', () => {
    expect(POTENTIAL_KEYS).toEqual([
      'infinite_square_well',
      'harmonic_oscillator',
      'double_well',
      'deep_double_well',
      'finite_square_well',
      'step_potential',
      'gaussian_barrier',
    ])
  })
})
