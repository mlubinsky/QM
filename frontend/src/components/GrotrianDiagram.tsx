import { useMemo, useState, useCallback, useEffect } from 'react'
import { SelectionRulesPanel } from './SelectionRulesPanel'

interface GrotrianDiagramProps {
  Z: number
  activeN: number
  activeL: number
  onSelectLevel?: (n: number, l: number) => void
}

interface TooltipState {
  lines: string[]
  x: number
  y: number
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

function isReachable(nv: number, lv: number, fromN: number, fromL: number): boolean {
  if (nv === fromN && lv === fromL) return false
  return Math.abs(lv - fromL) === 1 && nv < fromN
}

const SERIES_NAME: Record<number, string> = { 1: 'Lyman', 2: 'Balmer', 3: 'Paschen', 4: 'Brackett', 5: 'Pfund' }

export function GrotrianDiagram({ Z, activeN, activeL, onSelectLevel }: GrotrianDiagramProps) {
  const SVG_W = 500
  const SVG_H = 400
  const PAD_L = 52
  const PAD_R = 20
  const PAD_T = 24
  const PAD_B = 36

  const plotW = SVG_W - PAD_L - PAD_R
  const plotH = SVG_H - PAD_T - PAD_B

  const [focusN, setFocusN] = useState<number | null>(null)
  const [focusL, setFocusL] = useState<number | null>(null)
  const [showHelp, setShowHelp] = useState(false)
  const [showForbidden, setShowForbidden] = useState(false)
  const [showWavelengths, setShowWavelengths] = useState(false)
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  const closeHelp = useCallback(() => setShowHelp(false), [])

  useEffect(() => {
    setFocusN(activeN)
    setFocusL(activeL)
  }, [activeN, activeL])

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

  const allowedTransitions = useMemo(() => {
    const result: { nUp: number; nLo: number; lUp: number; lLo: number; nm: number }[] = []
    for (let nUp = 2; nUp <= N_MAX; nUp++) {
      for (let nLo = 1; nLo < nUp; nLo++) {
        for (let lUp = 0; lUp < nUp; lUp++) {
          for (let lLo = 0; lLo < nLo; lLo++) {
            if (Math.abs(lUp - lLo) !== 1) continue
            result.push({ nUp, nLo, lUp, lLo, nm: emissionWavelength(Z, nUp, nLo) })
          }
        }
      }
    }
    return result
  }, [Z])

  const forbiddenTransitions = useMemo(() => {
    const result: { nUp: number; nLo: number; lUp: number; lLo: number; reason: string }[] = []
    for (let nUp = 2; nUp <= N_MAX; nUp++) {
      for (let nLo = 1; nLo < nUp; nLo++) {
        for (let lUp = 0; lUp < nUp; lUp++) {
          for (let lLo = 0; lLo < nLo; lLo++) {
            const absDL = Math.abs(lUp - lLo)
            if (absDL === 1) continue
            const reason = absDL === 0
              ? 'Δℓ = 0 (parity unchanged — E1 dipole matrix element = 0)'
              : `|Δℓ| = ${absDL} (photon carries 1ℏ, so Δℓ must be ±1)`
            result.push({ nUp, nLo, lUp, lLo, reason })
          }
        }
      }
    }
    return result
  }, [])

  function handleLevelClick(nv: number, lv: number) {
    setFocusN(nv)
    setFocusL(lv)
    onSelectLevel?.(nv, lv)
  }

  function levelOpacity(nv: number, lv: number): number {
    if (!hasFocus) return 1
    if (nv === focusN && lv === focusL) return 1
    return isReachable(nv, lv, focusN!, focusL!) ? 1 : 0.18
  }

  function allowedArrowOpacity(nUp: number, lUp: number, nLo: number, lLo: number): number {
    if (!hasFocus) return 0.65
    const fromFocus = nUp === focusN && lUp === focusL && isReachable(nLo, lLo, focusN!, focusL!)
    return fromFocus ? 0.9 : 0.1
  }

  function forbiddenArrowOpacity(nUp: number, lUp: number): number {
    if (!hasFocus) return 0.35
    return nUp === focusN && lUp === focusL ? 0.55 : 0.08
  }

  const reachableCount = hasFocus
    ? Array.from({ length: N_MAX }, (_, ni) => ni + 1)
        .flatMap(nv => Array.from({ length: nv }, (_, lv) => ({ nv, lv })))
        .filter(({ nv, lv }) => isReachable(nv, lv, focusN!, focusL!))
        .length
    : 0

  function showTooltip(lines: string[], e: React.MouseEvent) {
    setTooltip({ lines, x: e.clientX, y: e.clientY })
  }
  function moveTooltip(e: React.MouseEvent) {
    setTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)
  }
  function hideTooltip() { setTooltip(null) }

  return (
    <div style={{ marginTop: 24 }}>

      {/* Floating tooltip — rendered outside SVG so it can overflow the diagram */}
      {tooltip && (
        <div style={{
          position: 'fixed',
          left: tooltip.x + 14,
          top: tooltip.y - 12,
          background: '#1e1e2e',
          border: '1px solid #555',
          borderRadius: 5,
          padding: '5px 10px',
          fontSize: '0.78rem',
          color: '#ddd',
          pointerEvents: 'none',
          zIndex: 9999,
          lineHeight: 1.7,
          boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
        }}>
          {tooltip.lines.map((line, i) => (
            <div key={i} style={i === 0 ? { fontWeight: 600 } : {}}>{line}</div>
          ))}
        </div>
      )}

      {/* Caption row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, paddingLeft: PAD_L }}>
        <span className="grotrian-caption">
          Grotrian diagram — click a level to highlight allowed decays&nbsp;·&nbsp;colored arrow = allowed&nbsp;·&nbsp;gray dashed = forbidden&nbsp;·&nbsp;hover any arrow for details
        </span>
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

      {/* Toggle controls — placed under caption so they clearly belong to this diagram */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 4, paddingLeft: PAD_L, fontSize: '0.8rem', color: '#bbb' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', userSelect: 'none' }}>
          <input
            type="checkbox"
            checked={showForbidden}
            onChange={e => setShowForbidden(e.target.checked)}
          />
          Show forbidden transitions
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', userSelect: 'none' }}>
          <input
            type="checkbox"
            checked={showWavelengths}
            onChange={e => setShowWavelengths(e.target.checked)}
          />
          λ labels
        </label>
      </div>

      {/* Focus status — shown only after a level is clicked */}
      {hasFocus && (
        <div style={{ paddingLeft: PAD_L, marginBottom: 4, fontSize: '0.78rem', fontStyle: 'italic' }}>
          {reachableCount === 0
            ? <span style={{ color: '#ff9f40' }}>no single-photon decay allowed from this level — metastable</span>
            : <span className="grotrian-hint">green = reachable by single-photon emission (Δℓ = ±1)</span>
          }
        </div>
      )}

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
          {allowedTransitions.map(({ nm }, i) => {
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

        {/* Forbidden transition lines — behind allowed arrows, no arrowhead */}
        {showForbidden && forbiddenTransitions.map(({ nUp, nLo, lUp, lLo, reason }, i) => {
          const x1 = colX(lUp)
          const x2 = colX(lLo)
          const y1 = yFromE(energy(nUp))
          const y2 = yFromE(energy(nLo))
          const opacity = forbiddenArrowOpacity(nUp, lUp)
          const lines = [
            `${nUp}${L_LABELS[lUp]} → ${nLo}${L_LABELS[lLo]}`,
            `Forbidden: ${reason}`,
          ]
          return (
            <g
              key={`f-${i}`}
              opacity={opacity}
              style={{ transition: 'opacity 0.15s', cursor: 'default' }}
              onMouseEnter={e => showTooltip(lines, e)}
              onMouseMove={moveTooltip}
              onMouseLeave={hideTooltip}
            >
              {/* Wide transparent hit area makes thin lines easy to hover */}
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth={10} />
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#777" strokeWidth={0.8} strokeDasharray="3,4" />
            </g>
          )
        })}

        {/* Allowed transition arrows */}
        {allowedTransitions.map(({ nUp, nLo, lUp, lLo, nm }, i) => {
          const x1 = colX(lUp)
          const x2 = colX(lLo)
          const y1 = yFromE(energy(nUp))
          const y2 = yFromE(energy(nLo))
          const { stroke, dash } = transitionColor(nm)
          const opacity = allowedArrowOpacity(nUp, lUp, nLo, lLo)
          const deltaL = lLo - lUp
          const deltaE_eV = 13.6 * Z * Z * (1 / (nLo * nLo) - 1 / (nUp * nUp))
          const series = SERIES_NAME[nLo] ?? `n=${nLo}`
          const lines = [
            `${nUp}${L_LABELS[lUp]} → ${nLo}${L_LABELS[lLo]}`,
            `Allowed: Δℓ = ${deltaL > 0 ? '+' : ''}${deltaL}`,
            `λ = ${Math.round(nm)} nm · ΔE = ${deltaE_eV.toFixed(2)} eV`,
            `${series} series`,
          ]
          return (
            <g
              key={i}
              opacity={opacity}
              style={{ transition: 'opacity 0.15s', cursor: 'default' }}
              onMouseEnter={e => showTooltip(lines, e)}
              onMouseMove={moveTooltip}
              onMouseLeave={hideTooltip}
            >
              {/* Wide transparent hit area makes thin lines easy to hover */}
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth={10} />
              <line
                x1={x1} y1={y1}
                x2={x2} y2={y2}
                stroke={stroke}
                strokeWidth={1.2}
                strokeDasharray={dash ? '4,3' : undefined}
                markerEnd={`url(#arrow-${i})`}
              />
              {showWavelengths && (
                <text
                  x={(x1 + x2) / 2 + 4}
                  y={(y1 + y2) / 2}
                  fontSize={8}
                  fill={stroke}
                >
                  {Math.round(nm)} nm
                </text>
              )}
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
            const isMetastable = nv === 2 && lv === 0

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
                {/* Metastable marker — hover for explanation */}
                {isMetastable && (
                  <circle
                    cx={x + colW / 2 + 20} cy={y} r={3.5}
                    fill="#ff9f40"
                    style={{ cursor: 'default' }}
                    onMouseEnter={e => { e.stopPropagation(); showTooltip([
                      '2s — metastable state',
                      'E1 decay to 1s is forbidden (Δℓ = 0)',
                      'Lifetime ≈ 0.12 s vs ≈ 1.6 ns for 2p',
                      'Ratio ~10⁸ · decays by two-photon emission',
                    ], e) }}
                    onMouseMove={e => { e.stopPropagation(); moveTooltip(e) }}
                    onMouseLeave={e => { e.stopPropagation(); hideTooltip() }}
                  />
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
      <div className="grotrian-legend" style={{ paddingLeft: PAD_L, marginTop: 6 }}>

        {/* Levels row */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginBottom: 5 }}>
          <span style={{ color: '#666', fontStyle: 'italic' }}>Levels:</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="16" height="8"><line x1="0" y1="4" x2="16" y2="4" stroke="#4a9eff" strokeWidth="2.5" /></svg>
            current orbital
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="16" height="8"><line x1="0" y1="4" x2="16" y2="4" stroke="#7ddf7d" strokeWidth="2.2" /></svg>
            reachable (Δℓ = ±1)
          </span>
          <span className="grotrian-legend-dim" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="16" height="8"><line x1="0" y1="4" x2="16" y2="4" stroke="#888" strokeWidth="1.5" /></svg>
            dimmed
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="10" height="8"><circle cx="5" cy="4" r="3.5" fill="#ff9f40" /></svg>
            metastable (2s)
          </span>
        </div>

        {/* Arrows section */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <span style={{ color: '#666', fontStyle: 'italic', flexShrink: 0, paddingTop: 1 }}>Arrows:</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <svg width="22" height="8" style={{ flexShrink: 0 }}>
                <line x1="0" y1="4" x2="17" y2="4" stroke="#ff0000" strokeWidth="1.5" />
                <path d="M14,1 L14,7 L22,4 z" fill="#ff0000" />
              </svg>
              <span>
                solid colored = E1 allowed, visible light (380–700 nm)
                &nbsp;·&nbsp;e.g.&nbsp;H-α 656 nm (Balmer 3→2)
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <svg width="22" height="8" style={{ flexShrink: 0 }}>
                <line x1="0" y1="4" x2="22" y2="4" stroke="#9400d3" strokeWidth="1.2" strokeDasharray="4,3" />
              </svg>
              <span>
                <span style={{ color: '#9400d3' }}>colored dashed = UV</span>
                &nbsp;· Lyman series — all transitions to n=1 land in UV
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <svg width="22" height="8" style={{ flexShrink: 0 }}>
                <line x1="0" y1="4" x2="22" y2="4" stroke="#8b0000" strokeWidth="1.2" strokeDasharray="4,3" />
              </svg>
              <span>
                <span style={{ color: '#8b0000' }}>colored dashed = IR</span>
                &nbsp;· Paschen/Brackett series — transitions between higher n levels
              </span>
            </div>

            {showForbidden && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }} className="grotrian-legend-dim">
                <svg width="22" height="8" style={{ flexShrink: 0 }}>
                  <line x1="0" y1="4" x2="22" y2="4" stroke="#777" strokeWidth="0.8" strokeDasharray="3,4" />
                </svg>
                <span>gray dashed = E1 forbidden (Δℓ ≠ ±1)</span>
              </div>
            )}

          </div>
        </div>

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
