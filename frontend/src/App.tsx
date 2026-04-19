import { useReducer, useEffect, useState } from 'react'
import './App.css'
import { ControlPanel } from './components/ControlPanel'
import { PlotArea } from './components/PlotArea'
import { ErrorBanner } from './components/ErrorBanner'
import { solveEigenstates, solveEvolve, ApiError } from './api/client'
import { readUrlParams, pushUrlParams, hasNonDefaultUrl, DEFAULTS } from './utils/urlState'
import type { UrlParams } from './utils/urlState'
import { POTENTIALS } from './data/potentials'
import type { AppState, AppMode, EigensolveResponse, EvolveResponse } from './types/api'
import type { EigensolveRequest, EvolveRequest } from './types/api'

type Action =
  | { type: 'SET_MODE'; mode: AppMode }
  | { type: 'LOADING' }
  | { type: 'SUCCESS_EIGEN'; result: EigensolveResponse; preset: string | null }
  | { type: 'SUCCESS_EVOLVE'; result: EvolveResponse }
  | { type: 'ERROR'; message: string }
  | { type: 'DISMISS_ERROR' }
  | { type: 'SET_FRAME'; frame: number }
  | { type: 'TOGGLE_PLAY' }
  | { type: 'SET_SPEED'; speed: number }

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_MODE':
      return { ...state, mode: action.mode, eigenResult: null, evolveResult: null, error: null }
    case 'LOADING':
      return { ...state, status: 'loading', error: null }
    case 'SUCCESS_EIGEN':
      return { ...state, status: 'success', eigenResult: action.result, potentialPreset: action.preset, currentFrame: 0, playing: false }
    case 'SUCCESS_EVOLVE':
      return { ...state, status: 'success', evolveResult: action.result, currentFrame: 0, playing: false }
    case 'ERROR':
      return { ...state, status: 'error', error: action.message }
    case 'DISMISS_ERROR':
      return { ...state, status: 'idle', error: null }
    case 'SET_FRAME':
      return { ...state, currentFrame: action.frame }
    case 'TOGGLE_PLAY':
      return { ...state, playing: !state.playing }
    case 'SET_SPEED':
      return { ...state, speed: action.speed }
    default:
      return state
  }
}

function buildExprFromParams(expr: string, params: Record<string, number>): string {
  let result = expr
  for (const [name, value] of Object.entries(params)) {
    result = result.replaceAll(`{${name}}`, value.toString())
  }
  return result
}

function buildPotentialFromUrlParams(urlParams: UrlParams) {
  if (urlParams.expr) {
    return { potential_preset: null, potential_expr: urlParams.expr }
  }
  const info = POTENTIALS[urlParams.potential]
  if (info?.parameters?.length && Object.keys(urlParams.potentialParams).length > 0) {
    const defaults: Record<string, number> = {}
    for (const p of info.parameters) defaults[p.name] = p.default
    return {
      potential_preset: null,
      potential_expr: buildExprFromParams(info.expr, { ...defaults, ...urlParams.potentialParams }),
    }
  }
  return { potential_preset: urlParams.potential, potential_expr: null }
}

export default function App() {
  const [initialParams] = useState<UrlParams>(() => readUrlParams())

  const [state, dispatch] = useReducer(reducer, null, () => ({
    mode: initialParams.mode,
    status: 'idle' as const,
    error: null,
    eigenResult: null,
    evolveResult: null,
    potentialPreset: null,
    currentFrame: 0,
    playing: false,
    speed: 1,
  }))

  // Advance animation frame when playing
  useEffect(() => {
    if (!state.playing || !state.evolveResult) return
    const nFrames = state.evolveResult.psi_frames.length
    const delay = Math.round(100 / (state.speed ?? 1))
    const id = setInterval(() => {
      dispatch({
        type: 'SET_FRAME',
        frame: (state.currentFrame + 1) % nFrames,
      })
    }, delay)
    return () => clearInterval(id)
  }, [state.playing, state.currentFrame, state.evolveResult, state.speed])

  async function handleSolve(params: Record<string, unknown>) {
    dispatch({ type: 'LOADING' })
    try {
      if (state.mode === 'stationary') {
        const req = params as unknown as EigensolveRequest
        const result = await solveEigenstates(req)
        dispatch({ type: 'SUCCESS_EIGEN', result, preset: req.potential_preset ?? null })
        pushUrlParams({
          ...DEFAULTS,
          ...initialParams,
          mode: 'stationary',
          potential: req.potential_preset ?? DEFAULTS.potential,
          expr: req.potential_expr ?? null,
          xmin: req.grid.x_min,
          xmax: req.grid.x_max,
          n: req.grid.n_points,
          nStates: (req as EigensolveRequest).n_states ?? DEFAULTS.nStates,
        })
      } else {
        const req = params as unknown as EvolveRequest
        const result = await solveEvolve(req)
        dispatch({ type: 'SUCCESS_EVOLVE', result })
        pushUrlParams({
          ...DEFAULTS,
          ...initialParams,
          mode: 'time-evolution',
          potential: req.potential_preset ?? DEFAULTS.potential,
          expr: req.potential_expr ?? null,
          xmin: req.grid.x_min,
          xmax: req.grid.x_max,
          n: req.grid.n_points,
          x0: req.gaussian_x0,
          sigma: req.gaussian_sigma,
          k0: req.gaussian_k0,
          dt: req.dt,
          nSteps: req.n_steps,
          saveEvery: req.save_every ?? DEFAULTS.saveEvery,
        })
      }
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.detail
          : err instanceof Error
            ? err.message
            : 'Unknown error'
      dispatch({ type: 'ERROR', message })
    }
  }

  // Auto-solve on mount when URL has non-default params
  useEffect(() => {
    if (!hasNonDefaultUrl(initialParams)) return
    const potential = buildPotentialFromUrlParams(initialParams)
    const grid = { x_min: initialParams.xmin, x_max: initialParams.xmax, n_points: initialParams.n }
    if (initialParams.mode === 'stationary') {
      dispatch({ type: 'LOADING' })
      solveEigenstates({ grid, ...potential, n_states: initialParams.nStates })
        .then(result => dispatch({ type: 'SUCCESS_EIGEN', result, preset: potential.potential_preset }))
        .catch(err => {
          const message = err instanceof ApiError ? err.detail : err instanceof Error ? err.message : 'Unknown error'
          dispatch({ type: 'ERROR', message })
        })
    } else {
      dispatch({ type: 'LOADING' })
      solveEvolve({
        grid,
        ...potential,
        gaussian_x0: initialParams.x0,
        gaussian_sigma: initialParams.sigma,
        gaussian_k0: initialParams.k0,
        dt: initialParams.dt,
        n_steps: initialParams.nSteps,
        save_every: initialParams.saveEvery,
      })
        .then(result => dispatch({ type: 'SUCCESS_EVOLVE', result }))
        .catch(err => {
          const message = err instanceof ApiError ? err.detail : err instanceof Error ? err.message : 'Unknown error'
          dispatch({ type: 'ERROR', message })
        })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="app">
      <header>
        <h1>Schrödinger Solver</h1>
        <div className="mode-bar">
          <span className="mode-equation" aria-live="polite">
            {state.mode === 'stationary'
              ? <span>Ĥψ = Eψ</span>
              : <span>i ∂ψ/∂t = Ĥψ</span>
            }
          </span>
          <div role="group" aria-label="mode toggle" className="mode-buttons">
            <button
              className={state.mode === 'stationary' ? 'mode-btn mode-btn--active' : 'mode-btn'}
              onClick={() => dispatch({ type: 'SET_MODE', mode: 'stationary' })}
              aria-pressed={state.mode === 'stationary'}
            >
              Stationary
            </button>
            <button
              className={state.mode === 'time-evolution' ? 'mode-btn mode-btn--active' : 'mode-btn'}
              onClick={() => dispatch({ type: 'SET_MODE', mode: 'time-evolution' })}
              aria-pressed={state.mode === 'time-evolution'}
            >
              Time Evolution
            </button>
          </div>
        </div>
      </header>

      {state.error && (
        <ErrorBanner
          message={state.error}
          onDismiss={() => dispatch({ type: 'DISMISS_ERROR' })}
        />
      )}

      <main className="main-layout">
        <ControlPanel
          mode={state.mode}
          onSolve={handleSolve}
          status={state.status}
          initialParams={initialParams}
        />
        <PlotArea
          mode={state.mode}
          eigenResult={state.eigenResult}
          evolveResult={state.evolveResult}
          potentialPreset={state.potentialPreset}
          currentFrame={state.currentFrame}
          playing={state.playing}
          onFrameChange={frame => dispatch({ type: 'SET_FRAME', frame })}
          onPlayPause={() => dispatch({ type: 'TOGGLE_PLAY' })}
          onSpeedChange={speed => dispatch({ type: 'SET_SPEED', speed })}
          speed={state.speed}
        />
      </main>
    </div>
  )
}
