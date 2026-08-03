import type { LevelDef } from './types';

/** 第6关：多层捷径与追击怪 */
export const level6: LevelDef = {
  id: 'level6',
  index: 6,
  playerStart: { x: 80, y: 430 },
  finish: { x: 4900, y: 100 },
  worldWidth: 5100,
  worldHeight: 860,
  threeStarMs: 75000,
  twoStarMs: 120000,
  platforms: [
    { x: 0, y: 540, w: 240, h: 50 },
    { x: 280, y: 480, w: 130, h: 30 },
    { x: 460, y: 420, w: 140, h: 28 },
    { x: 460, y: 240, w: 160, h: 28 },
    { x: 720, y: 360, w: 140, h: 28 },
    // 980/2400/3600 conveyors
    { x: 1260, y: 340, w: 140, h: 26 },
    { x: 1520, y: 280, w: 130, h: 26 },
    { x: 1800, y: 360, w: 170, h: 28 },
    { x: 2100, y: 300, w: 140, h: 26 },
    { x: 2700, y: 280, w: 140, h: 26 },
    { x: 3000, y: 340, w: 150, h: 28 },
    { x: 3300, y: 240, w: 140, h: 26 },
    { x: 3900, y: 220, w: 140, h: 26 },
    { x: 4200, y: 160, w: 160, h: 28 },
    { x: 4600, y: 120, w: 320, h: 34 },
  ],
  movingPlatforms: [
    { x: 1100, y: 260, w: 110, h: 22, axis: 'x', range: 110, speed: 65 },
    { x: 2550, y: 220, w: 110, h: 22, axis: 'y', range: 90, speed: 50 },
    { x: 4050, y: 280, w: 110, h: 22, axis: 'x', range: 100, speed: 60 },
  ],
  ladders: [
    { x: 520, y: 240, w: 40, h: 180 },
    { x: 1840, y: 220, w: 40, h: 140 },
    { x: 3340, y: 160, w: 40, h: 140 },
  ],
  seesaws: [
    { x: 1650, y: 340, w: 210 },
    { x: 3150, y: 300, w: 200 },
  ],
  conveyors: [
    { x: 980, y: 420, w: 150, h: 28, dir: 1, speed: 200 },
    { x: 2400, y: 380, w: 160, h: 28, dir: -1, speed: 190 },
    { x: 3600, y: 300, w: 150, h: 28, dir: 1, speed: 185 },
  ],
  fans: [
    { x: 1400, y: 140, w: 70, h: 200, force: 22 },
    { x: 2850, y: 120, w: 70, h: 180, force: 20 },
  ],
  crumbles: [
    { x: 860, y: 380, w: 100, h: 24 },
    { x: 2250, y: 340, w: 100, h: 24 },
    { x: 3750, y: 260, w: 100, h: 24 },
  ],
  bumpers: [
    { x: 1200, y: 310, dir: 1 },
    { x: 2850, y: 250, dir: -1 },
    { x: 4350, y: 140, dir: 1 },
  ],
  portals: [
    { id: 'e', x: 520, y: 210, pairId: 'f' },
    { id: 'f', x: 4200, y: 130, pairId: 'e' },
  ],
  geysers: [
    { x: 2000, y: 360, intervalMs: 1700, force: 820 },
    { x: 3450, y: 300, intervalMs: 1900, force: 760 },
  ],
  timedPlatforms: [
    { x: 2050, y: 240, w: 100, h: 22, onMs: 1400, offMs: 800 },
    { x: 3450, y: 180, w: 100, h: 22, onMs: 1200, offMs: 900 },
    { x: 4450, y: 200, w: 100, h: 22, onMs: 1500, offMs: 850 },
  ],
  spikes: [
    { x: 1040, y: 420, count: 2 },
    { x: 2480, y: 380, count: 2 },
    { x: 3680, y: 300, count: 2 },
  ],
  pads: [
    { x: 1560, y: 256 },
    { x: 2740, y: 256 },
    { x: 3960, y: 196 },
  ],
  enemies: [
    { type: 'chaser', x: 400, y: 380, patrol: 80 },
    { type: 'hopper', x: 800, y: 320, patrol: 70 },
    { type: 'floater', x: 1350, y: 220, patrol: 110 },
    { type: 'tank', x: 1850, y: 320, patrol: 60 },
    { type: 'spikeball', x: 2150, y: 260, patrol: 45 },
    { type: 'chaser', x: 2500, y: 340, patrol: 100 },
    { type: 'hopper', x: 3050, y: 300, patrol: 65 },
    { type: 'tank', x: 3350, y: 200, patrol: 50 },
    { type: 'floater', x: 3800, y: 140, patrol: 90 },
    { type: 'chaser', x: 4300, y: 120, patrol: 90 },
    { type: 'tank', x: 4750, y: 80, patrol: 50 },
  ],
  weapons: [
    { type: 'shotgun', x: 500, y: 200 },
    { type: 'fireball', x: 1540, y: 240 },
    { type: 'hammer', x: 2450, y: 340 },
    { type: 'peashooter', x: 3320, y: 200 },
    { type: 'fireball', x: 4220, y: 120 },
  ],
  checkpoints: [
    { x: 720, y: 320 },
    { x: 1800, y: 320 },
    { x: 2700, y: 240 },
    { x: 3600, y: 260 },
    { x: 3900, y: 180 },
  ],
};
