import { useReducer, useEffect } from 'react'
import './App.css'
import { ControlPanel } from './components/ControlPanel'
import { PlotArea } from './components/PlotArea'
import { ErrorBanner } from './components/ErrorBanner'
import { solveEigenstates, solveEvolve, ApiError } from './api/client'
import { readUrlParams, pushUrlParams } from './utils/urlState'
import type { AppState, AppMode, EigensolveResponse, EvolveResponse } from './types/api'
import type { EigensolveRequest, EvolveRequest } from './types/api'

type Action =
  | { type: 'SET_MODE'; mode: AppMode }
  | { type: 'LOADING' }
  | { type: 'SUCCESS_EIGEN'; result: EigensolveResponse }
  | { type: 'SUCCESS_EVOLVE'; result: EvolveResponse }
  | { type: 'ERROR'; message: string }
  | { type: 'DISMISS_ERROR' }
  | { type: 'SET_FRAME'; frame: number }
  | { type: 'TOGGLE_PLAY' }

const initialParams = readUrlParams()

const initialState: AppState = {
  mode: initialParams.mode,
  status: 'idle',
  error: null,
  eigenResult: null,
  evolveResult: null,
  currentFrame: 0,
  playing: false,
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_MODE':
      return { ...state, mode: action.mode, eigenResult: null, evolveResult: null, error: null }
    case 'LOADING':
      return { ...state, status: 'loading', error: null }
    case 'SUCCESS_EIGEN':
      return { ...state, status: 'success', eigenResult: action.result, currentFrame: 0, playing: false }
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
    default:
      return state
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState)

  // Advance animation frame when playing
  useEffect(() => {
    if (!state.playing || !state.evolveResult) return
    const nFrames = state.evolveResult.psi_frames.length
    const id = setInterval(() => {
      dispatch({
        type: 'SET_FRAME',
        frame: (state.currentFrame + 1) % nFrames,
      })
    }, 100)
    return () => clearInterval(id)
  }, [state.playing, state.currentFrame, state.evolveResult])

  async function handleSolve(params: Record<string, unknown>) {
    dispatch({ type: 'LOADING' })
    try {
      if (state.mode === 'stationary') {
        const req = params as unknown as EigensolveRequest
        const result = await solveEigenstates(req)
        dispatch({ type: 'SUCCESS_EIGEN', result })
        pushUrlParams({
          potential: (req.potential_preset ?? req.potential_expr ?? '') as string,
          xmin: req.grid.x_min,
          xmax: req.grid.x_max,
          n: req.grid.n_points,
          mode: 'stationary',
        })
      } else {
        const req = params as unknown as EvolveRequest
        const result = await solveEvolve(req)
        dispatch({ type: 'SUCCESS_EVOLVE', result })
        pushUrlParams({
          potential: (req.potential_preset ?? req.potential_expr ?? '') as string,
          xmin: req.grid.x_min,
          xmax: req.grid.x_max,
          n: req.grid.n_points,
          mode: 'time-evolution',
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

  return (
    <div className="app">
      <header>
        <h1>Schrödinger Solver</h1>
        <div role="group" aria-label="mode toggle">
          <button
            onClick={() => dispatch({ type: 'SET_MODE', mode: 'stationary' })}
            aria-pressed={state.mode === 'stationary'}
          >
            Stationary
          </button>
          <button
            onClick={() => dispatch({ type: 'SET_MODE', mode: 'time-evolution' })}
            aria-pressed={state.mode === 'time-evolution'}
          >
            Time Evolution
          </button>
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
        />
        <PlotArea
          mode={state.mode}
          eigenResult={state.eigenResult}
          evolveResult={state.evolveResult}
          currentFrame={state.currentFrame}
          playing={state.playing}
          onFrameChange={frame => dispatch({ type: 'SET_FRAME', frame })}
          onPlayPause={() => dispatch({ type: 'TOGGLE_PLAY' })}
          onSpeedChange={_speed => {}}
        />
      </main>
    </div>
  )
}
