import { MainPlot } from './MainPlot'
import { SecondaryPlot } from './SecondaryPlot'
import { AnimationControls } from './AnimationControls'
import { downloadFile, buildCsv } from '../utils/export'
import type { EigensolveResponse, EvolveResponse, AppMode } from '../types/api'

interface PlotAreaProps {
  mode: AppMode
  eigenResult: EigensolveResponse | null
  evolveResult: EvolveResponse | null
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
  currentFrame,
  playing,
  onFrameChange,
  onPlayPause,
  onSpeedChange,
}: PlotAreaProps) {
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

      <SecondaryPlot
        mode={mode}
        eigenResult={eigenResult}
        evolveResult={evolveResult}
      />

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
