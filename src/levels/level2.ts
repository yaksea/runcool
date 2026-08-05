import type { LevelDef } from './types';

/** 第2关：悬崖下行 —— 从高处出发，终点在谷底偏后。 */
export const level2: LevelDef = {
  id: 'level2',
  index: 2,
  playerStart: { x: 100, y: 120 },
  finish: { x: 180, y: 620 },
  worldWidth: 2600,
  worldHeight: 820,
  threeStarMs: 55000,
  twoStarMs: 90000,
  platforms: [
    // 山顶起点
    { x: 0, y: 200, w: 260, h: 36 },
    { x: 300, y: 240, w: 140, h: 28 },
    { x: 500, y: 280, w: 130, h: 26 },
    // 向右探出再下落
    { x: 720, y: 320, w: 150, h: 26 },
    { x: 960, y: 280, w: 140, h: 26 },
    { x: 1180, y: 340, w: 160, h: 28 },
    { x: 1420, y: 400, w: 140, h: 26 },
    { x: 1640, y: 460, w: 180, h: 28 },
    // 谷底通道（往左回走）
    { x: 1400, y: 560, w: 200, h: 30 },
    { x: 1100, y: 600, w: 180, h: 28 },
    { x: 820, y: 640, w: 160, h: 28 },
    { x: 520, y: 680, w: 180, h: 28 },
    { x: 220, y: 700, w: 220, h: 34 },
    { x: 40, y: 700, w: 160, h: 34 },
    // 旁路高台
    { x: 1680, y: 300, w: 120, h: 24 },
  ],
  ladders: [
    { x: 1700, y: 460, w: 40, h: 120 },
    { x: 560, y: 560, w: 40, h: 140 },
  ],
  seesaws: [{ x: 1300, y: 380, w: 200 }],
  conveyors: [{ x: 1100, y: 640, w: 160, h: 26, dir: -1, speed: 160 }],
  fans: [{ x: 880, y: 480, w: 64, h: 140, force: 16 }],
  crumbles: [
    { x: 640, y: 300, w: 90, h: 22 },
    { x: 1540, y: 560, w: 90, h: 22 },
  ],
  bumpers: [{ x: 1580, y: 450, dir: -1 }],
  spikes: [
    { x: 760, y: 320, count: 4 },
    { x: 1180, y: 600, count: 4 },
    { x: 1280, y: 600, count: 3 },
    { x: 380, y: 680, count: 4 },
    { x: 520, y: 680, count: 3 },
  ],
  flameVents: [
    { x: 1020, y: 280, intervalMs: 700, height: 140 },
    { x: 900, y: 640, intervalMs: 650, height: 145 },
    { x: 1460, y: 560, intervalMs: 750, height: 130 },
  ],
  acidPools: [
    { x: 540, y: 280, w: 84 },
    { x: 660, y: 680, w: 90 },
  ],
  pads: [
    { x: 1000, y: 256 },
    { x: 1480, y: 536 },
  ],
  enemies: [
    { type: 'slime', x: 540, y: 240, patrol: 40 },
    { type: 'hopper', x: 1240, y: 300, patrol: 55 },
    { type: 'slime', x: 900, y: 600, patrol: 50 },
    { type: 'floater', x: 1500, y: 220, patrol: 70 },
  ],
  weapons: [
    { type: 'glove', x: 980, y: 240 },
    { type: 'peashooter', x: 1700, y: 260 },
  ],
  coins: [
    { x: 200, y: 160 },
    { x: 360, y: 200 },
    { x: 780, y: 280 },
    { x: 1220, y: 300 },
    { x: 1680, y: 260, value: 2 },
    { x: 1500, y: 520 },
    { x: 1160, y: 560 },
    { x: 860, y: 600 },
    { x: 300, y: 660, value: 2 },
  ],
  pipe: { x: 1720, y: 300 },
  checkpoints: [
    { x: 720, y: 280 },
    { x: 1640, y: 420 },
    { x: 820, y: 600 },
  ],
};
