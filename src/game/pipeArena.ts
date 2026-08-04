import type { EnemyType } from '../levels/types';

/** Fixed reward for clearing a pipe arena. */
export const PIPE_ARENA_REWARD = 50;

/** Arena room size (placed to the right of the overworld). */
export const PIPE_ARENA = {
  width: 920,
  height: 520,
  margin: 120,
  floorH: 40,
} as const;

export type ArenaPack = { type: EnemyType; count: number };

/**
 * Per-level monster packs: several of each unlocked type.
 * Later levels add tougher species.
 */
export function pipeArenaPack(levelIndex: number): ArenaPack[] {
  const packs: Array<ArenaPack & { minLevel: number }> = [
    { type: 'slime', count: 3, minLevel: 1 },
    { type: 'hopper', count: 2, minLevel: 1 },
    { type: 'floater', count: 2, minLevel: 2 },
    { type: 'chaser', count: 2, minLevel: 3 },
    { type: 'bat', count: 2, minLevel: 4 },
    { type: 'roller', count: 2, minLevel: 4 },
    { type: 'ghost', count: 2, minLevel: 5 },
    { type: 'spitter', count: 2, minLevel: 5 },
    { type: 'tank', count: 1, minLevel: 6 },
  ];
  return packs
    .filter((p) => levelIndex >= p.minLevel)
    .map(({ type, count }) => ({ type, count }));
}

export function arenaOriginX(worldWidth: number): number {
  return worldWidth + PIPE_ARENA.margin;
}
