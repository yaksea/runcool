import type { LevelDef } from './types';

/** 第4关：竖井攀升 —— 窄而高，终点在塔顶。 */
export const level4: LevelDef = {
  id: 'level4',
  index: 4,
  playerStart: { x: 200, y: 780 },
  finish: { x: 420, y: 70 },
  worldWidth: 900,
  worldHeight: 1000,
  threeStarMs: 60000,
  twoStarMs: 95000,
  platforms: [
    { x: 80, y: 860, w: 280, h: 40 },
    { x: 420, y: 800, w: 160, h: 28 },
    { x: 120, y: 740, w: 150, h: 26 },
    { x: 400, y: 680, w: 160, h: 26 },
    { x: 140, y: 620, w: 140, h: 26 },
    { x: 420, y: 560, w: 160, h: 26 },
    { x: 120, y: 500, w: 150, h: 26 },
    { x: 400, y: 440, w: 180, h: 26 },
    { x: 140, y: 380, w: 140, h: 26 },
    { x: 420, y: 320, w: 160, h: 26 },
    { x: 160, y: 260, w: 150, h: 26 },
    { x: 400, y: 200, w: 180, h: 26 },
    { x: 280, y: 140, w: 280, h: 32 },
  ],
  ladders: [
    { x: 480, y: 680, w: 36, h: 140 },
    { x: 180, y: 380, w: 36, h: 140 },
    { x: 460, y: 200, w: 36, h: 140 },
  ],
  movingPlatforms: [
    { x: 300, y: 720, w: 100, h: 20, axis: 'x', range: 80, speed: 55 },
    { x: 300, y: 480, w: 100, h: 20, axis: 'x', range: 90, speed: 60 },
    { x: 300, y: 300, w: 100, h: 20, axis: 'y', range: 50, speed: 45 },
  ],
  conveyors: [
    { id: 'cv4a', x: 420, y: 840, w: 140, h: 26, dir: -1, speed: 150 },
  ],
  fans: [{ id: 'fan4', x: 300, y: 340, w: 60, h: 140, force: 20 }],
    crumbles: [
    { x: 260, y: 640, w: 90, h: 20 },
    { x: 280, y: 400, w: 90, h: 20 },
  ],
  timedPlatforms: [
    { x: 300, y: 600, w: 90, h: 20, onMs: 1400, offMs: 800 },
    { x: 300, y: 240, w: 90, h: 20, onMs: 1200, offMs: 700 },
  ],
  gates: [{ id: 'gate4a', x: 400, y: 100, w: 26, h: 80 }],
      levers: [
    { x: 336, y: 140, targetId: 'gate4a', targetType: 'gate' },
    { x: 527, y: 800, targetId: 'cv4a', targetType: 'conveyor' },
    { x: 220, y: 500, targetId: 'fan4', targetType: 'fan' },
  ],
  breakables: [
    { x: 180, y: 580, w: 44, h: 50, hits: 1 },
    { x: 460, y: 280, w: 48, h: 52, hits: 2 },
  ],
  flameVents: [
    { x: 520, y: 200, intervalMs: 700, height: 140 },
  ],
  acidPools: [
    { x: 527, y: 560, w: 88 },
  ],
      spikes: [
    { x: 507, y: 680, count: 3 },
    { x: 170, y: 740, count: 4 },
    { x: 520, y: 440, count: 3 },
    { x: 187, y: 380, count: 3 },
  ],
  pads: [
    { x: 480, y: 656 },
    { x: 200, y: 356 },
  ],
        bumpers: [
    { x: 453, y: 680, dir: 1 },
  ],
  enemies: [
    { type: 'slime', x: 480, y: 760, patrol: 40 },
    { type: 'hopper', x: 200, y: 580, patrol: 45 },
    { type: 'bat', x: 320, y: 520, patrol: 60 },
    { type: 'roller', x: 480, y: 400, patrol: 55 },
    { type: 'spitter', x: 220, y: 340, patrol: 25 },
    { type: 'ghost', x: 450, y: 180, patrol: 50 },
  ],
  weapons: [
    { type: 'hammer', x: 160, y: 700 },
    { type: 'peashooter', x: 480, y: 400 },
    { type: 'fireball', x: 200, y: 220 },
  ],
  coins: [
    { x: 220, y: 820 },
    { x: 480, y: 760 },
    { x: 200, y: 700 },
    { x: 480, y: 640 },
    { x: 200, y: 580 },
    { x: 480, y: 520, value: 2 },
    { x: 200, y: 460 },
    { x: 480, y: 400 },
    { x: 200, y: 340 },
    { x: 480, y: 280, value: 2 },
    { x: 420, y: 100, value: 3 },
  ],
  pipe: { x: 160, y: 860 },
  checkpoints: [
    { x: 420, y: 760 },
    { x: 140, y: 580 },
    { x: 420, y: 400 },
    { x: 160, y: 220 },
  ],
};
