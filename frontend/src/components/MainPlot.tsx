import _Plot from 'react-plotly.js'
// Rolldown (Vite 8) CJS→ESM interop: default import may arrive as { default: Class }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Plot = (_Plot as any).default ?? _Plot
import type { EigensolveResponse, EvolveResponse, AppMode } from '../types/api'

interface MainPlotProps {
  mode: AppMode
  eigenResult: EigensolveResponse | null
  evolveResult: EvolveResponse | null
  currentFrame: number
}

export function MainPlot({ mode, eigenResult, evolveResult, currentFrame }: MainPlotProps) {
  const traces: Plotly.Data[] = []

  if (mode === 'stationary' && eigenResult) {
    const { grid_x, wavefunctions, energies, potential } = eigenResult
    const xEnd = grid_x[grid_x.length - 1]

    // Clip V(x) so infinite/large walls don't compress the wavefunctions
    const eMax = Math.max(...energies)
    const vCeiling = eMax + Math.abs(eMax) * 0.5 + 1
    const vDisplay = potential.map(v => Math.min(v, vCeiling))

    traces.push({
      x: grid_x,
      y: vDisplay,
      name: 'V(x)',
      line: { color: 'rgba(150,150,150,0.4)' },
      type: 'scatter',
    })

    // Dashed horizontal lines at each energy level (baseline for offset wavefunctions)
    energies.forEach(E => {
      traces.push({
        x: [grid_x[0], xEnd],
        y: [E, E],
        type: 'scatter',
        mode: 'lines',
        line: { dash: 'dash', color: 'rgba(100,100,100,0.35)', width: 1 },
        showlegend: false,
        hoverinfo: 'skip',
      } as Plotly.Data)
    })

    // Eigenfunctions offset by energy (standard physics convention)
    wavefunctions.forEach((wf, i) => {
      traces.push({
        x: grid_x,
        y: wf.map(v => v + energies[i]),
        name: `ψ${i + 1}`,
        type: 'scatter',
      })
    })
  }

  if (mode === 'time-evolution' && evolveResult) {
    const { grid_x, psi_frames, potential } = evolveResult
    const frame = psi_frames[currentFrame] ?? psi_frames[0]

    // Clip V(x) at 90th-percentile value so large walls don't dominate
    const sorted = [...potential].sort((a, b) => a - b)
    const vCeiling = sorted[Math.floor(sorted.length * 0.9)]
    const vDisplay = potential.map(v => Math.min(v, vCeiling))

    traces.push({
      x: grid_x,
      y: vDisplay,
      name: 'V(x)',
      line: { color: 'rgba(150,150,150,0.4)' },
      type: 'scatter',
    })

    traces.push({
      x: grid_x,
      y: frame,
      name: '|ψ(x,t)|²',
      type: 'scatter',
    })
  }

  const layout: Partial<Plotly.Layout> = {
    title: { text: mode === 'stationary' ? 'Eigenfunctions' : '|ψ(x,t)|²' },
    autosize: true,
    xaxis: { title: { text: 'x (a.u.)' } },
    yaxis: { title: { text: mode === 'stationary' ? 'Energy (a.u.)' : '|ψ(x,t)|²' } },
  }

  return (
    <Plot
      data-testid="main-plot"
      data={traces}
      layout={layout}
      style={{ width: '100%', height: '100%' }}
      useResizeHandler
    />
  )
}
