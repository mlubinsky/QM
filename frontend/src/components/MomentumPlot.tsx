import _Plot from 'react-plotly.js'
// Rolldown (Vite 8) CJS→ESM interop: default import may arrive as { default: Class }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Plot = (_Plot as any).default ?? _Plot
import type { EvolveResponse } from '../types/api'

interface MomentumPlotProps {
  evolveResult: EvolveResponse | null
  currentFrame: number
}

export function MomentumPlot({ evolveResult, currentFrame }: MomentumPlotProps) {
  if (!evolveResult) return null

  const { momentum_k, momentum_frames } = evolveResult
  const frame = momentum_frames[currentFrame] ?? momentum_frames[0] ?? []

  const traces: Plotly.Data[] = [
    {
      x: momentum_k,
      y: frame,
      name: '|φ(k,t)|²',
      type: 'scatter',
    },
  ]

  const layout: Partial<Plotly.Layout> = {
    title: { text: 'Momentum Distribution' },
    autosize: true,
    xaxis: { title: { text: 'k (rad/a.u.)' } },
    yaxis: { title: { text: '|φ(k,t)|²' } },
  }

  return (
    <Plot
      data-testid="momentum-plot"
      data={traces}
      layout={layout}
      style={{ width: '100%', height: '100%' }}
      useResizeHandler
    />
  )
}
