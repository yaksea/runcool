import Phaser from 'phaser';
import type { WeaponDef } from '../levels/types';
import type { WeaponType } from '../systems/SaveSystem';

export class WeaponPickup {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  readonly weapon: Exclude<WeaponType, 'none'>;
  readonly afterCheckpoint: number;

  constructor(scene: Phaser.Scene, def: WeaponDef) {
    this.weapon = def.type;
    this.afterCheckpoint = def.afterCheckpoint ?? -1;
    this.sprite = scene.physics.add.sprite(def.x, def.y, def.type);
    this.sprite.setDepth(7);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setSize(28, 28);
    scene.tweens.add({
      targets: this.sprite,
      y: def.y - 8,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
