import Phaser from 'phaser';
import type { TimedPlatformDef } from '../levels/types';

/** Platform that blinks in and out on a timer. */
export class TimedPlatform {
  private readonly scene: Phaser.Scene;
  private readonly def: TimedPlatformDef;
  private readonly group: Phaser.Physics.Arcade.StaticGroup;
  private sprite: Phaser.Physics.Arcade.Sprite | null = null;
  private on: boolean;
  private nextToggle: number;

  constructor(scene: Phaser.Scene, group: Phaser.Physics.Arcade.StaticGroup, def: TimedPlatformDef) {
    this.scene = scene;
    this.def = def;
    this.group = group;
    this.on = def.startOn !== false;
    this.nextToggle = scene.time.now + (this.on ? def.onMs : def.offMs);
    if (this.on) this.spawn();
  }

  update(): void {
    const now = this.scene.time.now;
    if (now < this.nextToggle) {
      if (this.on && this.sprite) {
        // Blink warn near end of on-phase
        const left = this.nextToggle - now;
        if (left < 400) this.sprite.setAlpha(0.45 + 0.55 * Math.abs(Math.sin(now / 40)));
      }
      return;
    }

    this.on = !this.on;
    this.nextToggle = now + (this.on ? this.def.onMs : this.def.offMs);
    if (this.on) this.spawn();
    else this.despawn();
  }

  private spawn(): void {
    if (this.sprite) return;
    this.sprite = this.group.create(
      this.def.x + this.def.w / 2,
      this.def.y + this.def.h / 2,
      'timed_platform',
    ) as Phaser.Physics.Arcade.Sprite;
    this.sprite.setDisplaySize(this.def.w, this.def.h);
    this.sprite.setAlpha(1);
    this.sprite.refreshBody();
  }

  private despawn(): void {
    this.sprite?.destroy();
    this.sprite = null;
  }
}
