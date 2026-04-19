import { useState, useEffect, useCallback, useRef } from 'react'
import type { AppMode, AppStatus } from '../types/api'
import { POTENTIALS, POTENTIAL_KEYS } from '../data/potentials'
import { PhysicsPanel } from './PhysicsPanel'
import { SolverInfoPanel } from './SolverInfoPanel'
import { ParameterSlider } from './ParameterSlider'
import { RegimeIndicator } from './RegimeIndicator'
import type { UrlParams } from '../utils/urlState'

function buildExpr(expr: string, params: Record<string, number>): string {
  let result = expr
  for (const [name, value] of Object.entries(params)) {
    result = result.replaceAll(`{${name}}`, value.toString())
  }
  return result
}

interface ControlPanelProps {
  mode: AppMode
  onSolve: (params: Record<string, unknown>) => void
  status?: AppStatus
  initialParams?: UrlParams
}

export function ControlPanel({ mode, onSolve, status = 'idle', initialParams }: ControlPanelProps) {
  const loading = status === 'loading'

  // Track whether a solve has ever succeeded and whether params changed since
  const [solvedOnce, setSolvedOnce] = useState(false)
  const [dirtyAfterSolve, setDirtyAfterSolve] = useState(false)

  useEffect(() => {
    if (status === 'success') {
      setSolvedOnce(true)
      setDirtyAfterSolve(false)
    }
  }, [status])

  const markDirty = () => {
    if (solvedOnce && !dirtyAfterSolve) setDirtyAfterSolve(true)
  }

  // Grid controls
  const [xMin, setXMin] = useState(initialParams?.xmin ?? -10)
  const [xMax, setXMax] = useState(initialParams?.xmax ?? 10)
  const [nPoints, setNPoints] = useState(initialParams?.n ?? 500)

  // Potential
  const [preset, setPreset] = useState(initialParams?.potential ?? 'infinite_square_well')
  const [customExpr, setCustomExpr] = useState(initialParams?.expr ?? '')
  const [showPhysicsHelp, setShowPhysicsHelp] = useState(false)
  const [showGridHelp, setShowGridHelp] = useState(false)

  // Merge URL potential params with slider defaults for the initial preset
  const [paramValues, setParamValues] = useState<Record<string, number>>(() => {
    const initialPreset = initialParams?.potential ?? 'infinite_square_well'
    const info = POTENTIALS[initialPreset]
    const defaults: Record<string, number> = {}
    if (info?.parameters) {
      for (const p of info.parameters) defaults[p.name] = p.default
    }
    return { ...defaults, ...(initialParams?.potentialParams ?? {}) }
  })

  // Reset parameter sliders to defaults when preset changes (skip on first mount
  // to preserve URL-provided param values)
  const isFirstPresetEffect = useRef(true)
  useEffect(() => {
    if (isFirstPresetEffect.current) {
      isFirstPresetEffect.current = false
      return
    }
    const info = POTENTIALS[preset]
    if (info?.parameters) {
      const defaults: Record<string, number> = {}
      for (const p of info.parameters) defaults[p.name] = p.default
      setParamValues(defaults)
    } else {
      setParamValues({})
    }
  }, [preset])

  const closeHelp = useCallback(() => setShowPhysicsHelp(false), [])
  const closeGridHelp = useCallback(() => setShowGridHelp(false), [])

  useEffect(() => {
    if (!showPhysicsHelp) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeHelp() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showPhysicsHelp, closeHelp])

  useEffect(() => {
    if (!showGridHelp) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeGridHelp() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showGridHelp, closeGridHelp])

  // Stationary
  const [nStates, setNStates] = useState(initialParams?.nStates ?? 5)

  // Time evolution
  const [x0, setX0] = useState(initialParams?.x0 ?? 0)
  const [sigma, setSigma] = useState(initialParams?.sigma ?? 1)
  const [k0, setK0] = useState(initialParams?.k0 ?? 0)
  const [dt, setDt] = useState(initialParams?.dt ?? 0.001)
  const [nSteps, setNSteps] = useState(initialParams?.nSteps ?? 1000)
  const saveEvery = initialParams?.saveEvery ?? 10

  const btnClass = !solvedOnce
    ? 'solve-btn solve-btn--ready'
    : dirtyAfterSolve
      ? 'solve-btn solve-btn--dirty'
      : 'solve-btn solve-btn--current'

  const handleSubmit = () => {
    const info = POTENTIALS[preset]
    const hasParams = !customExpr && (info?.parameters?.length ?? 0) > 0
    const base = {
      grid: { x_min: xMin, x_max: xMax, n_points: nPoints },
      potential_preset: (customExpr || hasParams) ? null : preset,
      potential_expr: customExpr
        ? customExpr
        : hasParams
          ? buildExpr(info.expr, paramValues)
          : null,
    }
    if (mode === 'stationary') {
      onSolve({ ...base, n_states: nStates })
    } else {
      onSolve({ ...base, gaussian_x0: x0, gaussian_sigma: sigma, gaussian_k0: k0, dt, n_steps: nSteps, save_every: saveEvery })
    }
  }

  return (
    <div className="control-panel">
      {/* Grid Controls */}
      <fieldset>
        <legend>
          <span className="legend-row">
            Grid
            <button
              type="button"
              className="physics-info-btn"
              aria-label="Show solver reference"
              onClick={() => setShowGridHelp(true)}
            >?</button>
          </span>
        </legend>
        <label htmlFor="x-min">x_min</label>
        <input id="x-min" type="number" value={xMin} onChange={e => { setXMin(Number(e.target.value)); markDirty() }} />

        <label htmlFor="x-max">x_max</label>
        <input id="x-max" type="number" value={xMax} onChange={e => { setXMax(Number(e.target.value)); markDirty() }} />

        <label htmlFor="n-points">n_points</label>
        <div className="slider-row">
          <input id="n-points" type="range" min={50} max={2000} value={nPoints}
            onChange={e => { setNPoints(Number(e.target.value)); markDirty() }} />
          <span aria-live="polite">{nPoints}</span>
        </div>
      </fieldset>

      {/* Potential Selector */}
      <fieldset>
        <legend>Potential</legend>
        <label htmlFor="potential-preset">Potential</label>
        <div className="potential-select-row">
          <select id="potential-preset" value={preset} onChange={e => { setPreset(e.target.value); markDirty() }}>
            {POTENTIAL_KEYS.map(key => (
              <option key={key} value={key}>{POTENTIALS[key].label}</option>
            ))}
          </select>
          <button
            type="button"
            className="physics-info-btn"
            aria-label="Show physics reference"
            onClick={() => setShowPhysicsHelp(true)}
          >?</button>
        </div>

        {POTENTIALS[preset]?.parameters?.map(param => (
          <ParameterSlider
            key={param.name}
            param={param}
            value={paramValues[param.name] ?? param.default}
            allParamValues={paramValues}
            onChange={val => { setParamValues(prev => ({ ...prev, [param.name]: val })); markDirty() }}
          />
        ))}

        <RegimeIndicator potentialKey={preset} paramValues={paramValues} />

        <label htmlFor="custom-expr">Custom expression</label>
        <input id="custom-expr" type="text" value={customExpr}
          placeholder="e.g. 0.5 * x**2"
          onChange={e => { setCustomExpr(e.target.value); markDirty() }} />
      </fieldset>

      {/* Grid / solver info modal */}
      {showGridHelp && (
        <div className="physics-modal-backdrop" onClick={closeGridHelp}>
          <div
            className="physics-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Solver reference"
            onClick={e => e.stopPropagation()}
          >
            <div className="physics-modal-header">
              <span className="physics-modal-title">1D Solver — reference</span>
              <button
                type="button"
                className="physics-modal-close"
                aria-label="Close"
                onClick={closeGridHelp}
              >✕</button>
            </div>
            <div className="physics-modal-body">
              <SolverInfoPanel />
            </div>
          </div>
        </div>
      )}

      {/* Physics help modal */}
      {showPhysicsHelp && (
        <div className="physics-modal-backdrop" onClick={closeHelp}>
          <div
            className="physics-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`Physics info: ${POTENTIALS[preset]?.label ?? preset}`}
            onClick={e => e.stopPropagation()}
          >
            <div className="physics-modal-header">
              <span className="physics-modal-title">
                {POTENTIALS[preset]?.label ?? preset}
              </span>
              <button
                type="button"
                className="physics-modal-close"
                aria-label="Close"
                onClick={closeHelp}
              >✕</button>
            </div>
            <div className="physics-modal-body">
              <PhysicsPanel potentialKey={preset} paramValues={paramValues} />
            </div>
          </div>
        </div>
      )}

      {/* Mode-specific controls */}
      {mode === 'stationary' && (
        <fieldset>
          <legend>Eigenstates</legend>
          <label htmlFor="n-states">n_states</label>
          <div className="slider-row">
            <input id="n-states" type="range" min={1} max={20} value={nStates}
              onChange={e => { setNStates(Number(e.target.value)); markDirty() }} />
            <span aria-live="polite">{nStates}</span>
          </div>
        </fieldset>
      )}

      {mode === 'time-evolution' && (
        <fieldset>
          <legend>Gaussian Packet</legend>

          {/* Formula panel */}
          <div className="gauss-formula" aria-label="Initial wavefunction formula">
            ψ(x,0) = (2π<span className="param-sigma">σ</span>²)<sup>−¼</sup>{' '}
            exp[−(x−<span className="param-x0">x₀</span>)² / 4<span className="param-sigma">σ</span>²]{' '}
            e<sup>i<span className="param-k0">k₀</span>x</sup>
          </div>

          <label htmlFor="gauss-x0" data-tooltip="Initial center position of the wave packet (a.u.)">
            <span className="param-x0">x₀</span>
          </label>
          <input id="gauss-x0" type="number" value={x0} onChange={e => { setX0(Number(e.target.value)); markDirty() }} />

          <label htmlFor="gauss-sigma" data-tooltip="Gaussian width (a.u.) — position uncertainty Δx ≈ σ/√2, momentum uncertainty Δp ≈ 1/(2σ)">
            <span className="param-sigma">σ</span>
          </label>
          <input id="gauss-sigma" type="number" value={sigma} onChange={e => { setSigma(Number(e.target.value)); markDirty() }} />

          <label htmlFor="gauss-k0" data-tooltip="Initial momentum / wavenumber (a.u.); the packet travels with group velocity v = k₀">
            <span className="param-k0">k₀</span>
          </label>
          <input id="gauss-k0" type="number" value={k0} onChange={e => { setK0(Number(e.target.value)); markDirty() }} />

          <label htmlFor="dt" data-tooltip="Crank-Nicolson time step size (a.u.) — smaller gives higher temporal accuracy">
            dt
          </label>
          <input id="dt" type="number" value={dt} onChange={e => { setDt(Number(e.target.value)); markDirty() }} />

          <label htmlFor="n-steps" data-tooltip="Total number of time steps; total simulated time = n_steps × dt">
            n_steps
          </label>
          <div className="slider-row">
            <input id="n-steps" type="range" min={10} max={10000} value={nSteps}
              onChange={e => { setNSteps(Number(e.target.value)); markDirty() }} />
            <span aria-live="polite">{nSteps}</span>
          </div>
        </fieldset>
      )}

      {loading && <span role="status">Loading…</span>}

      <button className={btnClass} onClick={handleSubmit} disabled={loading}>
        {mode === 'stationary' ? 'Solve Eigenstates' : 'Run Evolution'}
      </button>
    </div>
  )
}
