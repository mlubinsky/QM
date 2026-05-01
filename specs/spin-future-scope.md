# Spin Module — Future Scope (not in MVP)

Features deliberately deferred from the initial spin-½ / Bloch sphere implementation.
Revisit these after the MVP ships.

---

## Spin > ½

- Spin-1 (qutrit), spin-3/2, general spin-s
- Generalized Bloch sphere → higher-dimensional geometric representations (Majorana stars)
- `S_x`, `S_y`, `S_z` matrices for arbitrary s via ladder operators

## Two-qubit / entanglement

- Tensor product state space: |ψ⟩ ∈ ℂ⁴
- Bell states, Schmidt decomposition
- Entanglement entropy display
- Two-Bloch-sphere visualization with correlation arrows

## Decoherence / open quantum systems

- Lindblad master equation: dρ/dt = -i[H,ρ] + Σ_k (L_k ρ L_k† - ½{L_k†L_k, ρ})
- T1 (energy relaxation), T2 (dephasing) parameters
- Bloch sphere vector shrinking inside the sphere (mixed states)
- Density matrix display

## Physical Stern-Gerlach apparatus

- Full simulation of atom trajectory through inhomogeneous B field
- Force F = ∇(μ · B), spatial deflection as a function of m_s
- Multi-beam visualization (e.g. spin-1 → 3 beams)

## Angular momentum coupling (Clebsch-Gordan)

- Combine orbital l and spin s into total j = l ⊕ s
- Clebsch-Gordan coefficient table and composer
- Spectroscopic notation: ²ˢ⁺¹L_J
- Depends on: orbital angular momentum from 3D solver (not yet built)

## Real-units mode

- Expose Larmor frequency in MHz and B-field in Tesla
- Gyromagnetic ratio γ for electron, proton, neutron presets
- NMR / ESR context labels

## Pulse sequences (quantum control)

- Apply a sequence of rotation gates: Rx(θ), Ry(θ), Rz(θ), Hadamard
- Bloch sphere animation showing each gate step
- Export sequence as a circuit diagram

## Integration with 1D spatial solver

- Spin-orbit coupling: H_SO = ξ(r) L·S term added to Hamiltonian
- Zeeman effect: E_n,m = E_n + m_s g_s μ_B B
- Requires 3D solver extension (beyond current 1D MVP)
