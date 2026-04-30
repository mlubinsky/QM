import 'katex/dist/katex.min.css'
import { BlockMath, InlineMath } from 'react-katex'

export function RadialDensityInfoPanel() {
  return (
    <div style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>

      <section style={{ marginBottom: '1rem' }}>
        <h4 style={{ margin: '0 0 6px' }}>What is being plotted?</h4>
        <p style={{ margin: '0 0 6px' }}>
          The curve shows the <strong>radial probability density</strong> — the probability
          of finding the electron in a thin spherical shell of radius <InlineMath math="r" /> and
          thickness <InlineMath math="dr" />:
        </p>
        <BlockMath math="P(r)\,dr = r^2\,|R_{nl}(r)|^2\,dr" />
        <p style={{ margin: '4px 0 0' }}>
          The factor <InlineMath math="r^2" /> comes from the volume of the shell:
          integrating <InlineMath math="dV = r^2\sin\theta\,dr\,d\theta\,d\phi" /> over all angles
          gives <InlineMath math="4\pi r^2\,dr" />.  The angular part integrates to 1 (spherical
          harmonics are normalised), so only the radial factor remains.
        </p>
      </section>

      <section style={{ marginBottom: '1rem' }}>
        <h4 style={{ margin: '0 0 6px' }}>Mean radius ⟨r⟩ (dashed line)</h4>
        <p style={{ margin: '0 0 6px' }}>
          The orange dashed vertical line marks the expectation value of the electron–nucleus
          distance, given exactly by:
        </p>
        <BlockMath math="\langle r \rangle_{nl} = \frac{a_0}{2Z}\bigl(3n^2 - l(l+1)\bigr)" />
        <p style={{ margin: '4px 0 0' }}>
          This is <em>not</em> the peak of the curve — the most probable radius and the mean
          radius differ (except for 1s). For 1s hydrogen: ⟨r⟩ = 1.5 Bohr, peak at 1 Bohr.
        </p>
      </section>

      <section style={{ marginBottom: '1rem' }}>
        <h4 style={{ margin: '0 0 6px' }}>Radial nodes</h4>
        <p style={{ margin: 0 }}>
          The curve crosses zero <InlineMath math="n - l - 1" /> times (excluding the
          origin and infinity). These are <strong>radial nodes</strong> — spherical shells
          where the electron has zero probability of being found. The 1s state has 0 nodes,
          2s has 1, 3s has 2, 3p has 1, and so on.
        </p>
      </section>

      <section style={{ marginBottom: '1rem' }}>
        <h4 style={{ margin: '0 0 6px' }}>Units</h4>
        <table style={{ borderCollapse: 'collapse', fontSize: '0.85rem', width: '100%' }}>
          <thead>
            <tr>
              {['Axis', 'Unit', 'Meaning', 'SI equivalent'].map(h => (
                <th key={h} style={{ padding: '2px 8px', textAlign: 'left', borderBottom: '1px solid #888' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ['x — radius r', 'Bohr (a₀)', 'atomic unit of length', '0.529 Å = 0.0529 nm'],
              ['x — radius r', 'Å (top axis)', 'Ångström', '1 Å = 1.889 Bohr'],
              ['y — P(r)', 'Bohr⁻¹', 'probability per unit r', '—'],
            ].map(([axis, unit, meaning, si], i) => (
              <tr key={i}>
                <td style={{ padding: '2px 8px' }}>{axis}</td>
                <td style={{ padding: '2px 8px', fontStyle: 'italic' }}>{unit}</td>
                <td style={{ padding: '2px 8px' }}>{meaning}</td>
                <td style={{ padding: '2px 8px', color: '#aaa' }}>{si}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ margin: '6px 0 0', color: '#aaa', fontSize: '0.85rem' }}>
          Integral check: <InlineMath math="\int_0^\infty r^2|R_{nl}|^2\,dr = 1" /> (the
          electron must be <em>somewhere</em>).
        </p>
      </section>

      <section>
        <h4 style={{ margin: '0 0 6px' }}>Z-scaling</h4>
        <p style={{ margin: 0 }}>
          Increasing nuclear charge <InlineMath math="Z" /> pulls the electron inward — the
          entire curve shifts left by a factor of <InlineMath math="Z" />.  He⁺ (Z=2) has
          ⟨r⟩ half that of H (Z=1) for the same (n, l).
        </p>
      </section>

    </div>
  )
}
