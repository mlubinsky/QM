interface AnimationControlsProps {
  nFrames: number
  currentFrame: number
  playing: boolean
  currentTime: number
  speed?: number
  loop?: boolean
  onFrameChange: (frame: number) => void
  onPlayPause: () => void
  onSpeedChange: (speed: number) => void
  onLoopToggle?: () => void
}

export function AnimationControls({
  nFrames,
  currentFrame,
  playing,
  currentTime,
  speed = 1,
  loop = true,
  onFrameChange,
  onPlayPause,
  onSpeedChange,
  onLoopToggle,
}: AnimationControlsProps) {
  return (
    <div className="animation-controls">
      <label htmlFor="frame-slider">Frame</label>
      <input
        id="frame-slider"
        type="range"
        min={0}
        max={nFrames - 1}
        value={currentFrame}
        onChange={e => onFrameChange(Number(e.target.value))}
      />

      <button onClick={onPlayPause}>
        {playing ? 'Pause' : 'Play'}
      </button>

      <label htmlFor="speed-select">Speed</label>
      <select
        id="speed-select"
        value={String(speed)}
        onChange={e => onSpeedChange(Number(e.target.value))}
      >
        <option value="0.25">0.25x</option>
        <option value="0.5">0.5x</option>
        <option value="1">1x</option>
        <option value="2">2x</option>
        <option value="4">4x</option>
      </select>

      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        <input
          type="checkbox"
          checked={loop}
          onChange={onLoopToggle}
          aria-label="Loop"
        />
        Loop
      </label>

      <span>t = {currentTime.toFixed(4)} a.u.</span>
    </div>
  )
}
