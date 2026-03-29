import { describe, it, expect } from 'vitest'
import { buildCsv } from '../utils/export'
import { mockEigenResult } from '../mock/mockData'

describe('buildCsv', () => {
  it('first line contains correct column headers', () => {
    const csv = buildCsv(mockEigenResult, 0)
    const header = csv.split('\n')[0]
    expect(header).toBe('x,psi_real,psi_imag,potential')
  })

  it('has one data row per grid point', () => {
    const csv = buildCsv(mockEigenResult, 0)
    const lines = csv.split('\n').filter(Boolean)
    // header + n data rows
    expect(lines).toHaveLength(mockEigenResult.grid_x.length + 1)
  })

  it('first data row x matches grid_x[0]', () => {
    const csv = buildCsv(mockEigenResult, 0)
    const firstData = csv.split('\n')[1].split(',')
    expect(parseFloat(firstData[0])).toBeCloseTo(mockEigenResult.grid_x[0])
  })
})
