import { useState } from 'react'
import { writeToClipboard } from '../utils/clipboard'
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
  onFrameChange: (frame: number) => void
  onPlayPause: () => void
  onSpeedChange: (speed: number) => void
}

export function PlotArea({
  mode,
  eigenResult,
  evolveResult,
  potentialPreset,
  currentFrame,
  playing,
  onFrameChange,
  onPlayPause,
  onSpeedChange,
}: PlotAreaProps) {
  const [copied, setCopied] = useState(false)
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
      {/* Energy level labels (stationary) */}
      {mode === 'stationary' && eigenResult && (
        <ul className="energy-levels">
          {eigenResult.energies.map((E, i) => (
            <li key={i}>
              E<sub>{i + 1}</sub> ={' '}
              <span data-testid="energy-label">{E.toFixed(4)}</span> a.u.
            </li>
          ))}
        </ul>
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

      <MainPlot
        mode={mode}
        eigenResult={eigenResult}
        evolveResult={evolveResult}
        currentFrame={currentFrame}
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
      />

      {mode === 'time-evolution' && (
        <ExpectationValuesPlot evolveResult={evolveResult} />
      )}

      {mode === 'time-evolution' && evolveResult && (
        <AnimationControls
          nFrames={evolveResult.psi_frames.length}
          currentFrame={currentFrame}
          playing={playing}
          currentTime={evolveResult.times[currentFrame] ?? 0}
          onFrameChange={onFrameChange}
          onPlayPause={onPlayPause}
          onSpeedChange={onSpeedChange}
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
