// Client-side utility to match server's income formula
export function territoryIncome(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}
