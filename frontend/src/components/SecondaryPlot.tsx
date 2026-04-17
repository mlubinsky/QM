import _Plot from 'react-plotly.js'
// Rolldown (Vite 8) CJS→ESM interop: default import may arrive as { default: Class }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Plot = (_Plot as any).default ?? _Plot
import type { EigensolveResponse, EvolveResponse, AppMode } from '../types/api'
import { POTENTIALS } from '../data/potentials'
import styles from './SecondaryPlot.module.css'

interface SecondaryPlotProps {
  mode: AppMode
  eigenResult: EigensolveResponse | null
  evolveResult: EvolveResponse | null
  potentialPreset?: string | null
  currentEigenstate?: number
}

export function SecondaryPlot({ mode, eigenResult, evolveResult, potentialPreset, currentEigenstate = 0 }: SecondaryPlotProps) {
  const potentialInfo = potentialPreset ? POTENTIALS[potentialPreset] : null
  const hasBoundStates = potentialInfo?.has_bound_states ?? true

  // In stationary mode, scattering potentials have no physical energy levels —
  // show a message instead of a misleading plot.
  if (mode === 'stationary' && !hasBoundStates) {
    return (
      <div className={styles.noPlotMessage}>
        <p>⚠ No bound states — energy spectrum is continuous.</p>
        <p>
          The energy levels a finite-box solver returns for this potential are
          numerical artifacts, not physical results.
        </p>
        <p>
          Switch to <strong>Time Evolution</strong> mode to see the real physics.
        </p>
      </div>
    )
  }

  const traces: Plotly.Data[] = []

  if (mode === 'stationary' && eigenResult) {
    const { grid_x, potential, energies } = eigenResult
    const xEnd = grid_x[grid_x.length - 1]

    // V(x) as filled background — same ceiling logic as MainPlot
    const eMax = Math.max(...energies)
    const vCeiling = eMax + Math.abs(eMax) * 0.5 + 1
    const vDisplay = potential.map(v => Math.min(v, vCeiling))

    traces.push({
      x: grid_x,
      y: vDisplay,
      name: 'V(x)',
      type: 'scatter',
      fill: 'tozeroy',
      fillcolor: 'rgba(150,150,150,0.12)',
      line: { color: 'rgba(150,150,150,0.5)' },
    } as Plotly.Data)

    // Horizontal energy level lines — selected level is thicker and highlighted
    energies.forEach((E, i) => {
      const selected = i === currentEigenstate
      traces.push({
        x: [grid_x[0], xEnd],
        y: [E, E],
        name: `E${i + 1} = ${E.toFixed(4)}`,
        type: 'scatter',
        mode: 'lines',
        line: {
          width: selected ? 3 : 1,
          color: selected ? '#e05c00' : undefined,
        },
      } as Plotly.Data)
    })
  }

  if (mode === 'time-evolution' && evolveResult) {
    traces.push({
      x: evolveResult.times,
      y: evolveResult.norm_history.map(n => n - 1),
      name: '‖ψ(t)‖² − 1',
      type: 'scatter',
    })
  }

  const layout: Partial<Plotly.Layout> = {
    title: { text: mode === 'stationary' ? 'Energy Levels' : 'Norm History' },
    autosize: true,
    xaxis: { title: { text: mode === 'stationary' ? 'x (a.u.)' : 't (a.u.)' } },
    yaxis: { title: { text: mode === 'stationary' ? 'Energy (a.u.)' : '‖ψ(t)‖² − 1' } },
  }

  return (
    <Plot
      data={traces}
      layout={layout}
      style={{ width: '100%', height: '100%' }}
      useResizeHandler
    />
  )
}
