import 'katex/dist/katex.min.css'
import { BlockMath, InlineMath } from 'react-katex'

export function SphericalHarmonicInfoPanel() {
  return (
    <div style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>

      <section style={{ marginBottom: '1rem' }}>
        <h4 style={{ margin: '0 0 6px' }}>What is being plotted?</h4>
        <p style={{ margin: '0 0 6px' }}>
          The polar diagram shows the <strong>angular probability distribution</strong> —
          the direction-dependent factor of the full wavefunction:
        </p>
        <BlockMath math="|Y_l^m(\theta)|^2 \quad \text{(normalised to max = 1)}" />
        <p style={{ margin: '4px 0 0' }}>
          The distance from the origin in any direction is proportional to the probability of
          finding the electron in that direction, regardless of radius.  The nucleus sits at the
          centre.  The z-axis (vertical) is the quantisation axis.
        </p>
      </section>

      <section style={{ marginBottom: '1rem' }}>
        <h4 style={{ margin: '0 0 6px' }}>Relationship to the full wavefunction</h4>
        <p style={{ margin: '0 0 6px' }}>
          The hydrogen wavefunction factorises exactly:
        </p>
        <BlockMath math="\psi_{nlm}(r,\theta,\phi) = R_{nl}(r)\,Y_l^m(\theta,\phi)" />
        <p style={{ margin: '4px 0 0' }}>
          The radial density plot shows <InlineMath math="|R_{nl}|^2" /> (how far from the
          nucleus); this polar plot shows <InlineMath math="|Y_l^m|^2" /> (in which direction).
          The orbital density heatmap shows their product.
        </p>
      </section>

      <section style={{ marginBottom: '1rem' }}>
        <h4 style={{ margin: '0 0 6px' }}>Why is φ absent?</h4>
        <p style={{ margin: '0 0 6px' }}>
          The complex spherical harmonics are{' '}
          <InlineMath math="Y_l^m(\theta,\phi) = P_l^{|m|}(\cos\theta)\,e^{im\phi}" />, so:
        </p>
        <BlockMath math="|Y_l^m(\theta,\phi)|^2 = |P_l^{|m|}(\cos\theta)|^2" />
        <p style={{ margin: '4px 0 0' }}>
          The <InlineMath math="e^{im\phi}" /> phase cancels in the modulus squared, leaving a
          function of <InlineMath math="\theta" /> only.  The full 3D shape is obtained by
          rotating this curve around the z-axis.
        </p>
      </section>

      <section style={{ marginBottom: '1rem' }}>
        <h4 style={{ margin: '0 0 6px' }}>Angular nodes</h4>
        <p style={{ margin: 0 }}>
          The curve touches the origin exactly <InlineMath math="l" /> times (excluding the
          endpoints at θ=0 and θ=π for m≠0).  An s-orbital (l=0) is a circle — no angular
          nodes.  A p-orbital (l=1) has one node; a d-orbital (l=2) has two.  Each node
          corresponds to a nodal cone (or the equatorial plane for m=0 p-orbitals).
        </p>
      </section>

      <section>
        <h4 style={{ margin: '0 0 6px' }}>Normalisation</h4>
        <p style={{ margin: 0 }}>
          The curve is normalised to its maximum value so that the shape always fills the
          plot.  Absolute magnitudes are not directly comparable between different (l, m)
          pairs — what matters is the shape and the location of the nodes.
        </p>
      </section>

    </div>
  )
}
