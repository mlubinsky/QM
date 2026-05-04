import _Plot from 'react-plotly.js'
// Rolldown (Vite 8) CJS→ESM interop: default import may arrive as { default: Class }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Plot = (_Plot as any).default ?? _Plot
import type { EvolveResponse } from '../types/api'

interface Props {
  evolveResult: EvolveResponse | null
  currentTime?: number
}

export function ExpectationValuesPlot({ evolveResult, currentTime }: Props) {
  if (!evolveResult) return null

  const { times, expect_x, expect_p, delta_x, delta_p, delta_x_delta_p } = evolveResult

  const heisenberg = times.map(() => 0.5)

  const traces: Plotly.Data[] = [
    // ── top subplot: ⟨x⟩ and ⟨p⟩ ──────────────────────────────────────────
    {
      x: times,
      y: expect_x,
      name: '⟨x(t)⟩',
      type: 'scatter',
      xaxis: 'x',
      yaxis: 'y',
    },
    {
      x: times,
      y: expect_p,
      name: '⟨p(t)⟩',
      type: 'scatter',
      xaxis: 'x',
      yaxis: 'y',
    },
    // ── bottom subplot: Δx, Δp, Δx·Δp, Heisenberg bound ───────────────────
    {
      x: times,
      y: delta_x,
      name: 'Δx(t)',
      type: 'scatter',
      xaxis: 'x2',
      yaxis: 'y2',
    },
    {
      x: times,
      y: delta_p,
      name: 'Δp(t)',
      type: 'scatter',
      xaxis: 'x2',
      yaxis: 'y2',
    },
    {
      x: times,
      y: delta_x_delta_p,
      name: 'Δx·Δp',
      type: 'scatter',
      xaxis: 'x2',
      yaxis: 'y2',
      line: { width: 2 },
    },
    {
      x: times,
      y: heisenberg,
      name: 'ħ/2 bound',
      type: 'scatter',
      xaxis: 'x2',
      yaxis: 'y2',
      line: { dash: 'dash', color: 'gray', width: 1 },
      showlegend: true,
    } as Plotly.Data,
  ]

  const cursorShapes: Partial<Plotly.Shape>[] = currentTime !== undefined
    ? [
        { type: 'line', x0: currentTime, x1: currentTime, y0: 0, y1: 1,
          xref: 'x',  yref: 'y domain',
          line: { color: 'rgba(100,100,100,0.5)', dash: 'dot', width: 1.5 } } as Partial<Plotly.Shape>,
        { type: 'line', x0: currentTime, x1: currentTime, y0: 0, y1: 1,
          xref: 'x2', yref: 'y2 domain',
          line: { color: 'rgba(100,100,100,0.5)', dash: 'dot', width: 1.5 } } as Partial<Plotly.Shape>,
      ]
    : []

  const layout: Partial<Plotly.Layout> = {
    grid: { rows: 2, columns: 1, pattern: 'independent', roworder: 'top to bottom' },
    autosize: true,
    height: 480,
    margin: { t: 40, b: 40 },
    xaxis:  { title: { text: '' }, matches: 'x2' },
    yaxis:  { title: { text: '⟨x⟩, ⟨p⟩ (a.u.)' } },
    xaxis2: { title: { text: 't (a.u.)' } },
    yaxis2: { title: { text: 'uncertainty (a.u.)' } },
    legend: { orientation: 'h', y: -0.12 },
    shapes: cursorShapes,
    annotations: [
      { text: 'Expectation values', xref: 'paper', yref: 'paper', x: 0.5, y: 1.04,
        xanchor: 'center', yanchor: 'bottom', showarrow: false,
        font: { size: 14 } },
      { text: 'Uncertainties', xref: 'paper', yref: 'paper', x: 0.5, y: 0.46,
        xanchor: 'center', yanchor: 'bottom', showarrow: false,
        font: { size: 14 } },
    ],
  }

  return (
    <Plot
      data-testid="expectation-values-plot"
      data={traces}
      layout={layout}
      style={{ width: '100%', height: '480px' }}
      useResizeHandler
    />
  )
}
