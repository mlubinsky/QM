import type { AppMode } from '../types/api'

export interface UrlParams {
  mode: AppMode
  potential: string
  expr: string | null
  xmin: number
  xmax: number
  n: number
  nStates: number
  potentialParams: Record<string, number>
  x0: number
  sigma: number
  k0: number
  dt: number
  nSteps: number
  saveEvery: number
}

export const DEFAULTS: UrlParams = {
  mode: 'stationary',
  potential: 'infinite_square_well',
  expr: null,
  xmin: -10,
  xmax: 10,
  n: 500,
  nStates: 5,
  potentialParams: {},
  x0: 0,
  sigma: 1,
  k0: 0,
  dt: 0.001,
  nSteps: 1000,
  saveEvery: 10,
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val))
}

export function serializeUrlParams(params: UrlParams): string {
  const entries: Record<string, string> = {
    mode:      params.mode,
    potential: params.potential,
    xmin:      String(params.xmin),
    xmax:      String(params.xmax),
    n:         String(params.n),
    n_states:  String(params.nStates),
    x0:        String(params.x0),
    sigma:     String(params.sigma),
    k0:        String(params.k0),
    dt:        String(params.dt),
    n_steps:   String(params.nSteps),
    save_every: String(params.saveEvery),
  }
  if (params.expr !== null) {
    entries.expr = params.expr
  }
  for (const [k, v] of Object.entries(params.potentialParams)) {
    entries[`p_${k}`] = String(v)
  }
  return new URLSearchParams(entries).toString()
}

export function parseUrlParams(sp: URLSearchParams): UrlParams {
  // Grid
  let xmin = sp.has('xmin') ? parseFloat(sp.get('xmin')!) : DEFAULTS.xmin
  let xmax = sp.has('xmax') ? parseFloat(sp.get('xmax')!) : DEFAULTS.xmax
  if (xmin >= xmax) [xmin, xmax] = [xmax, xmin]

  const n       = clamp(sp.has('n')        ? parseInt(sp.get('n')!, 10)        : DEFAULTS.n,       50, 2000)
  const nStates = clamp(sp.has('n_states') ? parseInt(sp.get('n_states')!, 10) : DEFAULTS.nStates, 1,  20)
  const dt      = clamp(sp.has('dt')       ? parseFloat(sp.get('dt')!)         : DEFAULTS.dt,      1e-6, 0.1)
  const nSteps  = clamp(sp.has('n_steps')  ? parseInt(sp.get('n_steps')!, 10)  : DEFAULTS.nSteps,  10, 10000)
  const sigma   = Math.max(sp.has('sigma') ? parseFloat(sp.get('sigma')!)      : DEFAULTS.sigma,   1e-6)

  // Potential params (p_* prefix)
  const potentialParams: Record<string, number> = {}
  for (const [k, v] of sp.entries()) {
    if (k.startsWith('p_')) {
      const val = parseFloat(v)
      if (!isNaN(val)) potentialParams[k.slice(2)] = val
    }
  }

  // expr — null when key absent
  const exprRaw = sp.get('expr')
  const expr = exprRaw !== null ? exprRaw : null

  return {
    mode:            (sp.get('mode') as AppMode | null) ?? DEFAULTS.mode,
    potential:       sp.get('potential') ?? DEFAULTS.potential,
    expr,
    xmin,
    xmax,
    n,
    nStates,
    potentialParams,
    x0:              sp.has('x0')         ? parseFloat(sp.get('x0')!)         : DEFAULTS.x0,
    sigma,
    k0:              sp.has('k0')         ? parseFloat(sp.get('k0')!)         : DEFAULTS.k0,
    dt,
    nSteps,
    saveEvery:       sp.has('save_every') ? parseInt(sp.get('save_every')!, 10) : DEFAULTS.saveEvery,
  }
}

export function readUrlParams(): UrlParams {
  return parseUrlParams(new URLSearchParams(window.location.search))
}

export function pushUrlParams(params: UrlParams): void {
  const qs = serializeUrlParams(params)
  window.history.pushState(null, '', `?${qs}`)
}

export function hasNonDefaultUrl(params: UrlParams): boolean {
  return (
    params.mode     !== DEFAULTS.mode     ||
    params.potential !== DEFAULTS.potential ||
    params.expr     !== DEFAULTS.expr     ||
    params.xmin     !== DEFAULTS.xmin     ||
    params.xmax     !== DEFAULTS.xmax     ||
    params.n        !== DEFAULTS.n        ||
    params.nStates  !== DEFAULTS.nStates  ||
    Object.keys(params.potentialParams).length > 0 ||
    params.x0       !== DEFAULTS.x0       ||
    params.sigma    !== DEFAULTS.sigma    ||
    params.k0       !== DEFAULTS.k0       ||
    params.dt       !== DEFAULTS.dt       ||
    params.nSteps   !== DEFAULTS.nSteps
  )
}
