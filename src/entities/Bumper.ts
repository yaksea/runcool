import Phaser from 'phaser';
import type { BumperDef } from '../levels/types';
import type { Player } from './Player';

/** Side spring — knocks the player horizontally with a small hop. */
export class Bumper {
  private readonly sprite: Phaser.GameObjects.Image;
  private readonly def: BumperDef;
  private cooldownUntil = 0;
  private readonly scene: Phaser.Scene;

  constructor(scene: Phaser.Scene, def: BumperDef) {
    this.scene = scene;
    this.def = def;
    this.sprite = scene.add
      .image(def.x, def.y, 'bumper')
      .setFlipX(def.dir < 0)
      .setDepth(7);
    scene.tweens.add({
      targets: this.sprite,
      scaleX: { from: 1, to: 1.12 },
      scaleY: { from: 1, to: 0.92 },
      duration: 420,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  tryHit(player: Player): void {
    if (player.climbing) return;
    const now = this.scene.time.now;
    if (now < this.cooldownUntil) return;

    const dx = player.sprite.x - this.def.x;
    const dy = player.sprite.y - this.def.y;
    if (Math.abs(dx) > 36 || Math.abs(dy) > 34) return;

    player.launch(this.def.dir * 420, -320);
    this.cooldownUntil = now + 220;
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: 0.7,
      duration: 80,
      yoyo: true,
    });
  }
}
