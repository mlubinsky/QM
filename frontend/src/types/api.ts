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
  initial_state?: 'gaussian' | 'superposition'
  gaussian_x0?: number
  gaussian_sigma?: number
  gaussian_k0?: number
  n_super_states?: number
  coefficients?: number[] | null
  dt?: number
  n_steps?: number
  save_every?: number
}

export interface EvolveResponse {
  prob_frames: number[][]     // shape (n_frames, n_points), |ψ(x,t)|²
  times: number[]
  norm_history: number[]
  grid_x: number[]
  potential: number[]
  expect_x: number[]          // ⟨x(t)⟩ at each frame
  expect_p: number[]          // ⟨p(t)⟩ at each frame
  expect_x2: number[]         // ⟨x²(t)⟩ at each frame
  expect_p2: number[]         // ⟨p²(t)⟩ at each frame
  expect_H: number[]          // ⟨H(t)⟩ at each frame
  momentum_frames: number[][] // shape (n_frames, n_points), |φ(k,t)|²
  momentum_k: number[]        // shape (n_points,), k values (rad/a.u.)
  current_frames: number[][]  // shape (n_frames, n_points), J(x,t)
  delta_x: number[]           // Δx(t) at each frame
  delta_p: number[]           // Δp(t) at each frame
  delta_x_delta_p: number[]   // Δx·Δp at each frame
}

export type AppMode = 'stationary' | 'time-evolution' | 'hydrogenic' | 'spin'

export interface HydrogenicRequest {
  Z: number
  n: number
  l: number
  m: number
  n_points?: number
  grid_2d_points?: number
}

export interface HydrogenicResponse {
  r: number[]
  radial_density: number[]
  energy_hartree: number
  energy_exact_hartree: number
  energy_ev: number
  x_axis: number[]
  z_axis: number[]
  orbital_density: number[][]
  ion_symbol: string
  ion_name: string
  orbital_label: string
  sph_harm_x: number[]
  sph_harm_z: number[]
}
export interface PauliMatrix {
  re: number[][]
  im: number[][]
}

export interface SpinMeasureRequest {
  theta: number
  phi: number
  axis: [number, number, number]
  n_shots: number
}

export interface SpinMeasureResponse {
  p_plus: number
  p_minus: number
  shots_plus: number
  shots_minus: number
  axis_label: string
}

export interface SpinPauliResponse {
  sigma_x: PauliMatrix
  sigma_y: PauliMatrix
  sigma_z: PauliMatrix
  eigenvalues: number[]
  eigenvectors: Record<string, { plus: number[]; minus: number[] }>
}

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
  speed: number
}
