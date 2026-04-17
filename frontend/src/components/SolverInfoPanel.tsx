import 'katex/dist/katex.min.css'
import { BlockMath, InlineMath } from 'react-katex'

export function SolverInfoPanel() {
  return (
    <div style={{ fontSize: '0.9rem', lineHeight: 1.55 }}>

      <section style={{ marginBottom: '1rem' }}>
        <h4 style={{ margin: '0 0 6px' }}>Grid</h4>
        <p style={{ margin: '0 0 6px' }}>
          The solver discretises <InlineMath math="[x_{\min},\, x_{\max}]" /> into{' '}
          <InlineMath math="N" /> uniformly spaced points:
        </p>
        <BlockMath math="\Delta x = \frac{x_{\max} - x_{\min}}{N - 1}" />
        <p style={{ margin: '4px 0 0' }}>
          Finer grids (larger <InlineMath math="N" />) resolve sharper features but increase
          computation time roughly as <InlineMath math="O(N)" />.
        </p>
      </section>

      <section style={{ marginBottom: '1rem' }}>
        <h4 style={{ margin: '0 0 6px' }}>Boundary conditions</h4>
        <p style={{ margin: 0 }}>
          Dirichlet (hard walls): <InlineMath math="\psi(x_{\min}) = \psi(x_{\max}) = 0" />.
          The particle is strictly confined to the box. Choose{' '}
          <InlineMath math="x_{\min}" />, <InlineMath math="x_{\max}" /> wide enough
          that the wavefunction decays to zero at the edges.
        </p>
      </section>

      <section style={{ marginBottom: '1rem' }}>
        <h4 style={{ margin: '0 0 6px' }}>Time evolution — Crank-Nicolson</h4>
        <p style={{ margin: '0 0 6px' }}>
          The time-dependent Schrödinger equation{' '}
          <InlineMath math="i\partial_t\psi = \hat{H}\psi" /> is stepped with
          the implicit Crank-Nicolson scheme:
        </p>
        <BlockMath math="\bigl(I + \tfrac{i\,\Delta t}{2}\hat{H}\bigr)\psi^{n+1} = \bigl(I - \tfrac{i\,\Delta t}{2}\hat{H}\bigr)\psi^{n}" />
        <ul style={{ margin: '4px 0 0', paddingLeft: '1.4em' }}>
          <li>Second-order accurate in time: error <InlineMath math="\propto \Delta t^2" /></li>
          <li>Unconditionally stable — no CFL restriction on <InlineMath math="\Delta t" /></li>
          <li>Unitary: <InlineMath math="\|\psi(t)\|^2" /> is conserved to machine precision</li>
        </ul>
      </section>

      <section style={{ marginBottom: '1rem' }}>
        <h4 style={{ margin: '0 0 6px' }}>Stationary states — finite difference</h4>
        <p style={{ margin: 0 }}>
          The kinetic energy operator{' '}
          <InlineMath math="\hat{T} = -\tfrac{1}{2}\partial_x^2" /> is discretised
          with the standard 3-point stencil:
        </p>
        <BlockMath math="(\hat{T}\psi)_j \approx \frac{-\psi_{j-1} + 2\psi_j - \psi_{j+1}}{2\,\Delta x^2}" />
        <p style={{ margin: '4px 0 0' }}>
          Eigenstates are found with a sparse symmetric eigensolver (<em>ARPACK</em>).
          Spatial error scales as <InlineMath math="O(\Delta x^2)" />.
        </p>
      </section>

      <section>
        <h4 style={{ margin: '0 0 6px' }}>Units</h4>
        <p style={{ margin: 0 }}>
          All quantities are in <strong>atomic units</strong>:{' '}
          <InlineMath math="\hbar = m_e = e = 1" />.
          Lengths are in Bohr radii (<InlineMath math="a_0 \approx 0.529\,\text{Å}" />),
          energies in Hartree (<InlineMath math="E_h \approx 27.2\,\text{eV}" />),
          and times in <InlineMath math="\hbar/E_h \approx 24.2\,\text{as}" />.
        </p>
      </section>

    </div>
  )
}
