export interface ParameterDef {
  name: string
  label: string
  min: number
  max: number
  step: number
  default: number
  unit: string
  description: string
}

export interface PotentialInfo {
  label: string
  expr: string
  hamiltonian_latex: string
  formula_label: string
  key_formula_latex: string
  formula_note?: string   // optional plain-English gloss shown below the formula
  description: string
  interesting_features: string[]
  has_bound_states: boolean
  scattering_note?: string
  parameters?: ParameterDef[]
}

export const POTENTIALS: Record<string, PotentialInfo> = {
  infinite_square_well: {
    label: 'Infinite Square Well',
    // V = 0 inside; confinement is enforced by Dirichlet BCs (ψ = 0 at grid edges),
    // not by an explicit potential wall.  The well width L = x_max − x_min.
    expr: '0',
    hamiltonian_latex:
      '\\hat{H} = -\\frac{\\hbar^2}{2m}\\frac{d^2}{dx^2} + V(x), \\quad V(x) = \\begin{cases} 0 & |x| < L/2 \\\\ \\infty & \\text{otherwise} \\end{cases}',
    formula_label: 'Energy Levels',
    key_formula_latex:
      'E_n = \\frac{n^2 \\pi^2 \\hbar^2}{2mL^2}, \\quad n = 1, 2, 3, \\ldots',
    has_bound_states: true,
    description:
      'Particle-in-a-box: zero potential inside a hard-walled region. ' +
      'The walls are implemented as Dirichlet boundary conditions (ψ = 0 at the grid edges), ' +
      'so the well width L equals the grid range x_max − x_min. ' +
      'Changing the grid bounds changes all energy levels.',
    interesting_features: [
      'Well width L = x_max − x_min: wider grid → lower energies (E ∝ 1/L²)',
      'Energy levels scale as n²: the gap between levels grows with n',
      'Ground state has non-zero energy (zero-point energy)',
      'Wavefunctions are standing sine waves with n antinodes',
      'Eigenstates alternate between even and odd symmetry',
    ],
  },

  harmonic_oscillator: {
    label: 'Harmonic Oscillator',
    expr: '0.5 * x**2',
    hamiltonian_latex:
      '\\hat{H} = -\\frac{\\hbar^2}{2m}\\frac{d^2}{dx^2} + \\tfrac{1}{2}m\\omega^2 x^2',
    formula_label: 'Energy Levels',
    key_formula_latex:
      'E_n = \\hbar\\omega\\!\\left(n + \\tfrac{1}{2}\\right), \\quad n = 0, 1, 2, \\ldots',
    has_bound_states: true,
    description:
      'Quadratic confining potential with equally spaced energy levels and Hermite-polynomial wavefunctions. Fundamental to quantum field theory.',
    interesting_features: [
      'Equally spaced energy levels — unique to the harmonic oscillator',
      'Ground state is a Gaussian: ψ₀ ∝ exp(−x²/2)',
      'Coherent states (Gaussian packets) oscillate without spreading',
      'Models molecular vibrations, photons, and quantum fields',
    ],
  },

  double_well: {
    label: 'Double Well',
    expr: '{lambda} * (x**2 - {a}**2)**2',
    hamiltonian_latex:
      '\\hat{H} = -\\frac{1}{2}\\frac{d^2}{dx^2} + \\lambda(x^2 - a^2)^2',
    formula_label: 'Energy Levels',
    key_formula_latex:
      '\\left[-\\frac{1}{2}\\frac{d^2}{dx^2} + \\lambda(x^2-a^2)^2\\right]\\psi(x) = E\\psi(x)',
    has_bound_states: true,
    parameters: [
      {
        name: 'a',
        label: 'Well separation',
        min: 0.5,
        max: 3.0,
        step: 0.1,
        default: 1.0,
        unit: 'a.u.',
        description:
          'Distance from origin to each well minimum. Barrier height scales as a⁴.',
      },
      {
        name: 'lambda',
        label: 'Well depth λ',
        min: 0.1,
        max: 5.0,
        step: 0.1,
        default: 0.5,
        unit: 'a.u.',
        description:
          'Overall depth and steepness of the wells. Larger λ deepens the wells and raises the barrier.',
      },
    ],
    description:
      'Two symmetric wells with minima at x = ±a, separated by a barrier ' +
      'of height V(0) = λa⁴ at x = 0. With default parameters (λ = 0.5, ' +
      'a = 1), the barrier height is only 0.5 a.u. — lower than the ground ' +
      'state energy. All eigenstates sit above the barrier: no tunneling. ' +
      'Increase λ or a to enter the tunneling regime, or switch to ' +
      'Deep Double Well which starts there.',
    interesting_features: [
      'Default barrier height V(0) = λa⁴ = 0.5 a.u. — below ground state',
      'Default regime: all eigenstates above the barrier, no tunneling',
      'Increasing λ or a raises the barrier — watch E₁ drop below V(0)',
      'Once E₁ < V(0) the system enters the tunneling regime',
      'Compare with Deep Double Well to see what tunneling looks like',
    ],
  },

  deep_double_well: {
    label: 'Deep Double Well',
    expr: '{lambda} * (x**2 - {a}**2)**2',
    hamiltonian_latex:
      '\\hat{H} = -\\frac{1}{2}\\frac{d^2}{dx^2} + \\lambda(x^2 - a^2)^2',
    formula_label: 'Energy Levels',
    key_formula_latex:
      '\\left[-\\frac{1}{2}\\frac{d^2}{dx^2} + \\lambda(x^2-a^2)^2\\right]\\psi(x) = E\\psi(x)',
    has_bound_states: true,
    parameters: [
      {
        name: 'a',
        label: 'Well separation',
        min: 0.5,
        max: 3.0,
        step: 0.1,
        default: 1.414,
        unit: 'a.u.',
        description:
          'Distance from origin to each well minimum. Barrier height scales as a⁴.',
      },
      {
        name: 'lambda',
        label: 'Well depth λ',
        min: 0.1,
        max: 5.0,
        step: 0.1,
        default: 2.0,
        unit: 'a.u.',
        description:
          'Overall depth and steepness of the wells. Larger λ deepens the wells and raises the barrier.',
      },
    ],
    description:
      'The same formula as Double Well but with deeper default parameters ' +
      '(λ = 2, a = √2 ≈ 1.41). Barrier height V(0) = λa⁴ ≈ 8 a.u. is ' +
      'well above the ground state (~2 a.u.), placing the system firmly ' +
      'in the tunneling regime. The lowest two eigenstates form a nearly ' +
      'degenerate pair — their tiny energy splitting ΔE = E₂ − E₁ directly ' +
      'encodes the tunneling amplitude. Same physics as nitrogen inversion ' +
      'in ammonia (NH₃).',
    interesting_features: [
      'Default barrier height V(0) ≈ 8 a.u. — well above ground state E₁ ≈ 2 a.u.',
      'E₁ and E₂ are nearly degenerate: compute ΔE = E₂ − E₁ from results',
      'ΔE is the tunneling splitting — cannot be found analytically',
      'Tunneling period T = π / ΔE atomic units — visible in time evolution',
      'A Gaussian started in one well oscillates to the other at period T',
      'Decrease λ or a to shrink barrier — watch ΔE grow as tunneling increases',
      'Compare with Double Well (shallow regime) to see the contrast',
    ],
  },

  finite_square_well: {
    label: 'Finite Square Well',
    expr: '(abs(x) < 3) * -10',
    hamiltonian_latex:
      '\\hat{H} = -\\frac{\\hbar^2}{2m}\\frac{d^2}{dx^2} + V(x), \\quad V(x) = \\begin{cases} -V_0 & |x| < a \\\\ 0 & |x| \\geq a \\end{cases}',
    formula_label: 'Energy Levels',
    key_formula_latex:
      'k\\tan(ka) = \\kappa, \\quad k = \\sqrt{2m(E+V_0)/\\hbar^2}, \\; \\kappa = \\sqrt{-2mE/\\hbar^2}',
    has_bound_states: true,
    description:
      'Attractive square well of finite depth. Supports finitely many bound states; wavefunctions decay exponentially into the classically-forbidden region.',
    interesting_features: [
      'Wavefunctions tunnel into the classically-forbidden region outside the well',
      'A finite well always has at least one bound state',
      'Eigenenergies are lower than the corresponding infinite-well values',
      'Scattering resonances (quasi-bound states) appear above the well edge',
    ],
  },

  step_potential: {
    label: 'Step Potential',
    expr: '(x > 0) * 5',
    hamiltonian_latex:
      '\\hat{H} = -\\frac{\\hbar^2}{2m}\\frac{d^2}{dx^2} + V(x), \\quad V(x) = \\begin{cases} 0 & x < 0 \\\\ V_0 & x \\geq 0 \\end{cases}',
    formula_label: 'Scattering Coefficients',
    key_formula_latex:
      'R = \\left(\\frac{k_1 - k_2}{k_1 + k_2}\\right)^{\\!2}, \\quad T = \\frac{4k_1 k_2}{(k_1+k_2)^2}, \\quad R + T = 1',
    formula_note:
      'R (reflection) and T (transmission) are the fractions of probability that bounce back or pass through. ' +
      'They always sum to 1 — conservation of probability. ' +
      'k₁ = √(2mE)/ħ is the wavenumber before the step; ' +
      'k₂ = √(2m(E−V₀))/ħ after it (imaginary when E < V₀, giving pure reflection with evanescent decay).',
    has_bound_states: false,
    scattering_note:
      'This potential has no bound states. The energy levels shown by a finite-box solver are artifacts of the ' +
      'simulation walls, not physical properties of the step potential. Use Time Evolution mode to see the real ' +
      'physics: watch a wavepacket partially reflect and partially transmit at x = 0.',
    description:
      'An abrupt potential jump. Incident wavefunctions partially reflect and transmit — quantum reflection occurs even when E > V₀.',
    interesting_features: [
      'Quantum reflection occurs for E > V₀ (no classical analogue)',
      'Complete reflection with evanescent decay for E < V₀',
      'Reflection coefficient is non-monotonic in energy',
      'Simplest model for a semiconductor heterojunction barrier',
    ],
  },

  gaussian_barrier: {
    label: 'Gaussian Barrier',
    expr: '5 * exp(-0.5 * x**2)',
    hamiltonian_latex:
      '\\hat{H} = -\\frac{\\hbar^2}{2m}\\frac{d^2}{dx^2} + V_0\\,e^{-x^2/2\\sigma^2}',
    formula_label: 'Tunneling Probability',
    key_formula_latex:
      'T \\approx \\exp\\!\\left(-2\\int_{x_1}^{x_2}\\!\\sqrt{2m[V(x)-E]/\\hbar^2}\\,dx\\right) \\quad (\\text{WKB})',
    formula_note:
      'The WKB (Wentzel–Kramers–Brillouin) approximation gives the tunneling probability for a particle ' +
      'whose energy E is less than the barrier height V(x). ' +
      'The integral runs between the two classical turning points x₁ and x₂ where V = E. ' +
      'Tunneling drops exponentially with barrier width and height — ' +
      'this is why electrons tunnel easily (scanning tunneling microscopes, tunnel diodes) but macroscopic objects do not.',
    has_bound_states: false,
    scattering_note:
      'This potential has no bound states. The energy levels shown by a finite-box solver are artifacts of the ' +
      'simulation walls, not physical properties of the barrier. Use Time Evolution mode to see the real ' +
      'physics: watch a wavepacket split into reflected and transmitted components.',
    description:
      'Smooth Gaussian-shaped barrier. A wavepacket incident from the left partially tunnels through and partially reflects.',
    interesting_features: [
      'Tunneling probability grows exponentially as barrier height decreases',
      'Transmitted and reflected packets separate cleanly after scattering',
      'Phase shift of reflected/transmitted packets is energy-dependent',
      'Smooth shape avoids the unphysical discontinuities of square barriers',
    ],
  },
}

export const POTENTIAL_KEYS = Object.keys(POTENTIALS)
