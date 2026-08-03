import Phaser from 'phaser';
import type { FanDef } from '../levels/types';
import type { Player } from './Player';

/** Updraft column — lifts the player while inside. */
export class FanZone {
  private readonly zone: Phaser.GameObjects.Zone;
  private readonly visuals: Phaser.GameObjects.Image[] = [];
  private readonly force: number;
  private readonly x: number;
  private readonly y: number;
  private readonly w: number;
  private readonly h: number;

  constructor(scene: Phaser.Scene, def: FanDef) {
    this.force = def.force;
    this.x = def.x;
    this.y = def.y;
    this.w = def.w;
    this.h = def.h;

    this.zone = scene.add.zone(def.x + def.w / 2, def.y + def.h / 2, def.w, def.h).setDepth(3);
    scene.add.image(def.x + def.w / 2, def.y + def.h - 10, 'fan').setDepth(4).setScale(1.1);

    for (let i = 0; i < 4; i++) {
      const gust = scene.add
        .image(def.x + def.w / 2 + (i - 1.5) * 8, def.y + def.h - 30 - i * 28, 'gust')
        .setDepth(3)
        .setAlpha(0.45);
      this.visuals.push(gust);
      scene.tweens.add({
        targets: gust,
        y: def.y + 20,
        alpha: { from: 0.55, to: 0.05 },
        duration: 700 + i * 120,
        repeat: -1,
        delay: i * 140,
      });
    }
  }

  apply(player: Player, delta: number): void {
    if (player.climbing) return;
    const b = player.sprite.body as Phaser.Physics.Arcade.Body;
    const cx = b.center.x;
    const cy = b.center.y;
    if (cx < this.x || cx > this.x + this.w || cy < this.y || cy > this.y + this.h) return;

    const dt = delta / 1000;
    b.velocity.y -= this.force * dt * 60;
    b.velocity.y = Math.max(b.velocity.y, -420);
    const mid = this.x + this.w / 2;
    b.velocity.x += (mid - cx) * 0.08;
  }
}
