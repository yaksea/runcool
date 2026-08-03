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
    damage: number;
    scale?: number;
    vy?: number;
    lifeMs?: number;
  },
): Phaser.Physics.Arcade.Sprite {
  const sprite = group.create(opts.x, opts.y, opts.key) as Phaser.Physics.Arcade.Sprite;
  sprite.setDepth(9);
  sprite.setData('spent', false);
  sprite.setData('damage', opts.damage);
  if (opts.scale) sprite.setScale(opts.scale);
  const body = sprite.body as Phaser.Physics.Arcade.Body;
  body.setAllowGravity(false);
  body.setSize(Math.max(8, sprite.width * 0.6), Math.max(8, sprite.height * 0.6));
  sprite.setVelocity(opts.dir * opts.speed, opts.vy ?? 0);

  scene.time.delayedCall(opts.lifeMs ?? 1800, () => retirePhysicsSprite(sprite));
  return sprite;
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
    damage: 2,
  });
}
