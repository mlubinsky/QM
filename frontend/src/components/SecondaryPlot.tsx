import _Plot from 'react-plotly.js'
// Rolldown (Vite 8) CJS→ESM interop: default import may arrive as { default: Class }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Plot = (_Plot as any).default ?? _Plot
import type { EigensolveResponse, EvolveResponse, AppMode } from '../types/api'

interface SecondaryPlotProps {
  mode: AppMode
  eigenResult: EigensolveResponse | null
  evolveResult: EvolveResponse | null
}

export function SecondaryPlot({ mode, eigenResult, evolveResult }: SecondaryPlotProps) {
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

    // Horizontal energy level lines on top of V(x)
    energies.forEach((E, i) => {
      traces.push({
        x: [grid_x[0], xEnd],
        y: [E, E],
        name: `E${i + 1} = ${E.toFixed(4)}`,
        type: 'scatter',
        mode: 'lines',
      })
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
