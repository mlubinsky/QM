import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AnimationControls } from '../components/AnimationControls'

describe('AnimationControls', () => {
  const defaultProps = {
    nFrames: 11,
    currentFrame: 0,
    playing: false,
    currentTime: 0,
    onFrameChange: vi.fn(),
    onPlayPause: vi.fn(),
    onSpeedChange: vi.fn(),
  }

  it('renders frame slider', () => {
    render(<AnimationControls {...defaultProps} />)
    expect(screen.getByLabelText(/frame/i)).toBeInTheDocument()
  })

  it('renders Play button when paused', () => {
    render(<AnimationControls {...defaultProps} playing={false} />)
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument()
  })

  it('renders Pause button when playing', () => {
    render(<AnimationControls {...defaultProps} playing={true} />)
    expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument()
  })

  it('calls onPlayPause when Play clicked', async () => {
    const onPlayPause = vi.fn()
    render(<AnimationControls {...defaultProps} playing={false} onPlayPause={onPlayPause} />)
    await userEvent.click(screen.getByRole('button', { name: /play/i }))
    expect(onPlayPause).toHaveBeenCalledOnce()
  })

  it('calls onPlayPause when Pause clicked', async () => {
    const onPlayPause = vi.fn()
    render(<AnimationControls {...defaultProps} playing={true} onPlayPause={onPlayPause} />)
    await userEvent.click(screen.getByRole('button', { name: /pause/i }))
    expect(onPlayPause).toHaveBeenCalledOnce()
  })

  it('renders speed selector with 0.5x, 1x, 2x, 4x options', () => {
    render(<AnimationControls {...defaultProps} />)
    const select = screen.getByLabelText(/speed/i)
    expect(select).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '0.5x' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '1x' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '2x' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '4x' })).toBeInTheDocument()
  })

  it('displays current time', () => {
    render(<AnimationControls {...defaultProps} currentTime={1.23} />)
    expect(screen.getByText(/1\.23/)).toBeInTheDocument()
  })
})
