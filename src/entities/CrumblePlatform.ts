import Phaser from 'phaser';
import type { CrumbleDef } from '../levels/types';
import type { Player } from './Player';

type Phase = 'idle' | 'shake' | 'gone';

/** Stands briefly, shakes, drops away, then respawns. */
export class CrumblePlatform {
  private readonly scene: Phaser.Scene;
  private readonly def: CrumbleDef;
  private sprite: Phaser.Physics.Arcade.Sprite;
  private phase: Phase = 'idle';
  private timer = 0;
  private readonly shakeMs: number;
  private readonly goneMs: number;
  private readonly group: Phaser.Physics.Arcade.StaticGroup;

  constructor(scene: Phaser.Scene, group: Phaser.Physics.Arcade.StaticGroup, def: CrumbleDef) {
    this.scene = scene;
    this.def = def;
    this.group = group;
    // Faster cycle so platforms feel lively.
    this.shakeMs = Math.round((def.shakeMs ?? 450) * 0.55);
    this.goneMs = Math.round((def.goneMs ?? 1800) * 0.45);
    this.sprite = this.spawnSprite();
  }

  private spawnSprite(): Phaser.Physics.Arcade.Sprite {
    const s = this.group.create(
      this.def.x + this.def.w / 2,
      this.def.y + this.def.h / 2,
      'crumble',
    ) as Phaser.Physics.Arcade.Sprite;
    s.setDisplaySize(this.def.w, this.def.h);
    s.refreshBody();
    s.setDepth(5);
    return s;
  }

  update(player: Player, delta: number): void {
    if (this.phase === 'gone') {
      this.timer += delta;
      if (this.timer >= this.goneMs) {
        this.sprite = this.spawnSprite();
        this.phase = 'idle';
        this.timer = 0;
      }
      return;
    }

    if (this.phase === 'shake') {
      this.timer += delta;
      this.sprite.x =
        this.def.x + this.def.w / 2 + Math.sin(this.scene.time.now / 30) * 3;
      this.sprite.refreshBody();
      if (this.timer >= this.shakeMs) {
        this.sprite.destroy();
        this.phase = 'gone';
        this.timer = 0;
      }
      return;
    }

    // idle: start shake when player stands on top
    const body = player.sprite.body as Phaser.Physics.Arcade.Body;
    if (!body.touching.down && !body.blocked.down) return;
    const px = player.sprite.x;
    const py = player.sprite.y + 18;
    if (
      px > this.def.x + 4 &&
      px < this.def.x + this.def.w - 4 &&
      py > this.def.y - 6 &&
      py < this.def.y + this.def.h + 8
    ) {
      this.phase = 'shake';
      this.timer = 0;
      this.sprite.setTint(0xffcc99);
    }
  }
}
