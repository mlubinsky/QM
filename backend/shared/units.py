"""Atomic unit constants used throughout the solver.

In atomic units: ħ = m_e = e = 1.
All energies in Hartree, lengths in Bohr radii (a₀), times in atomic units
(1 a.u. ≈ 24.19 attoseconds).
"""

HBAR: float = 1.0       # reduced Planck constant
M_E: float = 1.0        # electron mass
E_CHARGE: float = 1.0   # elementary charge

A0_TO_ANGSTROM: float = 0.529177210903   # Bohr radius in Ångström
HARTREE_TO_EV: float = 27.211386245988   # Hartree in electron-volts
AU_TIME_TO_AS: float = 24.18884326505    # atomic time unit in attoseconds
