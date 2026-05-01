import type { EigensolveRequest, EigensolveResponse, EvolveRequest, EvolveResponse,
              HydrogenicRequest, HydrogenicResponse,
              SpinMeasureRequest, SpinMeasureResponse, SpinPauliResponse } from '../types/api'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export class ApiError extends Error {
  constructor(public status: number, public detail: string) {
    super(detail)
    this.name = 'ApiError'
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }))
    throw new ApiError(res.status, body.detail ?? 'Request failed')
  }
  return res.json() as Promise<T>
}

export async function fetchPresets(): Promise<string[]> {
  const res = await fetch(`${BASE_URL}/schrodinger1d/presets`)
  const data = await handleResponse<{ presets: string[] }>(res)
  return data.presets
}

export async function solveEigenstates(req: EigensolveRequest): Promise<EigensolveResponse> {
  const res = await fetch(`${BASE_URL}/schrodinger1d/solve/eigenstates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })
  return handleResponse<EigensolveResponse>(res)
}

export async function solveEvolve(req: EvolveRequest): Promise<EvolveResponse> {
  const res = await fetch(`${BASE_URL}/schrodinger1d/solve/evolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })
  return handleResponse<EvolveResponse>(res)
}

export async function solveHydrogenic(req: HydrogenicRequest): Promise<HydrogenicResponse> {
  const res = await fetch(`${BASE_URL}/hydrogenic/solve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })
  return handleResponse<HydrogenicResponse>(res)
}

export async function spinMeasure(req: SpinMeasureRequest): Promise<SpinMeasureResponse> {
  const res = await fetch(`${BASE_URL}/spin/measure`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })
  return handleResponse<SpinMeasureResponse>(res)
}

export async function spinPauli(): Promise<SpinPauliResponse> {
  const res = await fetch(`${BASE_URL}/spin/pauli`)
  return handleResponse<SpinPauliResponse>(res)
}
