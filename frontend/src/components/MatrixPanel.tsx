import { useState, useEffect, useRef, useMemo } from 'react'
import type { EigensolveResponse } from '../types/api'
import { buildH, buildX, buildP, heisenbergRe } from '../utils/matrixElements'
import { MatrixHeatmap } from './MatrixHeatmap'

type Operator = 'H' | 'X' | 'P'
type View = 'static' | 'animated'

interface MatrixPanelProps {
  eigenResult: EigensolveResponse
}

const btnBase: React.CSSProperties = {
  padding: '3px 12px',
  border: '1px solid #aaa',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.85rem',
}

const opBtnBase: React.CSSProperties = {
  ...btnBase,
  fontFamily: 'Georgia, serif',
  fontSize: '1rem',
  fontWeight: 700,
}

export function MatrixPanel({ eigenResult }: MatrixPanelProps) {
  const { energies, wavefunctions, grid_x, dx } = eigenResult
  const N = energies.length

  const [operator, setOperator] = useState<Operator>('X')
  const [view, setView] = useState<View>('static')
  const [playing, setPlaying] = useState(false)
  const [t, setT] = useState(0)
  const [speed, setSpeed] = useState(1)

  const rafRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number | null>(null)

  // requestAnimationFrame animation loop
  useEffect(() => {
    if (!playing || view !== 'animated') return
    const step = (now: number) => {
      if (lastTimeRef.current !== null) {
        const wallDt = (now - lastTimeRef.current) / 1000
        setT(prev => prev + wallDt * speed)
      }
      lastTimeRef.current = now
      rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      lastTimeRef.current = null
    }
  }, [playing, view, speed])

  // Reset time when operator or view changes
  useEffect(() => {
    setT(0)
    setPlaying(false)
  }, [operator, view])

  // Memoized matrix computations — grid can be large
  const H_matrix = useMemo(
    () => buildH(energies).map((e, m) => energies.map((_, n) => m === n ? e : 0)),
    [energies],
  )
  const X_matrix = useMemo(
    () => buildX(wavefunctions, grid_x, dx),
    [wavefunctions, grid_x, dx],
  )
  const P_matrix = useMemo(
    () => buildP(wavefunctions, dx),
    [wavefunctions, dx],
  )

  if (N < 2) {
    return (
      <p style={{ fontSize: '0.85rem', color: '#888' }}>
        Compute at least 2 eigenstates to see off-diagonal matrix structure.
      </p>
    )
  }

  const labels = energies.map((_, i) => `ψ${i + 1}`)

  const staticMatrix = operator === 'H' ? H_matrix : operator === 'X' ? X_matrix : P_matrix
  const displayMatrix = view === 'animated'
    ? heisenbergRe(staticMatrix, energies, t)
    : staticMatrix

  const heatmapTitle: Record<Operator, string> = {
    H: '⟨ψₘ|Ĥ|ψₙ⟩ — diagonal in its own eigenbasis',
    X: view === 'animated'
      ? `Re⟨ψₘ|x(t)|ψₙ⟩   t = ${t.toFixed(2)} a.u.`
      : '⟨ψₘ|x|ψₙ⟩ — real, symmetric',
    P: view === 'animated'
      ? `Re⟨ψₘ|p(t)|ψₙ⟩   t = ${t.toFixed(2)} a.u.`
      : 'Im⟨ψₘ|p|ψₙ⟩ — purely imaginary, antisymmetric',
  }

  const bohrFreqs = energies.map((Em, _m) => energies.map(En => Em - En))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {/* Operator + view selectors */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Operator:</span>
        {(['H', 'X', 'P'] as Operator[]).map(op => (
          <button
            key={op}
            onClick={() => setOperator(op)}
            style={{
              ...opBtnBase,
              background: operator === op ? '#1a6abf' : '#f0f0f0',
              color: operator === op ? '#fff' : '#333',
              borderColor: operator === op ? '#1a6abf' : '#aaa',
            }}
          >{op}</button>
        ))}

        <span style={{ marginLeft: '10px', fontSize: '0.85rem', fontWeight: 600 }}>View:</span>
        {(['static', 'animated'] as View[]).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            style={{
              ...btnBase,
              background: view === v ? '#1a6abf' : '#f0f0f0',
              color: view === v ? '#fff' : '#333',
              borderColor: view === v ? '#1a6abf' : '#aaa',
            }}
          >{v === 'static' ? 'Structure (t = 0)' : 'Time evolution'}</button>
        ))}
      </div>

      {/* Animation controls */}
      {view === 'animated' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
          <button
            onClick={() => setPlaying(p => !p)}
            style={{ ...btnBase, minWidth: '4.5em' }}
          >{playing ? 'Pause' : 'Play'}</button>
          <button
            onClick={() => { setT(0); setPlaying(false) }}
            style={btnBase}
          >Reset</button>
          <span>t = <strong>{t.toFixed(2)}</strong> a.u.</span>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            Speed:
            <select value={speed} onChange={e => setSpeed(Number(e.target.value))}>
              <option value={0.25}>0.25×</option>
              <option value={0.5}>0.5×</option>
              <option value={1}>1×</option>
              <option value={2}>2×</option>
              <option value={5}>5×</option>
            </select>
          </label>
          {operator === 'H' && (
            <span style={{ color: '#888', fontStyle: 'italic' }}>
              Ĥ is time-independent — diagonal elements carry no phase
            </span>
          )}
        </div>
      )}

      {/* Main heatmap */}
      <MatrixHeatmap
        data={displayMatrix}
        rowLabels={labels}
        colLabels={labels}
        title={heatmapTitle[operator]}
      />

      {/* Physics note for static view */}
      {view === 'static' && (
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#555' }}>
          {operator === 'H' && 'H is diagonal in its own eigenbasis by definition. Off-diagonal elements are exactly zero.'}
          {operator === 'X' && 'Zero entries reflect parity selection rules: ⟨ψₘ|x|ψₙ⟩ = 0 when ψₘ and ψₙ have the same parity.'}
          {operator === 'P' && 'P is purely imaginary; this table shows Im⟨ψₘ|p|ψₙ⟩. Antisymmetry P_mn = −P_nm is enforced by the operator being Hermitian.'}
        </p>
      )}

      {/* Bohr frequency table */}
      <details>
        <summary style={{ fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }}>
          Bohr frequencies ω_mn = E_m − E_n (a.u.)
        </summary>
        <div style={{ marginTop: '10px' }}>
          <MatrixHeatmap
            data={bohrFreqs}
            rowLabels={labels}
            colLabels={labels}
            title="ωₘₙ — off-diagonal elements oscillate at these frequencies"
          />
          <p style={{ margin: '6px 0 0', fontSize: '0.8rem', color: '#555' }}>
            Period T_mn = 2π / |ω_mn| a.u.
            Diagonal is always zero — diagonal matrix elements are time-independent.
          </p>
        </div>
      </details>
    </div>
  )
}
