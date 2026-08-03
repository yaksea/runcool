import type { LevelDef } from './types';

/** 第5关：喷泉与散射弹 */
export const level5: LevelDef = {
  id: 'level5',
  index: 5,
  playerStart: { x: 70, y: 420 },
  finish: { x: 4550, y: 120 },
  worldWidth: 4800,
  worldHeight: 820,
  threeStarMs: 70000,
  twoStarMs: 110000,
  platforms: [
    { x: 0, y: 520, w: 260, h: 50 },
    { x: 300, y: 460, w: 140, h: 30 },
    { x: 500, y: 400, w: 150, h: 28 },
    { x: 750, y: 340, w: 130, h: 26 },
    // 1000/2250 conveyors
    { x: 1300, y: 320, w: 140, h: 26 },
    { x: 1600, y: 380, w: 160, h: 28 },
    { x: 1950, y: 300, w: 140, h: 26 },
    { x: 2600, y: 280, w: 140, h: 26 },
    { x: 2900, y: 340, w: 150, h: 28 },
    { x: 3200, y: 260, w: 140, h: 26 },
    { x: 3500, y: 200, w: 150, h: 28 },
    { x: 3850, y: 260, w: 140, h: 26 },
    { x: 4150, y: 180, w: 160, h: 28 },
    { x: 4400, y: 140, w: 280, h: 34 },
  ],
  movingPlatforms: [
    { x: 1150, y: 260, w: 110, h: 22, axis: 'y', range: 70, speed: 55 },
    { x: 3050, y: 200, w: 110, h: 22, axis: 'x', range: 90, speed: 60 },
  ],
  ladders: [
    { x: 540, y: 250, w: 40, h: 150 },
    { x: 2940, y: 200, w: 40, h: 140 },
  ],
  seesaws: [
    { x: 1450, y: 360, w: 200 },
    { x: 3700, y: 240, w: 190 },
  ],
  conveyors: [
    { x: 1000, y: 400, w: 160, h: 28, dir: 1, speed: 190 },
    { x: 2250, y: 360, w: 170, h: 28, dir: -1, speed: 180 },
  ],
  fans: [
    { x: 1800, y: 160, w: 70, h: 200, force: 21 },
    { x: 4000, y: 60, w: 64, h: 150, force: 18 },
  ],
  crumbles: [
    { x: 880, y: 360, w: 100, h: 24 },
    { x: 2750, y: 300, w: 100, h: 24 },
  ],
  bumpers: [
    { x: 1700, y: 350, dir: 1 },
    { x: 3350, y: 230, dir: -1 },
  ],
  portals: [
    { id: 'c', x: 560, y: 220, pairId: 'd' },
    { id: 'd', x: 3500, y: 170, pairId: 'c' },
  ],
  geysers: [
    { x: 2100, y: 360, intervalMs: 1800, force: 800 },
    { x: 3300, y: 260, intervalMs: 2100, force: 740 },
  ],
  timedPlatforms: [
    { x: 2400, y: 280, w: 100, h: 22, onMs: 1500, offMs: 900 },
    { x: 4050, y: 220, w: 100, h: 22, onMs: 1300, offMs: 900 },
  ],
  spikes: [
    { x: 1080, y: 400, count: 2 },
    { x: 2320, y: 360, count: 2 },
    { x: 3600, y: 200, count: 2 },
  ],
  pads: [
    { x: 1340, y: 296 },
    { x: 2640, y: 256 },
    { x: 4200, y: 156 },
  ],
  enemies: [
    { type: 'hopper', x: 450, y: 360, patrol: 60 },
    { type: 'slime', x: 1100, y: 360, patrol: 50 },
    { type: 'chaser', x: 1650, y: 340, patrol: 110 },
    { type: 'floater', x: 2000, y: 220, patrol: 100 },
    { type: 'tank', x: 2300, y: 320, patrol: 55 },
    { type: 'spikeball', x: 2950, y: 300, patrol: 40 },
    { type: 'hopper', x: 3250, y: 220, patrol: 55 },
    { type: 'chaser', x: 3900, y: 220, patrol: 90 },
    { type: 'tank', x: 4500, y: 100, patrol: 45 },
  ],
  weapons: [
    { type: 'glove', x: 520, y: 360 },
    { type: 'shotgun', x: 1320, y: 280 },
    { type: 'fireball', x: 2280, y: 320 },
    { type: 'hammer', x: 3520, y: 160 },
  ],
  checkpoints: [
    { x: 750, y: 300 },
    { x: 1600, y: 340 },
    { x: 2600, y: 240 },
    { x: 3200, y: 220 },
    { x: 4150, y: 140 },
  ],
};
