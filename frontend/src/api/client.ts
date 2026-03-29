import type { EigensolveRequest, EigensolveResponse, EvolveRequest, EvolveResponse } from '../types/api'

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
  const res = await fetch(`${BASE_URL}/presets`)
  const data = await handleResponse<{ presets: string[] }>(res)
  return data.presets
}

export async function solveEigenstates(req: EigensolveRequest): Promise<EigensolveResponse> {
  const res = await fetch(`${BASE_URL}/solve/eigenstates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })
  return handleResponse<EigensolveResponse>(res)
}

export async function solveEvolve(req: EvolveRequest): Promise<EvolveResponse> {
  const res = await fetch(`${BASE_URL}/solve/evolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })
  return handleResponse<EvolveResponse>(res)
}
