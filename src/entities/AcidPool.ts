import Phaser from 'phaser';
import type { AcidPoolDef } from '../levels/types';
import type { Enemy } from './Enemy';
import type { Player } from './Player';

/**
 * Always-on acid pool on the floor — hurts player and monsters standing in it.
 */
export class AcidPool {
  private readonly scene: Phaser.Scene;
  private readonly x: number;
  private readonly y: number;
  private readonly halfW: number;
  private readonly visual: Phaser.GameObjects.Image;
  private readonly glow: Phaser.GameObjects.Ellipse;

  constructor(scene: Phaser.Scene, def: AcidPoolDef) {
    this.scene = scene;
    this.x = def.x;
    this.y = def.y;
    this.halfW = Math.max(28, (def.w ?? 72) / 2);
    this.glow = scene.add
      .ellipse(def.x, def.y - 6, this.halfW * 2.2, 22, 0x58d68d, 0.35)
      .setDepth(4);
    this.visual = scene.add
      .image(def.x, def.y, 'acid_pool')
      .setDepth(5)
      .setOrigin(0.5, 1)
      .setDisplaySize(this.halfW * 2, 22);
    scene.tweens.add({
      targets: [this.glow, this.visual],
      alpha: { from: 0.75, to: 1 },
      scaleX: { from: 0.96, to: 1.04 },
      duration: 520,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /** @returns true if the player is standing in the pool. */
  update(player: Player, enemies: Enemy[]): boolean {
    const top = this.y - 28;
    const bottom = this.y + 10;
    const left = this.x - this.halfW;
    const right = this.x + this.halfW;
    let hurtPlayer = false;

    if (this.bodyInPool(player.sprite, left, right, top, bottom)) {
      hurtPlayer = true;
    }

    for (const e of enemies) {
      if (e.dead || !e.sprite.active) continue;
      if (!this.bodyInPool(e.sprite, left, right, top, bottom)) continue;
      const knock = Math.sign(e.sprite.x - this.x) || 1;
      e.takeWeaponHit(knock);
    }

    return hurtPlayer;
  }

  private bodyInPool(
    sprite: Phaser.Physics.Arcade.Sprite,
    left: number,
    right: number,
    top: number,
    bottom: number,
  ): boolean {
    const body = sprite.body as Phaser.Physics.Arcade.Body | null;
    if (!body) return false;
    return body.right > left && body.x < right && body.bottom > top && body.y < bottom;
  }
}
