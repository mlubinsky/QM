import { useState, useEffect, useRef } from 'react'
import { computeTrajectory } from '../utils/spinMath'
import type { Vec3 } from '../utils/spinMath'

interface Props {
  theta: number
  phi: number
  onTrajectory: (traj: Vec3[]) => void
  onFrame: (theta: number, phi: number) => void
}

const PI = Math.PI
const N_FRAMES = 120

type BPreset = 'x' | 'y' | 'z' | 'custom'

// φ clock dial — hand points in the direction of the azimuthal angle
function PhiClock({ phi, omega0 }: { phi: number; omega0: number }) {
  const cx = 44, cy = 44, R = 30, HR = 22
  const hx = cx + HR * Math.cos(phi)
  const hy = cy - HR * Math.sin(phi)   // SVG y is down, so flip
  const ticks: [number, string][] = [
    [0,       '+x'],
    [PI / 2,  '+y'],
    [PI,      '−x'],
    [3*PI/2,  '−y'],
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, marginTop: 6 }}>
      <svg width={88} height={88} style={{ display: 'block', overflow: 'visible' }}>
        <circle cx={cx} cy={cy} r={R} fill="#0b0b14" stroke="#444" strokeWidth={1} />
        {ticks.map(([a, lbl]) => {
          const ix = cx + (R - 5) * Math.cos(a), iy = cy - (R - 5) * Math.sin(a)
          const ox = cx +  R      * Math.cos(a), oy = cy -  R      * Math.sin(a)
          const lx = cx + (R + 9) * Math.cos(a), ly = cy - (R + 9) * Math.sin(a)
          return (
            <g key={lbl}>
              <line x1={ix} y1={iy} x2={ox} y2={oy} stroke="#555" strokeWidth={1.5} />
              <text x={lx} y={ly} textAnchor="middle" dominantBaseline="central"
                fill="#777" fontSize={7} fontFamily="sans-serif">{lbl}</text>
            </g>
          )
        })}
        <line x1={cx} y1={cy} x2={hx} y2={hy}
          stroke="#f39c12" strokeWidth={2.5} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={3}   fill="#f39c12" />
        <circle cx={hx} cy={hy} r={2.5} fill="#f39c12" />
      </svg>
      <div style={{ fontSize: '0.72rem', color: '#f39c12', textAlign: 'center', lineHeight: 1.4 }}>
        φ = {(((phi % (2*PI)) + 2*PI) % (2*PI) * 180 / PI).toFixed(0)}°
        <span style={{ color: '#888', marginLeft: 6 }}>ω₀ = {omega0.toFixed(1)}</span>
      </div>
    </div>
  )
}

export function PrecessionControls({ theta, phi, onTrajectory, onFrame }: Props) {
  const [bPreset, setBPreset]   = useState<BPreset>('x')
  const [bTheta, setBTheta]     = useState(0)
  const [bPhi, setBPhi]         = useState(0)
  const [omega0, setOmega0]     = useState(1.0)
  const [tMax, setTMax]         = useState(parseFloat((2 * PI).toFixed(3)))
  const [playing, setPlaying]   = useState(false)
  const [frameIdx, setFrameIdx] = useState(0)

  const trajRef    = useRef<Vec3[]>([])
  const frameRef   = useRef(0)
  const playingRef = useRef(false)
  const rafRef     = useRef(0)

  function getBhat(): Vec3 {
    if (bPreset === 'x') return [1, 0, 0]
    if (bPreset === 'y') return [0, 1, 0]
    if (bPreset === 'z') return [0, 0, 1]
    return [
      Math.sin(bTheta) * Math.cos(bPhi),
      Math.sin(bTheta) * Math.sin(bPhi),
      Math.cos(bTheta),
    ]
  }

  // Recompute trajectory whenever inputs change, but not while animation is running.
  // (onFrame updates theta/phi every frame; without this guard, the trajectory would
  // reset to frame 0 on every tick and the spin vector would never visibly precess.)
  useEffect(() => {
    if (playingRef.current) return
    const traj = computeTrajectory(theta, phi, getBhat(), omega0, tMax, N_FRAMES)
    trajRef.current = traj
    onTrajectory(traj)
    setFrameIdx(0)
    frameRef.current = 0
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theta, phi, bPreset, bTheta, bPhi, omega0, tMax])

  // Animation loop
  useEffect(() => {
    playingRef.current = playing
    if (!playing) {
      cancelAnimationFrame(rafRef.current)
      return
    }

    let last = 0
    const msPerFrame = 1000 / 30  // 30 fps

    function step(ts: number) {
      if (!playingRef.current) return
      if (ts - last >= msPerFrame) {
        last = ts
        const traj = trajRef.current
        if (traj.length > 0) {
          frameRef.current = (frameRef.current + 1) % traj.length
          const [rx, ry, rz] = traj[frameRef.current]
          const newTheta = Math.acos(Math.max(-1, Math.min(1, rz)))
          const newPhi   = Math.atan2(ry, rx)
          onFrame(newTheta, newPhi < 0 ? newPhi + 2 * PI : newPhi)
          setFrameIdx(frameRef.current)
        }
      }
      rafRef.current = requestAnimationFrame(step)
    }

    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing])

  function reset() {
    setPlaying(false)
    setFrameIdx(0)
    frameRef.current = 0
    if (trajRef.current.length > 0) {
      const [rx, ry, rz] = trajRef.current[0]
      const t = Math.acos(Math.max(-1, Math.min(1, rz)))
      const p = Math.atan2(ry, rx)
      onFrame(t, p < 0 ? p + 2 * PI : p)
    }
  }

  const period = 2 * PI / omega0

  return (
    <fieldset className="spin-fieldset">
      <legend>Precession</legend>

      <label>B̂ direction</label>
      <div className="spin-b-presets">
        {(['x', 'y', 'z', 'custom'] as BPreset[]).map(p => (
          <button key={p}
            className={`spin-preset-btn ${bPreset === p ? 'spin-preset-btn--active' : ''}`}
            onClick={() => setBPreset(p)}
          >
            {p === 'custom' ? 'custom' : `+${p}`}
          </button>
        ))}
      </div>

      {bPreset === 'custom' && (
        <div className="spin-sliders">
          <label>θ_B <span className="spin-value">{bTheta.toFixed(2)}</span></label>
          <input type="range" min={0} max={PI} step={0.01} value={bTheta}
            onChange={e => setBTheta(parseFloat(e.target.value))} />
          <label>φ_B <span className="spin-value">{bPhi.toFixed(2)}</span></label>
          <input type="range" min={0} max={2*PI} step={0.01} value={bPhi}
            onChange={e => setBPhi(parseFloat(e.target.value))} />
        </div>
      )}

      <div className="spin-sliders">
        <label>ω₀ (rad/a.u.) <span className="spin-value">{omega0.toFixed(2)}</span></label>
        <input type="range" min={0.1} max={10} step={0.1} value={omega0}
          onChange={e => setOmega0(parseFloat(e.target.value))} />

        <label>t_max (a.u.) <span className="spin-value">{tMax.toFixed(2)}</span>
          <span className="spin-period-note"> (period = {period.toFixed(2)})</span>
        </label>
        <input type="range" min={0.5} max={50} step={0.5} value={tMax}
          onChange={e => setTMax(parseFloat(e.target.value))} />
      </div>

      <p style={{ margin: '6px 0 4px', fontSize: '0.8rem', color: '#aaa', fontStyle: 'italic' }}>
        Animate spin vector precessing around B̂
      </p>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div className="spin-playback">
            <button className="spin-play-btn" onClick={() => setPlaying(p => !p)}>
              {playing ? 'Pause' : 'Play'}
            </button>
            <button className="spin-play-btn" onClick={reset}>Reset</button>
          </div>
          <span className="spin-frame-counter" style={{ marginTop: 4, display: 'block' }}>
            frame {frameIdx + 1} / {N_FRAMES}
          </span>
        </div>
        <PhiClock phi={phi} omega0={omega0} />
      </div>
    </fieldset>
  )
}
