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

  const radialTrace: object = {
    x: result.r,
    y: result.radial_density,
    type: 'scatter',
    mode: 'lines',
    line: { color: '#4a9eff', width: 2 },
    name: 'r²|R|²',
  }

  const meanRLine: object = {
    x: [meanR, meanR],
    y: [0, Math.max(...result.radial_density)],
    type: 'scatter',
    mode: 'lines',
    line: { color: '#ff9f40', dash: 'dash', width: 1.5 },
    name: `⟨r⟩ = ${meanR.toFixed(2)} a₀ = ${(meanR * BOHR_TO_ANGSTROM).toFixed(2)} Å`,
  }

  const heatmap: object = {
    z: result.orbital_density,
    x: result.x_axis,
    y: result.z_axis,
    type: 'heatmap',
    colorscale: 'Viridis',
    showscale: true,
    colorbar: { title: '|ψ|² (Bohr⁻³)', thickness: 14, titlefont: { size: 10 } },
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
            data={[radialTrace, meanRLine]}
            layout={{
              title: { text: `Radial probability density — ${result.ion_symbol} ${orbLabel}`, font: { size: 13 } },
              xaxis: {
                title: 'r (Bohr)',
                zeroline: false,
                range: [0, maxR],
              },
              xaxis2: {
                title: 'r (Å)',
                overlaying: 'x',
                side: 'top',
                range: angstromRange,
                showgrid: false,
                zeroline: false,
              },
              yaxis: { title: 'P(r) = r²|R_nl(r)|² (Bohr⁻¹)' },
              margin: { t: 55, b: 50, l: 70, r: 20 },
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
              xaxis: { title: 'x (Bohr)', scaleanchor: 'y', scaleratio: 1 },
              yaxis: { title: 'z (Bohr)' },
              margin: { t: 40, b: 60, l: 55, r: 80 },
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
