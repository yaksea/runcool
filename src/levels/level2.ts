import type { LevelDef } from './types';

/** Rhythm level: folds, ladders, seesaws; denser checkpoints; friendly gaps. */
export const level2: LevelDef = {
  id: 'level2',
  index: 2,
  playerStart: { x: 80, y: 420 },
  finish: { x: 4280, y: 120 },
  worldWidth: 4500,
  worldHeight: 800,
  threeStarMs: 60000,
  twoStarMs: 95000,
  platforms: [
    { x: 0, y: 520, w: 280, h: 60 },
    { x: 260, y: 470, w: 130, h: 36 },
    { x: 380, y: 420, w: 130, h: 36 },
    { x: 500, y: 370, w: 160, h: 32 },
    // Upper shelf via ladder
    { x: 500, y: 220, w: 200, h: 28 },
    // Island chain (wider); 760/2060 are conveyors
    { x: 1000, y: 360, w: 120, h: 26 },
    { x: 1200, y: 320, w: 120, h: 26 },
    { x: 1400, y: 360, w: 140, h: 28 },
    // Seesaw bridge zone
    { x: 1780, y: 340, w: 160, h: 28 },
    // Fold down / terrace
    { x: 2320, y: 440, w: 160, h: 32 },
    { x: 2320, y: 280, w: 140, h: 26 },
    { x: 2560, y: 360, w: 130, h: 26 },
    { x: 2760, y: 300, w: 130, h: 26 },
    // Second ladder climb
    { x: 3000, y: 460, w: 180, h: 36 },
    { x: 3000, y: 200, w: 200, h: 28 },
    // Narrow-ish but still fair
    { x: 3300, y: 260, w: 110, h: 24 },
    { x: 3500, y: 220, w: 110, h: 24 },
    { x: 3700, y: 180, w: 140, h: 28 },
    { x: 3960, y: 160, w: 360, h: 36 },
  ],
  movingPlatforms: [
    { x: 1600, y: 300, w: 120, h: 22, axis: 'x', range: 100, speed: 55 },
  ],
  ladders: [
    { x: 560, y: 220, w: 40, h: 150 },
    { x: 2380, y: 280, w: 40, h: 160 },
    { x: 3080, y: 200, w: 40, h: 260 },
  ],
  seesaws: [
    { x: 1660, y: 360, w: 200 },
    { x: 2900, y: 320, w: 190 },
  ],
  conveyors: [
    { x: 760, y: 400, w: 160, h: 32, dir: 1, speed: 150 },
    { x: 2060, y: 380, w: 180, h: 32, dir: -1, speed: 140 },
  ],
  fans: [
    { x: 2480, y: 200, w: 70, h: 180, force: 20 },
    { x: 3620, y: 80, w: 64, h: 140, force: 17 },
  ],
  crumbles: [
    { x: 1100, y: 340, w: 100, h: 24 },
    { x: 2680, y: 320, w: 100, h: 24 },
  ],
  bumpers: [
    { x: 1540, y: 330, dir: 1 },
    { x: 3240, y: 230, dir: 1 },
  ],
  spikes: [
    { x: 820, y: 400, count: 2 },
    { x: 2120, y: 380, count: 2 },
    { x: 3360, y: 260, count: 2 },
  ],
  pads: [
    { x: 1440, y: 336 },
    { x: 2600, y: 336 },
    { x: 3540, y: 196 },
  ],
  enemies: [
    { type: 'slime', x: 820, y: 360, patrol: 50 },
    { type: 'floater', x: 1260, y: 240, patrol: 90 },
    { type: 'spikeball', x: 2140, y: 340, patrol: 40 },
    { type: 'slime', x: 2800, y: 260, patrol: 45 },
    { type: 'floater', x: 3400, y: 180, patrol: 70 },
    { type: 'slime', x: 4100, y: 120, patrol: 55 },
  ],
  weapons: [
    { type: 'glove', x: 540, y: 180 },
    { type: 'peashooter', x: 2100, y: 340 },
  ],
  checkpoints: [
    { x: 760, y: 360 },
    { x: 1780, y: 300 },
    { x: 2560, y: 320 },
    { x: 3000, y: 420 },
    { x: 3700, y: 140 },
  ],
};
