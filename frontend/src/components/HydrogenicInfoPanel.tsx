import 'katex/dist/katex.min.css'
import { BlockMath, InlineMath } from 'react-katex'

export function HydrogenicInfoPanel() {
  return (
    <div style={{ fontSize: '0.9rem', lineHeight: 1.55 }}>

      <section style={{ marginBottom: '1rem' }}>
        <h4 style={{ margin: '0 0 6px' }}>Hamiltonian</h4>
        <p style={{ margin: '0 0 6px' }}>
          A single electron bound to a nucleus of charge <InlineMath math="Z" /> (atomic units{' '}
          <InlineMath math="\hbar = m_e = e = 1" />):
        </p>
        <BlockMath math="\hat{H} = -\tfrac{1}{2}\nabla^2 - \frac{Z}{r}" />
      </section>

      <section style={{ marginBottom: '1rem' }}>
        <h4 style={{ margin: '0 0 6px' }}>Radial reduction</h4>
        <p style={{ margin: '0 0 6px' }}>
          Writing <InlineMath math="\psi_{nlm} = R_{nl}(r)\,Y_l^m(\theta,\phi)" /> and
          substituting <InlineMath math="u_{nl}(r) = r\,R_{nl}(r)" /> turns the 3-D problem into
          a 1-D eigenvalue equation:
        </p>
        <BlockMath math="-\tfrac{1}{2}\frac{d^2u}{dr^2} + V_{\!\text{eff}}(r)\,u = E\,u" />
        <BlockMath math="V_{\!\text{eff}}(r) = -\frac{Z}{r} + \frac{l(l+1)}{2r^2}" />
        <p style={{ margin: '4px 0 0' }}>
          The second term is the centrifugal barrier — it vanishes for s-states (<InlineMath math="l=0" />).
        </p>
      </section>

      <section style={{ marginBottom: '1rem' }}>
        <h4 style={{ margin: '0 0 6px' }}>Exact energy levels</h4>
        <BlockMath math="E_n = -\frac{Z^2}{2n^2}\;\text{Hartree} = -Z^2 \times \frac{13.606\;\text{eV}}{n^2}" />
        <p style={{ margin: '4px 0 0' }}>
          First few levels for hydrogen (<InlineMath math="Z=1" />):
        </p>
        <table style={{ borderCollapse: 'collapse', fontSize: '0.85rem', margin: '4px 0' }}>
          <thead>
            <tr>
              {['n', 'State', 'Hartree', 'eV'].map(h => (
                <th key={h} style={{ padding: '2px 8px', textAlign: 'left', borderBottom: '1px solid #888' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ['1', '1s', '−0.500', '−13.61'],
              ['2', '2s/2p', '−0.125', '−3.40'],
              ['3', '3s/3p/3d', '−0.056', '−1.51'],
            ].map(([n, s, h, ev]) => (
              <tr key={n}>
                <td style={{ padding: '2px 8px' }}>{n}</td>
                <td style={{ padding: '2px 8px' }}>{s}</td>
                <td style={{ padding: '2px 8px' }}>{h}</td>
                <td style={{ padding: '2px 8px' }}>{ev}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={{ marginBottom: '1rem' }}>
        <h4 style={{ margin: '0 0 6px' }}>Orbital size</h4>
        <p style={{ margin: '0 0 6px' }}>
          The Bohr radius scales as <InlineMath math="a_Z = a_0/Z" />, so orbitals
          shrink as <InlineMath math="Z" /> increases:
        </p>
        <BlockMath math="\langle r \rangle_{nl} = \frac{a_0}{2Z}\bigl(3n^2 - l(l+1)\bigr)" />
        <p style={{ margin: '4px 0 0' }}>
          He⁺ (<InlineMath math="Z=2" />) orbitals are half the size of H and
          4× more tightly bound.
        </p>
      </section>

      <section style={{ marginBottom: '1rem' }}>
        <h4 style={{ margin: '0 0 6px' }}>Quantum numbers</h4>
        <table style={{ borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr>
              {['Symbol', 'Name', 'Range', 'Meaning'].map(h => (
                <th key={h} style={{ padding: '2px 8px', textAlign: 'left', borderBottom: '1px solid #888' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ['n', 'principal', '1 … 5', 'energy shell'],
              ['l', 'angular', '0 … n−1', 'orbital shape (s,p,d,f)'],
              ['m', 'magnetic', '−l … l', 'orientation'],
              ['Z', 'nuclear', '1 … 10', 'nuclear charge'],
            ].map(([sym, name, range, meaning]) => (
              <tr key={sym}>
                <td style={{ padding: '2px 8px', fontStyle: 'italic' }}>{sym}</td>
                <td style={{ padding: '2px 8px' }}>{name}</td>
                <td style={{ padding: '2px 8px' }}>{range}</td>
                <td style={{ padding: '2px 8px' }}>{meaning}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={{ marginBottom: '1rem' }}>
        <h4 style={{ margin: '0 0 6px' }}>X-ray scaling</h4>
        <p style={{ margin: 0 }}>
          Binding energy scales as <InlineMath math="Z^2" />, so knocking a K-shell
          electron out of carbon (<InlineMath math="Z=6" />) costs
          36× more energy than hydrogen:{' '}
          <InlineMath math="E = Z^2 \times 13.6\;\text{eV}" />.
          This is why X-ray emission energies are element-specific.
        </p>
      </section>

      <section>
        <h4 style={{ margin: '0 0 6px' }}>Units</h4>
        <p style={{ margin: 0 }}>
          Atomic units: <InlineMath math="\hbar = m_e = e = 1" />.
          Lengths in Bohr (<InlineMath math="a_0 \approx 0.529\,\text{Å}" />),
          energies in Hartree (<InlineMath math="E_h \approx 27.21\,\text{eV}" />).
        </p>
      </section>

    </div>
  )
}
