import type { LevelDef } from './types';

/** 第11关：西归航线 —— 从东侧高台出发，终点在左方低地；需折返穿越风带与闸门。 */
export const level11: LevelDef = {
  id: 'level11',
  index: 11,
  playerStart: { x: 3020, y: 160 },
  finish: { x: 120, y: 620 },
  worldWidth: 3300,
  worldHeight: 820,
  threeStarMs: 80000,
  twoStarMs: 125000,
  platforms: [
    // 东侧起点
    { x: 2880, y: 240, w: 360, h: 36 },
    { x: 2620, y: 300, w: 160, h: 26 },
    { x: 2360, y: 260, w: 150, h: 26 },
    { x: 2100, y: 320, w: 160, h: 26 },
    { x: 1840, y: 280, w: 150, h: 26 },
    { x: 1580, y: 340, w: 170, h: 28 },
    { x: 1320, y: 400, w: 160, h: 26 },
    { x: 1060, y: 360, w: 150, h: 26 },
    { x: 800, y: 420, w: 160, h: 26 },
    { x: 540, y: 480, w: 170, h: 28 },
    { x: 280, y: 540, w: 180, h: 28 },
    { x: 40, y: 700, w: 260, h: 36 },
    // 中层岔路（可抄近道）
    { x: 2400, y: 460, w: 150, h: 24 },
    { x: 2000, y: 520, w: 160, h: 26 },
    { x: 1600, y: 560, w: 150, h: 26 },
    { x: 1200, y: 600, w: 160, h: 26 },
    { x: 820, y: 640, w: 180, h: 28 },
    { x: 480, y: 660, w: 160, h: 26 },
    // 高空捷径
    { x: 2200, y: 160, w: 140, h: 22 },
    { x: 1800, y: 140, w: 150, h: 22 },
  ],
  ladders: [
    { x: 2700, y: 300, w: 36, h: 180 },
    { x: 1240, y: 400, w: 36, h: 220 },
    { x: 500, y: 540, w: 36, h: 140 },
  ],
  movingPlatforms: [
    { x: 2500, y: 380, w: 100, h: 20, axis: 'y', range: 60, speed: 45 },
    { x: 1400, y: 480, w: 100, h: 20, axis: 'x', range: 80, speed: 55 },
  ],
  conveyors: [
    { id: 'cv11a', x: 1580, y: 340, w: 150, h: 28, dir: -1, speed: 150 },
    { id: 'cv11b', x: 820, y: 640, w: 160, h: 28, dir: 1, speed: 130 },
  ],
  fans: [
    { id: 'fan11', x: 1000, y: 260, w: 60, h: 140, force: 19 },
  ],
    crumbles: [
    { x: 2280, y: 280, w: 80, h: 20 },
    { x: 940, y: 440, w: 80, h: 20 },
  ],
  seesaws: [
    { x: 1900, y: 320, w: 180 },
    { x: 700, y: 520, w: 160 },
  ],
      bumpers: [
    { x: 1650, y: 560, dir: -1 },
  ],
  timedPlatforms: [
    { x: 1720, y: 220, w: 90, h: 18, onMs: 1300, offMs: 750 },
    { x: 400, y: 600, w: 90, h: 18, onMs: 1200, offMs: 700 },
  ],
    
  gates: [
    { id: 'gate11', x: 260, y: 620, w: 26, h: 80 },
  ],
  breakables: [
    { x: 2460, y: 220, w: 48, h: 48, hits: 1 },
    { x: 360, y: 620, w: 48, h: 52, hits: 2 },
  ],
  portals: [
    { id: 'p11a', x: 2240, y: 120, pairId: 'p11b' },
    { id: 'p11b', x: 900, y: 600, pairId: 'p11a' },
  ],
      spikes: [
    { x: 2450, y: 460, count: 3 },
    { x: 1700, y: 560, count: 3 },
    { x: 1373, y: 400, count: 3 },
    { x: 1307, y: 600, count: 3 },
    { x: 340, y: 540, count: 3 },
    { x: 2153, y: 320, count: 3 },
    { x: 587, y: 660, count: 3 },
  ],
      flameVents: [
    { x: 2727, y: 300, intervalMs: 650, height: 145 },
    { x: 2107, y: 520, intervalMs: 750, height: 130 },
    { x: 2940, y: 240, intervalMs: 650, height: 135 },
  ],
      levers: [
    { x: 170, y: 700, targetId: 'gate11', targetType: 'gate' },
    { x: 1850, y: 140, targetId: 'cv11a', targetType: 'conveyor' },
    { x: 1253, y: 600, targetId: 'cv11b', targetType: 'conveyor' },
    { x: 1110, y: 360, targetId: 'fan11', targetType: 'fan' },
  ],
      acidPools: [
    { x: 3060, y: 240, w: 84 },
    { x: 3180, y: 240, w: 88 },
  ],
  pads: [
    { x: 2780, y: 260 },
    { x: 1460, y: 360 },
    { x: 680, y: 440 },
  ],
  enemies: [
    { type: 'slime', x: 2700, y: 260, patrol: 45 },
    { type: 'bat', x: 2450, y: 180, patrol: 60 },
    { type: 'roller', x: 2150, y: 280, patrol: 55 },
    { type: 'hopper', x: 1680, y: 300, patrol: 50 },
    { type: 'spitter', x: 1400, y: 360, patrol: 30 },
    { type: 'chaser', x: 1100, y: 320, patrol: 50 },
    { type: 'ghost', x: 900, y: 380, patrol: 55 },
    { type: 'tank', x: 600, y: 440, patrol: 35 },
    { type: 'floater', x: 1900, y: 100, patrol: 60 },
  ],
  weapons: [
    { type: 'shotgun', x: 2760, y: 200 },
    { type: 'hammer', x: 1500, y: 300 },
    { type: 'fireball', x: 1000, y: 560 },
  ],
  coins: [
    { x: 3000, y: 180 },
    { x: 2500, y: 240 },
    { x: 2100, y: 260 },
    { x: 1700, y: 220, value: 2 },
    { x: 1300, y: 340 },
    { x: 900, y: 360 },
    { x: 560, y: 420 },
    { x: 200, y: 640, value: 2 },
    { x: 2100, y: 480 },
  ],
  pipe: { x: 2040, y: 520 },
  checkpoints: [
    { x: 2580, y: 260 },
    { x: 1580, y: 300 },
    { x: 820, y: 380 },
    { x: 480, y: 620 },
  ],
};
