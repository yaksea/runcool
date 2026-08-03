import Phaser from 'phaser';
import { PHYSICS } from '../style/theme';

export class Projectile {
  readonly sprite: Phaser.Physics.Arcade.Sprite;

  constructor(scene: Phaser.Scene, x: number, y: number, dir: number) {
    this.sprite = scene.physics.add.sprite(x, y, 'pea');
    this.sprite.setDepth(9);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setSize(10, 10);
    this.sprite.setVelocityX(dir * PHYSICS.peaSpeed);
    this.sprite.setData('projectile', this);

    scene.time.delayedCall(1800, () => {
      if (this.sprite.active) this.sprite.destroy();
    });
  }
}
