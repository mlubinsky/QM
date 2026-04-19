/**
 * Spec 16 — URL state bug fixes (items 1–2).
 *
 * Item 1: saveEvery must be clamped to [1, 100] on parse.
 * Item 2: hasNonDefaultUrl must return true when saveEvery differs from default.
 */
import { describe, it, expect } from 'vitest'
import { parseUrlParams, hasNonDefaultUrl, DEFAULTS } from '../utils/urlState'

// ── Item 1: saveEvery clamping ────────────────────────────────────────────

describe('Spec 16 — saveEvery URL clamping', () => {
  it('clamps save_every > 100 to 100', () => {
    const p = parseUrlParams(new URLSearchParams('save_every=999'))
    expect(p.saveEvery).toBe(100)
  })

  it('clamps save_every < 1 to 1', () => {
    const p = parseUrlParams(new URLSearchParams('save_every=0'))
    expect(p.saveEvery).toBe(1)
  })

  it('clamps save_every=-5 to 1', () => {
    const p = parseUrlParams(new URLSearchParams('save_every=-5'))
    expect(p.saveEvery).toBe(1)
  })

  it('accepts save_every=10 unchanged', () => {
    const p = parseUrlParams(new URLSearchParams('save_every=10'))
    expect(p.saveEvery).toBe(10)
  })

  it('accepts save_every=100 unchanged', () => {
    const p = parseUrlParams(new URLSearchParams('save_every=100'))
    expect(p.saveEvery).toBe(100)
  })
})

// ── Item 2: hasNonDefaultUrl includes saveEvery ───────────────────────────

describe('Spec 16 — hasNonDefaultUrl includes saveEvery', () => {
  it('returns true when saveEvery differs from default', () => {
    const p = { ...DEFAULTS, saveEvery: 5 }
    expect(hasNonDefaultUrl(p)).toBe(true)
  })

  it('returns false when saveEvery equals default', () => {
    const p = { ...DEFAULTS }
    expect(hasNonDefaultUrl(p)).toBe(false)
  })
})
