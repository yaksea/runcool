import type { LevelDef } from './types';

/** Finale: layered routes with ladders/seesaws/movers; more checkpoints, still fair. */
export const level3: LevelDef = {
  id: 'level3',
  index: 3,
  playerStart: { x: 80, y: 440 },
  finish: { x: 4880, y: 100 },
  worldWidth: 5100,
  worldHeight: 860,
  threeStarMs: 75000,
  twoStarMs: 120000,
  platforms: [
    { x: 0, y: 540, w: 260, h: 60 },
    { x: 240, y: 490, w: 120, h: 36 },
    { x: 340, y: 440, w: 120, h: 36 },
    { x: 440, y: 390, w: 160, h: 32 },
    // High balcony + ladder
    { x: 440, y: 220, w: 180, h: 28 },
    // Zigzag terraces; 700/1960/3860 are conveyors
    { x: 920, y: 380, w: 130, h: 26 },
    { x: 1120, y: 340, w: 130, h: 26 },
    { x: 1320, y: 380, w: 150, h: 28 },
    { x: 1320, y: 240, w: 120, h: 24 },
    // Seesaw valley
    { x: 1680, y: 360, w: 160, h: 28 },
    // Multi-layer mid
    { x: 2220, y: 340, w: 140, h: 26 },
    { x: 2220, y: 480, w: 160, h: 32 },
    { x: 2460, y: 420, w: 130, h: 26 },
    { x: 2660, y: 360, w: 130, h: 26 },
    // Ladder tower
    { x: 2900, y: 500, w: 180, h: 36 },
    { x: 2900, y: 320, w: 160, h: 28 },
    { x: 2900, y: 160, w: 180, h: 28 },
    // Sky steps
    { x: 3180, y: 220, w: 120, h: 24 },
    { x: 3380, y: 180, w: 120, h: 24 },
    { x: 3580, y: 240, w: 140, h: 28 },
    // Lower recovery path
    { x: 3580, y: 420, w: 180, h: 30 },
    { x: 4060, y: 300, w: 130, h: 26 },
    { x: 4260, y: 240, w: 130, h: 26 },
    { x: 4460, y: 180, w: 140, h: 28 },
    { x: 4660, y: 140, w: 320, h: 36 },
  ],
  movingPlatforms: [
    { x: 1520, y: 280, w: 120, h: 22, axis: 'x', range: 120, speed: 60 },
    { x: 2500, y: 280, w: 110, h: 22, axis: 'y', range: 80, speed: 50 },
    { x: 3780, y: 200, w: 110, h: 22, axis: 'x', range: 100, speed: 55 },
  ],
  ladders: [
    { x: 500, y: 220, w: 40, h: 170 },
    { x: 1380, y: 240, w: 40, h: 140 },
    { x: 2280, y: 340, w: 40, h: 140 },
    { x: 2980, y: 160, w: 40, h: 340 },
    { x: 3640, y: 240, w: 40, h: 180 },
  ],
  seesaws: [
    { x: 1580, y: 380, w: 210 },
    { x: 2800, y: 360, w: 200 },
    { x: 4200, y: 280, w: 190 },
  ],
  conveyors: [
    { x: 700, y: 420, w: 150, h: 30, dir: 1, speed: 155 },
    { x: 1960, y: 400, w: 180, h: 32, dir: -1, speed: 145 },
    { x: 3860, y: 360, w: 130, h: 26, dir: 1, speed: 150 },
  ],
  fans: [
    { x: 1040, y: 180, w: 70, h: 200, force: 19 },
    { x: 2360, y: 160, w: 70, h: 220, force: 21 },
    { x: 4520, y: 40, w: 64, h: 160, force: 18 },
  ],
  crumbles: [
    { x: 1020, y: 360, w: 100, h: 24 },
    { x: 2560, y: 400, w: 100, h: 24 },
    { x: 3280, y: 200, w: 100, h: 22 },
  ],
  bumpers: [
    { x: 1480, y: 350, dir: 1 },
    { x: 2740, y: 330, dir: -1 },
    { x: 4000, y: 270, dir: 1 },
  ],
  spikes: [
    { x: 760, y: 420, count: 2 },
    { x: 2020, y: 400, count: 2 },
    { x: 2960, y: 500, count: 2 },
    { x: 3640, y: 420, count: 2 },
  ],
  pads: [
    { x: 1360, y: 356 },
    { x: 2500, y: 396 },
    { x: 3420, y: 156 },
    { x: 4100, y: 276 },
  ],
  enemies: [
    { type: 'slime', x: 760, y: 380, patrol: 45 },
    { type: 'floater', x: 1180, y: 260, patrol: 80 },
    { type: 'spikeball', x: 2040, y: 360, patrol: 35 },
    { type: 'slime', x: 2700, y: 320, patrol: 40 },
    { type: 'floater', x: 3100, y: 120, patrol: 70 },
    { type: 'spikeball', x: 3620, y: 380, patrol: 35 },
    { type: 'slime', x: 4300, y: 200, patrol: 45 },
    { type: 'floater', x: 4780, y: 60, patrol: 60 },
  ],
  weapons: [
    { type: 'glove', x: 480, y: 180 },
    { type: 'peashooter', x: 2000, y: 360 },
    { type: 'peashooter', x: 2940, y: 120 },
  ],
  checkpoints: [
    { x: 700, y: 380 },
    { x: 1680, y: 320 },
    { x: 2460, y: 380 },
    { x: 2900, y: 460 },
    { x: 3580, y: 200 },
    { x: 4260, y: 200 },
  ],
};
