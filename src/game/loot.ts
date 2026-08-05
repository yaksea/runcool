/**
 * Enemy death coin drop table (sums to 100%):
 * - 50% → 0
 * - 25% → 1
 * - 20% → 2
 * - 4%  → 3
 * - 1%  → 0 (remainder)
 */
export function rollEnemyCoinDrop(): number {
  const r = Math.random() * 100;
  if (r < 50) return 0;
  if (r < 75) return 1;
  if (r < 95) return 2;
  if (r < 99) return 3;
  return 0;
}
