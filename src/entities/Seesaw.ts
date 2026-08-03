import Phaser from 'phaser';
import { PHYSICS } from '../style/theme';
import type { SeesawDef } from '../levels/types';
import type { Player } from './Player';

/** Springy seesaw: overshoots, slides, and can tip-launch the player. */
export class Seesaw {
  readonly x: number;
  readonly y: number;
  readonly halfW: number;
  private readonly scene: Phaser.Scene;
  private readonly plank: Phaser.GameObjects.Image;
  private readonly fulcrum: Phaser.GameObjects.Image;
  private angle = 0;
  private angularVel = 0;
  private onBoard = false;
  private tipCooldownUntil = 0;
  private wasOnBoard = false;

  constructor(scene: Phaser.Scene, def: SeesawDef) {
    this.scene = scene;
    this.x = def.x;
    this.y = def.y;
    this.halfW = def.w / 2;

    this.fulcrum = scene.add.image(def.x, def.y + 10, 'seesaw_fulcrum').setDepth(5);
    this.plank = scene.add
      .image(def.x, def.y, 'seesaw_plank')
      .setDisplaySize(def.w, 18)
      .setDepth(6);
  }

  updateTilt(player: Player, delta: number): void {
    const dt = Math.min(delta / 1000, 0.05);
    const px = player.sprite.x;
    const py = player.sprite.y;
    this.onBoard =
      !player.climbing &&
      px >= this.x - this.halfW + 6 &&
      px <= this.x + this.halfW - 6 &&
      py >= this.surfaceY(px) - 52 &&
      py <= this.surfaceY(px) + 30;

    let target = 0;
    if (this.onBoard) {
      const t = Phaser.Math.Clamp((px - this.x) / this.halfW, -1, 1);
      // Extra tip when near the end for livelier motion.
      target = t * PHYSICS.seesawMaxAngle * (0.65 + Math.abs(t) * 0.55);
    }

    // Spring-damper with overshoot.
    const stiffness = 120;
    const damping = 7.5;
    const accel = (target - this.angle) * stiffness - this.angularVel * damping;
    this.angularVel += accel * dt;
    this.angle += this.angularVel * dt;
    this.angle = Phaser.Math.Clamp(this.angle, -PHYSICS.seesawMaxAngle - 4, PHYSICS.seesawMaxAngle + 4);
    this.plank.setAngle(this.angle);

    // Land squash when stepping on.
    if (this.onBoard && !this.wasOnBoard) {
      this.scene.tweens.add({
        targets: this.plank,
        scaleY: 0.82,
        duration: 70,
        yoyo: true,
      });
    }
    this.wasOnBoard = this.onBoard;
  }

  supportPlayer(player: Player): void {
    if (player.climbing) return;
    this.trySupport(player);
  }

  private surfaceY(px: number): number {
    const rad = Phaser.Math.DegToRad(this.angle);
    return this.y + (px - this.x) * Math.tan(rad) - 10;
  }

  private trySupport(player: Player): void {
    const body = player.sprite.body as Phaser.Physics.Arcade.Body;
    const px = player.sprite.x;
    if (px < this.x - this.halfW + 8 || px > this.x + this.halfW - 8) return;

    const surface = this.surfaceY(px);
    const foot = player.sprite.y + 16;
    const fallingOrRest = body.velocity.y >= -60;

    if (!(fallingOrRest && foot >= surface - 8 && foot <= surface + 20)) return;

    player.sprite.y = surface - 16;
    body.velocity.y = Math.min(body.velocity.y, 0);

    const rad = Phaser.Math.DegToRad(this.angle);
    // Slide + carry from angular velocity for a living feel.
    const slide = Math.sin(rad) * 220 + this.angularVel * 4;
    body.velocity.x += slide * 0.045;
    player.markSupported();

    const now = this.scene.time.now;
    const tip = Math.abs(this.angle) >= PHYSICS.seesawMaxAngle - 2;
    const nearEnd = Math.abs(px - this.x) > this.halfW * 0.55;
    if (tip && nearEnd && now > this.tipCooldownUntil && Math.sign(px - this.x) === Math.sign(this.angle)) {
      // Tip-launch off the low end.
      const dir = Math.sign(this.angle) || 1;
      player.launch(dir * 280, PHYSICS.bouncePadVelocity * 0.78);
      this.angularVel = -dir * 90;
      this.tipCooldownUntil = now + 650;
      this.scene.tweens.add({
        targets: this.plank,
        scaleY: 0.7,
        duration: 80,
        yoyo: true,
      });
    }
  }
}
