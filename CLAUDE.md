# Schrödinger Solver — Project Context

## What this is
A 1D quantum mechanics solver with browser UI.
Target: JOSS publication eventually.

## Decisions already made (do not revisit)
- Time evolution: Crank-Nicolson only for MVP
- Units: atomic units (ħ = m_e = 1)
- Boundary conditions: Dirichlet (ψ = 0 at walls) for MVP
- Grid abstraction must be dimension-agnostic (path to 2D)
- Backend: FastAPI + Python
- Frontend: React + TypeScript
- Animation: precomputed frames for MVP, SSE streaming later
- Expression parser: asteval or sympy restricted namespace — never eval()

## Validation requirements
Every solver must pass these before being considered done:
- Infinite square well: E_n = n²π²/2L² in atomic units
- Harmonic oscillator: E_n = n + 1/2
- Norm conservation: ||ψ(t)||² stays within 1e-6 of 1.0

## Primary user
Explorer — someone varying parameters and comparing results.
Not a pure tutorial tool.

## What NOT to build yet
- 2D solver
- SSE streaming
- Absorbing boundary conditions
- GPU acceleration
```

