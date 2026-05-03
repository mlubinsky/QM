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

interface MeasurementRecord {
  axisLabel: string
  pPlus: number
  outcome: '+' | '-'
}

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

function axisLabel(preset: AxisPreset, customTheta: number, customPhi: number): string {
  if (preset !== 'custom') return preset
  return `(θ=${customTheta.toFixed(2)}, φ=${customPhi.toFixed(2)})`
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

function MeasurementHistory({ history, onClear }: {
  history: MeasurementRecord[]
  onClear: () => void
}) {
  if (history.length === 0) return null

  // Detect when consecutive measurements used different axes — that's the
  // moment to explain state collapse and non-commutativity.
  const last = history[history.length - 1]
  const prev = history.length >= 2 ? history[history.length - 2] : null
  const axisChanged = prev !== null && prev.axisLabel !== last.axisLabel

  return (
    <div className="sg-history">
      <div className="sg-history-header">
        <span className="sg-history-title">Measurement history</span>
        <button className="sg-history-clear" onClick={onClear}>Clear</button>
      </div>

      {history.map((rec, i) => (
        <div key={i} className="sg-history-row">
          <span className="sg-history-step">{i + 1}.</span>
          <span>along <strong>{rec.axisLabel}</strong></span>
          <span className="sg-history-prob">(P(+½) = {(rec.pPlus * 100).toFixed(0)}%)</span>
          <span className={`sg-history-outcome ${rec.outcome === '+' ? 'sg-history-plus' : 'sg-history-minus'}`}>
            → {rec.outcome === '+' ? '+½' : '−½'}
          </span>
        </div>
      ))}

      {axisChanged && (
        <p className="sg-history-note">
          After measuring along <strong>{prev!.axisLabel}</strong>, the state collapsed
          to a {prev!.axisLabel}-axis eigenstate — it has no memory of its previous direction.
          Measuring along <strong>{last.axisLabel}</strong> now uses this new collapsed
          state. Non-commuting measurements ({prev!.axisLabel} then {last.axisLabel}) do
          not have definite simultaneous values: this is the quantum measurement postulate.
        </p>
      )}

      {history.length >= 3 &&
        history[history.length - 1].axisLabel === history[0].axisLabel &&
        history.some((r, i) => i > 0 && r.axisLabel !== history[0].axisLabel) && (
        <p className="sg-history-note">
          Classic result: filtering along {history[0].axisLabel}, then measuring a
          perpendicular axis, then measuring {history[0].axisLabel} again gives 50/50 —
          even if the first measurement guaranteed +½. The intermediate measurement
          erased the original information.
        </p>
      )}
    </div>
  )
}

interface PrepResult {
  plus: number
  minus: number
  total: number
  pExact: number
}

function PrepHistogram({ result, axis }: { result: PrepResult; axis: string }) {
  const maxCount = Math.max(result.plus, result.minus, 1)
  return (
    <div className="sg-histogram">
      <div className="sg-hist-bar-wrap">
        <div className="sg-hist-label">+½</div>
        <div className="sg-hist-track">
          <div className="sg-hist-fill sg-prob-plus"
            style={{ width: `${(result.plus / maxCount) * 100}%` }} />
        </div>
        <div className="sg-hist-count">{result.plus}</div>
      </div>
      <div className="sg-hist-bar-wrap">
        <div className="sg-hist-label">−½</div>
        <div className="sg-hist-track">
          <div className="sg-hist-fill sg-prob-minus"
            style={{ width: `${(result.minus / maxCount) * 100}%` }} />
        </div>
        <div className="sg-hist-count">{result.minus}</div>
      </div>
      <div className="sg-hist-note">
        exact P(+½) along {axis} = {(result.pExact * 100).toFixed(2)}%
        &nbsp;·&nbsp;observed {(result.plus / result.total * 100).toFixed(1)}%
      </div>
      <p className="sg-history-note" style={{ marginTop: 4 }}>
        Each of the {result.total} trials started from the <em>same</em> preparation
        state — yet outcomes differ. Quantum randomness is irreducible: no hidden
        variable determines the result in advance.
      </p>
    </div>
  )
}

export function SternGerlachPanel({ theta, phi, onCollapse }: Props) {
  const [axisPreset, setAxisPreset] = useState<AxisPreset>('z')
  const [customTheta, setCustomTheta] = useState(PI / 4)
  const [customPhi, setCustomPhi]     = useState(0)
  const [nShots, setNShots]           = useState(1000)
  const [shotResult, setShotResult]   = useState<SpinMeasureResponse | null>(null)
  const [loading, setLoading]         = useState(false)
  const [history, setHistory]         = useState<MeasurementRecord[]>([])
  const [prepState, setPrepState]     = useState<{ theta: number; phi: number } | null>(null)
  const [prepResult, setPrepResult]   = useState<PrepResult | null>(null)

  const axis = axisVec(axisPreset, customTheta, customPhi)
  const label = axisLabel(axisPreset, customTheta, customPhi)

  // Exact Born-rule probability (computed locally, instant)
  const rx = Math.sin(theta) * Math.cos(phi)
  const ry = Math.sin(theta) * Math.sin(phi)
  const rz = Math.cos(theta)
  const pPlus  = Math.max(0, Math.min(1, (1 + axis[0]*rx + axis[1]*ry + axis[2]*rz) / 2))
  const pMinus = 1 - pPlus

  function handleMeasureOnce() {
    const outcome: '+' | '-' = Math.random() < pPlus ? '+' : '-'
    setHistory(h => [...h, { axisLabel: label, pPlus, outcome }])
    const { theta: t, phi: p } = collapseState(axis, outcome)
    onCollapse(t, p)
  }

  function handleSetPrep() {
    setPrepState({ theta, phi })
    setPrepResult(null)
  }

  function handleMeasureFromPrep() {
    if (!prepState) return
    const prx = Math.sin(prepState.theta) * Math.cos(prepState.phi)
    const pry = Math.sin(prepState.theta) * Math.sin(prepState.phi)
    const prz = Math.cos(prepState.theta)
    const p = Math.max(0, Math.min(1, (1 + axis[0]*prx + axis[1]*pry + axis[2]*prz) / 2))
    let plus = 0
    for (let i = 0; i < nShots; i++) { if (Math.random() < p) plus++ }
    setPrepResult({ plus, minus: nShots - plus, total: nShots, pExact: p })
    onCollapse(prepState.theta, prepState.phi)
  }

  async function handleRunShots() {
    setLoading(true)
    try {
      const res = await spinMeasure({ theta, phi, axis, n_shots: nShots })
      setShotResult(res)
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

      <MeasurementHistory history={history} onClear={() => setHistory([])} />

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

      {shotResult && <Histogram result={shotResult} />}

      <hr style={{ border: 'none', borderTop: '1px solid #444', margin: '8px 0' }} />

      <div style={{ fontSize: '0.78rem', fontStyle: 'italic', color: 'var(--text)', marginBottom: 4 }}>
        Identical preparation — measure the same state N times
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <button className="spin-play-btn" onClick={handleSetPrep}>
          Lock |ψ⟩ as prep state
        </button>
        {prepState && (
          <span style={{ fontSize: '0.75rem', color: 'var(--text)' }}>
            |prep⟩: θ={prepState.theta.toFixed(3)}, φ={prepState.phi.toFixed(3)}
          </span>
        )}
      </div>

      {prepState && (
        <button
          className="spin-play-btn sg-measure-btn"
          style={{ marginTop: 4 }}
          onClick={handleMeasureFromPrep}
        >
          Measure {nShots} times from |prep⟩
        </button>
      )}

      {prepResult && <PrepHistogram result={prepResult} axis={label} />}
    </fieldset>
  )
}
