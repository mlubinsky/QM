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
    eigenResult.energies.forEach((E, i) => {
      traces.push({
        x: [eigenResult.grid_x[0], eigenResult.grid_x[eigenResult.grid_x.length - 1]],
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
      y: evolveResult.norm_history,
      name: '‖ψ(t)‖²',
      type: 'scatter',
    })
  }

  return (
    <Plot
      data={traces}
      layout={{
        title: { text: mode === 'stationary' ? 'Energy Levels' : 'Norm History' },
        autosize: true,
      }}
      style={{ width: '100%', height: '100%' }}
      useResizeHandler
    />
  )
}
