import { useMemo, useState, useCallback, useEffect } from 'react'
import { SelectionRulesPanel } from './SelectionRulesPanel'

interface GrotrianDiagramProps {
  Z: number
  activeN: number
  activeL: number
  onSelectLevel?: (n: number, l: number) => void
}

const N_MAX = 5
const L_LABELS = ['s', 'p', 'd', 'f', 'g']

function wavelengthToColor(nm: number): string {
  if (nm < 380) return '#9400d3'
  if (nm < 450) return '#8b00ff'
  if (nm < 495) return '#0000ff'
  if (nm < 530) return '#00cc00'
  if (nm < 590) return '#ffff00'
  if (nm < 620) return '#ff7700'
  if (nm < 700) return '#ff0000'
  return '#8b0000'
}

function transitionColor(nm: number): { stroke: string; dash: boolean } {
  if (nm < 380) return { stroke: '#9400d3', dash: true }
  if (nm > 700) return { stroke: '#8b0000', dash: true }
  return { stroke: wavelengthToColor(nm), dash: false }
}

function emissionWavelength(Z: number, nUpper: number, nLower: number): number {
  const deltaE = (Z * Z / 2) * (1 / (nLower * nLower) - 1 / (nUpper * nUpper))
  const hartreeToJoule = 4.3597447222071e-18
  const h = 6.62607015e-34
  const c = 2.99792458e8
  return (h * c) / (deltaE * hartreeToJoule) * 1e9
}

// A level (nv, lv) is reachable from (fromN, fromL) if:
//   - it is a different level
//   - |Δl| = 1  (E1 selection rule)
//   - it has lower energy (emission) — we show downward transitions only
function isReachable(nv: number, lv: number, fromN: number, fromL: number): boolean {
  if (nv === fromN && lv === fromL) return false
  return Math.abs(lv - fromL) === 1 && nv < fromN
}

export function GrotrianDiagram({ Z, activeN, activeL, onSelectLevel }: GrotrianDiagramProps) {
  const SVG_W = 500
  const SVG_H = 400
  const PAD_L = 52
  const PAD_R = 20
  const PAD_T = 24
  const PAD_B = 36

  const plotW = SVG_W - PAD_L - PAD_R
  const plotH = SVG_H - PAD_T - PAD_B

  // Which level is "focused" for the highlight interaction.
  // Starts as the active (solved) level; clicking another level updates it.
  const [focusN, setFocusN] = useState<number | null>(null)
  const [focusL, setFocusL] = useState<number | null>(null)

  // Keep focus in sync when the solved level changes externally
  useEffect(() => {
    setFocusN(activeN)
    setFocusL(activeL)
  }, [activeN, activeL])

  const [showHelp, setShowHelp] = useState(false)
  const closeHelp = useCallback(() => setShowHelp(false), [])
  useEffect(() => {
    if (!showHelp) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeHelp() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showHelp, closeHelp])

  const hasFocus = focusN !== null && focusL !== null

  const energy = (nv: number) => -(Z * Z) / (2 * nv * nv)
  const eMin = energy(1)
  const eMax = 0
  const yFromE = (e: number) => PAD_T + plotH * (1 - (e - eMin) / (eMax - eMin))
  const colX = (lv: number) => PAD_L + ((lv + 0.5) / N_MAX) * plotW
  const colW = plotW / N_MAX * 0.7

  const transitions = useMemo(() => {
    const result: { nUp: number; nLo: number; lUp: number; lLo: number; nm: number }[] = []
    for (let nUp = 2; nUp <= N_MAX; nUp++) {
      for (let nLo = 1; nLo < nUp; nLo++) {
        if (nLo > 2) continue   // Lyman + Balmer only
        for (let lLo = 0; lLo < nLo; lLo++) {
          const lUp = lLo + 1
          if (lUp >= nUp) continue
          const nm = emissionWavelength(Z, nUp, nLo)
          result.push({ nUp, nLo, lUp, lLo, nm })
        }
      }
    }
    return result
  }, [Z])

  function handleLevelClick(nv: number, lv: number) {
    setFocusN(nv)
    setFocusL(lv)
    onSelectLevel?.(nv, lv)
  }

  // Opacity for a given level relative to the focused level
  function levelOpacity(nv: number, lv: number): number {
    if (!hasFocus) return 1
    if (nv === focusN && lv === focusL) return 1
    return isReachable(nv, lv, focusN!, focusL!) ? 1 : 0.18
  }

  // Opacity for a transition arrow
  function arrowOpacity(nUp: number, lUp: number, nLo: number, lLo: number): number {
    if (!hasFocus) return 0.65
    const fromFocus = nUp === focusN && lUp === focusL && isReachable(nLo, lLo, focusN!, focusL!)
    return fromFocus ? 0.9 : 0.1
  }

  const reachableCount = hasFocus
    ? Array.from({ length: N_MAX }, (_, ni) => ni + 1)
        .flatMap(nv => Array.from({ length: nv }, (_, lv) => ({ nv, lv })))
        .filter(({ nv, lv }) => isReachable(nv, lv, focusN!, focusL!))
        .length
    : 0

  return (
    <div style={{ marginTop: 24 }}>
      {/* Caption row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, paddingLeft: PAD_L }}>
        <span className="grotrian-caption">
          Grotrian diagram — click a level to solve and highlight reachable states&nbsp;·&nbsp;solid = visible light&nbsp;·&nbsp;dashed = UV or IR (outside visible)
        </span>
        {hasFocus && reachableCount === 0 && (
          <span style={{ fontSize: '0.78rem', color: '#ff9f40', fontStyle: 'italic' }}>
            no single-photon decay allowed — metastable
          </span>
        )}
        {hasFocus && reachableCount > 0 && (
          <span className="grotrian-hint">
            green = reachable by single-photon emission (Δℓ = ±1)
          </span>
        )}
        <button
          type="button"
          aria-label="Show selection rules reference"
          onClick={() => setShowHelp(true)}
          style={{
            marginLeft: 'auto',
            background: 'none',
            border: '1px solid #555',
            borderRadius: '50%',
            width: 20, height: 20,
            fontSize: '0.75rem',
            cursor: 'pointer',
            color: '#aaa',
            lineHeight: '18px',
            padding: 0,
            flexShrink: 0,
          }}
        >?</button>
      </div>

      {/* SVG diagram */}
      <svg
        width={SVG_W}
        height={SVG_H}
        style={{ display: 'block', maxWidth: '100%' }}
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      >
        {/* Y-axis label */}
        <text
          x={12}
          y={PAD_T + plotH / 2}
          transform={`rotate(-90, 12, ${PAD_T + plotH / 2})`}
          textAnchor="middle"
          fontSize={11}
          fill="#aaa"
        >
          Energy (Eh)
        </text>

        {/* Y-axis ticks */}
        {Array.from({ length: N_MAX }, (_, i) => i + 1).map(nv => {
          const y = yFromE(energy(nv))
          return (
            <g key={nv}>
              <line x1={PAD_L - 5} y1={y} x2={PAD_L} y2={y} stroke="#555" strokeWidth={0.8} />
              <text x={PAD_L - 7} y={y + 4} textAnchor="end" fontSize={9} fill="#aaa">
                {energy(nv).toFixed(2)}
              </text>
            </g>
          )
        })}

        {/* Y-axis line */}
        <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={PAD_T + plotH} stroke="#555" strokeWidth={1} />

        {/* X-axis column headers */}
        {Array.from({ length: N_MAX }, (_, lv) => (
          <text key={lv} x={colX(lv)} y={PAD_T + plotH + 20} textAnchor="middle" fontSize={11} fill="#aaa">
            {L_LABELS[lv]}
          </text>
        ))}
        <text x={PAD_L + plotW / 2} y={SVG_H - 2} textAnchor="middle" fontSize={10} fill="#666">
          Angular momentum ℓ
        </text>

        {/* Arrow marker defs */}
        <defs>
          {transitions.map(({ nm }, i) => {
            const { stroke } = transitionColor(nm)
            return (
              <marker
                key={i}
                id={`arrow-${i}`}
                markerWidth={6} markerHeight={6}
                refX={3} refY={3}
                orient="auto"
              >
                <path d="M0,0 L0,6 L6,3 z" fill={stroke} />
              </marker>
            )
          })}
        </defs>

        {/* Transition arrows */}
        {transitions.map(({ nUp, nLo, lUp, lLo, nm }, i) => {
          const x1 = colX(lUp)
          const x2 = colX(lLo)
          const y1 = yFromE(energy(nUp))
          const y2 = yFromE(energy(nLo))
          const { stroke, dash } = transitionColor(nm)
          const opacity = arrowOpacity(nUp, lUp, nLo, lLo)
          return (
            <g key={i} opacity={opacity} style={{ transition: 'opacity 0.15s' }}>
              <line
                x1={x1} y1={y1}
                x2={x2} y2={y2}
                stroke={stroke}
                strokeWidth={1.2}
                strokeDasharray={dash ? '4,3' : undefined}
                markerEnd={`url(#arrow-${i})`}
              />
              <text
                x={(x1 + x2) / 2 + 4}
                y={(y1 + y2) / 2}
                fontSize={8}
                fill={stroke}
              >
                {Math.round(nm)} nm
              </text>
            </g>
          )
        })}

        {/* Energy levels */}
        {Array.from({ length: N_MAX }, (_, ni) => ni + 1).flatMap(nv =>
          Array.from({ length: nv }, (_, lv) => {
            const y = yFromE(energy(nv))
            const x = colX(lv)
            const isSolved = nv === activeN && lv === activeL
            const opacity = levelOpacity(nv, lv)
            const reachable = hasFocus && isReachable(nv, lv, focusN!, focusL!)

            let stroke = '#ccc'
            let strokeWidth = 1.5
            if (isSolved) { stroke = '#4a9eff'; strokeWidth = 2.5 }
            if (reachable) { stroke = '#7ddf7d'; strokeWidth = 2.2 }

            return (
              <g
                key={`${nv}-${lv}`}
                style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
                opacity={opacity}
                onClick={() => handleLevelClick(nv, lv)}
              >
                <line
                  x1={x - colW / 2} y1={y}
                  x2={x + colW / 2} y2={y}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                />
                {lv === nv - 1 && (
                  <text x={x + colW / 2 + 4} y={y + 4} fontSize={9} fill="#888">
                    n={nv}
                  </text>
                )}
                <rect
                  x={x - colW / 2 - 4} y={y - 6}
                  width={colW + 8} height={12}
                  fill="transparent"
                />
              </g>
            )
          })
        )}
      </svg>

      {/* Legend */}
      <div className="grotrian-legend" style={{ paddingLeft: PAD_L, marginTop: 4, display: 'flex', gap: 16 }}>
        <span><span style={{ color: '#4a9eff' }}>━</span> current orbital</span>
        <span><span style={{ color: '#7ddf7d' }}>━</span> reachable (Δℓ = ±1)</span>
        <span className="grotrian-legend-dim">━ forbidden / dimmed</span>
      </div>

      {/* Selection rules modal */}
      {showHelp && (
        <div className="physics-modal-backdrop" onClick={closeHelp}>
          <div
            className="physics-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Selection rules reference"
            onClick={e => e.stopPropagation()}
          >
            <div className="physics-modal-header">
              <span className="physics-modal-title">Electric dipole selection rules</span>
              <button
                type="button"
                className="physics-modal-close"
                aria-label="Close"
                onClick={closeHelp}
              >✕</button>
            </div>
            <div className="physics-modal-body">
              <SelectionRulesPanel />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
