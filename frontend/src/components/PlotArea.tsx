import { useState } from 'react'
import { writeToClipboard } from '../utils/clipboard'
import { auToEv } from '../utils/units'
import { MainPlot } from './MainPlot'
import { MatrixPanel } from './MatrixPanel'
import { SecondaryPlot } from './SecondaryPlot'
import { AnimationControls } from './AnimationControls'
import { ExactSolutionPanel } from './ExactSolutionPanel'
import { ExpectationValuesPlot } from './ExpectationValuesPlot'
import { MomentumPlot } from './MomentumPlot'
import { CurrentPlot } from './CurrentPlot'
import { downloadFile, buildCsv } from '../utils/export'
import type { EigensolveResponse, EvolveResponse, AppMode } from '../types/api'

interface PlotAreaProps {
  mode: AppMode
  eigenResult: EigensolveResponse | null
  evolveResult: EvolveResponse | null
  potentialPreset: string | null
  currentFrame: number
  playing: boolean
  speed?: number
  loop?: boolean
  onFrameChange: (frame: number) => void
  onPlayPause: () => void
  onSpeedChange: (speed: number) => void
  onLoopToggle?: () => void
}

export function PlotArea({
  mode,
  eigenResult,
  evolveResult,
  potentialPreset,
  currentFrame,
  playing,
  speed = 1,
  loop = true,
  onFrameChange,
  onPlayPause,
  onSpeedChange,
  onLoopToggle,
}: PlotAreaProps) {
  const currentTime = evolveResult?.times[currentFrame] ?? 0
  const [copied, setCopied] = useState(false)
  const [showPhase, setShowPhase] = useState(false)
  const [showClassical, setShowClassical] = useState(false)
  const [showNodeInfo, setShowNodeInfo] = useState(false)
  const [showEnergyInfo, setShowEnergyInfo] = useState(false)
  const result = mode === 'stationary' ? eigenResult : evolveResult
  const currentNorm =
    mode === 'time-evolution' && evolveResult
      ? evolveResult.norm_history[currentFrame] ?? 1
      : null

  function handleExportCsv() {
    if (!eigenResult) return
    const csv = buildCsv(eigenResult, 0)
    downloadFile(csv, 'eigenstates.csv', 'text/csv')
  }

  function handleExportJson() {
    if (!result) return
    downloadFile(JSON.stringify(result, null, 2), 'result.json', 'application/json')
  }

  return (
    <div className="plot-area">
      {/* Energy level labels (stationary) — ? overlaid, adds zero height */}
      {mode === 'stationary' && eigenResult && (
        <div style={{ position: 'relative' }}>
          <button
            className="physics-info-btn plot-info-btn-overlay"
            aria-label="Energy levels — what they mean"
            onClick={() => setShowEnergyInfo(true)}
          >?</button>
          <ul className="energy-levels">
            {eigenResult.energies.map((E, i) => (
              <li key={i}>
                E<sub>{i + 1}</sub> ={' '}
                <span data-testid="energy-label">{E.toFixed(4)}</span> a.u.{' '}
                <span className="energy-ev">({auToEv(E)} eV)</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showEnergyInfo && (
        <div className="physics-modal-backdrop" onClick={() => setShowEnergyInfo(false)}>
          <div className="physics-modal" role="dialog" aria-modal="true"
               onClick={e => e.stopPropagation()}>
            <div className="physics-modal-header">
              <span className="physics-modal-title">Energy Levels</span>
              <button className="physics-modal-close" aria-label="Close"
                      onClick={() => setShowEnergyInfo(false)}>✕</button>
            </div>
            <div className="physics-modal-body">
              <p>
                Each E<sub>n</sub> is an <strong>allowed energy</strong> for a particle
                bound in this potential. Quantum mechanics permits only these discrete
                values — any other energy produces a wavefunction that fails to satisfy
                the boundary conditions. This is the origin of quantisation.
              </p>
              <p>
                <strong>Sign convention.</strong> A negative energy means the particle
                is bound below the asymptote of the potential (it cannot classically
                escape). A positive energy means it sits above the asymptote and would
                be unbound in classical mechanics — though a quantum particle can still
                be trapped temporarily by a barrier.
              </p>
              <p>
                <strong>Units.</strong> Energies are shown in atomic units (Hartree,
                a.u.) and in electron-volts (eV) for intuition. 1 Hartree = 27.21 eV.
                In atomic units ħ = m<sub>e</sub> = 1, so the harmonic oscillator
                ground state is exactly ½ a.u.
              </p>
              <p>
                <strong>Spacing patterns reveal the potential.</strong>
              </p>
              <ul>
                <li>
                  <strong>Infinite square well:</strong> E<sub>n</sub> = n²π²/2L² —
                  levels grow as n², so the gaps widen with each step.
                </li>
                <li>
                  <strong>Harmonic oscillator:</strong> E<sub>n</sub> = n + ½ —
                  levels are perfectly equally spaced. This equal spacing is unique to
                  the harmonic oscillator and is why coherent states do not spread.
                </li>
                <li>
                  <strong>Other potentials</strong> have their own characteristic
                  spacing — anharmonic wells bunch levels at the top, double wells
                  produce near-degenerate pairs.
                </li>
              </ul>
              <p>
                <strong>Connection to the plot.</strong> Each dashed horizontal line
                in the wavefunction plot is drawn at the corresponding energy. The
                wavefunction ψ<sub>n</sub>(x) is plotted <em>offset upward by its own
                energy</em> — the standard physics convention that lets you read off
                the energy directly from the baseline of each wavefunction.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Exact solution formula + error table (Infinite Square Well and Harmonic Oscillator only) */}
      {mode === 'stationary' && eigenResult && potentialPreset && (
        <ExactSolutionPanel preset={potentialPreset} eigenResult={eigenResult} />
      )}

      {/* Matrix / Heisenberg picture — collapsible, stationary mode only */}
      {mode === 'stationary' && eigenResult && (
        <details style={{ border: '1px solid #ccc', borderRadius: '6px', padding: '8px 12px' }}>
          <summary style={{ fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', userSelect: 'none' }}>
            Matrix representation (Heisenberg picture)
          </summary>
          <div style={{ marginTop: '12px' }}>
            <MatrixPanel eigenResult={eigenResult} />
          </div>
        </details>
      )}

      {/* Norm display (time-evolution) */}
      {mode === 'time-evolution' && currentNorm !== null && (
        <div>
          Norm: <span data-testid="norm-display">{currentNorm.toFixed(6)}</span>
        </div>
      )}

      {mode === 'time-evolution' && (
        <div className="phase-toggle-row">
          <label className="phase-toggle-label">
            <input
              type="checkbox"
              checked={showPhase}
              onChange={e => setShowPhase(e.target.checked)}
            />
            {' '}Show Re(ψ) and Im(ψ)
          </label>
          {showPhase && (
            <p className="phase-toggle-note">
              A stationary state has ψ = φ(x)·e<sup>−iEt</sup>: Re(ψ) and Im(ψ) spin
              at frequency E while |ψ|² stays fixed. In a superposition of two eigenstates,
              the two components spin at different speeds — their phase difference oscillates,
              making |ψ|² slosh back and forth. This is quantum interference in action.
            </p>
          )}
        </div>
      )}

      {showNodeInfo && (
        <div className="physics-modal-backdrop" onClick={() => setShowNodeInfo(false)}>
          <div className="physics-modal" role="dialog" aria-modal="true"
               onClick={e => e.stopPropagation()}>
            <div className="physics-modal-header">
              <span className="physics-modal-title">Eigenfunctions &amp; Node Counting</span>
              <button className="physics-modal-close" aria-label="Close"
                      onClick={() => setShowNodeInfo(false)}>✕</button>
            </div>
            <div className="physics-modal-body">
              <p>
                A <strong>node</strong> is an interior point where ψ(x) = 0 and changes sign.
                The boundary zeros (where the walls force ψ = 0) do not count — only the
                genuine zero-crossings inside the well.
              </p>
              <p>
                The <strong>n-th energy eigenstate always has exactly n−1 nodes</strong>.
                This follows from the Sturm-Liouville theorem, the same mathematics that
                governs a vibrating string fixed at both ends: the fundamental mode has no
                interior nodes, the first harmonic has one node at the centre, and so on.
              </p>
              <p>
                This matters for three reasons:
              </p>
              <ul>
                <li>
                  <strong>Correctness check.</strong> If the solver returned eigenvalues in
                  the wrong order, the node counts would be wrong too. Seeing ψ₁ (0 nodes),
                  ψ₂ (1 node), ψ₃ (2 nodes) instantly confirms the results are physically correct.
                </li>
                <li>
                  <strong>Kinetic energy made visible.</strong> More nodes means more curvature.
                  The kinetic energy operator is −½ d²ψ/dx², so a wavefunction that oscillates
                  more has larger second derivatives and higher energy. You can <em>see</em> why
                  E₃ &gt; E₂ &gt; E₁.
                </li>
                <li>
                  <strong>Orthogonality.</strong> Two eigenstates with different node counts
                  cannot be the same state. The node count acts as a quantum number — a discrete
                  label that uniquely identifies each bound state.
                </li>
              </ul>
              <p style={{ marginTop: '10px', color: '#888', fontSize: '0.82rem' }}>
                For the infinite square well the exact energies are E<sub>n</sub> = n²π²/2L²,
                growing as n² — exactly as expected for a wave with n−1 interior nodes squeezed
                into a box of length L.
              </p>
            </div>
          </div>
        </div>
      )}

      {mode === 'stationary' && (
        <div className="phase-toggle-row">
          <label className="phase-toggle-label">
            <input
              type="checkbox"
              checked={showClassical}
              onChange={e => setShowClassical(e.target.checked)}
            />
            {' '}Show classical P(x)
          </label>
          {showClassical && (
            <p className="phase-toggle-note">
              The dotted curve shows where a <strong>classical</strong> particle at the
              same energy would spend its time. It spends more time near the{' '}
              <strong>turning points</strong> (where it slows to rest) and less time
              near the centre (where it moves fastest). For large n, the quantum
              probability |ψₙ|² smooths out to match this classical distribution —
              the <strong>correspondence principle</strong>.
            </p>
          )}
        </div>
      )}

      {/* Zero-height row — positions ? button over the plot top-right without consuming flex space */}
      {mode === 'stationary' && (
        <div style={{ height: 0, position: 'relative', overflow: 'visible' }}>
          <button
            className="physics-info-btn plot-info-btn-overlay"
            aria-label="Eigenfunction nodes — what they mean"
            onClick={() => setShowNodeInfo(true)}
          >?</button>
        </div>
      )}
      <MainPlot
        mode={mode}
        eigenResult={eigenResult}
        evolveResult={evolveResult}
        currentFrame={currentFrame}
        showPhase={showPhase}
        showClassical={showClassical}
      />

      {mode === 'time-evolution' && (
        <MomentumPlot evolveResult={evolveResult} currentFrame={currentFrame} />
      )}

      {mode === 'time-evolution' && (
        <CurrentPlot evolveResult={evolveResult} currentFrame={currentFrame} />
      )}

      <SecondaryPlot
        mode={mode}
        eigenResult={eigenResult}
        evolveResult={evolveResult}
        potentialPreset={potentialPreset}
        currentTime={currentTime}
      />

      {mode === 'time-evolution' && (
        <ExpectationValuesPlot evolveResult={evolveResult} currentTime={currentTime} />
      )}

      {mode === 'time-evolution' && evolveResult && (
        <AnimationControls
          nFrames={evolveResult.prob_frames.length}
          currentFrame={currentFrame}
          playing={playing}
          currentTime={currentTime}
          onFrameChange={onFrameChange}
          onPlayPause={onPlayPause}
          onSpeedChange={onSpeedChange}
          speed={speed}
          loop={loop}
          onLoopToggle={onLoopToggle}
        />
      )}

      <div className="export-buttons">
        <button onClick={handleExportCsv} disabled={!eigenResult}>
          Export CSV
        </button>
        <button onClick={handleExportJson} disabled={!result}>
          Export JSON
        </button>
        <button
          onClick={async () => {
            try {
              await writeToClipboard(window.location.href)
              setCopied(true)
              setTimeout(() => setCopied(false), 2000)
            } catch (_) {}
          }}
        >
          {copied ? 'Copied!' : 'Copy link'}
        </button>
      </div>
    </div>
  )
}
