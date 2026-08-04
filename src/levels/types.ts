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
export type CoinDef = { x: number; y: number; value?: number };
/** One optional warp pipe per level → monster arena challenge. */
export type PipeDef = { x: number; y: number };
export type LadderDef = { x: number; y: number; w: number; h: number };
export type SeesawDef = { x: number; y: number; w: number };
export type ConveyorDef = PlatformDef & { dir: -1 | 1; speed: number; id?: string };
export type FanDef = { x: number; y: number; w: number; h: number; force: number; id?: string };

/** Solid door opened/closed by a lever. */
export type GateDef = PlatformDef & { id: string; open?: boolean };

/** Press X nearby to toggle a gate / conveyor / fan. */
export type LeverDef = {
  x: number;
  y: number;
  targetId: string;
  targetType: 'gate' | 'conveyor' | 'fan';
};

/** Press X nearby to smash (hits times). */
export type BreakableDef = PlatformDef & { hits?: number };
export type CrumbleDef = PlatformDef & { shakeMs?: number; goneMs?: number };
export type BumperDef = { x: number; y: number; dir: -1 | 1 };
export type PortalDef = { id: string; x: number; y: number; pairId: string };
export type GeyserDef = { x: number; y: number; intervalMs?: number; force?: number };
export type TimedPlatformDef = PlatformDef & {
  onMs: number;
  offMs: number;
  startOn?: boolean;
};

export type EnemyType =
  | 'slime'
  | 'spikeball'
  | 'floater'
  | 'hopper'
  | 'tank'
  | 'chaser'
  | 'bat'
  | 'roller'
  | 'ghost'
  | 'spitter';

export type EnemyDef = {
  type: EnemyType;
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
  gates?: GateDef[];
  levers?: LeverDef[];
  breakables?: BreakableDef[];
  spikes: SpikeDef[];
  pads: PadDef[];
  enemies: EnemyDef[];
  weapons: WeaponDef[];
  coins?: CoinDef[];
  /** At most one pipe challenge per level. */
  pipe?: PipeDef;
  checkpoints: CheckpointDef[];
};
