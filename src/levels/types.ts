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
export type LadderDef = { x: number; y: number; w: number; h: number };
export type SeesawDef = { x: number; y: number; w: number };
export type ConveyorDef = PlatformDef & { dir: -1 | 1; speed: number };
export type FanDef = { x: number; y: number; w: number; h: number; force: number };
export type CrumbleDef = PlatformDef & { shakeMs?: number; goneMs?: number };
export type BumperDef = { x: number; y: number; dir: -1 | 1 };
export type PortalDef = { id: string; x: number; y: number; pairId: string };
export type GeyserDef = { x: number; y: number; intervalMs?: number; force?: number };
export type TimedPlatformDef = PlatformDef & {
  onMs: number;
  offMs: number;
  startOn?: boolean;
};

export type EnemyDef = {
  type: 'slime' | 'spikeball' | 'floater' | 'hopper' | 'tank' | 'chaser';
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
  ladders?: LadderDef[];
  seesaws?: SeesawDef[];
  conveyors?: ConveyorDef[];
  fans?: FanDef[];
  crumbles?: CrumbleDef[];
  bumpers?: BumperDef[];
  portals?: PortalDef[];
  geysers?: GeyserDef[];
  timedPlatforms?: TimedPlatformDef[];
  spikes: SpikeDef[];
  pads: PadDef[];
  enemies: EnemyDef[];
  weapons: WeaponDef[];
  checkpoints: CheckpointDef[];
};
