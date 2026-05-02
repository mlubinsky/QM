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

type SpinTab = 'dynamics' | 'measurement'

export function SpinPanel() {
  const [theta, setTheta] = useState(0)
  const [phi, setPhi]     = useState(0)
  const [trajectory, setTrajectory] = useState<Vec3[]>([])
  const [playing, setPlaying]       = useState(false)
  const [showHelp, setShowHelp]     = useState(false)
  const [activeTab, setActiveTab]   = useState<SpinTab>('dynamics')
  const closeHelp = useCallback(() => setShowHelp(false), [])

  function handleTabChange(tab: SpinTab) {
    setActiveTab(tab)
    // Clear precession trail when switching to measurement — the trajectory
    // cone has no meaning in the Born-rule context and would confuse the view.
    if (tab === 'measurement') setTrajectory([])
  }

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

          {/* Tab strip */}
          <div className="spin-tabs">
            <button
              className={`spin-tab-btn ${activeTab === 'dynamics' ? 'spin-tab-btn--active' : ''}`}
              onClick={() => handleTabChange('dynamics')}
            >
              Precession
            </button>
            <button
              className={`spin-tab-btn ${activeTab === 'measurement' ? 'spin-tab-btn--active' : ''}`}
              onClick={() => handleTabChange('measurement')}
            >
              Measurement
            </button>
          </div>

          {/* State composer is shared — both tabs need an initial spin state */}
          <SpinStateComposer
            theta={theta}
            phi={phi}
            onChange={handleStateChange}
          />

          {activeTab === 'dynamics' ? (
            <>
              <p className="spin-tab-note">
                Unitary evolution — the Bloch vector stays on the sphere surface.
              </p>
              <PrecessionControls
                theta={theta}
                phi={phi}
                onTrajectory={setTrajectory}
                onFrame={(t, p) => { setTheta(t); setPhi(p); setPlaying(true) }}
              />
              <PauliMatrixDisplay />
            </>
          ) : (
            <>
              <p className="spin-tab-note">
                Measurement collapses the state randomly. P(+½) = ½(1 + n̂·r̂)
              </p>
              <SternGerlachPanel
                theta={theta}
                phi={phi}
                onCollapse={(t, p) => { setTheta(t); setPhi(p) }}
              />
            </>
          )}
        </div>

        {/* Right column: Bloch sphere — always visible */}
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
