import Phaser from 'phaser';
import type { Enemy } from './Enemy';

/**
 * Persistent poison field at a monster spawn area.
 * Damages enemies only — 1 hit per second while overlapping.
 */
export class ToxicZone {
  readonly x: number;
  readonly y: number;
  private readonly radius: number;
  private readonly glow: Phaser.GameObjects.Ellipse;
  private readonly visual: Phaser.GameObjects.Image;
  private readonly mist: Phaser.GameObjects.Ellipse;
  private tickAcc = 0;
  private destroyed = false;

  constructor(scene: Phaser.Scene, x: number, y: number, radius = 88) {
    this.x = x;
    this.y = y;
    this.radius = radius;

    this.glow = scene.add
      .ellipse(x, y, radius * 2.1, radius * 1.35, 0x9b59b6, 0.28)
      .setDepth(4);
    this.mist = scene.add
      .ellipse(x, y - 8, radius * 1.6, radius * 0.9, 0xd2b4de, 0.2)
      .setDepth(4);
    this.visual = scene.add
      .image(x, y, 'toxic_zone')
      .setDepth(5)
      .setDisplaySize(radius * 2, radius * 1.15);

    scene.tweens.add({
      targets: [this.glow, this.mist, this.visual],
      alpha: { from: 0.55, to: 0.95 },
      scaleX: { from: 0.94, to: 1.06 },
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  update(enemies: Enemy[], delta: number): void {
    if (this.destroyed) return;
    this.tickAcc += delta;
    if (this.tickAcc < 1000) return;
    this.tickAcc -= 1000;

    const r2 = this.radius * this.radius;
    for (const e of enemies) {
      if (e.dead || !e.sprite.active) continue;
      const dx = e.sprite.x - this.x;
      const dy = e.sprite.y - this.y;
      if (dx * dx + dy * dy > r2) continue;
      const knock = Math.sign(e.sprite.x - this.x) || 1;
      e.takeHits(1, knock);
    }
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.glow.destroy();
    this.mist.destroy();
    this.visual.destroy();
  }
}
