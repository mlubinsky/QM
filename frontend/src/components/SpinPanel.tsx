import { useState, useCallback } from 'react'
import { BlochSphere } from './BlochSphere'
import { SpinStateComposer } from './SpinStateComposer'
import { PrecessionControls } from './PrecessionControls'
import { PauliMatrixDisplay } from './PauliMatrixDisplay'
import { SternGerlachPanel } from './SternGerlachPanel'
import { SpinInfoPanel } from './SpinInfoPanel'
import type { Vec3 } from '../utils/spinMath'

function HelpButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Spin ½ reference"
      onClick={onClick}
      className="physics-info-btn"
    >?</button>
  )
}

function SpinModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="physics-modal-backdrop" onClick={onClose}>
      <div
        className="physics-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Spin ½ reference"
        onClick={e => e.stopPropagation()}
      >
        <div className="physics-modal-header">
          <span className="physics-modal-title">Spin ½ — Physics Reference</span>
          <button type="button" className="physics-modal-close" aria-label="Close" onClick={onClose}>✕</button>
        </div>
        <div className="physics-modal-body">
          <SpinInfoPanel />
        </div>
      </div>
    </div>
  )
}

export function SpinPanel() {
  const [theta, setTheta] = useState(0)
  const [phi, setPhi]     = useState(0)
  const [trajectory, setTrajectory] = useState<Vec3[]>([])
  const [playing, setPlaying]       = useState(false)
  const [showHelp, setShowHelp]     = useState(false)
  const closeHelp = useCallback(() => setShowHelp(false), [])

  function handleStateChange(t: number, p: number) {
    setTheta(t)
    setPhi(p)
  }

  return (
    <>
      {showHelp && <SpinModal onClose={closeHelp} />}
      <div className="spin-panel">
        {/* Left column: controls */}
        <div className="spin-controls">
          <div className="spin-header-row">
            <span className="spin-title">Spin ½ / Bloch Sphere</span>
            <HelpButton onClick={() => setShowHelp(true)} />
          </div>
          <SpinStateComposer
            theta={theta}
            phi={phi}
            onChange={handleStateChange}
          />
          <PrecessionControls
            theta={theta}
            phi={phi}
            onTrajectory={setTrajectory}
            onFrame={(t, p) => { setTheta(t); setPhi(p); setPlaying(true) }}
          />
          <SternGerlachPanel
            theta={theta}
            phi={phi}
            onCollapse={(t, p) => { setTheta(t); setPhi(p) }}
          />
          <PauliMatrixDisplay />
        </div>

        {/* Right column: Bloch sphere */}
        <div className="spin-sphere-wrap">
          <BlochSphere
            theta={theta}
            phi={phi}
            trajectory={trajectory}
            playing={playing}
          />
        </div>
      </div>
    </>
  )
}
