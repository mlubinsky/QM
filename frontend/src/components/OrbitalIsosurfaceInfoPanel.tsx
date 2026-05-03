import 'katex/dist/katex.min.css'
import { BlockMath, InlineMath } from 'react-katex'

export function OrbitalIsosurfaceInfoPanel() {
  return (
    <div style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>

      <section style={{ marginBottom: '1rem' }}>
        <h4 style={{ margin: '0 0 6px' }}>What is being shown?</h4>
        <p style={{ margin: '0 0 6px' }}>
          The surface encloses the region of space where the probability density
          of finding the electron exceeds <strong>10% of its peak value</strong>:
        </p>
        <BlockMath math="|\psi_{nlm}(x,y,z)|^2 \geq 0.10 \times \max|\psi_{nlm}|^2" />
        <p style={{ margin: '4px 0 0' }}>
          This threshold is a conventional choice — it shows the orbital <em>envelope</em>
          (the region where the electron spends most of its time) without filling the entire
          plot with near-zero density.
        </p>
      </section>

      <section style={{ marginBottom: '1rem' }}>
        <h4 style={{ margin: '0 0 6px' }}>How is ψ computed?</h4>
        <p style={{ margin: '0 0 6px' }}>
          The analytic hydrogenic wavefunction is factored into a radial part and an angular part:
        </p>
        <BlockMath math="\psi_{nlm}(r,\theta,\phi) = R_{nl}(r)\,Y_l^m(\theta,\phi)" />
        <p style={{ margin: '4px 0 0' }}>
          The radial function uses the associated Laguerre polynomial:
        </p>
        <BlockMath math="R_{nl}(r) = N_{nl}\,e^{-\rho/2}\,\rho^l\,L_{n-l-1}^{2l+1}(\rho),\quad \rho = \frac{2Zr}{n}" />
        <p style={{ margin: '4px 0 0' }}>
          where <InlineMath math="N_{nl}" /> is the normalization constant and <InlineMath math="L_k^\alpha" /> is
          the associated Laguerre polynomial.  The angular part <InlineMath math="Y_l^m" /> is the
          spherical harmonic.
        </p>
      </section>

      <section style={{ marginBottom: '1rem' }}>
        <h4 style={{ margin: '0 0 6px' }}>Orbital shapes and nodal structure</h4>
        <p style={{ margin: '0 0 4px' }}>
          The total number of nodes is <InlineMath math="n - 1" />, split between:
        </p>
        <ul style={{ margin: '0 0 6px', paddingLeft: '1.4em' }}>
          <li><strong>Radial nodes</strong> (<InlineMath math="n - l - 1" /> spherical shells where <InlineMath math="R_{nl} = 0" />)</li>
          <li><strong>Angular nodes</strong> (<InlineMath math="l" /> planes or cones where <InlineMath math="Y_l^m = 0" />)</li>
        </ul>
        <p style={{ margin: 0 }}>
          For example, the 2p<sub>z</sub> orbital (<InlineMath math="n{=}2, l{=}1, m{=}0" />) has 0 radial
          nodes and 1 angular node — the <InlineMath math="z{=}0" /> plane — giving the familiar
          dumbbell shape.
        </p>
      </section>

      <section style={{ marginBottom: '1rem' }}>
        <h4 style={{ margin: '0 0 6px' }}>Units and grid</h4>
        <p style={{ margin: '0 0 4px' }}>
          All axes are in <strong>atomic units</strong> (Bohr radii, a₀ ≈ 0.529 Å). The grid
          extends to roughly <InlineMath math="5n(n+1)/Z" /> Bohr in each direction — enough to
          capture the outer lobes of higher-n states while contracting for larger <InlineMath math="Z" />.
        </p>
        <table style={{ borderCollapse: 'collapse', fontSize: '0.85rem', width: '100%' }}>
          <thead>
            <tr>
              {['Quantity', 'Unit', 'SI equivalent'].map(h => (
                <th key={h} style={{ padding: '2px 8px', textAlign: 'left', borderBottom: '1px solid #888' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ['x, y, z axes', 'Bohr (a₀)', '1 a₀ = 0.529 Å'],
              ['Colour — |ψ|²', 'Bohr⁻³', 'probability per unit volume'],
            ].map(([q, u, si], i) => (
              <tr key={i}>
                <td style={{ padding: '2px 8px' }}>{q}</td>
                <td style={{ padding: '2px 8px', fontStyle: 'italic' }}>{u}</td>
                <td style={{ padding: '2px 8px', color: '#aaa' }}>{si}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h4 style={{ margin: '0 0 6px' }}>Z-scaling</h4>
        <p style={{ margin: 0 }}>
          Increasing the nuclear charge <InlineMath math="Z" /> contracts the orbital by a
          factor of <InlineMath math="Z" /> — the characteristic size scales as{' '}
          <InlineMath math="\langle r \rangle \propto n^2 / Z" />. He⁺ (Z=2) orbitals are
          half the size of H (Z=1) for the same quantum numbers.
        </p>
      </section>

    </div>
  )
}
