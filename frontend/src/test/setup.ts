import '@testing-library/jest-dom'

// Plotly uses ResizeObserver — stub it in jsdom
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
