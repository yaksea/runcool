import Phaser from 'phaser';
import type { FlameVentDef } from '../levels/types';
import type { Enemy } from './Enemy';
import type { Player } from './Player';

/**
 * Periodic flame burst — hurts both the player and monsters in the column.
 * Idle glow + rising embers stay visible so the vent is easy to spot between blasts.
 */
export class FlameVent {
  private readonly scene: Phaser.Scene;
  private readonly x: number;
  private readonly y: number;
  private readonly height: number;
  private readonly halfW = 36;
  private readonly interval: number;
  private readonly spout: Phaser.GameObjects.Image;
  private readonly warn: Phaser.GameObjects.Rectangle;
  private readonly flame: Phaser.GameObjects.Rectangle;
  private readonly embers: Phaser.GameObjects.Rectangle[] = [];
  private nextBlast = 0;
  private activeUntil = 0;

  constructor(scene: Phaser.Scene, def: FlameVentDef) {
    this.scene = scene;
    this.x = def.x;
    this.y = def.y;
    this.height = def.height ?? 150;
    // Faster default cadence so vents feel dangerous and readable.
    this.interval = Math.round(def.intervalMs ?? 750);
    this.spout = scene.add
      .image(def.x, def.y, 'flame_vent')
      .setDepth(8)
      .setOrigin(0.5, 1)
      .setScale(1.55);
    this.warn = scene.add
      .rectangle(def.x, def.y - this.height / 2, this.halfW * 2, this.height, 0xe74c3c, 0.28)
      .setDepth(5);
    this.flame = scene.add
      .rectangle(def.x, def.y - this.height / 2, this.halfW * 2, this.height, 0xf39c12, 0)
      .setDepth(6);

    for (let i = 0; i < 4; i++) {
      const ember = scene.add
        .rectangle(def.x + (i - 1.5) * 10, def.y - 18 - i * 16, 6, 10, 0xf5b041, 0.7)
        .setDepth(7);
      this.embers.push(ember);
      scene.tweens.add({
        targets: ember,
        y: def.y - 50 - i * 28,
        alpha: { from: 0.85, to: 0.15 },
        duration: 520 + i * 90,
        yoyo: true,
        repeat: -1,
        delay: i * 70,
        ease: 'Sine.easeInOut',
      });
    }

    this.nextBlast = scene.time.now + 80 + Math.random() * 180;
    scene.tweens.add({
      targets: this.warn,
      alpha: { from: 0.2, to: 0.42 },
      duration: 320,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    scene.tweens.add({
      targets: this.spout,
      scaleX: { from: 1.4, to: 1.7 },
      scaleY: { from: 1.45, to: 1.65 },
      duration: 360,
      yoyo: true,
      repeat: -1,
    });
  }

  /**
   * @returns true if the player stood in an active blast this pulse (caller should hurtPlayer).
   */
  update(player: Player, enemies: Enemy[]): boolean {
    const now = this.scene.time.now;
    let hurtPlayer = false;

    if (now >= this.nextBlast) {
      this.nextBlast = now + this.interval;
      this.activeUntil = now + 560;
      this.flame.setFillStyle(0xf39c12, 0.85);
      this.flame.setAlpha(0.95);
      this.spout.setTint(0xffeaa7);
      this.scene.tweens.add({
        targets: this.flame,
        alpha: { from: 1, to: 0.2 },
        scaleY: { from: 1.15, to: 0.75 },
        duration: 500,
        onUpdate: () => {
          this.flame.y = this.y - (this.height * this.flame.scaleY) / 2;
        },
        onComplete: () => {
          this.flame.setAlpha(0);
          this.flame.setScale(1);
          this.flame.y = this.y - this.height / 2;
          this.spout.clearTint();
        },
      });
    }

    if (now > this.activeUntil) return false;

    const top = this.y - this.height;
    const bottom = this.y + 8;
    const left = this.x - this.halfW;
    const right = this.x + this.halfW;

    if (this.bodyInColumn(player.sprite, left, right, top, bottom)) {
      hurtPlayer = true;
    }

    for (const e of enemies) {
      if (e.dead || !e.sprite.active) continue;
      if (!this.bodyInColumn(e.sprite, left, right, top, bottom)) continue;
      const knock = Math.sign(e.sprite.x - this.x) || 1;
      e.takeWeaponHit(knock);
    }

    return hurtPlayer;
  }

  private bodyInColumn(
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
