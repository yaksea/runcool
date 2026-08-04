import type { LevelDef } from './types';

/** 第3关：折返走廊 —— 冲到尽头后必须原路爬回，终点在起点上方。 */
export const level3: LevelDef = {
  id: 'level3',
  index: 3,
  playerStart: { x: 90, y: 520 },
  finish: { x: 140, y: 80 },
  worldWidth: 3200,
  worldHeight: 780,
  threeStarMs: 70000,
  twoStarMs: 110000,
  platforms: [
    // 下层：向右推进
    { x: 0, y: 600, w: 240, h: 48 },
    { x: 280, y: 560, w: 140, h: 28 },
    { x: 480, y: 520, w: 150, h: 28 },
    { x: 700, y: 480, w: 160, h: 28 },
    { x: 940, y: 520, w: 140, h: 26 },
    { x: 1160, y: 480, w: 160, h: 28 },
    { x: 1400, y: 440, w: 180, h: 28 },
    { x: 1680, y: 400, w: 160, h: 26 },
    { x: 1940, y: 360, w: 180, h: 28 },
    { x: 2220, y: 400, w: 160, h: 28 },
    { x: 2480, y: 360, w: 200, h: 30 },
    { x: 2780, y: 320, w: 240, h: 34 },
    // 右端爬升
    { x: 2860, y: 180, w: 180, h: 26 },
    // 上层：向左折返
    { x: 2500, y: 140, w: 200, h: 26 },
    { x: 2180, y: 160, w: 160, h: 24 },
    { x: 1860, y: 140, w: 160, h: 24 },
    { x: 1540, y: 160, w: 150, h: 24 },
    { x: 1220, y: 140, w: 160, h: 24 },
    { x: 900, y: 160, w: 150, h: 24 },
    { x: 580, y: 140, w: 160, h: 24 },
    { x: 280, y: 120, w: 180, h: 26 },
    { x: 40, y: 140, w: 200, h: 28 },
  ],
  ladders: [
    { x: 2920, y: 180, w: 40, h: 160 },
    { x: 320, y: 120, w: 40, h: 200 },
  ],
  seesaws: [
    { x: 1080, y: 500, w: 200 },
    { x: 2000, y: 150, w: 180 },
  ],
  conveyors: [
    { x: 700, y: 560, w: 160, h: 28, dir: 1, speed: 170 },
    { x: 1540, y: 200, w: 150, h: 24, dir: -1, speed: 150 },
  ],
  fans: [{ x: 2360, y: 220, w: 64, h: 160, force: 18 }],
  crumbles: [
    { x: 860, y: 500, w: 90, h: 22 },
    { x: 1700, y: 140, w: 90, h: 22 },
  ],
  bumpers: [
    { x: 1600, y: 430, dir: 1 },
    { x: 1100, y: 150, dir: -1 },
  ],
  spikes: [
    { x: 560, y: 520, count: 2 },
    { x: 1800, y: 400, count: 2 },
    { x: 2300, y: 160, count: 2 },
    { x: 700, y: 140, count: 2 },
  ],
  pads: [
    { x: 1480, y: 416 },
    { x: 2600, y: 116 },
  ],
  enemies: [
    { type: 'slime', x: 520, y: 480, patrol: 45 },
    { type: 'hopper', x: 1200, y: 440, patrol: 60 },
    { type: 'chaser', x: 2000, y: 320, patrol: 80 },
    { type: 'floater', x: 2600, y: 100, patrol: 70 },
    { type: 'slime', x: 1000, y: 120, patrol: 50 },
    { type: 'hopper', x: 400, y: 80, patrol: 40 },
  ],
  weapons: [
    { type: 'peashooter', x: 1720, y: 360 },
    { type: 'hammer', x: 2900, y: 140 },
  ],
  coins: [
    { x: 340, y: 520 },
    { x: 760, y: 440 },
    { x: 1220, y: 440 },
    { x: 1720, y: 360 },
    { x: 2300, y: 360 },
    { x: 2860, y: 280, value: 2 },
    { x: 2520, y: 100 },
    { x: 1900, y: 100 },
    { x: 1260, y: 100 },
    { x: 620, y: 100, value: 2 },
    { x: 120, y: 100, value: 3 },
  ],
  checkpoints: [
    { x: 700, y: 440 },
    { x: 1940, y: 320 },
    { x: 2780, y: 280 },
    { x: 1540, y: 120 },
    { x: 580, y: 100 },
  ],
};
