/** 1 Hartree (atomic unit of energy) in electron-volts. */
export const HARTREE_TO_EV = 27.2114

/** Convert an energy in atomic units to eV, formatted to 2 decimal places. */
export function auToEv(au: number): string {
  return (au * HARTREE_TO_EV).toFixed(2)
}
