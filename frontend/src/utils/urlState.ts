import type { AppMode } from '../types/api'

export interface UrlParams {
  potential: string
  xmin: number
  xmax: number
  n: number
  mode: AppMode
}

const DEFAULTS: UrlParams = {
  potential: 'infinite_square_well',
  xmin: -10,
  xmax: 10,
  n: 500,
  mode: 'stationary',
}

export function serializeUrlParams(params: UrlParams): string {
  return new URLSearchParams({
    potential: params.potential,
    xmin: String(params.xmin),
    xmax: String(params.xmax),
    n: String(params.n),
    mode: params.mode,
  }).toString()
}

export function parseUrlParams(sp: URLSearchParams): UrlParams {
  return {
    potential: sp.get('potential') ?? DEFAULTS.potential,
    xmin: sp.has('xmin') ? parseFloat(sp.get('xmin')!) : DEFAULTS.xmin,
    xmax: sp.has('xmax') ? parseFloat(sp.get('xmax')!) : DEFAULTS.xmax,
    n: sp.has('n') ? parseInt(sp.get('n')!, 10) : DEFAULTS.n,
    mode: (sp.get('mode') as AppMode | null) ?? DEFAULTS.mode,
  }
}

export function readUrlParams(): UrlParams {
  return parseUrlParams(new URLSearchParams(window.location.search))
}

export function pushUrlParams(params: UrlParams): void {
  const qs = serializeUrlParams(params)
  window.history.pushState(null, '', `?${qs}`)
}
