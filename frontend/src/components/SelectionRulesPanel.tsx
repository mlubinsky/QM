import 'katex/dist/katex.min.css'
import { BlockMath, InlineMath } from 'react-katex'

export function SelectionRulesPanel() {
  return (
    <div style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>

      <section style={{ marginBottom: '1rem' }}>
        <h4 style={{ margin: '0 0 6px' }}>Why are some transitions forbidden?</h4>
        <p style={{ margin: 0 }}>
          The answer comes entirely from <strong>symmetry</strong> — not from any ad hoc rule.
          A photon carries angular momentum <InlineMath math="\hbar" />. When an electron emits or
          absorbs a photon, angular momentum must be conserved. This single requirement generates
          all of the selection rules automatically.
        </p>
      </section>

      <section style={{ marginBottom: '1rem' }}>
        <h4 style={{ margin: '0 0 6px' }}>The matrix element</h4>
        <p style={{ margin: '0 0 6px' }}>
          In time-dependent perturbation theory, the transition rate between states{' '}
          <InlineMath math="|n,\ell,m\rangle" /> and <InlineMath math="|n',\ell',m'\rangle" /> is
          proportional to:
        </p>
        <BlockMath math="W \propto \bigl|\langle n'\ell'm'|\,\mathbf{r}\,|n\ell m\rangle\bigr|^2" />
        <p style={{ margin: '4px 0 0' }}>
          If this integral is zero, the transition is <strong>forbidden</strong> — the electron
          cannot make that jump via single-photon emission. Whether it vanishes is decided entirely
          by the symmetry of the wavefunctions involved.
        </p>
      </section>

      <section style={{ marginBottom: '1rem' }}>
        <h4 style={{ margin: '0 0 6px' }}>
          Rule 1 — <InlineMath math="\Delta\ell = \pm 1" /> (the key rule)
        </h4>
        <p style={{ margin: '0 0 6px' }}>
          The position operator <InlineMath math="\mathbf{r}" /> has <em>odd parity</em> — it
          flips sign under <InlineMath math="\mathbf{r} \to -\mathbf{r}" />. Hydrogen wavefunctions
          have definite parity <InlineMath math="(-1)^\ell" />. For the integrand to be even
          (so the integral can survive), we need:
        </p>
        <BlockMath math="(-1)^{\ell'} \cdot (-1)^1 \cdot (-1)^\ell = +1 \;\Longrightarrow\; \ell' + \ell \text{ odd} \;\Longrightarrow\; \Delta\ell = \pm 1" />
        <p style={{ margin: '4px 0 0' }}>
          Example: <strong>2s → 1s</strong> is forbidden — both states have even parity (
          <InlineMath math="\ell=0" />), so the integrand is odd and integrates to zero.
          But <strong>2p → 1s</strong> is allowed: <InlineMath math="\ell" /> goes from 1 to 0,
          parity flips, the integral survives.
        </p>
      </section>

      <section style={{ marginBottom: '1rem' }}>
        <h4 style={{ margin: '0 0 6px' }}>
          Rule 2 — <InlineMath math="\Delta m = 0, \pm 1" />
        </h4>
        <p style={{ margin: '0 0 6px' }}>
          The <InlineMath math="\phi" />-dependence of <InlineMath math="Y_\ell^m" /> is{' '}
          <InlineMath math="e^{im\phi}" />. The dipole operator introduces{' '}
          <InlineMath math="e^{\pm i\phi}" /> factors, so the <InlineMath math="\phi" /> integral
          vanishes unless <InlineMath math="\Delta m = 0" /> or <InlineMath math="\pm 1" />.
          These correspond to linearly and circularly polarized photons — exactly the three physical
          polarizations of light.
        </p>
      </section>

      <section style={{ marginBottom: '1rem' }}>
        <h4 style={{ margin: '0 0 6px' }}>
          Rule 3 — <InlineMath math="\Delta n" />: no restriction
        </h4>
        <p style={{ margin: 0 }}>
          There is no restriction on <InlineMath math="\Delta n" /> from symmetry alone. Any{' '}
          <InlineMath math="n \to n'" /> transition is allowed as long as{' '}
          <InlineMath math="\Delta\ell = \pm 1" /> is satisfied. This is why the Lyman series
          allows <InlineMath math="n=2,3,4,\ldots \to 1" /> with no upper limit on <em>n</em>.
        </p>
      </section>

      <section style={{ marginBottom: '1rem' }}>
        <h4 style={{ margin: '0 0 6px' }}>
          Rule 4 — <InlineMath math="\Delta s = 0" /> (spin unchanged)
        </h4>
        <p style={{ margin: 0 }}>
          The electric dipole operator acts only on spatial coordinates — it is blind to spin.
          So spin cannot flip in an E1 transition. In multi-electron atoms this is why singlet and
          triplet states barely mix (hence the long lifetime of helium's triplet metastable state).
        </p>
      </section>

      <section style={{ marginBottom: '1rem' }}>
        <h4 style={{ margin: '0 0 6px' }}>Summary</h4>
        <table style={{ borderCollapse: 'collapse', fontSize: '0.85rem', width: '100%' }}>
          <thead>
            <tr>
              {['Quantity', 'Rule', 'Physical reason'].map(h => (
                <th key={h} style={{ padding: '2px 8px', textAlign: 'left', borderBottom: '1px solid #888' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ['Δℓ', '= ±1', 'Parity + photon angular momentum'],
              ['Δm', '= 0, ±1', 'φ-integral orthogonality'],
              ['Δs', '= 0', 'Dipole operator is spin-blind'],
              ['Δn', 'any', 'No symmetry restriction'],
              ['Δj (with spin)', '= 0, ±1', 'Total angular momentum conservation'],
            ].map(([q, rule, reason]) => (
              <tr key={q}>
                <td style={{ padding: '2px 8px', fontStyle: 'italic' }}>{q}</td>
                <td style={{ padding: '2px 8px' }}>{rule}</td>
                <td style={{ padding: '2px 8px' }}>{reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h4 style={{ margin: '0 0 6px' }}>"Forbidden" doesn't mean "impossible"</h4>
        <p style={{ margin: '0 0 6px' }}>
          Selection rules apply specifically to <strong>electric dipole (E1)</strong> transitions,
          by far the strongest. Forbidden transitions can still occur via:
        </p>
        <ul style={{ margin: '0 0 6px', paddingLeft: '1.4rem' }}>
          <li><strong>Magnetic dipole (M1)</strong> — rate ~10⁻⁵ of E1</li>
          <li><strong>Electric quadrupole (E2)</strong> — allows <InlineMath math="\Delta\ell = 0, \pm 2" /></li>
          <li><strong>Two-photon emission</strong> — the 2s state decays this way</li>
        </ul>
        <p style={{ margin: 0 }}>
          The <strong>2s state</strong> is the classic example: it cannot decay to 1s via a single
          photon (<InlineMath math="\Delta\ell = 0" /> is E1-forbidden), so it lives for{' '}
          <strong>0.12 seconds</strong> — nearly 10⁸ times longer than the 2p state (~1 ns).
          In astrophysics, this two-photon emission from hydrogen produces a characteristic
          continuum visible in planetary nebulae.
        </p>
      </section>

    </div>
  )
}
