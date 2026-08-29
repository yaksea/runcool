import type { LevelDef } from './types';

/** 第5关：峡谷坠落 —— 先右后下，终点在深层右侧洞穴。 */
export const level5: LevelDef = {
  id: 'level5',
  index: 5,
  playerStart: { x: 80, y: 160 },
  finish: { x: 2680, y: 680 },
  worldWidth: 3000,
  worldHeight: 900,
  threeStarMs: 75000,
  twoStarMs: 120000,
  platforms: [
    // 上层向右
    { x: 0, y: 240, w: 220, h: 36 },
    { x: 280, y: 280, w: 140, h: 26 },
    { x: 500, y: 240, w: 150, h: 26 },
    { x: 740, y: 280, w: 160, h: 28 },
    { x: 980, y: 220, w: 180, h: 28 },
    { x: 1240, y: 260, w: 140, h: 26 },
    // 中部落口
    { x: 1480, y: 320, w: 120, h: 24 },
    { x: 1480, y: 480, w: 140, h: 26 },
    { x: 1280, y: 560, w: 160, h: 26 },
    { x: 1040, y: 620, w: 150, h: 26 },
    // 谷底向右（深处）
    { x: 1280, y: 720, w: 180, h: 30 },
    { x: 1560, y: 760, w: 160, h: 28 },
    { x: 1820, y: 720, w: 170, h: 28 },
    { x: 2100, y: 760, w: 160, h: 28 },
    { x: 2360, y: 720, w: 180, h: 28 },
    { x: 2580, y: 760, w: 260, h: 36 },
    // 旁路
    { x: 1680, y: 520, w: 140, h: 24 },
    { x: 2000, y: 480, w: 130, h: 24 },
  ],
  ladders: [
    { x: 1520, y: 320, w: 40, h: 180 },
    { x: 1100, y: 560, w: 40, h: 120 },
  ],
  seesaws: [{ x: 900, y: 260, w: 200 }],
  conveyors: [
    { id: 'cv5a', x: 740, y: 360, w: 150, h: 26, dir: 1, speed: 180 },
    { id: 'cv5b', x: 1820, y: 800, w: 160, h: 26, dir: -1, speed: 170 },
  ],
  fans: [
    { id: 'fan5a', x: 1360, y: 360, w: 60, h: 160, force: 19 },
    { id: 'fan5b', x: 2200, y: 560, w: 60, h: 140, force: 17 },
  ],
  portals: [
    { id: 'p5a', x: 1100, y: 180, pairId: 'p5b' },
    { id: 'p5b', x: 1900, y: 680, pairId: 'p5a' },
  ],
  geysers: [
    { x: 550, y: 240, intervalMs: 1400, force: 780 },
  ],
  flameVents: [
    { x: 1287, y: 260, intervalMs: 700, height: 145 },
    { x: 1560, y: 320, intervalMs: 650, height: 150 },
    { x: 2207, y: 760, intervalMs: 700, height: 140 },
    { x: 2043, y: 480, intervalMs: 750, height: 130 },
  ],
  acidPools: [
    { x: 1667, y: 760, w: 90 },
    { x: 2645, y: 760, w: 80 },
    { x: 2775, y: 760, w: 86 },
  ],
  timedPlatforms: [
    { x: 1600, y: 600, w: 100, h: 20, onMs: 1200, offMs: 700 },
    { x: 2300, y: 640, w: 100, h: 20, onMs: 1100, offMs: 750 },
  ],
  gates: [{ id: 'gate5a', x: 2500, y: 640, w: 26, h: 100 }],
      levers: [
    { x: 2420, y: 720, targetId: 'gate5a', targetType: 'gate' },
    { x: 1090, y: 620, targetId: 'cv5a', targetType: 'conveyor' },
    { x: 1573, y: 480, targetId: 'fan5a', targetType: 'fan' },
  ],
  breakables: [
    { x: 1320, y: 480, w: 48, h: 56, hits: 1 },
    { x: 2000, y: 680, w: 52, h: 58, hits: 2 },
  ],
    crumbles: [
    { x: 620, y: 260, w: 90, h: 22 },
  ],
    
      spikes: [
    { x: 373, y: 280, count: 4 },
    { x: 1400, y: 720, count: 4 },
    { x: 1773, y: 520, count: 3 },
    { x: 1140, y: 620, count: 3 },
  ],
  pads: [
    { x: 1020, y: 196 },
    { x: 1500, y: 456 },
    { x: 2160, y: 736 },
  ],
  enemies: [
    { type: 'slime', x: 360, y: 240, patrol: 40 },
    { type: 'bat', x: 800, y: 160, patrol: 70 },
    { type: 'chaser', x: 1100, y: 180, patrol: 70 },
    { type: 'hopper', x: 1360, y: 440, patrol: 50 },
    { type: 'roller', x: 1200, y: 680, patrol: 60 },
    { type: 'spitter', x: 1680, y: 680, patrol: 30 },
    { type: 'ghost', x: 2000, y: 420, patrol: 55 },
    { type: 'tank', x: 2500, y: 680, patrol: 45 },
  ],
  weapons: [
    { type: 'shotgun', x: 1000, y: 180 },
    { type: 'fireball', x: 1500, y: 440 },
    { type: 'hammer', x: 2200, y: 680 },
  ],
  coins: [
    { x: 320, y: 240 },
    { x: 560, y: 200 },
    { x: 820, y: 240 },
    { x: 1060, y: 180, value: 2 },
    { x: 1520, y: 280 },
    { x: 1340, y: 520 },
    { x: 1360, y: 680 },
    { x: 1640, y: 720 },
    { x: 1900, y: 680 },
    { x: 2200, y: 720, value: 2 },
    { x: 2660, y: 720, value: 3 },
  ],
  pipe: { x: 100, y: 240 },
  checkpoints: [
    { x: 740, y: 240 },
    { x: 1480, y: 440 },
    { x: 1280, y: 680 },
    { x: 2100, y: 720 },
  ],
};
