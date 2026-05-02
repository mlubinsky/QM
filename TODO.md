# TODO — Feature Backlog

## In Progress

## Planned

### Sequential Stern-Gerlach chain (spin module)

The current SG simulator measures one device at a time. The most striking quantum result requires a chain of devices with explicit beam blocking:

```
|+z⟩ → [SG-z] → block |−z⟩ → [SG-x] → block |−x⟩ → [SG-z] → 50/50 again
```

The final 50/50 — measuring spin-z on a state already filtered for +z — is the result that makes state collapse and measurement erasure concrete. The physics foundation is already in place (collapse correctly updates the Bloch sphere state); what's needed is a dedicated UI showing:

- Multiple SG boxes in a linear chain
- Per-output blocking/passing controls (block +½, block −½, or pass both)
- State propagating through the chain with running probabilities at each stage
- A clear label explaining why the last SG-z gives 50/50 despite earlier filtering

## Future / Nice-to-Have

### Module Sequencing Roadmap

- **Phase 2 — Perturbation Theory** (prerequisite for Zeeman)
  The Zeeman effect is an application of perturbation theory — you cannot understand it properly without first learning how small perturbations shift energy levels. Fine/hyperfine structure follows naturally from the same toolkit.

- **Phase 3 — Many-Body Physics** (prerequisite for Condensed Matter)
  Hartree-Fock, Slater determinants, and second quantization are the language in which crystals, metals, and semiconductors are actually described. Skipping this makes Phase 4 feel like memorizing formulas.

- **Phase 4 — Condensed Matter** (as a block)
  Crystals → Metals → Semiconductors is the canonical order (each builds on Bloch's theorem). The Ising model is slightly detached — it's statistical physics more than QM — but it's excellent preparation for understanding phase transitions before tackling superconductivity. The Josephson effect sits last here because it requires Cooper pairs and BCS theory.

- **Phase 5 — Dirac Equation** (capstone)
  Requires comfort with all of QM and some exposure to special relativity. Natural capstone before quantum field theory.

## Completed
