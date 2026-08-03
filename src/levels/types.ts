import type { WeaponType } from '../systems/SaveSystem';

export type PlatformDef = { x: number; y: number; w: number; h: number };

export type MovingPlatformDef = PlatformDef & {
  axis: 'x' | 'y';
  range: number;
  speed: number;
};

export type SpikeDef = { x: number; y: number; count: number };
export type PadDef = { x: number; y: number };
export type CheckpointDef = { x: number; y: number };
export type EnemyDef = {
  type: 'slime' | 'spikeball' | 'floater';
  x: number;
  y: number;
  patrol: number;
  afterCheckpoint?: number;
};
export type WeaponDef = {
  type: Exclude<WeaponType, 'none'>;
  x: number;
  y: number;
  afterCheckpoint?: number;
};

export type LevelDef = {
  id: string;
  index: number;
  playerStart: { x: number; y: number };
  finish: { x: number; y: number };
  worldWidth: number;
  worldHeight: number;
  threeStarMs: number;
  twoStarMs: number;
  platforms: PlatformDef[];
  movingPlatforms?: MovingPlatformDef[];
  spikes: SpikeDef[];
  pads: PadDef[];
  enemies: EnemyDef[];
  weapons: WeaponDef[];
  checkpoints: CheckpointDef[];
};
