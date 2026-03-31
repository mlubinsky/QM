import _Plot from 'react-plotly.js'
// Rolldown (Vite 8) CJS→ESM interop: default import may arrive as { default: Class }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Plot = (_Plot as any).default ?? _Plot
import type { EvolveResponse } from '../types/api'

interface CurrentPlotProps {
  evolveResult: EvolveResponse | null
  currentFrame: number
}

export function CurrentPlot({ evolveResult, currentFrame }: CurrentPlotProps) {
  if (!evolveResult) return null

  const { grid_x, current_frames } = evolveResult
  const frame = current_frames[currentFrame] ?? current_frames[0] ?? []

  const traces: Plotly.Data[] = [
    {
      x: grid_x,
      y: frame,
      name: 'J(x,t)',
      type: 'scatter',
    },
    {
      x: [grid_x[0], grid_x[grid_x.length - 1]],
      y: [0, 0],
      type: 'scatter',
      mode: 'lines',
      line: { dash: 'dash', color: 'rgba(100,100,100,0.4)', width: 1 },
      showlegend: false,
      hoverinfo: 'skip',
    } as Plotly.Data,
  ]

  const layout: Partial<Plotly.Layout> = {
    title: { text: 'Probability Current' },
    autosize: true,
    xaxis: { title: { text: 'x (a.u.)' } },
    yaxis: { title: { text: 'J(x,t)' } },
  }

  return (
    <Plot
      data-testid="current-plot"
      data={traces}
      layout={layout}
      style={{ width: '100%', height: '100%' }}
      useResizeHandler
    />
  )
}
