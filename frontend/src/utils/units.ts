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

/** 1 atomic unit of time in attoseconds. */
export const AU_TIME_TO_AS = 24.1888

/**
 * Convert a time in atomic units to a human-readable string.
 * Uses attoseconds below 1000 as, femtoseconds at or above.
 */
export function auTimeToHuman(au: number): string {
  const as = au * AU_TIME_TO_AS
  if (as < 1000) {
    return `${as.toFixed(2)} as`
  }
  return `${(as / 1000).toFixed(2)} fs`
}
