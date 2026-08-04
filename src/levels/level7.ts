import type { LevelDef } from './types';

/** 第7关：山脊之字 —— 反复上下攀降，终点在远端低谷。 */
export const level7: LevelDef = {
  id: 'level7',
  index: 7,
  playerStart: { x: 80, y: 200 },
  finish: { x: 3180, y: 700 },
  worldWidth: 3400,
  worldHeight: 920,
  threeStarMs: 90000,
  twoStarMs: 140000,
  platforms: [
    // 峰1
    { x: 0, y: 280, w: 200, h: 34 },
    { x: 260, y: 340, w: 130, h: 26 },
    { x: 460, y: 400, w: 140, h: 26 },
    { x: 680, y: 480, w: 160, h: 28 },
    // 谷1
    { x: 920, y: 560, w: 180, h: 30 },
    { x: 1180, y: 500, w: 140, h: 26 },
    // 峰2
    { x: 1400, y: 380, w: 150, h: 26 },
    { x: 1640, y: 280, w: 170, h: 28 },
    { x: 1900, y: 220, w: 160, h: 26 },
    // 谷2
    { x: 2140, y: 340, w: 150, h: 26 },
    { x: 2380, y: 460, w: 160, h: 28 },
    { x: 2620, y: 580, w: 170, h: 28 },
    // 终谷
    { x: 2860, y: 680, w: 180, h: 30 },
    { x: 3080, y: 760, w: 240, h: 36 },
    // 旁路高台
    { x: 1000, y: 300, w: 120, h: 22 },
    { x: 2200, y: 180, w: 130, h: 22 },
    { x: 2800, y: 400, w: 120, h: 22 },
  ],
  ladders: [
    { x: 700, y: 400, w: 40, h: 140 },
    { x: 1660, y: 280, w: 40, h: 160 },
    { x: 2640, y: 460, w: 40, h: 160 },
  ],
  seesaws: [
    { x: 1100, y: 540, w: 200 },
    { x: 2500, y: 560, w: 190 },
  ],
  movingPlatforms: [
    { x: 850, y: 420, w: 100, h: 20, axis: 'y', range: 80, speed: 50 },
    { x: 2000, y: 320, w: 100, h: 20, axis: 'x', range: 100, speed: 60 },
  ],
  conveyors: [
    { id: 'cv7a', x: 920, y: 640, w: 160, h: 26, dir: 1, speed: 190 },
    { id: 'cv7b', x: 2380, y: 540, w: 150, h: 26, dir: -1, speed: 180 },
  ],
  fans: [
    { id: 'fan7a', x: 1500, y: 200, w: 64, h: 160, force: 21 },
    { id: 'fan7b', x: 2700, y: 420, w: 60, h: 140, force: 18 },
  ],
  portals: [
    { id: 'p7a', x: 500, y: 360, pairId: 'p7b' },
    { id: 'p7b', x: 2300, y: 140, pairId: 'p7a' },
  ],
  geysers: [
    { x: 1000, y: 560, intervalMs: 1300, force: 800 },
    { x: 2700, y: 580, intervalMs: 1500, force: 760 },
  ],
  timedPlatforms: [
    { x: 1300, y: 440, w: 100, h: 20, onMs: 1000, offMs: 700 },
    { x: 2500, y: 360, w: 100, h: 20, onMs: 1100, offMs: 750 },
    { x: 3000, y: 620, w: 100, h: 20, onMs: 1200, offMs: 700 },
  ],
  gates: [
    { id: 'gate7a', x: 3000, y: 640, w: 26, h: 100 },
  ],
  levers: [
    { x: 2880, y: 640, targetId: 'gate7a', targetType: 'gate' },
    { x: 980, y: 600, targetId: 'cv7a', targetType: 'conveyor' },
    { x: 1540, y: 340, targetId: 'fan7a', targetType: 'fan' },
    { x: 2440, y: 500, targetId: 'cv7b', targetType: 'conveyor' },
  ],
  breakables: [
    { x: 720, y: 420, w: 48, h: 54, hits: 1 },
    { x: 1720, y: 220, w: 50, h: 56, hits: 2 },
    { x: 2700, y: 520, w: 48, h: 54, hits: 2 },
  ],
  crumbles: [
    { x: 560, y: 380, w: 90, h: 22 },
    { x: 1800, y: 260, w: 90, h: 22 },
    { x: 2520, y: 560, w: 90, h: 22 },
  ],
  bumpers: [
    { x: 800, y: 470, dir: 1 },
    { x: 2050, y: 210, dir: -1 },
    { x: 2900, y: 670, dir: 1 },
  ],
  spikes: [
    { x: 520, y: 400, count: 2 },
    { x: 1000, y: 560, count: 2 },
    { x: 1480, y: 380, count: 2 },
    { x: 2260, y: 340, count: 2 },
    { x: 2740, y: 580, count: 2 },
  ],
  pads: [
    { x: 1220, y: 476 },
    { x: 1680, y: 256 },
    { x: 2440, y: 436 },
  ],
  enemies: [
    { type: 'hopper', x: 320, y: 300, patrol: 45 },
    { type: 'chaser', x: 760, y: 440, patrol: 70 },
    { type: 'bat', x: 1100, y: 400, patrol: 80 },
    { type: 'roller', x: 1480, y: 340, patrol: 55 },
    { type: 'spitter', x: 1720, y: 240, patrol: 30 },
    { type: 'ghost', x: 2000, y: 160, patrol: 60 },
    { type: 'tank', x: 2400, y: 420, patrol: 50 },
    { type: 'chaser', x: 2700, y: 540, patrol: 70 },
    { type: 'hopper', x: 3000, y: 640, patrol: 50 },
    { type: 'floater', x: 2200, y: 120, patrol: 70 },
  ],
  weapons: [
    { type: 'shotgun', x: 960, y: 520 },
    { type: 'fireball', x: 1920, y: 180 },
    { type: 'hammer', x: 2660, y: 540 },
    { type: 'peashooter', x: 3120, y: 720 },
  ],
  coins: [
    { x: 180, y: 240 },
    { x: 500, y: 360 },
    { x: 980, y: 520 },
    { x: 1440, y: 340 },
    { x: 1720, y: 240, value: 2 },
    { x: 2200, y: 140 },
    { x: 2460, y: 420 },
    { x: 2700, y: 540 },
    { x: 2940, y: 640, value: 2 },
    { x: 3180, y: 720, value: 3 },
  ],
  pipe: { x: 1720, y: 280 },
  checkpoints: [
    { x: 680, y: 440 },
    { x: 1180, y: 460 },
    { x: 1900, y: 180 },
    { x: 2620, y: 540 },
    { x: 2860, y: 640 },
  ],
};
