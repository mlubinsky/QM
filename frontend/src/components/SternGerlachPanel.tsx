import { useState } from 'react'
import { spinMeasure } from '../api/client'
import { collapseState } from '../utils/spinMath'
import type { Vec3 } from '../utils/spinMath'
import type { SpinMeasureResponse } from '../types/api'

interface Props {
  theta: number
  phi: number
  onCollapse: (theta: number, phi: number) => void
}

const PI = Math.PI

type AxisPreset = 'x' | 'y' | 'z' | 'custom'

function axisVec(preset: AxisPreset, customTheta: number, customPhi: number): Vec3 {
  if (preset === 'x') return [1, 0, 0]
  if (preset === 'y') return [0, 1, 0]
  if (preset === 'z') return [0, 0, 1]
  return [
    Math.sin(customTheta) * Math.cos(customPhi),
    Math.sin(customTheta) * Math.sin(customPhi),
    Math.cos(customTheta),
  ]
}

function ProbBar({ pPlus, pMinus }: { pPlus: number; pMinus: number }) {
  return (
    <div className="sg-prob-bar-wrap">
      <div className="sg-prob-bar">
        <div className="sg-prob-fill sg-prob-plus" style={{ width: `${pPlus * 100}%` }} />
      </div>
      <div className="sg-prob-labels">
        <span>+½: {(pPlus * 100).toFixed(1)}%</span>
        <span>−½: {(pMinus * 100).toFixed(1)}%</span>
      </div>
    </div>
  )
}

function Histogram({ result }: { result: SpinMeasureResponse }) {
  const maxShots = Math.max(result.shots_plus, result.shots_minus, 1)
  return (
    <div className="sg-histogram">
      <div className="sg-hist-bar-wrap">
        <div className="sg-hist-label">+½</div>
        <div className="sg-hist-track">
          <div className="sg-hist-fill sg-prob-plus"
            style={{ width: `${(result.shots_plus / maxShots) * 100}%` }} />
        </div>
        <div className="sg-hist-count">{result.shots_plus}</div>
      </div>
      <div className="sg-hist-bar-wrap">
        <div className="sg-hist-label">−½</div>
        <div className="sg-hist-track">
          <div className="sg-hist-fill sg-prob-minus"
            style={{ width: `${(result.shots_minus / maxShots) * 100}%` }} />
        </div>
        <div className="sg-hist-count">{result.shots_minus}</div>
      </div>
      <div className="sg-hist-note">
        exact P(+½) = {(result.p_plus * 100).toFixed(2)}%
      </div>
    </div>
  )
}

export function SternGerlachPanel({ theta, phi, onCollapse }: Props) {
  const [axisPreset, setAxisPreset] = useState<AxisPreset>('z')
  const [customTheta, setCustomTheta] = useState(PI / 4)
  const [customPhi, setCustomPhi]     = useState(0)
  const [nShots, setNShots]           = useState(1000)
  const [result, setResult]           = useState<SpinMeasureResponse | null>(null)
  const [lastOutcome, setLastOutcome] = useState<string | null>(null)
  const [loading, setLoading]         = useState(false)

  const axis = axisVec(axisPreset, customTheta, customPhi)

  // Exact probabilities (local, instant)
  const rx = Math.sin(theta) * Math.cos(phi)
  const ry = Math.sin(theta) * Math.sin(phi)
  const rz = Math.cos(theta)
  const pPlus  = Math.max(0, Math.min(1, (1 + axis[0]*rx + axis[1]*ry + axis[2]*rz) / 2))
  const pMinus = 1 - pPlus

  async function handleMeasureOnce() {
    const outcome: '+' | '-' = Math.random() < pPlus ? '+' : '-'
    setLastOutcome(outcome === '+' ? '+½' : '−½')
    const { theta: t, phi: p } = collapseState(axis, outcome)
    onCollapse(t, p)
  }

  async function handleRunShots() {
    setLoading(true)
    try {
      const res = await spinMeasure({ theta, phi, axis, n_shots: nShots })
      setResult(res)
    } finally {
      setLoading(false)
    }
  }

  return (
    <fieldset className="spin-fieldset">
      <legend>Stern-Gerlach</legend>

      <label>Measurement axis</label>
      <div className="spin-b-presets">
        {(['x', 'y', 'z', 'custom'] as AxisPreset[]).map(p => (
          <button key={p}
            className={`spin-preset-btn ${axisPreset === p ? 'spin-preset-btn--active' : ''}`}
            onClick={() => setAxisPreset(p)}
          >
            {p === 'custom' ? 'custom' : p}
          </button>
        ))}
      </div>

      {axisPreset === 'custom' && (
        <div className="spin-sliders">
          <label>θ_n <span className="spin-value">{customTheta.toFixed(2)}</span></label>
          <input type="range" min={0} max={PI} step={0.01} value={customTheta}
            onChange={e => setCustomTheta(parseFloat(e.target.value))} />
          <label>φ_n <span className="spin-value">{customPhi.toFixed(2)}</span></label>
          <input type="range" min={0} max={2*PI} step={0.01} value={customPhi}
            onChange={e => setCustomPhi(parseFloat(e.target.value))} />
        </div>
      )}

      <ProbBar pPlus={pPlus} pMinus={pMinus} />

      <button className="spin-play-btn sg-measure-btn" onClick={handleMeasureOnce}>
        Measure once
      </button>
      {lastOutcome && (
        <div className="sg-outcome">
          Outcome: <strong>{lastOutcome}</strong> → state collapsed
        </div>
      )}

      <div className="sg-shots-row">
        <label>N shots</label>
        <input type="number" min={1} max={10000} value={nShots}
          onChange={e => setNShots(Math.max(1, Math.min(10000, parseInt(e.target.value) || 1)))}
          className="sg-shots-input"
        />
        <button className="spin-play-btn" onClick={handleRunShots} disabled={loading}>
          {loading ? 'Running…' : 'Run N shots'}
        </button>
      </div>

      {result && <Histogram result={result} />}
    </fieldset>
  )
}
