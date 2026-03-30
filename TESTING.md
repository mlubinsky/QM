# Testing the Schrödinger Solver

---

## 1. Backend unit tests (pytest)

```bash
cd /Users/mlubinsky/QM
python -m pytest backend/tests/ -v
```

This runs all 4 test suites:

| File | What it tests |
|---|---|
| `test_grid.py` | Grid spacing, shape, monotonicity |
| `test_hamiltonian.py` | Symmetry, ISW ground-state energy, matrix shape |
| `test_eigenvalue_solver.py` | ISW + HO energies, normalization, orthogonality |
| `test_crank_nicolson.py` | Norm conservation, energy conservation, tunneling, coherent-state trajectory |
| `test_expectation_values.py` | ⟨x⟩, ⟨p⟩, ⟨H⟩ for HO/ISW; Heisenberg bound; Ehrenfest theorem |
| `test_api.py` | All HTTP endpoints via FastAPI TestClient |

To run just one suite:
```bash
python -m pytest backend/tests/test_api.py -v
```

---

## 2. Frontend unit tests (Vitest)

```bash
cd /Users/mlubinsky/QM/frontend
npm test
```

This runs all 7 test files — no backend needed, everything is mocked.

---

## 3. Run the full app end-to-end

You need two terminals:

**Terminal 1 — backend**
```bash
cd /Users/mlubinsky/QM/backend
uvicorn app:app --reload --port 8000
```

Verify it's up:
```bash
curl http://localhost:8000/health
# → {"status":"ok","version":"0.1.0"}

curl http://localhost:8000/presets
# → {"presets":["infinite_square_well","harmonic_oscillator",...]}
```

**Terminal 2 — frontend**
```bash
cd /Users/mlubinsky/QM/frontend
npm run dev
# → open http://localhost:5173 in your browser
```

---

## 4. Manual API testing (no frontend needed)

Test eigenstate solve:
```bash
curl -s -X POST http://localhost:8000/solve/eigenstates \
  -H "Content-Type: application/json" \
  -d '{"grid":{"x_min":-8,"x_max":8,"n_points":500},"potential_preset":"harmonic_oscillator","n_states":5}' \
  | python -m json.tool | grep energies
```
Expected: `"energies": [0.5, 1.5, 2.5, 3.5, 4.5]` (approximately)

Test expectation values from time evolution:
```bash
curl -s -X POST http://localhost:8000/solve/evolve \
  -H "Content-Type: application/json" \
  -d '{"grid":{"x_min":-8,"x_max":8,"n_points":300},"potential_preset":"harmonic_oscillator","gaussian_x0":0,"gaussian_sigma":0.707,"gaussian_k0":0,"dt":0.01,"n_steps":100,"save_every":10}' \
  | python -m json.tool | grep -E '"expect_x"|"expect_H"'
```
Expected: `expect_x` values near 0 (packet centered at origin), `expect_H` values near 0.5 (HO ground-state energy).

Test validation rejection:
```bash
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8000/solve/eigenstates \
  -H "Content-Type: application/json" \
  -d '{"grid":{"x_min":5,"x_max":-5,"n_points":100},"potential_preset":"harmonic_oscillator"}'
# → 422
```

Test bad potential expression:
```bash
curl -s -X POST http://localhost:8000/solve/eigenstates \
  -H "Content-Type: application/json" \
  -d '{"grid":{"x_min":-5,"x_max":5,"n_points":100},"potential_expr":"import os"}'
# → 422 with detail message
```

---

## 5. Interactive API docs

With the backend running, open:
```
http://localhost:8000/docs
```
This gives a full Swagger UI where you can try every endpoint interactively.

---

## Quick sanity check (all at once)

```bash
cd /Users/mlubinsky/QM
python -m pytest backend/tests/ -q && \
  cd frontend && npm test -- --reporter=dot
```
