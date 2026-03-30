# Contributing

Bug reports, feature suggestions, and pull requests are welcome.

## Reporting a bug

Open an issue and include:
- What you did (inputs, potential, grid settings)
- What you expected
- What actually happened (error message, screenshot, or unexpected output)

## Running the tests before submitting a PR

Backend:
```bash
cd backend
python -m pytest tests/ -v
```

Frontend:
```bash
cd frontend
npm test
```

Both suites must pass with no failures.

## Code style

- Python: follow PEP 8; docstrings on all public functions
- TypeScript: existing ESLint config enforced via `npm run lint`
- No new dependencies without discussion — keep the install surface small

## What is and is not in scope

**In scope for contributions:**
- Bug fixes in the solver, API, or UI
- New built-in potential presets
- Additional validation tests
- Documentation improvements

**Not in scope yet (planned but deferred):**
- 2D solver
- SSE streaming for real-time evolution
- Absorbing boundary conditions
- GPU acceleration

If you want to work on something larger, open an issue first to discuss design before writing code.
