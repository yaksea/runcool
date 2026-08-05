import type { LevelDef } from './types';

/**
 * 新手关：展厅式线性关卡。
 * 操作 → 武器 → 怪物（连续地板）→ 机关（一格一个，互不重叠）→ 终点。
 */
export const levelTutorial: LevelDef = {
  id: 'tutorial',
  index: 0,
  playerStart: { x: 80, y: 520 },
  finish: { x: 7020, y: 480 },
  worldWidth: 7300,
  worldHeight: 720,
  threeStarMs: 240000,
  twoStarMs: 360000,

  platforms: [
    // —— 1. 操作区 ——
    { x: 0, y: 600, w: 560, h: 48 },
    { x: 600, y: 560, w: 120, h: 28 },
    { x: 760, y: 520, w: 140, h: 28 },

    // —— 2. 武器区 ——
    { x: 960, y: 600, w: 760, h: 48 },
    { x: 1000, y: 520, w: 90, h: 22 },
    { x: 1140, y: 520, w: 90, h: 22 },
    { x: 1280, y: 520, w: 90, h: 22 },
    { x: 1420, y: 520, w: 90, h: 22 },
    { x: 1560, y: 520, w: 90, h: 22 },

    // —— 3. 怪物区：一整条地面，怪不会掉崖 ——
    { x: 1780, y: 600, w: 1400, h: 48 },
    // 中层展台（跳板可上，高度够得着）
    { x: 1860, y: 500, w: 200, h: 22 },
    { x: 2140, y: 500, w: 200, h: 22 },
    { x: 2420, y: 500, w: 200, h: 22 },
    { x: 2700, y: 500, w: 200, h: 22 },
    { x: 1840, y: 550, w: 60, h: 16 },
    { x: 2120, y: 550, w: 60, h: 16 },
    { x: 2400, y: 550, w: 60, h: 16 },
    { x: 2680, y: 550, w: 60, h: 16 },
    { x: 1720, y: 560, w: 70, h: 22 },
    { x: 3160, y: 560, w: 80, h: 22 },

    // —— 4. 机关区：每格约 280px，一格只放一种 ——
    // 4.1 可破坏方块
    { x: 3280, y: 600, w: 260, h: 48 },
    // 4.2 易碎平台（前后落地）
    { x: 3580, y: 600, w: 80, h: 48 },
    { x: 3820, y: 600, w: 80, h: 48 },
    // 4.3 跷跷板
    { x: 3940, y: 600, w: 260, h: 48 },
    // 4.4 尖刺（上层可绕）
    { x: 4240, y: 600, w: 260, h: 48 },
    { x: 4280, y: 520, w: 180, h: 22 },
    // 4.5 传送带 + 专属杠杆台
    { x: 4540, y: 600, w: 260, h: 48 },
    { x: 4700, y: 520, w: 70, h: 20 },
    // 4.6 弹射器
    { x: 4840, y: 600, w: 260, h: 48 },
    // 4.7 移动平台（两端落脚）
    { x: 5140, y: 600, w: 90, h: 48 },
    { x: 5380, y: 600, w: 90, h: 48 },
    // 4.8 闪烁平台（两端落脚）
    { x: 5520, y: 600, w: 90, h: 48 },
    { x: 5760, y: 600, w: 90, h: 48 },
    // 4.9 喷泉
    { x: 5900, y: 600, w: 260, h: 48 },
  // 4.10 风扇 + 杠杆台（杠杆放风扇旁）
  { x: 6200, y: 600, w: 260, h: 48 },
  { x: 6340, y: 520, w: 80, h: 20 },
    // 4.11 闸门 + 杠杆（先杠杆后闸门）
    { x: 6500, y: 600, w: 300, h: 48 },
    // 4.12 传送门落脚（两扇分开）
    { x: 6840, y: 600, w: 140, h: 48 },
    { x: 7080, y: 520, w: 180, h: 28 },
    // 闸门后 → 管道 / 终点
    { x: 6760, y: 560, w: 80, h: 24 },
  ],

  // 4.7 移动平台单独一格
  movingPlatforms: [{ x: 5260, y: 560, w: 100, h: 20, axis: 'x', range: 50, speed: 45 }],

  ladders: [{ x: 740, y: 520, w: 36, h: 100 }],

  // 4.3
  seesaws: [{ x: 4070, y: 560, w: 150 }],

  // 4.5
  conveyors: [{ x: 4560, y: 600, w: 180, h: 28, dir: 1, speed: 90, id: 'tut_belt' }],

  // 4.10
  fans: [{ x: 6360, y: 480, w: 70, h: 120, force: 500, id: 'tut_fan' }],

  // 4.2
  crumbles: [{ x: 3680, y: 560, w: 100, h: 20, shakeMs: 500, goneMs: 1800 }],

  // 4.6
  bumpers: [{ x: 4970, y: 560, dir: 1 }],

  // 4.12 两扇门分开放
  portals: [
    { id: 'tut_a', x: 6910, y: 560, pairId: 'tut_b' },
    { id: 'tut_b', x: 7160, y: 480, pairId: 'tut_a' },
  ],

  // 4.9
  geysers: [{ x: 6030, y: 600, intervalMs: 2200, force: 600 }],
  // 喷火口 / 酸液：与尖刺、喷泉、传送带错开，一格一种
  flameVents: [
    { x: 1680, y: 600, intervalMs: 700, height: 150 },
    { x: 4350, y: 520, intervalMs: 650, height: 140 },
    { x: 6145, y: 600, intervalMs: 700, height: 140 },
  ],
  acidPools: [
    { x: 1520, y: 600, w: 96 },
    { x: 2100, y: 600, w: 90 },
    { x: 5800, y: 600, w: 88 },
  ],

  // 4.8
  timedPlatforms: [{ x: 5640, y: 560, w: 100, h: 20, onMs: 1600, offMs: 1200, startOn: true }],

  // 4.11
  gates: [{ id: 'tut_gate', x: 6720, y: 520, w: 28, h: 80, open: false }],
  levers: [
    { x: 4735, y: 480, targetId: 'tut_belt', targetType: 'conveyor' },
    { x: 6380, y: 480, targetId: 'tut_fan', targetType: 'fan' },
    { x: 6580, y: 560, targetId: 'tut_gate', targetType: 'gate' },
  ],

  // 4.1
  breakables: [{ x: 3380, y: 540, w: 56, h: 56, hits: 1 }],

  spikes: [
    { x: 360, y: 600, count: 4 },
    { x: 480, y: 600, count: 3 },
    // 4.4 尖刺格（地面；上层留给喷火口）
    { x: 4280, y: 600, count: 5 },
    { x: 4400, y: 600, count: 4 },
    { x: 2360, y: 600, count: 4 },
    { x: 2620, y: 600, count: 4 },
  ],

  pads: [
    { x: 640, y: 520 },
    { x: 1880, y: 560 },
    { x: 2160, y: 560 },
    { x: 2440, y: 560 },
    { x: 2720, y: 560 },
  ],

  enemies: [
    { type: 'slime', x: 1900, y: 560, patrol: 40 },
    { type: 'hopper', x: 2100, y: 560, patrol: 36 },
    { type: 'spikeball', x: 2300, y: 560, patrol: 40 },
    { type: 'roller', x: 2500, y: 560, patrol: 44 },
    { type: 'chaser', x: 2700, y: 560, patrol: 40 },
    { type: 'tank', x: 2900, y: 560, patrol: 32 },
    { type: 'floater', x: 1960, y: 450, patrol: 48 },
    { type: 'bat', x: 2240, y: 450, patrol: 48 },
    { type: 'ghost', x: 2520, y: 450, patrol: 44 },
    { type: 'spitter', x: 2800, y: 460, patrol: 36 },
  ],

  weapons: [
    { type: 'glove', x: 1040, y: 480 },
    { type: 'peashooter', x: 1180, y: 480 },
    { type: 'hammer', x: 1320, y: 480 },
    { type: 'fireball', x: 1460, y: 480 },
    { type: 'shotgun', x: 1600, y: 480 },
  ],

  coins: [
    { x: 220, y: 540 },
    { x: 680, y: 460 },
    { x: 1200, y: 460 },
    { x: 2000, y: 450 },
    { x: 3400, y: 520 },
    { x: 4100, y: 520 },
    { x: 5000, y: 520 },
    { x: 6050, y: 480 },
    { x: 7000, y: 460, value: 2 },
  ],

  pipe: { x: 6980, y: 560 },

  checkpoints: [
    // Sit on continuous ground slabs — never over gaps / cliffs.
    { x: 400, y: 560 },
    { x: 1300, y: 560 },
    { x: 2500, y: 560 },
    { x: 4640, y: 560 },
    { x: 6620, y: 560 },
  ],
};
