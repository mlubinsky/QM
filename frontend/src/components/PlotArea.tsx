import { useState, useEffect } from 'react'
import { MainPlot } from './MainPlot'
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
  const [currentEigenstate, setCurrentEigenstate] = useState(0)

  // Reset to first eigenstate whenever a new solve result arrives
  useEffect(() => { setCurrentEigenstate(0) }, [eigenResult])

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
      {/* Eigenstate slider + energy label (stationary) */}
      {mode === 'stationary' && eigenResult && (
        <div className="eigenstate-controls">
          {eigenResult.energies.length > 1 && (
            <div className="eigenstate-slider-row">
              <label htmlFor="eigenstate-slider">
                n = {currentEigenstate + 1}
              </label>
              <input
                id="eigenstate-slider"
                type="range"
                min={0}
                max={eigenResult.energies.length - 1}
                value={currentEigenstate}
                onChange={e => setCurrentEigenstate(Number(e.target.value))}
              />
            </div>
          )}
          <ul className="energy-levels">
            {eigenResult.energies.map((E, i) => (
              <li key={i} className={i === currentEigenstate ? 'energy-level--active' : ''}>
                E<sub>{i + 1}</sub> ={' '}
                <span data-testid="energy-label">{E.toFixed(4)}</span> a.u.
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Exact solution formula + error table (Infinite Square Well and Harmonic Oscillator only) */}
      {mode === 'stationary' && eigenResult && potentialPreset && (
        <ExactSolutionPanel preset={potentialPreset} eigenResult={eigenResult} />
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
        currentEigenstate={currentEigenstate}
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
        currentEigenstate={currentEigenstate}
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
      </div>
    </div>
  )
}
