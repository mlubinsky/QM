import { useState } from 'react'
import type { AppMode } from '../types/api'

interface ControlPanelProps {
  mode: AppMode
  onSolve: (params: Record<string, unknown>) => void
  loading?: boolean
}

export function ControlPanel({ mode, onSolve, loading = false }: ControlPanelProps) {
  // Grid controls
  const [xMin, setXMin] = useState(-10)
  const [xMax, setXMax] = useState(10)
  const [nPoints, setNPoints] = useState(500)

  // Potential
  const [preset, setPreset] = useState('infinite_square_well')
  const [customExpr, setCustomExpr] = useState('')

  // Stationary
  const [nStates, setNStates] = useState(5)

  // Time evolution
  const [x0, setX0] = useState(0)
  const [sigma, setSigma] = useState(1)
  const [k0, setK0] = useState(0)
  const [dt, setDt] = useState(0.001)
  const [nSteps, setNSteps] = useState(1000)

  const handleSubmit = () => {
    const base = {
      grid: { x_min: xMin, x_max: xMax, n_points: nPoints },
      potential_preset: customExpr ? null : preset,
      potential_expr: customExpr || null,
    }
    if (mode === 'stationary') {
      onSolve({ ...base, n_states: nStates })
    } else {
      onSolve({ ...base, gaussian_x0: x0, gaussian_sigma: sigma, gaussian_k0: k0, dt, n_steps: nSteps })
    }
  }

  return (
    <div className="control-panel">
      {/* Grid Controls */}
      <fieldset>
        <legend>Grid</legend>
        <label htmlFor="x-min">x_min</label>
        <input id="x-min" type="number" value={xMin} onChange={e => setXMin(Number(e.target.value))} />

        <label htmlFor="x-max">x_max</label>
        <input id="x-max" type="number" value={xMax} onChange={e => setXMax(Number(e.target.value))} />

        <label htmlFor="n-points">n_points</label>
        <input id="n-points" type="range" min={50} max={2000} value={nPoints}
          onChange={e => setNPoints(Number(e.target.value))} />
      </fieldset>

      {/* Potential Selector */}
      <fieldset>
        <legend>Potential</legend>
        <label htmlFor="potential-preset">Potential</label>
        <select id="potential-preset" value={preset} onChange={e => setPreset(e.target.value)}>
          <option value="infinite_square_well">Infinite Square Well</option>
          <option value="harmonic_oscillator">Harmonic Oscillator</option>
          <option value="double_well">Double Well</option>
          <option value="finite_square_well">Finite Square Well</option>
          <option value="step_potential">Step Potential</option>
          <option value="gaussian_barrier">Gaussian Barrier</option>
        </select>

        <label htmlFor="custom-expr">Custom expression</label>
        <input id="custom-expr" type="text" value={customExpr}
          placeholder="e.g. 0.5 * x**2"
          onChange={e => setCustomExpr(e.target.value)} />
      </fieldset>

      {/* Mode-specific controls */}
      {mode === 'stationary' && (
        <fieldset>
          <legend>Eigenstates</legend>
          <label htmlFor="n-states">n_states</label>
          <input id="n-states" type="range" min={1} max={20} value={nStates}
            onChange={e => setNStates(Number(e.target.value))} />
        </fieldset>
      )}

      {mode === 'time-evolution' && (
        <fieldset>
          <legend>Gaussian Packet</legend>
          <label htmlFor="gauss-x0">x0</label>
          <input id="gauss-x0" type="number" value={x0} onChange={e => setX0(Number(e.target.value))} />

          <label htmlFor="gauss-sigma">sigma</label>
          <input id="gauss-sigma" type="number" value={sigma} onChange={e => setSigma(Number(e.target.value))} />

          <label htmlFor="gauss-k0">k0</label>
          <input id="gauss-k0" type="number" value={k0} onChange={e => setK0(Number(e.target.value))} />

          <label htmlFor="dt">dt</label>
          <input id="dt" type="number" value={dt} onChange={e => setDt(Number(e.target.value))} />

          <label htmlFor="n-steps">n_steps</label>
          <input id="n-steps" type="range" min={10} max={10000} value={nSteps}
            onChange={e => setNSteps(Number(e.target.value))} />
        </fieldset>
      )}

      {loading && <span role="status">Loading…</span>}

      <button onClick={handleSubmit} disabled={loading}>
        {mode === 'stationary' ? 'Solve Eigenstates' : 'Run Evolution'}
      </button>
    </div>
  )
}
