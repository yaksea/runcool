import type { LevelDef } from './types';

/** 第1关：台阶教学 —— 先向右，再爬到高台终点（终点在上方）。 */
export const level1: LevelDef = {
  id: 'level1',
  index: 1,
  playerStart: { x: 80, y: 520 },
  finish: { x: 520, y: 90 },
  worldWidth: 2200,
  worldHeight: 720,
  threeStarMs: 45000,
  twoStarMs: 75000,
  platforms: [
    // 起点低地
    { x: 0, y: 600, w: 280, h: 50 },
    { x: 300, y: 560, w: 140, h: 30 },
    { x: 480, y: 520, w: 140, h: 28 },
    { x: 680, y: 480, w: 160, h: 28 },
    // 右侧尽头平台（提示要折返往上）
    { x: 920, y: 440, w: 220, h: 32 },
    { x: 1200, y: 400, w: 160, h: 28 },
    { x: 1420, y: 360, w: 200, h: 30 },
    // 回走的中层
    { x: 1100, y: 280, w: 180, h: 26 },
    { x: 860, y: 240, w: 160, h: 26 },
    { x: 620, y: 200, w: 160, h: 26 },
    // 终点高台（在地图偏左上方）
    { x: 380, y: 160, w: 280, h: 32 },
    { x: 200, y: 220, w: 120, h: 24 },
  ],
  ladders: [
    { x: 1480, y: 360, w: 40, h: 140 },
    { x: 640, y: 200, w: 40, h: 160 },
  ],
  conveyors: [{ x: 920, y: 520, w: 180, h: 28, dir: 1, speed: 140 }],
  crumbles: [{ x: 820, y: 480, w: 90, h: 22 }],
  spikes: [
    { x: 720, y: 480, count: 4 },
    { x: 1240, y: 400, count: 4 },
    { x: 900, y: 240, count: 3 },
  ],
  flameVents: [
    { x: 1000, y: 440, intervalMs: 700, height: 145 },
    { x: 1480, y: 360, intervalMs: 650, height: 140 },
  ],
  acidPools: [
    { x: 540, y: 520, w: 88 },
    { x: 1180, y: 280, w: 80 },
  ],
  pads: [{ x: 1120, y: 256 }],
  enemies: [
    { type: 'slime', x: 720, y: 440, patrol: 50 },
    { type: 'slime', x: 1300, y: 360, patrol: 45 },
  ],
  weapons: [{ type: 'glove', x: 1500, y: 320 }],
  coins: [
    { x: 340, y: 520 },
    { x: 520, y: 480 },
    { x: 720, y: 440 },
    { x: 1000, y: 400 },
    { x: 1260, y: 360 },
    { x: 1480, y: 300, value: 2 },
    { x: 1120, y: 240 },
    { x: 880, y: 200 },
    { x: 500, y: 120, value: 2 },
  ],
  pipe: { x: 1550, y: 360 },
  checkpoints: [
    { x: 700, y: 440 },
    { x: 1420, y: 320 },
    { x: 900, y: 200 },
  ],
};
