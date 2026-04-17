import type { PotentialInfo } from '../data/potentials'
import styles from './ParameterSlider.module.css'

interface Props {
  param: NonNullable<PotentialInfo['parameters']>[number]
  value: number
  allParamValues: Record<string, number>
  onChange: (value: number) => void
}

export function ParameterSlider({ param, value, allParamValues, onChange }: Props) {
  const showDerived = param.name === 'a' && 'lambda' in allParamValues
  const barrierHeight = showDerived
    ? allParamValues['lambda'] * Math.pow(value, 4)
    : null

  return (
    <div className={styles.wrapper}>
      <div className={styles.labelRow}>
        <span>{param.label}</span>
        <span className={styles.value}>
          {param.name === 'lambda' ? 'λ' : param.name} = {value.toFixed(2)} {param.unit}
        </span>
      </div>
      <input
        type="range"
        min={param.min}
        max={param.max}
        step={param.step}
        value={value}
        className={styles.slider}
        aria-label={`${param.label} (${param.name})`}
        onChange={e => onChange(Number(e.target.value))}
      />
      {showDerived && barrierHeight !== null && (
        <div className={styles.derived} aria-live="polite">
          Well minima at x = ±{value.toFixed(2)},{' '}
          barrier height V(0) = {barrierHeight.toFixed(3)} a.u.
        </div>
      )}
      <div className={styles.hint}>{param.description}</div>
    </div>
  )
}
