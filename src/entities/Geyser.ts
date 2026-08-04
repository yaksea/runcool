import Phaser from 'phaser';
import type { GeyserDef } from '../levels/types';
import type { Player } from './Player';

/** Periodic vertical blast from the ground. */
export class Geyser {
  private readonly scene: Phaser.Scene;
  private readonly x: number;
  private readonly y: number;
  private readonly force: number;
  private readonly interval: number;
  private readonly spout: Phaser.GameObjects.Image;
  private nextBlast = 0;

  constructor(scene: Phaser.Scene, def: GeyserDef) {
    this.scene = scene;
    this.x = def.x;
    this.y = def.y;
    this.force = def.force ?? 780;
    // Higher refresh rate than level data alone.
    this.interval = Math.round((def.intervalMs ?? 2200) * 0.55);
    this.spout = scene.add.image(def.x, def.y, 'geyser').setDepth(5).setAlpha(0.35);
    this.nextBlast = scene.time.now + 400 + Math.random() * 400;
    scene.tweens.add({
      targets: this.spout,
      scaleX: { from: 0.85, to: 1.1 },
      duration: 500,
      yoyo: true,
      repeat: -1,
    });
  }

  update(player: Player): void {
    const now = this.scene.time.now;
    if (now < this.nextBlast) return;
    this.nextBlast = now + this.interval;

    this.spout.setAlpha(1);
    this.scene.tweens.add({
      targets: this.spout,
      alpha: 0.3,
      scaleY: { from: 1.55, to: 0.75 },
      duration: 260,
    });

    const dx = Math.abs(player.sprite.x - this.x);
    const dy = player.sprite.y - this.y;
    if (dx < 42 && dy < 12 && dy > -170) {
      const vx = player.sprite.body
        ? (player.sprite.body as Phaser.Physics.Arcade.Body).velocity.x * 0.25
        : 0;
      player.launch(vx, -this.force);
    }
  }
}
