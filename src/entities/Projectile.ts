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

export function firePea(
  scene: Phaser.Scene,
  group: Phaser.Physics.Arcade.Group,
  x: number,
  y: number,
  dir: number,
): Phaser.Physics.Arcade.Sprite {
  const sprite = group.create(x, y, 'pea') as Phaser.Physics.Arcade.Sprite;
  sprite.setDepth(9);
  sprite.setData('spent', false);
  const body = sprite.body as Phaser.Physics.Arcade.Body;
  body.setAllowGravity(false);
  body.setSize(10, 10);
  sprite.setVelocityX(dir * PHYSICS.peaSpeed);

  scene.time.delayedCall(1800, () => retirePhysicsSprite(sprite));
  return sprite;
}
