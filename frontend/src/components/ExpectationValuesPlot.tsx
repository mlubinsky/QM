import _Plot from 'react-plotly.js'
// Rolldown (Vite 8) CJS→ESM interop: default import may arrive as { default: Class }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Plot = (_Plot as any).default ?? _Plot
import type { EvolveResponse } from '../types/api'

interface Props {
  evolveResult: EvolveResponse | null
}

export function ExpectationValuesPlot({ evolveResult }: Props) {
  if (!evolveResult) return null

  const { times, expect_x, expect_p, delta_x_delta_p } = evolveResult

  // Heisenberg bound reference line
  const heisenberg = times.map(() => 0.5)

  const traces: Plotly.Data[] = [
    {
      x: times,
      y: expect_x,
      name: '⟨x(t)⟩',
      type: 'scatter',
      yaxis: 'y',
    },
    {
      x: times,
      y: expect_p,
      name: '⟨p(t)⟩',
      type: 'scatter',
      yaxis: 'y',
    },
    {
      x: times,
      y: delta_x_delta_p,
      name: 'Δx·Δp',
      type: 'scatter',
      yaxis: 'y2',
    },
    {
      x: times,
      y: heisenberg,
      name: 'Heisenberg bound (½)',
      type: 'scatter',
      yaxis: 'y2',
      line: { dash: 'dash', color: 'gray', width: 1 },
      showlegend: true,
    } as Plotly.Data,
  ]

  const layout: Partial<Plotly.Layout> = {
    title: { text: 'Expectation Values' },
    autosize: true,
    xaxis: { title: { text: 't (a.u.)' } },
    yaxis: { title: { text: '⟨x⟩, ⟨p⟩ (a.u.)' } },
    yaxis2: {
      title: { text: 'Δx·Δp' },
      overlaying: 'y',
      side: 'right',
    },
    legend: { orientation: 'h', y: -0.2 },
  }

  return (
    <Plot
      data-testid="expectation-values-plot"
      data={traces}
      layout={layout}
      style={{ width: '100%', height: '100%' }}
      useResizeHandler
    />
  )
}
