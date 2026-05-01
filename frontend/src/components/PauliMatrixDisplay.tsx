import { useEffect, useState } from 'react'
import { spinPauli } from '../api/client'
import type { SpinPauliResponse, PauliMatrix } from '../types/api'

function MatrixGrid({ m, name }: { m: PauliMatrix; name: string }) {
  function cell(re: number, im: number) {
    if (im === 0)  return re === 0 ? '0' : String(re)
    if (re === 0)  return im === 1 ? 'i' : im === -1 ? '−i' : `${im}i`
    return `${re}+${im}i`
  }
  return (
    <div className="pauli-matrix">
      <div className="pauli-name">{name}</div>
      <table className="pauli-table">
        <tbody>
          {m.re.map((row, r) => (
            <tr key={r}>
              {row.map((_, c) => (
                <td key={c}>{cell(m.re[r][c], m.im[r][c])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="pauli-eigen">eigenvalues: ±1</div>
    </div>
  )
}

export function PauliMatrixDisplay() {
  const [data, setData] = useState<SpinPauliResponse | null>(null)

  useEffect(() => {
    spinPauli().then(setData).catch(() => {})
  }, [])

  return (
    <details className="spin-fieldset pauli-details">
      <summary>Pauli matrices (reference)</summary>
      {data ? (
        <div className="pauli-grid">
          <MatrixGrid m={data.sigma_x} name="σₓ" />
          <MatrixGrid m={data.sigma_y} name="σᵧ" />
          <MatrixGrid m={data.sigma_z} name="σ_z" />
        </div>
      ) : (
        <div className="pauli-loading">Loading…</div>
      )}
    </details>
  )
}
