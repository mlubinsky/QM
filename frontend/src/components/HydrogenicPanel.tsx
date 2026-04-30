import Plot from 'react-plotly.js'
import type { HydrogenicResponse } from '../types/api'

interface HydrogenicPanelProps {
  result: HydrogenicResponse
  Z: number
  n: number
  l: number
  m: number
}

const L_LABELS = ['s', 'p', 'd', 'f', 'g']

export function HydrogenicPanel({ result, Z, n, l, m }: HydrogenicPanelProps) {
  const lLabel = L_LABELS[l] ?? String(l)
  const orbLabel = `${n}${lLabel}`
  const meanR = (3 * n * n - l * (l + 1)) / (2 * Z)

  const radialTrace: Plotly.Data = {
    x: result.r,
    y: result.radial_density,
    type: 'scatter',
    mode: 'lines',
    line: { color: '#4a9eff', width: 2 },
    name: 'r²|R|²',
  }

  const meanRLine: Plotly.Data = {
    x: [meanR, meanR],
    y: [0, Math.max(...result.radial_density)],
    type: 'scatter',
    mode: 'lines',
    line: { color: '#ff9f40', dash: 'dash', width: 1.5 },
    name: '⟨r⟩',
  }

  const heatmap: Plotly.Data = {
    z: result.orbital_density,
    x: result.x_axis,
    y: result.z_axis,
    type: 'heatmap',
    colorscale: 'Viridis',
    showscale: false,
  }

  return (
    <div className="hydrogenic-panel">
      <div className="hydrogenic-energy">
        <strong>{result.ion_symbol}</strong> {orbLabel} (m={m})
        &nbsp;&nbsp;
        <span>
          E = {result.energy_hartree.toFixed(5)} Eh
          &nbsp;=&nbsp;
          {result.energy_ev.toFixed(3)} eV
          &nbsp;
          <span style={{ color: '#888', fontSize: '0.85em' }}>
            (exact: {result.energy_exact_hartree.toFixed(5)} Eh)
          </span>
        </span>
      </div>

      <div className="hydrogenic-plots">
        <Plot
          data={[radialTrace, meanRLine]}
          layout={{
            title: { text: `Radial density — ${result.ion_symbol} ${orbLabel}`, font: { size: 13 } },
            xaxis: { title: 'r (Bohr)', zeroline: false },
            yaxis: { title: 'r²|R_nl(r)|²' },
            margin: { t: 40, b: 50, l: 55, r: 20 },
            showlegend: true,
            legend: { x: 0.7, y: 0.95 },
            height: 320,
          }}
          style={{ width: '100%' }}
          config={{ displayModeBar: false }}
        />

        <Plot
          data={[heatmap]}
          layout={{
            title: { text: `${result.ion_symbol} ${orbLabel} (m=${m})  |ψ(x,0,z)|²`, font: { size: 13 } },
            xaxis: { title: 'x (Bohr)', scaleanchor: 'y', scaleratio: 1 },
            yaxis: { title: 'z (Bohr)' },
            margin: { t: 40, b: 50, l: 55, r: 20 },
            height: 340,
          }}
          style={{ width: '100%' }}
          config={{ displayModeBar: false }}
        />
      </div>
    </div>
  )
}
