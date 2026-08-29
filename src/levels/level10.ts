import type { LevelDef } from './types';

/** 第10关：云塔攀升 —— 终点在顶部；窄塔左右折返，喷泉与闪烁台助攀。 */
export const level10: LevelDef = {
  id: 'level10',
  index: 10,
  playerStart: { x: 220, y: 820 },
  finish: { x: 480, y: 60 },
  worldWidth: 1000,
  worldHeight: 1100,
  threeStarMs: 75000,
  twoStarMs: 120000,
  platforms: [
    { x: 80, y: 900, w: 320, h: 40 },
    { x: 480, y: 840, w: 180, h: 28 },
    { x: 120, y: 780, w: 160, h: 26 },
    { x: 500, y: 720, w: 170, h: 26 },
    { x: 140, y: 660, w: 150, h: 26 },
    { x: 480, y: 600, w: 180, h: 26 },
    { x: 120, y: 540, w: 160, h: 26 },
    { x: 500, y: 480, w: 170, h: 26 },
    { x: 140, y: 420, w: 150, h: 26 },
    { x: 480, y: 360, w: 180, h: 26 },
    { x: 160, y: 300, w: 150, h: 26 },
    { x: 500, y: 240, w: 170, h: 26 },
    { x: 200, y: 180, w: 160, h: 26 },
    { x: 380, y: 120, w: 280, h: 32 },
    // 侧翼
    { x: 720, y: 640, w: 120, h: 24 },
    { x: 700, y: 400, w: 130, h: 24 },
  ],
  ladders: [
    { x: 560, y: 720, w: 36, h: 140 },
    { x: 180, y: 420, w: 36, h: 140 },
    { x: 540, y: 240, w: 36, h: 140 },
  ],
  movingPlatforms: [
    { x: 340, y: 800, w: 90, h: 18, axis: 'x', range: 70, speed: 50 },
    { x: 340, y: 520, w: 90, h: 18, axis: 'x', range: 80, speed: 55 },
    { x: 340, y: 280, w: 90, h: 18, axis: 'y', range: 45, speed: 40 },
  ],
  conveyors: [
    { id: 'cv10', x: 480, y: 840, w: 150, h: 26, dir: -1, speed: 130 },
  ],
  fans: [{ id: 'fan10', x: 360, y: 380, w: 56, h: 130, force: 20 }],
    crumbles: [
    { x: 300, y: 700, w: 80, h: 18 },
    { x: 320, y: 460, w: 80, h: 18 },
  ],
  timedPlatforms: [
    { x: 340, y: 620, w: 90, h: 18, onMs: 1200, offMs: 700 },
    { x: 340, y: 340, w: 90, h: 18, onMs: 1100, offMs: 650 },
  ],
  
  acidPools: [
    { x: 540, y: 360, w: 86 },
  ],
  seesaws: [{ x: 360, y: 560, w: 160 }],
  
  gates: [{ id: 'gate10', x: 460, y: 80, w: 26, h: 70 }],
      levers: [
    { x: 307, y: 180, targetId: 'gate10', targetType: 'gate' },
    { x: 613, y: 720, targetId: 'cv10', targetType: 'conveyor' },
    { x: 227, y: 540, targetId: 'fan10', targetType: 'fan' },
  ],
  breakables: [
    { x: 200, y: 620, w: 44, h: 48, hits: 1 },
    { x: 560, y: 200, w: 48, h: 50, hits: 2 },
  ],
  portals: [
    { id: 'p10a', x: 780, y: 600, pairId: 'p10b' },
    { id: 'p10b', x: 760, y: 360, pairId: 'p10a' },
  ],
  spikes: [
    { x: 557, y: 480, count: 3 },
    { x: 190, y: 420, count: 3 },
    { x: 548, y: 120, count: 3 },
  ],
  pads: [
    { x: 600, y: 680 },
    { x: 200, y: 380 },
    { x: 580, y: 200 },
  ],
  enemies: [
    { type: 'slime', x: 560, y: 800, patrol: 40 },
    { type: 'hopper', x: 200, y: 740, patrol: 40 },
    { type: 'bat', x: 360, y: 580, patrol: 55 },
    { type: 'roller', x: 560, y: 560, patrol: 50 },
    { type: 'floater', x: 360, y: 440, patrol: 50 },
    { type: 'spitter', x: 220, y: 380, patrol: 28 },
    { type: 'ghost', x: 560, y: 200, patrol: 45 },
    { type: 'chaser', x: 260, y: 140, patrol: 40 },
    { type: 'slime', x: 760, y: 640, patrol: 40 },
    { type: 'hopper', x: 400, y: 300, patrol: 35 },
  ],
  weapons: [
    { type: 'glove', x: 200, y: 740 },
    { type: 'fireball', x: 560, y: 440 },
    { type: 'peashooter', x: 260, y: 140 },
  ],
  coins: [
    { x: 180, y: 840 },
    { x: 560, y: 780 },
    { x: 200, y: 620 },
    { x: 560, y: 540 },
    { x: 200, y: 380, value: 2 },
    { x: 560, y: 300 },
    { x: 320, y: 140, value: 2 },
    { x: 760, y: 560 },
  ],
  pipe: { x: 760, y: 640 },
  checkpoints: [
    { x: 200, y: 740 },
    { x: 540, y: 560 },
    { x: 220, y: 260 },
  ],
};
