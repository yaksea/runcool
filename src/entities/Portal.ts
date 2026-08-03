import Phaser from 'phaser';
import type { PortalDef } from '../levels/types';
import type { Player } from './Player';

export class PortalPairSystem {
  private readonly portals: {
    def: PortalDef;
    sprite: Phaser.GameObjects.Image;
  }[] = [];
  private cooldownUntil = 0;
  private readonly scene: Phaser.Scene;

  constructor(scene: Phaser.Scene, defs: PortalDef[]) {
    this.scene = scene;
    defs.forEach((def) => {
      const sprite = scene.add.image(def.x, def.y, 'portal').setDepth(6);
      scene.tweens.add({
        targets: sprite,
        angle: 360,
        duration: 4000,
        repeat: -1,
      });
      scene.tweens.add({
        targets: sprite,
        scale: { from: 0.9, to: 1.1 },
        duration: 700,
        yoyo: true,
        repeat: -1,
      });
      this.portals.push({ def, sprite });
    });
  }

  /** Block teleports briefly after spawn/respawn so checkpoints near portals stay usable. */
  suppress(ms = 1200): void {
    this.cooldownUntil = Math.max(this.cooldownUntil, this.scene.time.now + ms);
  }

  tryTeleport(player: Player): void {
    const now = this.scene.time.now;
    if (now < this.cooldownUntil || player.climbing || player.isInvincible(now)) return;

    for (const p of this.portals) {
      const dx = player.sprite.x - p.def.x;
      const dy = player.sprite.y - p.def.y;
      if (Math.abs(dx) > 28 || Math.abs(dy) > 34) continue;

      const dest = this.portals.find((o) => o.def.id === p.def.pairId);
      if (!dest) continue;

      player.sprite.setPosition(dest.def.x, dest.def.y - 10);
      player.sprite.setVelocity(0, -120);
      this.cooldownUntil = now + 900;
      this.scene.cameras.main.flash(120, 180, 220, 255);
      return;
    }
  }
}
