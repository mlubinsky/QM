import { useState } from 'react'
import _Plot from 'react-plotly.js'
import { EnergyDecompositionInfoPanel } from './EnergyDecompositionInfoPanel'
import type { EvolveResponse } from '../types/api'

const Plot = (_Plot as any).default ?? _Plot

interface Props {
  evolveResult: EvolveResponse | null
}

export function EnergyDecompositionPlot({ evolveResult }: Props) {
  const [showInfo, setShowInfo] = useState(false)

  if (!evolveResult || evolveResult.decomp_weights.length === 0) return null

  const { decomp_weights, decomp_energies } = evolveResult
  const E0 = decomp_energies[0]
  const totalWeight = decomp_weights.reduce((s, w) => s + w, 0)

  const labels = decomp_weights.map((_, i) => `ψ${subscript(i + 1)}`)

  const hoverText = decomp_weights.map((w, i) => {
    const E = decomp_energies[i]
    const period = i === 0 ? 'ground state' : `T = ${(2 * Math.PI / Math.abs(E - E0)).toFixed(2)} a.u.`
    return `E${subscript(i + 1)} = ${E.toFixed(4)} a.u.<br>|c${subscript(i + 1)}|² = ${w.toFixed(4)}<br>${period}`
  })

  const data: Plotly.Data[] = [{
    type: 'bar',
    x: labels,
    y: decomp_weights,
    text: hoverText,
    hoverinfo: 'text',
    marker: { color: '#4c9be8' },
  }]

  const layout: Partial<Plotly.Layout> = {
    paper_bgcolor: '#1a1a2e',
    plot_bgcolor: '#1a1a2e',
    font: { color: '#e0e0e0', size: 12 },
    margin: { t: 30, b: 50, l: 55, r: 20 },
    height: 220,
    xaxis: { title: 'Eigenstate', color: '#e0e0e0', gridcolor: '#333' },
    yaxis: { title: '|cₙ|²', range: [0, 1.05], color: '#e0e0e0', gridcolor: '#333' },
    annotations: [{
      x: 0.99,
      y: 0.97,
      xref: 'paper',
      yref: 'paper',
      xanchor: 'right',
      yanchor: 'top',
      text: `Σ|cₙ|² = ${totalWeight.toFixed(3)}`,
      showarrow: false,
      font: { size: 11, color: '#aaa' },
    }],
  }

  return (
    <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
        <span style={{ fontSize: '0.85rem' }}>Energy decomposition |cₙ|²</span>
        <button
          aria-label="Energy decomposition info"
          title="What is energy decomposition?"
          onClick={() => setShowInfo(true)}
          style={{
            background: 'none', border: '1px solid #888', borderRadius: '50%',
            color: 'inherit', cursor: 'pointer', fontSize: '0.75rem',
            width: 20, height: 20, lineHeight: '18px', padding: 0, textAlign: 'center',
          }}
        >?</button>
      </div>

      <Plot
        data={data}
        layout={layout}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: '100%' }}
        data-testid="energy-decomp-plot"
      />

      {showInfo && (
        <div
          className="physics-modal-backdrop"
          onClick={() => setShowInfo(false)}
        >
          <div
            className="physics-modal"
            role="dialog"
            aria-modal="true"
            onClick={e => e.stopPropagation()}
          >
            <div className="physics-modal-header">
              <span className="physics-modal-title">Energy Decomposition</span>
              <button
                className="physics-modal-close"
                aria-label="Close"
                onClick={() => setShowInfo(false)}
              >✕</button>
            </div>
            <div className="physics-modal-body">
              <EnergyDecompositionInfoPanel />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function subscript(n: number): string {
  const map: Record<string, string> = {
    '0': '₀','1': '₁','2': '₂','3': '₃','4': '₄',
    '5': '₅','6': '₆','7': '₇','8': '₈','9': '₉',
  }
  return String(n).split('').map(c => map[c] ?? c).join('')
}
