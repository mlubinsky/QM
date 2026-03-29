import type { EigensolveResponse } from '../types/api'

export function downloadFile(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** Build a CSV for one eigenstate. Columns: x, psi_real, psi_imag, potential */
export function buildCsv(result: EigensolveResponse, stateIndex: number): string {
  const header = 'x,psi_real,psi_imag,potential'
  const rows = result.grid_x.map((x, i) => {
    const psiReal = result.wavefunctions[stateIndex][i]
    const psiImag = 0   // eigenfunctions are real in this solver
    const v = result.potential[i]
    return `${x},${psiReal},${psiImag},${v}`
  })
  return [header, ...rows].join('\n')
}
