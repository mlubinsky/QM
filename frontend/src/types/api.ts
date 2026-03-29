// TypeScript interfaces matching the Pydantic models in spec 05.
// These are the single source of truth for request/response shapes.

export interface GridConfig {
  x_min: number
  x_max: number
  n_points: number
}

export interface EigensolveRequest {
  grid: GridConfig
  potential_preset?: string | null
  potential_expr?: string | null
  n_states?: number
}

export interface EigensolveResponse {
  energies: number[]
  wavefunctions: number[][]   // shape (k, n_points), real
  grid_x: number[]
  dx: number
  potential: number[]
  converged: boolean
  norm_errors: number[]
}

export interface EvolveRequest {
  grid: GridConfig
  potential_preset?: string | null
  potential_expr?: string | null
  initial_state?: 'gaussian'
  gaussian_x0?: number
  gaussian_sigma?: number
  gaussian_k0?: number
  dt?: number
  n_steps?: number
  save_every?: number
}

export interface EvolveResponse {
  psi_frames: number[][]   // shape (n_frames, n_points), |ψ|²
  times: number[]
  norm_history: number[]
  grid_x: number[]
  potential: number[]
}

export type AppMode = 'stationary' | 'time-evolution'
export type AppStatus = 'idle' | 'loading' | 'success' | 'error'

export interface AppState {
  mode: AppMode
  status: AppStatus
  error: string | null
  eigenResult: EigensolveResponse | null
  evolveResult: EvolveResponse | null
  potentialPreset: string | null
  currentFrame: number
  playing: boolean
}
