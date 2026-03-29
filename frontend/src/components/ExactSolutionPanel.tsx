import type { EigensolveResponse } from '../types/api'

interface Props {
  preset: string
  eigenResult: EigensolveResponse
}

export function ExactSolutionPanel({ preset, eigenResult }: Props) {
  const { energies, grid_x } = eigenResult
  const n = energies.length

  let exactEnergies: number[]
  let formula: string
  let formulaNote: string
  let nLabel: (i: number) => number  // state index shown in table

  if (preset === 'infinite_square_well') {
    const L = grid_x[grid_x.length - 1] - grid_x[0]
    exactEnergies = Array.from({ length: n }, (_, i) =>
      ((i + 1) ** 2 * Math.PI ** 2) / (2 * L * L)
    )
    formula = 'Eₙ = n²π² / 2L²'
    formulaNote = `L = ${L.toFixed(4)} a.u.,  n = 1, 2, 3, …`
    nLabel = i => i + 1
  } else if (preset === 'harmonic_oscillator') {
    exactEnergies = Array.from({ length: n }, (_, i) => i + 0.5)
    formula = 'Eₙ = n + ½'
    formulaNote = 'ω = 1,  n = 0, 1, 2, …'
    nLabel = i => i
  } else {
    return null
  }

  return (
    <div className="exact-solution">
      <div className="exact-solution-header">
        <span className="exact-formula">{formula}</span>
        <span className="exact-formula-note">({formulaNote})</span>
      </div>
      <table className="exact-table">
        <thead>
          <tr>
            <th>n</th>
            <th>E exact (a.u.)</th>
            <th>E numerical (a.u.)</th>
            <th>|relative error|</th>
          </tr>
        </thead>
        <tbody>
          {energies.map((Enum, i) => {
            const Eexact = exactEnergies[i]
            const relErr = Math.abs(Enum - Eexact) / Math.abs(Eexact)
            return (
              <tr key={i}>
                <td>{nLabel(i)}</td>
                <td>{Eexact.toFixed(6)}</td>
                <td>{Enum.toFixed(6)}</td>
                <td>{relErr < 1e-14 ? '< 1×10⁻¹⁴' : relErr.toExponential(2)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
