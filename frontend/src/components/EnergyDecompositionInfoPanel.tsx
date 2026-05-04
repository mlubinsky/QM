import 'katex/dist/katex.min.css'
import { BlockMath, InlineMath } from 'react-katex'

export function EnergyDecompositionInfoPanel() {
  return (
    <div style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>

      <section style={{ marginBottom: '1rem' }}>
        <h4 style={{ margin: '0 0 6px' }}>Expanding in energy eigenstates</h4>
        <p style={{ margin: '0 0 6px' }}>
          Any normalised state can be written as a superposition of energy eigenstates:
        </p>
        <BlockMath math="\psi(x,0) = \sum_n c_n\,\psi_n(x)" />
        <p style={{ margin: '4px 0 0' }}>
          The expansion coefficients are the inner products:
        </p>
        <BlockMath math="c_n = \langle\psi_n|\psi(0)\rangle = \int \psi_n^*(x)\,\psi(x,0)\,dx" />
      </section>

      <section style={{ marginBottom: '1rem' }}>
        <h4 style={{ margin: '0 0 6px' }}>Time-independent weights</h4>
        <p style={{ margin: '0 0 6px' }}>
          Under time evolution each component acquires a phase factor:
        </p>
        <BlockMath math="\psi(x,t) = \sum_n c_n\,e^{-iE_n t}\,\psi_n(x)" />
        <p style={{ margin: '4px 0 0' }}>
          The weights <InlineMath math="|c_n|^2" /> are <strong>time-independent</strong> — energy
          is conserved, so the bar chart never changes during the animation.
        </p>
      </section>

      <section style={{ marginBottom: '1rem' }}>
        <h4 style={{ margin: '0 0 6px' }}>Interference and beating</h4>
        <p style={{ margin: '0 0 6px' }}>
          The probability density contains cross terms:
        </p>
        <BlockMath math="|\psi(x,t)|^2 = \sum_n|c_n|^2|\psi_n|^2 + 2\!\sum_{m>n}\mathrm{Re}\!\left[c_m c_n^* e^{-i(E_m-E_n)t}\psi_m\psi_n^*\right]" />
        <p style={{ margin: '4px 0 0' }}>
          The cross terms oscillate at the <strong>Bohr frequencies</strong>{' '}
          <InlineMath math="\omega_{mn} = E_m - E_n" /> (atomic units, <InlineMath math="\hbar=1" />).
          The beating period between modes m and n is:
        </p>
        <BlockMath math="T_{mn} = \frac{2\pi}{|E_m - E_n|}" />
        <p style={{ margin: '4px 0 0' }}>
          Hover over a bar to see the beating period relative to the ground state.
        </p>
      </section>

      <section style={{ marginBottom: '1rem' }}>
        <h4 style={{ margin: '0 0 6px' }}>Reading the bar chart</h4>
        <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
          <li>Bar height = probability weight <InlineMath math="|c_n|^2" /> of eigenstate <InlineMath math="\psi_n" /></li>
          <li>Weights sum to ≤ 1 (exactly 1 if all eigenstates were included)</li>
          <li>A pure eigenstate: one bar at height 1, all others at 0</li>
          <li>Equal superposition of two states: two bars each at 0.5</li>
          <li>The annotation shows the total captured weight <InlineMath math="\sum_n|c_n|^2" /></li>
        </ul>
      </section>

      <section>
        <h4 style={{ margin: '0 0 6px' }}>Units</h4>
        <p style={{ margin: 0 }}>
          Energies <InlineMath math="E_n" /> are in atomic units (Hartree).{' '}
          1 Hartree = 27.2 eV. The harmonic oscillator levels are{' '}
          <InlineMath math="E_n = n + \tfrac{1}{2}" /> and the infinite square well
          levels are <InlineMath math="E_n = n^2\pi^2/2L^2" />.
        </p>
      </section>

    </div>
  )
}
