/**
 * Client-side spin-½ math — pure functions, no side effects.
 *
 * Trajectory computation uses Rodrigues' rotation formula, which keeps
 * |r| = 1 exactly at every frame without any numerical integration.
 *
 * All quantities in atomic units (ħ = m_e = 1).
 */

export type Vec3 = [number, number, number]

/** Bloch vector r from spherical angles (θ, φ). |r| = 1. */
export function blochVector(theta: number, phi: number): Vec3 {
  return [
    Math.sin(theta) * Math.cos(phi),
    Math.sin(theta) * Math.sin(phi),
    Math.cos(theta),
  ]
}

/**
 * Rotate vector r around unit axis by angle (rad) using Rodrigues' formula:
 *   r' = r cosα + (axis × r) sinα + axis (axis · r)(1 − cosα)
 */
export function rodriguezRotate(r: Vec3, axis: Vec3, angle: number): Vec3 {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const dot = axis[0] * r[0] + axis[1] * r[1] + axis[2] * r[2]

  const cross: Vec3 = [
    axis[1] * r[2] - axis[2] * r[1],
    axis[2] * r[0] - axis[0] * r[2],
    axis[0] * r[1] - axis[1] * r[0],
  ]

  return [
    r[0] * cos + cross[0] * sin + axis[0] * dot * (1 - cos),
    r[1] * cos + cross[1] * sin + axis[1] * dot * (1 - cos),
    r[2] * cos + cross[2] * sin + axis[2] * dot * (1 - cos),
  ]
}

/**
 * Precompute nFrames Bloch vectors for Larmor precession.
 *
 * The Bloch vector rotates around Bhat at angular rate ω₀ (rad / a.u.).
 * Frame i corresponds to time t_i = i * tMax / (nFrames - 1).
 */
export function computeTrajectory(
  theta: number,
  phi: number,
  Bhat: Vec3,
  omega0: number,
  tMax: number,
  nFrames: number,
): Vec3[] {
  const r0 = blochVector(theta, phi)
  const trajectory: Vec3[] = [r0]

  for (let i = 1; i < nFrames; i++) {
    const t = (i / (nFrames - 1)) * tMax
    trajectory.push(rodriguezRotate(r0, Bhat, omega0 * t))
  }

  return trajectory
}

/**
 * Return (θ, φ) of the post-measurement eigenstate after a Stern-Gerlach
 * measurement along unit axis n̂.
 *
 * outcome '+': collapsed state has Bloch vector = +n̂
 * outcome '-': collapsed state has Bloch vector = -n̂
 */
export function collapseState(
  axis: Vec3,
  outcome: '+' | '-',
): { theta: number; phi: number } {
  const sign = outcome === '+' ? 1 : -1
  const [nx, ny, nz] = [sign * axis[0], sign * axis[1], sign * axis[2]]

  const theta = Math.acos(Math.max(-1, Math.min(1, nz)))
  const phi   = Math.atan2(ny, nx)

  return { theta, phi: phi < 0 ? phi + 2 * Math.PI : phi }
}
