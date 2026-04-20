/** 1 Hartree (atomic unit of energy) in electron-volts. */
export const HARTREE_TO_EV = 27.2114

/** Convert an energy in atomic units to eV, formatted to 2 decimal places. */
export function auToEv(au: number): string {
  return (au * HARTREE_TO_EV).toFixed(2)
}

/** 1 Bohr radius (atomic unit of length) in Ångströms. */
export const BOHR_TO_ANGSTROM = 0.529177

/** Convert a length in atomic units to Å, formatted to 2 decimal places. */
export function auToAngstrom(au: number): string {
  return (au * BOHR_TO_ANGSTROM).toFixed(2)
}
