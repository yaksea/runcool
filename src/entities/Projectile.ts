import Phaser from 'phaser';
import { PHYSICS } from '../style/theme';

/** Safely retire a physics sprite outside the current Arcade step. */
export function retirePhysicsSprite(sprite: Phaser.Physics.Arcade.Sprite): void {
  if (!sprite.active || sprite.getData('spent')) return;
  sprite.setData('spent', true);
  sprite.disableBody(true, true);
  const scene = sprite.scene;
  if (!scene) return;
  scene.time.delayedCall(0, () => {
    if (sprite.scene) sprite.destroy();
  });
}

export function fireProjectile(
  scene: Phaser.Scene,
  group: Phaser.Physics.Arcade.Group,
  opts: {
    x: number;
    y: number;
    dir: number;
    key: string;
    speed: number;
    /** When true, hitting an enemy removes exactly 1 hit point. */
    dealsHit?: boolean;
    scale?: number;
    vy?: number;
    lifeMs?: number;
  },
): Phaser.Physics.Arcade.Sprite {
  const sprite = group.create(opts.x, opts.y, opts.key) as Phaser.Physics.Arcade.Sprite;
  sprite.setDepth(9);
  sprite.setData('spent', false);
  sprite.setData('dealsHit', opts.dealsHit === true);
  sprite.setData('prevX', opts.x);
  sprite.setData('prevY', opts.y);
  if (opts.scale) sprite.setScale(opts.scale);
  const body = sprite.body as Phaser.Physics.Arcade.Body;
  body.setAllowGravity(false);
  // Elongate along travel so fast shots don't tunnel through small flyers.
  const vx = opts.dir * opts.speed;
  const vy = opts.vy ?? 0;
  const horizontal = Math.abs(vx) >= Math.abs(vy);
  if (horizontal) {
    body.setSize(22, 14);
  } else {
    body.setSize(14, 22);
  }
  sprite.setVelocity(vx, vy);

  scene.time.delayedCall(opts.lifeMs ?? 1800, () => retirePhysicsSprite(sprite));
  return sprite;
}

/** Segment vs padded AABB — used to catch tunneling peas. */
export function segmentHitsBody(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  body: Phaser.Physics.Arcade.Body,
  pad = 10,
): boolean {
  const left = body.x - pad;
  const right = body.right + pad;
  const top = body.y - pad;
  const bottom = body.bottom + pad;

  // Endpoint inside
  if (pointInRect(x1, y1, left, right, top, bottom) || pointInRect(x2, y2, left, right, top, bottom)) {
    return true;
  }

  // Sample along the segment (covers high-speed frames)
  const steps = 6;
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t;
    if (pointInRect(x, y, left, right, top, bottom)) return true;
  }
  return false;
}

function pointInRect(
  x: number,
  y: number,
  left: number,
  right: number,
  top: number,
  bottom: number,
): boolean {
  return x >= left && x <= right && y >= top && y <= bottom;
}

/** @deprecated use fireProjectile */
export function firePea(
  scene: Phaser.Scene,
  group: Phaser.Physics.Arcade.Group,
  x: number,
  y: number,
  dir: number,
): Phaser.Physics.Arcade.Sprite {
  return fireProjectile(scene, group, {
    x,
    y,
    dir,
    key: 'pea',
    speed: PHYSICS.peaSpeed,
    dealsHit: true,
  });
}
