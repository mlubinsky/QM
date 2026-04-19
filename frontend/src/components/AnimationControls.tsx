interface AnimationControlsProps {
  nFrames: number
  currentFrame: number
  playing: boolean
  currentTime: number
  speed?: number
  onFrameChange: (frame: number) => void
  onPlayPause: () => void
  onSpeedChange: (speed: number) => void
}

export function AnimationControls({
  nFrames,
  currentFrame,
  playing,
  currentTime,
  speed = 1,
  onFrameChange,
  onPlayPause,
  onSpeedChange,
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
        <option value="0.5">0.5x</option>
        <option value="1">1x</option>
        <option value="2">2x</option>
        <option value="4">4x</option>
      </select>

      <span>t = {currentTime.toFixed(4)} atomic units</span>
    </div>
  )
}
