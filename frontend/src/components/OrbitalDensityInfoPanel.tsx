import 'katex/dist/katex.min.css'
import { BlockMath, InlineMath } from 'react-katex'

export function OrbitalDensityInfoPanel() {
  return (
    <div style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>

      <section style={{ marginBottom: '1rem' }}>
        <h4 style={{ margin: '0 0 6px' }}>What is being plotted?</h4>
        <p style={{ margin: '0 0 6px' }}>
          The heatmap shows a <strong>cross-section of the 3D electron density</strong> through
          the nucleus in the xz-plane (y = 0):
        </p>
        <BlockMath math="|\psi_{nlm}(x,0,z)|^2 = |R_{nl}(r)|^2\,|Y_l^m(\theta,0)|^2" />
        <p style={{ margin: '4px 0 0' }}>
          where <InlineMath math="r = \sqrt{x^2+z^2}" /> and{' '}
          <InlineMath math="\theta = \arccos(z/r)" />.  The nucleus sits at the centre (0, 0).
          Bright regions are where the electron is most likely to be found; dark regions are where
          it almost never is.
        </p>
      </section>

      <section style={{ marginBottom: '1rem' }}>
        <h4 style={{ margin: '0 0 6px' }}>Angular nodes</h4>
        <p style={{ margin: 0 }}>
          The spherical harmonic <InlineMath math="Y_l^m" /> has <InlineMath math="l" /> angular
          nodes — planes or cones of zero density passing through the nucleus.  An s-orbital
          (l=0) has none; a p-orbital (l=1) has one nodal plane; a d-orbital (l=2) has two.
          Combined with the <InlineMath math="n-l-1" /> radial nodes, the total number of
          nodes is always <InlineMath math="n-1" />.
        </p>
      </section>

      <section style={{ marginBottom: '1rem' }}>
        <h4 style={{ margin: '0 0 6px' }}>Why y = 0?</h4>
        <p style={{ margin: 0 }}>
          The full wavefunction lives in 3D, but we can only show a 2D slice.  The xz-plane
          through the nucleus (y = 0) captures the nodal structure for all real orbitals and
          for m = 0 complex ones.  For <InlineMath math="m \neq 0" /> the orbital has
          azimuthal symmetry around the z-axis, so this slice is representative.
        </p>
      </section>

      <section style={{ marginBottom: '1rem' }}>
        <h4 style={{ margin: '0 0 6px' }}>Units</h4>
        <table style={{ borderCollapse: 'collapse', fontSize: '0.85rem', width: '100%' }}>
          <thead>
            <tr>
              {['Axis / quantity', 'Unit', 'SI equivalent'].map(h => (
                <th key={h} style={{ padding: '2px 8px', textAlign: 'left', borderBottom: '1px solid #888' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ['x, z — position', 'Bohr (a₀)', '1 Bohr = 0.529 Å'],
              ['colorbar — |ψ|²', 'Bohr⁻³', 'probability density per unit volume'],
            ].map(([axis, unit, si], i) => (
              <tr key={i}>
                <td style={{ padding: '2px 8px' }}>{axis}</td>
                <td style={{ padding: '2px 8px', fontStyle: 'italic' }}>{unit}</td>
                <td style={{ padding: '2px 8px', color: '#aaa' }}>{si}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ margin: '6px 0 0', color: '#aaa', fontSize: '0.85rem' }}>
          Integral check: <InlineMath math="\int|\psi|^2\,dV = 1" /> over all space.  The
          colorbar values are small because the probability is spread over a large volume.
        </p>
      </section>

      <section>
        <h4 style={{ margin: '0 0 6px' }}>Colorscale</h4>
        <p style={{ margin: 0 }}>
          Viridis colorscale: dark purple = zero (or near-zero) probability, yellow = maximum.
          The scale is linear and normalised to the maximum value in the current cross-section,
          so colors are comparable within one orbital but not directly between different orbitals.
        </p>
      </section>

    </div>
  )
}
