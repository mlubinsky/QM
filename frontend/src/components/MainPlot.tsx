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

    // Faded background: potential V(x)
    traces.push({
      x: grid_x,
      y: potential,
      name: 'V(x)',
      line: { color: 'rgba(150,150,150,0.4)' },
      type: 'scatter',
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

    traces.push({
      x: grid_x,
      y: potential,
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

  return (
    <Plot
      data-testid="main-plot"
      data={traces}
      layout={{ title: { text: mode === 'stationary' ? 'Eigenfunctions' : '|ψ(x,t)|²' }, autosize: true }}
      style={{ width: '100%', height: '100%' }}
      useResizeHandler
    />
  )
}
