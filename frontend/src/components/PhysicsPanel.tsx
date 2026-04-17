import 'katex/dist/katex.min.css'
import { BlockMath } from 'react-katex'
import { POTENTIALS } from '../data/potentials'
import styles from './PhysicsPanel.module.css'

interface Props {
  potentialKey: string
  paramValues?: Record<string, number>
}

function substituteLatex(latex: string, params: Record<string, number>): string {
  let result = latex
  for (const [name, value] of Object.entries(params)) {
    // Multi-char param names appear as LaTeX commands (e.g. lambda → \lambda)
    if (name.length > 1) {
      result = result.replaceAll(`\\${name}`, value.toFixed(2))
    }
    // Replace standalone occurrences not preceded by backslash or letter
    result = result.replaceAll(
      new RegExp(`(?<![a-zA-Z\\\\])${name}(?![a-zA-Z])`, 'g'),
      value.toFixed(2),
    )
  }
  return result
}

function getTunnelingRegime(
  potentialKey: string,
  paramValues: Record<string, number>,
): { label: string; color: string; explanation: string } | null {
  if (!['double_well', 'deep_double_well'].includes(potentialKey)) return null
  const a = paramValues['a'] ?? 1.0
  const lambda = paramValues['lambda'] ?? 0.5
  const barrierHeight = lambda * Math.pow(a, 4)
  const omega = Math.sqrt(8 * lambda * a * a)
  const zeroPoint = omega / 2

  if (zeroPoint >= barrierHeight) {
    return {
      label: 'Shallow regime — no tunneling',
      color: '#e9ecef',
      explanation:
        `Estimated zero-point energy (≈ ${zeroPoint.toFixed(2)} a.u.) ` +
        `meets or exceeds barrier height ` +
        `(${barrierHeight.toFixed(2)} a.u.). ` +
        `All eigenstates sit above the barrier.`,
    }
  } else {
    return {
      label: 'Tunneling regime',
      color: '#d1fae5',
      explanation:
        `Barrier height (${barrierHeight.toFixed(2)} a.u.) exceeds ` +
        `estimated zero-point energy ` +
        `(≈ ${zeroPoint.toFixed(2)} a.u.). ` +
        `Expect nearly degenerate E₁, E₂ pair. ` +
        `Tunneling splitting ΔE = E₂ − E₁ visible after solving.`,
    }
  }
}

export function PhysicsPanel({ potentialKey, paramValues }: Props) {
  const info = POTENTIALS[potentialKey]
  if (!info) return null

  const regime = getTunnelingRegime(potentialKey, paramValues ?? {})
  const showSubstituted = paramValues && info.parameters && info.parameters.length > 0

  return (
    <div className={styles.panel}>
      <h3 className={styles.title}>{info.label}</h3>

      {regime && (
        <div className={styles.regimeBadge} style={{ background: regime.color }}>
          <strong>{regime.label}</strong>
          <span>{regime.explanation}</span>
        </div>
      )}

      <section className={styles.section}>
        <h4 className={styles.sectionTitle}>Hamiltonian</h4>
        <BlockMath math={info.hamiltonian_latex} />
        {showSubstituted && (
          <>
            <p className={styles.paramSubLabel}>
              Current values:{' '}
              {info.parameters!
                .map(p => `${p.name === 'lambda' ? 'λ' : p.name} = ${(paramValues![p.name] ?? p.default).toFixed(2)} ${p.unit}`)
                .join(', ')}:
            </p>
            <BlockMath math={substituteLatex(info.hamiltonian_latex, paramValues!)} />
          </>
        )}
      </section>

      <section className={styles.section}>
        <h4 className={styles.sectionTitle}>{info.formula_label}</h4>
        <BlockMath math={info.key_formula_latex} />
        {info.formula_note && (
          <p className={styles.formulaNote}>{info.formula_note}</p>
        )}
      </section>

      <section className={styles.section}>
        <h4 className={styles.sectionTitle}>Physics</h4>
        <p className={styles.description}>{info.description}</p>
      </section>

      <section className={styles.section}>
        <h4 className={styles.sectionTitle}>What to look for</h4>
        <ul className={styles.featureList}>
          {info.interesting_features.map((f, i) => (
            <li key={i}>{f}</li>
          ))}
        </ul>
      </section>

      {!info.has_bound_states && info.scattering_note && (
        <section className={styles.warningSection}>
          <span className={styles.warningIcon}>⚠</span>
          <span>{info.scattering_note}</span>
        </section>
      )}
    </div>
  )
}
