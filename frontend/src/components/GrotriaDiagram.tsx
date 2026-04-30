import { useMemo } from 'react'

interface GrotriaDiagramProps {
  Z: number
  activeN: number
  activeL: number
  onSelectLevel?: (n: number, l: number) => void
}

const N_MAX = 5
const L_LABELS = ['s', 'p', 'd', 'f', 'g']

// Visible-light wavelength → approximate RGB
function wavelengthToColor(nm: number): string {
  if (nm < 380) return '#9400d3'   // UV — purple
  if (nm < 450) return '#8b00ff'
  if (nm < 495) return '#0000ff'
  if (nm < 530) return '#00cc00'
  if (nm < 590) return '#ffff00'
  if (nm < 620) return '#ff7700'
  if (nm < 700) return '#ff0000'
  return '#8b0000'                  // IR — dark red
}

function transitionColor(nm: number): { stroke: string; dash: boolean } {
  if (nm < 380) return { stroke: '#9400d3', dash: true }   // UV
  if (nm > 700) return { stroke: '#8b0000', dash: true }   // IR
  return { stroke: wavelengthToColor(nm), dash: false }
}

// Energy in Hartree, wavelength in nm (emission = upper→lower)
function emissionWavelength(Z: number, nUpper: number, nLower: number): number {
  const deltaE = (Z * Z / 2) * (1 / (nLower * nLower) - 1 / (nUpper * nUpper)) // Hartree
  const hartreeToJoule = 4.3597447222071e-18
  const h = 6.62607015e-34
  const c = 2.99792458e8
  const lambda_m = (h * c) / (deltaE * hartreeToJoule)
  return lambda_m * 1e9
}

export function GrotriaDiagram({ Z, activeN, activeL, onSelectLevel }: GrotriaDiagramProps) {
  const SVG_W = 500
  const SVG_H = 400
  const PAD_L = 52   // left margin for energy axis
  const PAD_R = 20
  const PAD_T = 24
  const PAD_B = 36

  const plotW = SVG_W - PAD_L - PAD_R
  const plotH = SVG_H - PAD_T - PAD_B

  // Compute energy(n) = -Z²/(2n²)
  const energy = (nv: number) => -(Z * Z) / (2 * nv * nv)

  // Map energy → y in SVG: E_1 at bottom, E_∞=0 at top
  const eMin = energy(1)
  const eMax = 0
  const yFromE = (e: number) => PAD_T + plotH * (1 - (e - eMin) / (eMax - eMin))

  // Column x positions for l=0..N_MAX-1
  const colX = (lv: number) => PAD_L + ((lv + 0.5) / N_MAX) * plotW
  const colW = plotW / N_MAX * 0.7  // level line half-width

  // Transitions to draw: all n→1 (Lyman) and n→2 (Balmer) for l-selection rules |Δl|=1
  const transitions = useMemo(() => {
    const result: { nUp: number; nLo: number; lUp: number; lLo: number; nm: number }[] = []
    for (let nUp = 2; nUp <= N_MAX; nUp++) {
      for (let nLo = 1; nLo < nUp; nLo++) {
        // Only Lyman (nLo=1) and Balmer (nLo=2) series to keep diagram readable
        if (nLo > 2) continue
        for (let lLo = 0; lLo < nLo; lLo++) {
          const lUp = lLo + 1  // Δl = +1
          if (lUp >= nUp) continue
          const nm = emissionWavelength(Z, nUp, nLo)
          result.push({ nUp, nLo, lUp, lLo, nm })
        }
      }
    }
    return result
  }, [Z])

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ fontSize: '0.82rem', color: '#888', marginBottom: 4, paddingLeft: PAD_L }}>
        Grotrian diagram — click a level to select it&nbsp;·&nbsp;dashed = UV/IR
      </div>
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
          const label = `${energy(nv).toFixed(2)}`
          return (
            <g key={nv}>
              <line x1={PAD_L - 5} y1={y} x2={PAD_L} y2={y} stroke="#555" strokeWidth={0.8} />
              <text x={PAD_L - 7} y={y + 4} textAnchor="end" fontSize={9} fill="#aaa">{label}</text>
            </g>
          )
        })}

        {/* Y-axis line */}
        <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={PAD_T + plotH} stroke="#555" strokeWidth={1} />

        {/* X-axis column headers (l labels) */}
        {Array.from({ length: N_MAX }, (_, lv) => (
          <text key={lv} x={colX(lv)} y={PAD_T + plotH + 20} textAnchor="middle" fontSize={11} fill="#aaa">
            {L_LABELS[lv]}
          </text>
        ))}
        <text x={PAD_L + plotW / 2} y={SVG_H - 2} textAnchor="middle" fontSize={10} fill="#666">
          Angular momentum l
        </text>

        {/* Transition arrows (drawn first, behind levels) */}
        {transitions.map(({ nUp, nLo, lUp, lLo, nm }, i) => {
          const x1 = colX(lUp)
          const x2 = colX(lLo)
          const y1 = yFromE(energy(nUp))
          const y2 = yFromE(energy(nLo))
          const { stroke, dash } = transitionColor(nm)
          return (
            <g key={i}>
              <defs>
                <marker
                  id={`arrow-${i}`}
                  markerWidth={6} markerHeight={6}
                  refX={3} refY={3}
                  orient="auto"
                >
                  <path d="M0,0 L0,6 L6,3 z" fill={stroke} />
                </marker>
              </defs>
              <line
                x1={x1} y1={y1}
                x2={x2} y2={y2}
                stroke={stroke}
                strokeWidth={1.2}
                strokeDasharray={dash ? '4,3' : undefined}
                markerEnd={`url(#arrow-${i})`}
                opacity={0.65}
              />
              {/* Wavelength label near midpoint */}
              <text
                x={(x1 + x2) / 2 + 4}
                y={(y1 + y2) / 2}
                fontSize={8}
                fill={stroke}
                opacity={0.9}
              >
                {Math.round(nm)} nm
              </text>
            </g>
          )
        })}

        {/* Energy levels — one per (n, l) where l < n */}
        {Array.from({ length: N_MAX }, (_, ni) => ni + 1).flatMap(nv =>
          Array.from({ length: nv }, (_, lv) => {
            const y = yFromE(energy(nv))
            const x = colX(lv)
            const isActive = nv === activeN && lv === activeL
            return (
              <g key={`${nv}-${lv}`} style={{ cursor: onSelectLevel ? 'pointer' : 'default' }}
                 onClick={() => onSelectLevel?.(nv, lv)}>
                <line
                  x1={x - colW / 2} y1={y}
                  x2={x + colW / 2} y2={y}
                  stroke={isActive ? '#4a9eff' : '#ccc'}
                  strokeWidth={isActive ? 2.5 : 1.5}
                />
                {/* n label to the right of the level on l=n-1 column (rightmost) */}
                {lv === nv - 1 && (
                  <text x={x + colW / 2 + 4} y={y + 4} fontSize={9} fill="#888">
                    n={nv}
                  </text>
                )}
                {/* Invisible hit area for clicking */}
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
    </div>
  )
}
