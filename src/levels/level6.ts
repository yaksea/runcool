import type { LevelDef } from './types';

/** 第6关：环状回廊 —— 绕一圈，终点在起点左后方高台。 */
export const level6: LevelDef = {
  id: 'level6',
  index: 6,
  playerStart: { x: 400, y: 480 },
  finish: { x: 120, y: 120 },
  worldWidth: 2800,
  worldHeight: 820,
  threeStarMs: 80000,
  twoStarMs: 125000,
  platforms: [
    // 中心出发台
    { x: 300, y: 560, w: 220, h: 34 },
    // 向右外环
    { x: 580, y: 520, w: 150, h: 26 },
    { x: 800, y: 480, w: 160, h: 26 },
    { x: 1040, y: 520, w: 150, h: 26 },
    { x: 1280, y: 460, w: 170, h: 28 },
    { x: 1540, y: 500, w: 160, h: 26 },
    { x: 1800, y: 440, w: 180, h: 28 },
    { x: 2080, y: 400, w: 200, h: 30 },
    // 右端上折
    { x: 2140, y: 260, w: 160, h: 26 },
    { x: 1860, y: 220, w: 160, h: 24 },
    { x: 1560, y: 240, w: 150, h: 24 },
    { x: 1260, y: 200, w: 160, h: 24 },
    { x: 960, y: 220, w: 150, h: 24 },
    { x: 660, y: 180, w: 160, h: 24 },
    { x: 360, y: 200, w: 150, h: 24 },
    // 终点：起点左后方上方
    { x: 40, y: 180, w: 220, h: 30 },
    // 内环捷径
    { x: 900, y: 360, w: 140, h: 24 },
    { x: 1200, y: 320, w: 130, h: 24 },
  ],
  ladders: [
    { x: 2160, y: 260, w: 40, h: 160 },
    { x: 100, y: 180, w: 40, h: 200 },
  ],
  seesaws: [
    { x: 1180, y: 500, w: 200 },
    { x: 1500, y: 230, w: 180 },
  ],
  conveyors: [
    { id: 'cv6a', x: 800, y: 560, w: 150, h: 26, dir: 1, speed: 180 },
    { id: 'cv6b', x: 1560, y: 280, w: 140, h: 24, dir: -1, speed: 160 },
  ],
  fans: [
    { id: 'fan6a', x: 1700, y: 280, w: 64, h: 150, force: 20 },
    { id: 'fan6b', x: 500, y: 80, w: 60, h: 120, force: 16 },
  ],
  portals: [
    { id: 'p6a', x: 2100, y: 360, pairId: 'p6b' },
    { id: 'p6b', x: 700, y: 160, pairId: 'p6a' },
  ],
    
  timedPlatforms: [
    { x: 1700, y: 340, w: 100, h: 20, onMs: 1100, offMs: 700 },
    { x: 500, y: 280, w: 100, h: 20, onMs: 1200, offMs: 750 },
  ],
  gates: [
    { id: 'gate6a', x: 200, y: 80, w: 26, h: 90 },
  ],
      levers: [
    { x: 150, y: 180, targetId: 'gate6a', targetType: 'gate' },
    { x: 907, y: 480, targetId: 'cv6a', targetType: 'conveyor' },
    { x: 1647, y: 500, targetId: 'fan6a', targetType: 'fan' },
  ],
  breakables: [
    { x: 1320, y: 400, w: 48, h: 56, hits: 1 },
    { x: 1000, y: 160, w: 50, h: 54, hits: 2 },
    { x: 280, y: 140, w: 48, h: 52, hits: 1 },
  ],
    crumbles: [
    { x: 680, y: 500, w: 90, h: 22 },
  ],
        bumpers: [
    { x: 410, y: 200, dir: 1 },
  ],
      spikes: [
    { x: 947, y: 360, count: 3 },
    { x: 1660, y: 240, count: 3 },
    { x: 1913, y: 220, count: 3 },
    { x: 460, y: 200, count: 3 },
    { x: 2213, y: 400, count: 3 },
    { x: 1287, y: 320, count: 3 },
  ],
        flameVents: [
    { x: 1313, y: 200, intervalMs: 700, height: 145 },
    { x: 1920, y: 440, intervalMs: 650, height: 150 },
    { x: 2193, y: 260, intervalMs: 700, height: 130 },
    { x: 465, y: 560, intervalMs: 750, height: 135 },
  ],
        acidPools: [
    { x: 355, y: 560, w: 84 },
  ],
  geysers: [
    { x: 618, y: 520, intervalMs: 1600, force: 720 },
  ],
  pads: [
    { x: 1100, y: 496 },
    { x: 1600, y: 216 },
    { x: 400, y: 176 },
  ],
  enemies: [
    { type: 'chaser', x: 700, y: 480, patrol: 70 },
    { type: 'hopper', x: 1200, y: 420, patrol: 55 },
    { type: 'bat', x: 1600, y: 360, patrol: 80 },
    { type: 'roller', x: 2000, y: 360, patrol: 60 },
    { type: 'spitter', x: 1900, y: 180, patrol: 30 },
    { type: 'ghost', x: 1300, y: 160, patrol: 60 },
    { type: 'tank', x: 800, y: 140, patrol: 40 },
    { type: 'floater', x: 500, y: 100, patrol: 50 },
  ],
  weapons: [
    { type: 'shotgun', x: 1320, y: 420 },
    { type: 'fireball', x: 2180, y: 220 },
    { type: 'hammer', x: 700, y: 140 },
  ],
  coins: [
    { x: 420, y: 520 },
    { x: 860, y: 440 },
    { x: 1320, y: 420 },
    { x: 1860, y: 400 },
    { x: 2160, y: 220, value: 2 },
    { x: 1600, y: 200 },
    { x: 1000, y: 180 },
    { x: 700, y: 140 },
    { x: 400, y: 160 },
    { x: 120, y: 140, value: 3 },
  ],
  pipe: { x: 2220, y: 260 },
  checkpoints: [
    { x: 1040, y: 480 },
    { x: 2080, y: 360 },
    { x: 1560, y: 200 },
    { x: 660, y: 140 },
  ],
};
