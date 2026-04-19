import type { CSSProperties } from 'react'

interface MatrixHeatmapProps {
  data: number[][]
  rowLabels: string[]
  colLabels: string[]
  title: string
  threshold?: number
  sequential?: boolean   // true → white-to-red scale (for H, all values ≥ 0)
  markDiagonal?: boolean // true → diagonal cells labelled "(static)"
}

function cellColorDiverging(val: number, maxAbs: number): string {
  if (maxAbs === 0) return '#fff'
  const v = Math.max(-1, Math.min(1, val / maxAbs))
  if (v >= 0) {
    const c = Math.round(255 * (1 - v))
    return `rgb(255,${c},${c})`
  } else {
    const c = Math.round(255 * (1 + v))
    return `rgb(${c},${c},255)`
  }
}

function cellColorSequential(val: number, maxAbs: number): string {
  if (maxAbs === 0) return '#fff'
  const v = Math.max(0, Math.min(1, val / maxAbs))
  const c = Math.round(255 * (1 - v))
  return `rgb(255,${c},${c})`
}

const headerStyle: CSSProperties = {
  padding: '3px 8px',
  fontSize: '0.78rem',
  fontWeight: 600,
  textAlign: 'center',
  background: '#f5f5f5',
  border: '1px solid #ddd',
}

export function MatrixHeatmap({
  data,
  rowLabels,
  colLabels,
  title,
  threshold = 1e-10,
  sequential = false,
  markDiagonal = false,
}: MatrixHeatmapProps) {
  const maxAbs = Math.max(...data.flatMap(row => row.map(v => Math.abs(v))), 1e-30)
  const cellColor = sequential ? cellColorSequential : cellColorDiverging

  return (
    <div>
      <p style={{ margin: '0 0 6px', fontSize: '0.85rem', fontWeight: 600 }}>{title}</p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={headerStyle} />
              {colLabels.map((label, n) => (
                <th key={n} style={headerStyle}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, m) => (
              <tr key={m}>
                <td style={headerStyle}>{rowLabels[m]}</td>
                {row.map((val, n) => {
                  const isDiag = m === n
                  const display = Math.abs(val) < threshold ? 0 : val
                  const cellStyle: CSSProperties = {
                    backgroundColor: cellColor(display, maxAbs),
                    textAlign: 'center',
                    padding: '3px 8px',
                    fontSize: '0.78rem',
                    fontFamily: 'monospace',
                    minWidth: '4em',
                    border: '1px solid #ddd',
                    cursor: 'default',
                  }
                  return (
                    <td
                      key={n}
                      style={cellStyle}
                      title={`${rowLabels[m]}, ${colLabels[n]}: ${val.toFixed(6)}`}
                    >
                      {display.toFixed(3)}
                      {markDiagonal && isDiag && (
                        <span style={{ display: 'block', fontSize: '0.6rem', color: '#888', lineHeight: 1 }}>
                          static
                        </span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ margin: '4px 0 0', fontSize: '0.72rem', color: '#888' }}>
        {sequential
          ? `White = 0 · Red = max · max value = ${maxAbs.toFixed(4)}`
          : `Blue = negative · White ≈ 0 · Red = positive · max |value| = ${maxAbs.toFixed(4)}`
        }
      </p>
    </div>
  )
}
