import Phaser from 'phaser';
import type { Enemy } from './Enemy';

type Spore = {
  sprite: Phaser.GameObjects.Arc;
  baseX: number;
  phase: number;
  speed: number;
  bob: number;
};

/**
 * Timed poison field at a monster spawn area.
 * Damages enemies only — 1 hit per second while overlapping.
 * Visuals stay light so they mark the hazard without blocking view.
 */
export class ToxicZone {
  readonly x: number;
  readonly y: number;
  private readonly scene: Phaser.Scene;
  private readonly radius: number;
  private readonly durationMs: number;
  private readonly wash: Phaser.GameObjects.Ellipse;
  private readonly ring: Phaser.GameObjects.Graphics;
  private readonly stain: Phaser.GameObjects.Image;
  private readonly spores: Spore[] = [];
  private readonly pulseTweens: Phaser.Tweens.Tween[] = [];
  private ringPhase = 0;
  private tickAcc = 0;
  private lifeMs = 0;
  private fading = false;
  private destroyed = false;

  /** Default lifetime: 30 seconds. */
  static readonly DEFAULT_DURATION_MS = 30_000;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    radius = 88,
    durationMs = ToxicZone.DEFAULT_DURATION_MS,
  ) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.durationMs = durationMs;

    // Soft tint on the ground — ADD keeps terrain readable underneath.
    this.wash = scene.add
      .ellipse(x, y + 4, radius * 1.9, radius * 0.95, 0xb39ddb, 0.14)
      .setDepth(3)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.stain = scene.add
      .image(x, y + 2, 'toxic_zone')
      .setDepth(3)
      .setAlpha(0.38)
      .setDisplaySize(radius * 1.85, radius * 0.85)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.ring = scene.add.graphics().setDepth(4).setAlpha(0.55);
    this.drawRing(1);

    this.pulseTweens.push(
      scene.tweens.add({
        targets: this.wash,
        alpha: { from: 0.1, to: 0.2 },
        scaleX: { from: 0.96, to: 1.04 },
        scaleY: { from: 0.94, to: 1.06 },
        duration: 1400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      }),
      scene.tweens.add({
        targets: this.stain,
        alpha: { from: 0.28, to: 0.45 },
        duration: 1100,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      }),
    );

    // Tiny floating spores — sparse so they read as poison, not fog.
    for (let i = 0; i < 7; i++) {
      const ox = (Math.random() - 0.5) * radius * 1.35;
      const oy = (Math.random() - 0.5) * radius * 0.55;
      const r = 1.4 + Math.random() * 1.8;
      const sprite = scene.add
        .circle(x + ox, y + oy, r, i % 2 === 0 ? 0xc39bd3 : 0x82e0aa, 0.55)
        .setDepth(5)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.spores.push({
        sprite,
        baseX: x + ox,
        phase: Math.random() * Math.PI * 2,
        speed: 0.9 + Math.random() * 1.1,
        bob: 5 + Math.random() * 8,
      });
    }

    // Occasional expanding ripple that fades out quickly.
    this.scheduleRipple();
  }

  /** False after visuals are fully torn down (safe to drop from GameScene list). */
  get alive(): boolean {
    return !this.destroyed;
  }

  private drawRing(scale: number): void {
    const g = this.ring;
    g.clear();
    const rx = this.radius * 0.92 * scale;
    const ry = this.radius * 0.48 * scale;
    g.lineStyle(1.5, 0xd7bde2, 0.7);
    g.strokeEllipse(this.x, this.y + 2, rx * 2, ry * 2);
    g.lineStyle(1, 0xa9dfbf, 0.35);
    g.strokeEllipse(this.x, this.y + 2, rx * 1.7, ry * 1.7);
  }

  private scheduleRipple(): void {
    if (this.destroyed || this.fading || !this.scene.sys.isActive()) return;
    const delay = 1600 + Math.random() * 900;
    this.scene.time.delayedCall(delay, () => {
      if (this.destroyed || this.fading || !this.scene.sys.isActive()) return;
      this.spawnRipple();
      this.scheduleRipple();
    });
  }

  private spawnRipple(): void {
    const ripple = this.scene.add.graphics().setDepth(4).setAlpha(0.5);
    ripple.lineStyle(1.5, 0xd2b4de, 0.65);
    ripple.strokeEllipse(this.x, this.y + 2, this.radius * 1.1, this.radius * 0.55);

    const state = { t: 0 };
    this.pulseTweens.push(
      this.scene.tweens.add({
        targets: state,
        t: 1,
        duration: 900,
        ease: 'Cubic.easeOut',
        onUpdate: () => {
          if (this.destroyed) return;
          const s = 1 + state.t * 0.55;
          ripple.clear();
          ripple.lineStyle(1.2, 0xd2b4de, 0.55 * (1 - state.t));
          ripple.strokeEllipse(
            this.x,
            this.y + 2,
            this.radius * 1.15 * s,
            this.radius * 0.58 * s,
          );
          ripple.setAlpha(0.45 * (1 - state.t));
        },
        onComplete: () => ripple.destroy(),
      }),
    );
  }

  update(enemies: Enemy[], delta: number): void {
    if (this.destroyed || this.fading) return;

    this.lifeMs += delta;
    if (this.lifeMs >= this.durationMs) {
      this.fadeOutAndDestroy();
      return;
    }

    // Soft fade in the last 4s so expiry is readable.
    const remain = this.durationMs - this.lifeMs;
    const fade = remain < 4000 ? Math.max(0.2, remain / 4000) : 1;

    this.ringPhase += delta * 0.0016;
    const breath = 1 + Math.sin(this.ringPhase) * 0.04;
    this.drawRing(breath);
    this.ring.setAlpha((0.4 + Math.sin(this.ringPhase * 1.3) * 0.12) * fade);

    const dt = delta * 0.001;
    for (const spore of this.spores) {
      spore.phase += dt * spore.speed;
      const lift = ((spore.phase % (Math.PI * 2)) / (Math.PI * 2)) * spore.bob;
      spore.sprite.x = spore.baseX + Math.sin(spore.phase * 1.4) * 6;
      spore.sprite.y = this.y - 4 - lift;
      spore.sprite.setAlpha((0.25 + (0.5 + Math.sin(spore.phase) * 0.5) * 0.35) * fade);
    }

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

  private fadeOutAndDestroy(): void {
    if (this.destroyed || this.fading) return;
    this.fading = true;
    for (const tw of this.pulseTweens) tw.stop();
    this.pulseTweens.length = 0;
    const targets = [this.wash, this.stain, this.ring, ...this.spores.map((s) => s.sprite)];
    this.scene.tweens.add({
      targets,
      alpha: 0,
      duration: 280,
      onComplete: () => this.destroy(),
    });
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.fading = false;
    for (const tw of this.pulseTweens) tw.stop();
    this.pulseTweens.length = 0;
    this.wash.destroy();
    this.stain.destroy();
    this.ring.destroy();
    for (const spore of this.spores) spore.sprite.destroy();
    this.spores.length = 0;
  }
}
