import type { LevelDef } from './types';

/** Teaching level: varied terrain + ladder/seesaw, dense checkpoints, easy gaps. */
export const level1: LevelDef = {
  id: 'level1',
  index: 1,
  playerStart: { x: 80, y: 400 },
  finish: { x: 3680, y: 140 },
  worldWidth: 3900,
  worldHeight: 740,
  threeStarMs: 50000,
  twoStarMs: 80000,
  platforms: [
    // Start terrace
    { x: 0, y: 500, w: 320, h: 60 },
    { x: 280, y: 460, w: 140, h: 36 },
    { x: 400, y: 420, w: 140, h: 36 },
    // Mid shelf + ladder climb area base/top (low path is a conveyor)
    { x: 560, y: 300, w: 180, h: 28 },
    { x: 820, y: 460, w: 200, h: 36 },
    // Stepping stones (generous) + crumble between
    { x: 1080, y: 420, w: 130, h: 28 },
    { x: 1280, y: 380, w: 130, h: 28 },
    { x: 1480, y: 420, w: 160, h: 32 },
    // Seesaw landing
    { x: 1880, y: 400, w: 180, h: 32 },
    // Drop then rise with alcove
    { x: 2140, y: 460, w: 200, h: 36 },
    { x: 2140, y: 320, w: 120, h: 24 },
    { x: 2420, y: 400, w: 140, h: 28 },
    { x: 2620, y: 360, w: 140, h: 28 },
    // Ladder shaft bottoms/tops
    { x: 2840, y: 480, w: 160, h: 36 },
    { x: 2840, y: 220, w: 200, h: 28 },
    // Finish approach
    { x: 3140, y: 280, w: 140, h: 28 },
    { x: 3340, y: 220, w: 140, h: 28 },
    { x: 3540, y: 180, w: 280, h: 36 },
  ],
  ladders: [
    { x: 620, y: 300, w: 40, h: 180 },
    { x: 2900, y: 220, w: 40, h: 260 },
  ],
  seesaws: [{ x: 1740, y: 400, w: 220 }],
  conveyors: [{ x: 560, y: 480, w: 220, h: 40, dir: 1, speed: 160 }],
  fans: [{ x: 2280, y: 280, w: 70, h: 160, force: 18 }],
  crumbles: [{ x: 1180, y: 400, w: 100, h: 24 }],
  bumpers: [{ x: 1600, y: 390, dir: 1 }],
  spikes: [
    { x: 880, y: 460, count: 2 },
    { x: 2200, y: 460, count: 2 },
  ],
  pads: [
    { x: 1520, y: 396 },
    { x: 2680, y: 336 },
  ],
  enemies: [
    { type: 'slime', x: 900, y: 420, patrol: 60 },
    { type: 'slime', x: 1960, y: 360, patrol: 50 },
    { type: 'slime', x: 3200, y: 240, patrol: 50 },
  ],
  weapons: [{ type: 'glove', x: 640, y: 260 }],
  checkpoints: [
    { x: 820, y: 420 },
    { x: 1880, y: 360 },
    { x: 2840, y: 440 },
    { x: 3340, y: 180 },
  ],
};
