import type { LevelDef } from './types';

/** 第4关：传送带与间歇平台教学延伸 */
export const level4: LevelDef = {
  id: 'level4',
  index: 4,
  playerStart: { x: 80, y: 400 },
  finish: { x: 4200, y: 140 },
  worldWidth: 4400,
  worldHeight: 780,
  threeStarMs: 65000,
  twoStarMs: 100000,
  platforms: [
    { x: 0, y: 500, w: 280, h: 50 },
    { x: 340, y: 440, w: 140, h: 30 },
    { x: 560, y: 380, w: 160, h: 30 },
    { x: 560, y: 220, w: 160, h: 28 },
    { x: 900, y: 360, w: 140, h: 28 },
    // 1180/2500 are conveyors
    { x: 1500, y: 340, w: 140, h: 28 },
    { x: 1900, y: 380, w: 180, h: 30 },
    { x: 2200, y: 300, w: 140, h: 28 },
    { x: 2800, y: 340, w: 140, h: 28 },
    { x: 3100, y: 280, w: 140, h: 28 },
    { x: 3400, y: 220, w: 160, h: 28 },
    { x: 3800, y: 180, w: 320, h: 36 },
  ],
  ladders: [
    { x: 620, y: 220, w: 40, h: 160 },
    { x: 2560, y: 300, w: 40, h: 120 },
  ],
  seesaws: [{ x: 1750, y: 360, w: 200 }],
  conveyors: [
    { x: 1180, y: 400, w: 160, h: 30, dir: 1, speed: 180 },
    { x: 2500, y: 420, w: 160, h: 30, dir: -1, speed: 170 },
  ],
  fans: [{ x: 3000, y: 120, w: 70, h: 180, force: 20 }],
  crumbles: [{ x: 1050, y: 380, w: 100, h: 24 }],
  bumpers: [{ x: 1380, y: 370, dir: 1 }],
  portals: [
    { id: 'a', x: 640, y: 190, pairId: 'b' },
    { id: 'b', x: 3200, y: 250, pairId: 'a' },
  ],
  geysers: [{ x: 2100, y: 380, intervalMs: 2000, force: 760 }],
  timedPlatforms: [
    { x: 780, y: 320, w: 100, h: 22, onMs: 1600, offMs: 900 },
    { x: 3600, y: 260, w: 110, h: 22, onMs: 1400, offMs: 1000 },
  ],
  spikes: [
    { x: 960, y: 360, count: 2 },
    { x: 2860, y: 340, count: 2 },
  ],
  pads: [
    { x: 1540, y: 316 },
    { x: 3440, y: 196 },
  ],
  enemies: [
    { type: 'slime', x: 400, y: 400, patrol: 50 },
    { type: 'hopper', x: 1000, y: 320, patrol: 70 },
    { type: 'floater', x: 1600, y: 240, patrol: 90 },
    { type: 'chaser', x: 2000, y: 340, patrol: 100 },
    { type: 'slime', x: 2700, y: 300, patrol: 55 },
    { type: 'hopper', x: 3500, y: 180, patrol: 60 },
    { type: 'tank', x: 4000, y: 140, patrol: 50 },
  ],
  weapons: [
    { type: 'hammer', x: 600, y: 180 },
    { type: 'peashooter', x: 1920, y: 340 },
    { type: 'fireball', x: 3120, y: 240 },
  ],
  checkpoints: [
    { x: 560, y: 340 },
    { x: 1500, y: 300 },
    { x: 2500, y: 380 },
    { x: 3400, y: 180 },
  ],
};
