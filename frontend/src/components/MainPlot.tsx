import _Plot from 'react-plotly.js'
// Rolldown (Vite 8) CJS→ESM interop: default import may arrive as { default: Class }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Plot = (_Plot as any).default ?? _Plot
import type { EigensolveResponse, EvolveResponse, AppMode } from '../types/api'
import { classicalProbabilityDensity } from '../utils/classicalMechanics'

// Plotly default color cycle (D3 category10) — used to match P_cl trace to its ψ trace.
const PLOTLY_COLORS = [
  '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
  '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
]

interface MainPlotProps {
  mode: AppMode
  eigenResult: EigensolveResponse | null
  evolveResult: EvolveResponse | null
  currentFrame: number
  showPhase?: boolean
  showClassical?: boolean
}

// Count sign-changes in the interior of wf (excludes boundary zeros from Dirichlet BCs)
function countNodes(wf: number[]): number {
  let count = 0
  const margin = 5
  for (let i = margin + 1; i < wf.length - margin; i++) {
    if (wf[i - 1] * wf[i] < 0) count++
  }
  return count
}

export function MainPlot({ mode, eigenResult, evolveResult, currentFrame, showPhase = false, showClassical = false }: MainPlotProps) {
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

    // Dashed horizontal lines at each energy level
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

    // Eigenfunctions offset by energy; legend includes node count
    wavefunctions.forEach((wf, i) => {
      const n = countNodes(wf)
      const nodeLabel = n === 1 ? '1 node' : `${n} nodes`
      traces.push({
        x: grid_x,
        y: wf.map(v => v + energies[i]),
        name: `ψ${i + 1} (${nodeLabel})`,
        type: 'scatter',
      })
    })

    // Classical probability density overlay P_cl(x) — one trace per eigenstate.
    // Scaled so the 90th-percentile of P_cl matches max(|ψ|²), then offset by E.
    // The 90th-percentile cap prevents the turning-point divergence from dominating.
    if (showClassical) {
      wavefunctions.forEach((wf, i) => {
        const pCl = classicalProbabilityDensity(potential, energies[i], eigenResult.dx)
        const nonZero = pCl.filter(v => v > 0).sort((a, b) => a - b)
        if (nonZero.length === 0) return   // no classically allowed region

        const p90 = nonZero[Math.floor(nonZero.length * 0.9)]
        const maxWfSq = Math.max(...wf.map(v => v * v))
        const scale = maxWfSq / p90

        const color = PLOTLY_COLORS[i % PLOTLY_COLORS.length]
        traces.push({
          x: grid_x,
          y: pCl.map(p => scale * p + energies[i]),
          name: `P_cl ${i + 1}`,
          type: 'scatter',
          mode: 'lines',
          line: { dash: 'dot', width: 1.5, color },
          opacity: 0.6,
        } as Plotly.Data)
      })
    }
  }

  if (mode === 'time-evolution' && evolveResult) {
    const { grid_x, prob_frames, re_frames, im_frames, potential } = evolveResult
    const frame = prob_frames[currentFrame] ?? prob_frames[0]

    // Clip V(x) to 1.5× the packet energy so large walls don't dominate
    const ePacket = evolveResult.expect_H[0] ?? 1
    const vCeiling = ePacket * 1.5 + 1
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
      name: '|ψ|²',
      type: 'scatter',
    })

    if (showPhase && re_frames && im_frames) {
      const re = re_frames[currentFrame] ?? re_frames[0]
      const im = im_frames[currentFrame] ?? im_frames[0]
      traces.push({
        x: grid_x,
        y: re,
        name: 'Re(ψ)',
        line: { color: '#2ca02c', dash: 'dash', width: 1.5 },
        type: 'scatter',
      })
      traces.push({
        x: grid_x,
        y: im,
        name: 'Im(ψ)',
        line: { color: '#ff7f0e', dash: 'dot', width: 1.5 },
        type: 'scatter',
      })
    }
  }

  const layout: Partial<Plotly.Layout> = {
    title: { text: mode === 'stationary' ? 'Eigenfunctions' : '|ψ(x,t)|²' },
    autosize: true,
    margin: { t: 36, b: 44, l: 56, r: 12 },
    xaxis: { title: { text: 'x (a.u.)' } },
    yaxis: { title: { text: mode === 'stationary' ? 'Energy (a.u.)' : 'amplitude' } },
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
