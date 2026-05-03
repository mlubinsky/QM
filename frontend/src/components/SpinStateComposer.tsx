import { useState } from 'react'

interface Props {
  theta: number
  phi: number
  onChange: (theta: number, phi: number) => void
}

const PI = Math.PI

const PRESETS: [string, number, number][] = [
  ['|↑⟩',  0,       0      ],
  ['|↓⟩',  PI,      0      ],
  ['|+x⟩', PI / 2,  0      ],
  ['|−x⟩', PI / 2,  PI     ],
  ['|+y⟩', PI / 2,  PI / 2 ],
  ['|−y⟩', PI / 2,  3*PI/2 ],
]

export function SpinStateComposer({ theta, phi, onChange }: Props) {
  const [inputMode, setInputMode] = useState<'angles' | 'components'>('angles')

  // Complex components derived from (theta, phi)
  const alphaRe = Math.cos(theta / 2)
  const betaRe  = Math.sin(theta / 2) * Math.cos(phi)
  const betaIm  = Math.sin(theta / 2) * Math.sin(phi)

  // Expectation values from Bloch vector
  const ex = Math.sin(theta) * Math.cos(phi)
  const ey = Math.sin(theta) * Math.sin(phi)
  const ez = Math.cos(theta)

  // Robertson uncertainty: Δσₓ·Δσᵧ ≥ |⟨σ_z⟩|  (from [σₓ,σᵧ] = 2iσ_z)
  const dSigmaX = Math.sqrt(Math.max(0, 1 - ex * ex))
  const dSigmaY = Math.sqrt(Math.max(0, 1 - ey * ey))
  const uncertLHS = dSigmaX * dSigmaY
  const uncertRHS = Math.abs(ez)

  function formatBeta(): string {
    const re = betaRe, im = betaIm
    const reS = re.toFixed(3), imS = Math.abs(im).toFixed(3)
    if (Math.abs(im) < 5e-4) return reS
    if (Math.abs(re) < 5e-4) return `${im < 0 ? '−' : ''}${imS}i`
    return `${reS} ${im < 0 ? '−' : '+'} ${imS}i`
  }

  function handleComponents(aRe: number, bRe: number, bIm: number) {
    const norm = Math.sqrt(aRe ** 2 + bRe ** 2 + bIm ** 2)
    if (norm < 1e-12) return
    const aNorm = aRe / norm
    const newTheta = 2 * Math.acos(Math.max(-1, Math.min(1, aNorm)))
    const newPhi   = Math.atan2(bIm / norm, bRe / norm)
    onChange(newTheta, newPhi < 0 ? newPhi + 2 * PI : newPhi)
  }

  return (
    <fieldset className="spin-fieldset">
      <legend>State |ψ⟩</legend>

      <div className="spin-mode-toggle">
        <label>
          <input type="radio" name="inputMode" checked={inputMode === 'angles'}
            onChange={() => setInputMode('angles')} /> Angles (θ, φ)
        </label>
        <label>
          <input type="radio" name="inputMode" checked={inputMode === 'components'}
            onChange={() => setInputMode('components')} /> Components (α, β)
        </label>
      </div>

      {inputMode === 'angles' ? (
        <div className="spin-sliders">
          <label>θ (polar) <span className="spin-value">{theta.toFixed(3)} rad ({(theta * 180 / PI).toFixed(1)}°)</span></label>
          <input type="range" min={0} max={PI} step={0.01} value={theta}
            onChange={e => onChange(parseFloat(e.target.value), phi)} />

          <label>φ (azimuthal) <span className="spin-value">{phi.toFixed(3)} rad ({(phi * 180 / PI).toFixed(1)}°)</span></label>
          <input type="range" min={0} max={2 * PI} step={0.01} value={phi}
            onChange={e => onChange(theta, parseFloat(e.target.value))} />
        </div>
      ) : (
        <div className="spin-components">
          <div className="spin-component-row">
            <label>Re(α)</label>
            <input type="number" step={0.01} value={alphaRe.toFixed(4)}
              onChange={e => handleComponents(parseFloat(e.target.value), betaRe, betaIm)} />
          </div>
          <div className="spin-component-row">
            <label>Re(β)</label>
            <input type="number" step={0.01} value={betaRe.toFixed(4)}
              onChange={e => handleComponents(alphaRe, parseFloat(e.target.value), betaIm)} />
          </div>
          <div className="spin-component-row">
            <label>Im(β)</label>
            <input type="number" step={0.01} value={betaIm.toFixed(4)}
              onChange={e => handleComponents(alphaRe, betaRe, parseFloat(e.target.value))} />
          </div>
          <div className="spin-norm-note">Im(α) = 0 (global phase fixed)</div>
        </div>
      )}

      <div className="spin-presets">
        {PRESETS.map(([label, t, p]) => (
          <button key={label} className="spin-preset-btn" onClick={() => onChange(t, p)}>
            {label}
          </button>
        ))}
      </div>

      <div className="spin-expectation">
        <span>⟨σ<sub>x</sub>⟩ = {ex.toFixed(3)}</span>
        <span>⟨σ<sub>y</sub>⟩ = {ey.toFixed(3)}</span>
        <span>⟨σ<sub>z</sub>⟩ = {ez.toFixed(3)}</span>
      </div>

      <div className="spin-ket">
        <span className="spin-ket-label">|ψ⟩ =</span>
        <span>{alphaRe.toFixed(3)}|↑⟩ + ({formatBeta()})|↓⟩</span>
      </div>

      <div className="spin-uncertainty">
        <span className="spin-uncertainty-label">Robertson:</span>
        <span>
          Δσ<sub>x</sub>·Δσ<sub>y</sub> = <strong>{uncertLHS.toFixed(3)}</strong>
          {' ≥ '}
          |⟨σ<sub>z</sub>⟩| = <strong>{uncertRHS.toFixed(3)}</strong>
          {' '}
          <span style={{ color: uncertLHS >= uncertRHS - 1e-9 ? '#4caf50' : '#f44336' }}>
            {uncertLHS >= uncertRHS - 1e-9 ? '✓' : '✗'}
          </span>
        </span>
      </div>
    </fieldset>
  )
}
