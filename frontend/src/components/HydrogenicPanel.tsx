import { useState, useCallback, useEffect } from 'react'
import _Plot from 'react-plotly.js'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Plot = (_Plot as any).default ?? _Plot
import type { HydrogenicResponse } from '../types/api'
import { GrotriaDiagram } from './GrotriaDiagram'
import { RadialDensityInfoPanel } from './RadialDensityInfoPanel'
import { OrbitalDensityInfoPanel } from './OrbitalDensityInfoPanel'

interface HydrogenicPanelProps {
  result: HydrogenicResponse
  Z: number
  n: number
  l: number
  m: number
  onSelectLevel?: (n: number, l: number) => void
}

const L_LABELS = ['s', 'p', 'd', 'f', 'g']
const BOHR_TO_ANGSTROM = 0.529177

function HelpButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Show plot reference"
      onClick={onClick}
      style={{
        background: 'none',
        border: '1px solid #555',
        borderRadius: '50%',
        width: 20, height: 20,
        fontSize: '0.75rem',
        cursor: 'pointer',
        color: '#aaa',
        lineHeight: '18px',
        padding: 0,
        flexShrink: 0,
        verticalAlign: 'middle',
      }}
    >?</button>
  )
}

function PlotModal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="physics-modal-backdrop" onClick={onClose}>
      <div
        className="physics-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={e => e.stopPropagation()}
      >
        <div className="physics-modal-header">
          <span className="physics-modal-title">{title}</span>
          <button type="button" className="physics-modal-close" aria-label="Close" onClick={onClose}>✕</button>
        </div>
        <div className="physics-modal-body">{children}</div>
      </div>
    </div>
  )
}

export function HydrogenicPanel({ result, Z, n, l, m, onSelectLevel }: HydrogenicPanelProps) {
  const lLabel = L_LABELS[l] ?? String(l)
  const orbLabel = `${n}${lLabel}`
  const meanR = (3 * n * n - l * (l + 1)) / (2 * Z)

  const [showRadialHelp, setShowRadialHelp] = useState(false)
  const [showOrbitalHelp, setShowOrbitalHelp] = useState(false)
  const closeRadial = useCallback(() => setShowRadialHelp(false), [])
  const closeOrbital = useCallback(() => setShowOrbitalHelp(false), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { closeRadial(); closeOrbital() }
    }
    if (showRadialHelp || showOrbitalHelp) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showRadialHelp, showOrbitalHelp, closeRadial, closeOrbital])

  const maxR = Math.max(...result.r)
  const angstromRange: [number, number] = [0, maxR * BOHR_TO_ANGSTROM]

  // Find the outermost r where radial density exceeds 0.1% of its peak.
  // Used to zoom the 2D heatmap into the region where the electron actually lives.
  const maxP = Math.max(...result.radial_density)
  const threshold = 0.001 * maxP
  let displayExtent = result.r[result.r.length - 1]
  for (let i = result.r.length - 1; i >= 0; i--) {
    if (result.radial_density[i] > threshold) {
      displayExtent = result.r[i] * 1.15   // 15% padding
      break
    }
  }

  const radialTrace: object = {
    x: result.r,
    y: result.radial_density,
    type: 'scatter',
    mode: 'lines',
    line: { color: '#4a9eff', width: 2 },
    name: 'P(r)',
    hovertemplate: 'r = %{x:.3f} Bohr<br>P(r) = %{y:.5f} Bohr⁻¹<extra></extra>',
  }

  // Invisible trace on x2 — required to make Plotly render the Å secondary axis
  const angstromDummy: object = {
    x: [0, maxR * BOHR_TO_ANGSTROM],
    y: [0, 0],
    type: 'scatter',
    mode: 'lines',
    line: { width: 0 },
    xaxis: 'x2',
    yaxis: 'y',
    showlegend: false,
    hoverinfo: 'skip',
  }

  const meanRLine: object = {
    x: [meanR, meanR],
    y: [0, Math.max(...result.radial_density)],
    type: 'scatter',
    mode: 'lines',
    line: { color: '#ff9f40', dash: 'dash', width: 1.5 },
    name: `⟨r⟩ = ${meanR.toFixed(2)} Bohr = ${(meanR * BOHR_TO_ANGSTROM).toFixed(2)} Å`,
    hoverinfo: 'skip',
  }

  // Trim x/z axes and density grid to displayExtent so the plot zooms in
  // without setting explicit axis ranges (which breaks scaleanchor squareness).
  const xKeep = result.x_axis.map(x => Math.abs(x) <= displayExtent)
  const zKeep = result.z_axis.map(z => Math.abs(z) <= displayExtent)
  const trimmedX = result.x_axis.filter((_, i) => xKeep[i])
  const trimmedZ = result.z_axis.filter((_, i) => zKeep[i])
  const trimmedDensity = result.orbital_density
    .filter((_, zi) => zKeep[zi])
    .map(row => row.filter((_, xi) => xKeep[xi]))

  const maxDensity = Math.max(...trimmedDensity.map(row => Math.max(...row)))
  const normalizedDensity = maxDensity > 0
    ? trimmedDensity.map(row => row.map(v => v / maxDensity))
    : trimmedDensity

  const heatmap: object = {
    z: normalizedDensity,
    x: trimmedX,
    y: trimmedZ,
    type: 'heatmap',
    colorscale: 'Viridis',
    zmin: 0,
    zmax: 1,
    showscale: true,
    colorbar: {
      title: '|ψ|² / max',
      thickness: 14,
      titlefont: { size: 10 },
      tickvals: [0, 0.25, 0.5, 0.75, 1],
      ticktext: ['0', '0.25', '0.50', '0.75', '1'],
    },
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
        {/* Radial density plot */}
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', top: 6, right: 8, zIndex: 1 }}>
            <HelpButton onClick={() => setShowRadialHelp(true)} />
          </div>
          <Plot
            data={[radialTrace, meanRLine, angstromDummy]}
            layout={{
              title: { text: `Radial probability density — ${result.ion_symbol} ${orbLabel}`, font: { size: 13 } },
              xaxis: {
                title: { text: 'r (Bohr)', standoff: 8 },
                zeroline: false,
                range: [0, displayExtent],
              },
              xaxis2: {
                title: { text: 'r (Å)', standoff: 8 },
                overlaying: 'x',
                side: 'top',
                range: [0, displayExtent * BOHR_TO_ANGSTROM],
                showgrid: false,
                zeroline: false,
              },
              yaxis: { title: { text: 'P(r) (Bohr⁻¹)', standoff: 8 } },
              margin: { t: 75, b: 55, l: 65, r: 20 },
              showlegend: true,
              legend: { x: 0.55, y: 0.95, font: { size: 11 } },
              height: 340,
            }}
            style={{ width: '100%' }}
            config={{ displayModeBar: false }}
          />
        </div>

        {/* Orbital density heatmap */}
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', top: 6, right: 8, zIndex: 1 }}>
            <HelpButton onClick={() => setShowOrbitalHelp(true)} />
          </div>
          <Plot
            data={[heatmap]}
            layout={{
              title: { text: `${result.ion_symbol} ${orbLabel} (m=${m}) — electron density |ψ(x,0,z)|²`, font: { size: 13 } },
              xaxis: { title: { text: 'x (Bohr)', standoff: 8 }, scaleanchor: 'y', scaleratio: 1 },
              yaxis: { title: { text: 'z (Bohr)', standoff: 8 } },
              margin: { t: 40, b: 60, l: 60, r: 80 },
              height: 360,
              annotations: [{
                text: 'Cross-section through nucleus (y = 0)',
                x: 0.5, y: -0.14,
                xref: 'paper', yref: 'paper',
                showarrow: false,
                font: { size: 11, color: '#888' },
              }],
            }}
            style={{ width: '100%' }}
            config={{ displayModeBar: false }}
          />
        </div>
      </div>

      <GrotriaDiagram Z={Z} activeN={n} activeL={l} onSelectLevel={onSelectLevel} />

      {showRadialHelp && (
        <PlotModal title="Radial probability density — reference" onClose={closeRadial}>
          <RadialDensityInfoPanel />
        </PlotModal>
      )}

      {showOrbitalHelp && (
        <PlotModal title="Electron density cross-section — reference" onClose={closeOrbital}>
          <OrbitalDensityInfoPanel />
        </PlotModal>
      )}
    </div>
  )
}
