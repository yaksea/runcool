import { level1 } from './level1';
import { level2 } from './level2';
import { level3 } from './level3';
import { level4 } from './level4';
import { level5 } from './level5';
import { level6 } from './level6';
import { level7 } from './level7';
import { level8 } from './level8';
import type { LevelDef } from './types';

export const LEVELS: LevelDef[] = [
  level1,
  level2,
  level3,
  level4,
  level5,
  level6,
  level7,
  level8,
];

export function getLevelById(id: string): LevelDef | undefined {
  return LEVELS.find((l) => l.id === id);
}

export function getLevelByIndex(index: number): LevelDef | undefined {
  return LEVELS.find((l) => l.index === index);
}

export type { LevelDef } from './types';
