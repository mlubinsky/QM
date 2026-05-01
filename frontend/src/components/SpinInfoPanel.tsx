import 'katex/dist/katex.min.css'
import { BlockMath, InlineMath } from 'react-katex'

export function SpinInfoPanel() {
  return (
    <div style={{ fontSize: '0.9rem', lineHeight: 1.55 }}>

      <section style={{ marginBottom: '1rem' }}>
        <h4 style={{ margin: '0 0 6px' }}>State space</h4>
        <p style={{ margin: '0 0 6px' }}>
          A spin-½ particle lives in a 2-dimensional complex Hilbert space.
          The general (normalised) state is:
        </p>
        <BlockMath math="|\psi\rangle = \alpha|\!\uparrow\rangle + \beta|\!\downarrow\rangle, \quad |\alpha|^2 + |\beta|^2 = 1" />
        <p style={{ margin: '4px 0 6px' }}>
          Fixing the global phase (<InlineMath math="\alpha \in \mathbb{R}_{\ge 0}" />) gives the
          Bloch parameterisation:
        </p>
        <BlockMath math="|\psi\rangle = \cos\!\tfrac{\theta}{2}|\!\uparrow\rangle + e^{i\varphi}\sin\!\tfrac{\theta}{2}|\!\downarrow\rangle" />
        <p style={{ margin: '4px 0 0' }}>
          The <strong>Bloch vector</strong> <InlineMath math="\mathbf{r} = (\sin\theta\cos\varphi,\;\sin\theta\sin\varphi,\;\cos\theta)" /> has
          unit length and uniquely identifies every pure state.
          The north pole (<InlineMath math="\theta=0" />) is <InlineMath math="|\!\uparrow\rangle" />;
          the south pole (<InlineMath math="\theta=\pi" />) is <InlineMath math="|\!\downarrow\rangle" />.
        </p>
      </section>

      <section style={{ marginBottom: '1rem' }}>
        <h4 style={{ margin: '0 0 6px' }}>Pauli matrices</h4>
        <p style={{ margin: '0 0 6px' }}>
          The three Pauli matrices generate all spin-½ observables:
        </p>
        <BlockMath math="\sigma_x = \begin{pmatrix}0&1\\1&0\end{pmatrix},\quad \sigma_y = \begin{pmatrix}0&-i\\i&0\end{pmatrix},\quad \sigma_z = \begin{pmatrix}1&0\\0&-1\end{pmatrix}" />
        <p style={{ margin: '4px 0 0' }}>
          Each has eigenvalues ±1. The expectation values read directly from the Bloch vector:
        </p>
        <BlockMath math="\langle\sigma_x\rangle = r_x,\quad \langle\sigma_y\rangle = r_y,\quad \langle\sigma_z\rangle = r_z" />
      </section>

      <section style={{ marginBottom: '1rem' }}>
        <h4 style={{ margin: '0 0 6px' }}>Larmor precession</h4>
        <p style={{ margin: '0 0 6px' }}>
          A spin in a magnetic field <InlineMath math="\mathbf{B} = \omega_0 \hat{B}" /> evolves under:
        </p>
        <BlockMath math="H = \tfrac{\omega_0}{2}\,(\hat{B}\cdot\boldsymbol{\sigma})" />
        <p style={{ margin: '4px 0 6px' }}>
          The Bloch vector rotates rigidly around <InlineMath math="\hat{B}" /> at angular frequency
          <InlineMath math="\omega_0" /> (Rodrigues' formula):
        </p>
        <BlockMath math="\mathbf{r}(t) = \mathbf{r}\cos(\omega_0 t) + (\hat{B}\times\mathbf{r})\sin(\omega_0 t) + \hat{B}(\hat{B}\cdot\mathbf{r})(1-\cos(\omega_0 t))" />
        <p style={{ margin: '4px 0 0' }}>
          This is computed analytically — no numerical ODE.
          The period is <InlineMath math="T = 2\pi/\omega_0" />.
          All times are in atomic units (1 a.u. = 24.19 as).
        </p>
      </section>

      <section style={{ marginBottom: '1rem' }}>
        <h4 style={{ margin: '0 0 6px' }}>Stern-Gerlach measurement</h4>
        <p style={{ margin: '0 0 6px' }}>
          Measuring spin along a unit axis <InlineMath math="\hat{n}" /> gives outcome{' '}
          <InlineMath math="+\tfrac{1}{2}" /> with probability:
        </p>
        <BlockMath math="P(+\hat{n}) = \frac{1 + \hat{n}\cdot\mathbf{r}}{2}" />
        <p style={{ margin: '4px 0 6px' }}>
          After outcome <InlineMath math="+\hat{n}" />, the state <strong>collapses</strong> to the
          eigenstate <InlineMath math="|{+\hat{n}}\rangle" /> whose Bloch vector equals{' '}
          <InlineMath math="+\hat{n}" />.
          After outcome <InlineMath math="-\hat{n}" />, it collapses to <InlineMath math="|{-\hat{n}}\rangle" />.
        </p>
        <p style={{ margin: 0 }}>
          <strong>Measure once</strong> — draws a single Bernoulli sample and updates the sphere to
          the post-measurement eigenstate.{' '}
          <strong>Run N shots</strong> — simulates <InlineMath math="N" /> independent measurements
          and shows the histogram alongside the exact probabilities.
        </p>
      </section>

      <section>
        <h4 style={{ margin: '0 0 6px' }}>What to explore</h4>
        <ul style={{ margin: 0, paddingLeft: '1.2em' }}>
          <li>Start in <InlineMath math="|{+x}\rangle" />, set <InlineMath math="\hat{B} = \hat{z}" />, press
            Play — the arrow circles the equator at rate <InlineMath math="\omega_0" />.</li>
          <li>Set <InlineMath math="\omega_0 = 2" /> and observe that the period halves.</li>
          <li>Measure <InlineMath math="|{+x}\rangle" /> along z repeatedly — you get 50/50 outcomes
            each time, and after each measurement the state is fully polarised along z.</li>
          <li>Start in <InlineMath math="|\!\uparrow\rangle" /> and measure along any axis — the
            probability equals <InlineMath math="(1 + \cos\theta_n)/2" /> where <InlineMath math="\theta_n" /> is
            the angle between <InlineMath math="\hat{n}" /> and <InlineMath math="\hat{z}" />.</li>
          <li>Use the component input mode to enter a state directly as <InlineMath math="(\alpha, \beta)" />.</li>
        </ul>
      </section>

    </div>
  )
}
