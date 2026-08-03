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
    this.interval = def.intervalMs ?? 2200;
    this.spout = scene.add.image(def.x, def.y, 'geyser').setDepth(5).setAlpha(0.35);
    this.nextBlast = scene.time.now + 600;
  }

  update(player: Player): void {
    const now = this.scene.time.now;
    if (now < this.nextBlast) return;
    this.nextBlast = now + this.interval;

    this.spout.setAlpha(1);
    this.scene.tweens.add({
      targets: this.spout,
      alpha: 0.3,
      scaleY: { from: 1.4, to: 0.8 },
      duration: 280,
    });

    const dx = Math.abs(player.sprite.x - this.x);
    const dy = player.sprite.y - this.y;
    if (dx < 40 && dy < 10 && dy > -160) {
      player.launch(player.sprite.body ? (player.sprite.body as Phaser.Physics.Arcade.Body).velocity.x * 0.2 : 0, -this.force);
    }
  }
}
