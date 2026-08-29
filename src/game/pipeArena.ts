import type { EnemyType } from '../levels/types';

/** Default reward for clearing a pipe arena. */
export const PIPE_ARENA_REWARD = 50;
/** Last-level pipe arena reward. */
export const PIPE_ARENA_FINAL_REWARD = 10_000;

/** Invincibility after entering the pipe realm. */
export const PIPE_ENTER_INVINCIBLE_MS = 5000;

/** Hard cap on monsters spawned inside a normal pipe arena. */
export const PIPE_ARENA_MAX_ENEMIES = 40;
/** Last-level pipe arena monster count. */
export const PIPE_ARENA_FINAL_MAX_ENEMIES = 1000;

/** Weapon hits to kill each arena monster (3 shots). */
export const PIPE_ARENA_HITS = 3;

/** Arena room size (placed to the right of the overworld). */
export const PIPE_ARENA = {
  width: 1200,
  height: 560,
  margin: 120,
  floorH: 40,
  /** Left safe ledge: player lands here; monsters never spawn here. */
  safePadW: 220,
  safePadH: 26,
  safePadGap: 110,
  /** Extra horizontal clear zone after the safe pad before first monster. */
  safeClear: 140,
} as const;

export type ArenaPack = { type: EnemyType; count: number };

/** True for the campaign finale pipe (level index 12). */
export function isFinalPipeArena(levelIndex: number): boolean {
  return levelIndex >= 12;
}

export function pipeArenaEnemyCap(levelIndex: number): number {
  return isFinalPipeArena(levelIndex)
    ? PIPE_ARENA_FINAL_MAX_ENEMIES
    : PIPE_ARENA_MAX_ENEMIES;
}

export function pipeArenaReward(levelIndex: number): number {
  return isFinalPipeArena(levelIndex) ? PIPE_ARENA_FINAL_REWARD : PIPE_ARENA_REWARD;
}

/**
 * Per-level monster packs (fills to the level's enemy cap).
 * Later levels unlock tougher species; leftovers redistribute to unlocked types.
 * Tutorial (index 0) gets a fixed gentle pack of 5.
 * Final level (12): 1000 mixed monsters.
 */
export function pipeArenaPack(levelIndex: number): ArenaPack[] {
  if (levelIndex <= 0) {
    return [
      { type: 'slime', count: 2 },
      { type: 'hopper', count: 2 },
      { type: 'floater', count: 1 },
    ];
  }

  const cap = pipeArenaEnemyCap(levelIndex);
  const packs: Array<ArenaPack & { minLevel: number }> = isFinalPipeArena(levelIndex)
    ? [
        { type: 'slime', count: 160, minLevel: 1 },
        { type: 'hopper', count: 140, minLevel: 1 },
        { type: 'floater', count: 120, minLevel: 2 },
        { type: 'chaser', count: 120, minLevel: 3 },
        { type: 'bat', count: 100, minLevel: 4 },
        { type: 'roller', count: 100, minLevel: 4 },
        { type: 'ghost', count: 100, minLevel: 5 },
        { type: 'spitter', count: 80, minLevel: 5 },
        { type: 'tank', count: 80, minLevel: 6 },
      ]
    : [
        { type: 'slime', count: 8, minLevel: 1 },
        { type: 'hopper', count: 6, minLevel: 1 },
        { type: 'floater', count: 5, minLevel: 2 },
        { type: 'chaser', count: 5, minLevel: 3 },
        { type: 'bat', count: 4, minLevel: 4 },
        { type: 'roller', count: 4, minLevel: 4 },
        { type: 'ghost', count: 4, minLevel: 5 },
        { type: 'spitter', count: 3, minLevel: 5 },
        { type: 'tank', count: 2, minLevel: 6 },
      ];

  let remaining = cap;
  const out: ArenaPack[] = [];
  for (const p of packs) {
    if (levelIndex < p.minLevel || remaining <= 0) continue;
    const count = Math.min(p.count, remaining);
    out.push({ type: p.type, count });
    remaining -= count;
  }

  // Always top up to the hard cap using unlocked species.
  let fill = 0;
  while (remaining > 0 && out.length > 0) {
    out[fill % out.length].count += 1;
    remaining -= 1;
    fill += 1;
  }
  return out;
}

export function arenaOriginX(worldWidth: number): number {
  return worldWidth + PIPE_ARENA.margin;
}
