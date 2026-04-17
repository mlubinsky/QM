import styles from './RegimeIndicator.module.css'

interface Props {
  potentialKey: string
  paramValues: Record<string, number>
}

export function RegimeIndicator({ potentialKey, paramValues }: Props) {
  if (!['double_well', 'deep_double_well'].includes(potentialKey)) {
    return null
  }

  const a = paramValues['a'] ?? 1.0
  const lambda = paramValues['lambda'] ?? 0.5
  const barrierHeight = lambda * Math.pow(a, 4)
  const omega = Math.sqrt(8 * lambda * a * a)
  const zeroPoint = omega / 2
  const isTunneling = barrierHeight > zeroPoint

  return (
    <div className={isTunneling ? styles.tunneling : styles.shallow}>
      <span className={styles.label}>
        {isTunneling ? 'Tunneling regime' : 'No tunneling'}
      </span>
      <span className={styles.numbers}>
        V(0) = {barrierHeight.toFixed(2)} a.u.
      </span>
    </div>
  )
}
