import Phaser from 'phaser';
import type { EnemyDef, EnemyType } from '../levels/types';
import type { Player } from './Player';

export type EnemyFireOpts = { homing?: boolean; speed?: number; vy?: number };
export type EnemyFireHazard = (x: number, y: number, dir: number, opts?: EnemyFireOpts) => void;

const HP_BAR_W = 48;
const HP_BAR_H = 8;

/** How many weapon hits to kill. One weapon connect = exactly 1 hit. */
function hitsFor(type: EnemyType): number {
  switch (type) {
    case 'tank':
      return 8;
    case 'ghost':
    case 'spitter':
      return 7;
    case 'spikeball':
    case 'hopper':
    case 'chaser':
    case 'roller':
      return 6;
    case 'bat':
    case 'floater':
    case 'slime':
    default:
      return 5;
  }
}

export class Enemy {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  readonly type: EnemyType;
  readonly afterCheckpoint: number;
  readonly spawnDef: EnemyDef;
  /** Remaining weapon hits before death. */
  hitsLeft: number;
  readonly maxHits: number;
  dead = false;

  private readonly originX: number;
  private readonly patrol: number;
  private dir = 1;
  private readonly baseY: number;
  private hopCooldown = 0;
  /** Stagger first volley so a pack doesn't all fire on the same frame. */
  private spitCooldown = 500 + Math.random() * 1200;
  private phase = Math.random() * Math.PI * 2;
  private readonly hpBg: Phaser.GameObjects.Rectangle;
  private readonly hpFill: Phaser.GameObjects.Rectangle;
  private readonly fireHazard?: EnemyFireHazard;
  private readonly onDied?: (enemy: Enemy) => void;
  private wobbleTween?: Phaser.Tweens.Tween;
  private hurtUntil = 0;
  private stompImmuneUntil = 0;
  /** Orbit max-level shield knockback window. */
  private repulseUntil = 0;
  private repulseVx = 0;
  private repulseVy = 0;
  /** Brief grace after arena recall so shield doesn't bounce-loop. */
  private shieldImmuneUntil = 0;

  constructor(
    scene: Phaser.Scene,
    def: EnemyDef,
    fireHazard?: EnemyFireHazard,
    /** Optional hit override (e.g. pipe arena = 3 shots). */
    hitsOverride?: number,
    onDied?: (enemy: Enemy) => void,
  ) {
    this.type = def.type;
    this.afterCheckpoint = def.afterCheckpoint ?? -1;
    this.spawnDef = def;
    this.originX = def.x;
    this.patrol = def.patrol;
    this.baseY = def.y;
    this.maxHits = hitsOverride ?? hitsFor(def.type);
    this.hitsLeft = this.maxHits;
    this.fireHazard = fireHazard;
    this.onDied = onDied;

    this.sprite = scene.physics.add.sprite(def.x, def.y, def.type);
    this.sprite.setDepth(8);
    this.sprite.setData('enemy', this);

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    if (def.type === 'floater' || def.type === 'bat' || def.type === 'ghost') {
      body.setAllowGravity(false);
      // Bat needs a generous box — fast peas otherwise tunnel through.
      if (def.type === 'bat') body.setSize(34, 28);
      else if (def.type === 'ghost') body.setSize(30, 30);
      else body.setSize(30, 24);
    } else if (def.type === 'spikeball' || def.type === 'roller') {
      body.setAllowGravity(true);
      body.setSize(26, 26);
    } else if (def.type === 'tank') {
      body.setAllowGravity(true);
      body.setSize(34, 30);
      body.setOffset(4, 6);
    } else if (def.type === 'spitter') {
      body.setAllowGravity(true);
      body.setSize(30, 28);
      body.setOffset(5, 6);
    } else {
      body.setAllowGravity(true);
      body.setSize(30, 26);
      body.setOffset(5, 8);
    }

    this.hpBg = scene.add
      .rectangle(def.x, def.y - 28, HP_BAR_W, HP_BAR_H, 0x111111, 0.9)
      .setStrokeStyle(1, 0xffffff, 0.45)
      .setDepth(12);
    this.hpFill = scene.add
      .rectangle(def.x - HP_BAR_W / 2, def.y - 28, HP_BAR_W - 4, HP_BAR_H - 2, 0x2ecc71, 1)
      .setOrigin(0, 0.5)
      .setDepth(13);
    this.refreshHpBar();

    this.wobbleTween = scene.tweens.add({
      targets: this.sprite,
      scaleY: { from: 0.94, to: 1.06 },
      scaleX: { from: 1.04, to: 0.96 },
      duration: 380 + Math.random() * 220,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  get canBeStomped(): boolean {
    return this.type !== 'spikeball';
  }

  get lethalOnTouch(): boolean {
    return this.type === 'spikeball';
  }

  isStompImmune(now: number): boolean {
    return now < this.stompImmuneUntil;
  }

  /** @deprecated use hitsLeft/maxHits — kept so HUD math stays simple */
  get hp(): number {
    return this.hitsLeft;
  }

  get maxHp(): number {
    return this.maxHits;
  }

  private isFlyer(): boolean {
    return this.type === 'floater' || this.type === 'bat' || this.type === 'ghost';
  }

  /**
   * Max-level orbit shield knockback (no damage).
   * Returns true when a new bounce starts (for FX).
   */
  applyOrbitRepulse(fromX: number, fromY: number, force = 340): boolean {
    if (this.dead || !this.sprite.active) return false;
    const now = this.sprite.scene.time.now;
    if (now < this.repulseUntil || now < this.shieldImmuneUntil) return false;

    let dx = this.sprite.x - fromX;
    let dy = this.sprite.y - fromY;
    let len = Math.hypot(dx, dy);
    if (len < 1) {
      dx = this.dir || 1;
      dy = -0.25;
      len = Math.hypot(dx, dy);
    }
    const nx = dx / len;
    const ny = dy / len;

    this.repulseUntil = now + 300;
    this.repulseVx = nx * force;
    this.repulseVy = ny * force * (this.isFlyer() ? 0.85 : 0.45);
    this.dir = nx >= 0 ? 1 : -1;
    this.sprite.setFlipX(this.dir < 0);

    if (this.isFlyer()) {
      this.placeFlying(this.sprite.x + nx * 28, this.sprite.y + ny * 22);
    } else {
      const body = this.sprite.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(this.repulseVx, Math.min(-160, this.repulseVy - 80));
    }

    this.sprite.setTint(0x1abc9c);
    this.sprite.scene.time.delayedCall(120, () => {
      if (!this.dead && this.sprite.active) this.sprite.clearTint();
    });
    return true;
  }

  /**
   * Put this foe back at its authored spawn (keeps remaining hits).
   * Used when an arena monster is yeeted out of the pipe room.
   */
  recallToSpawn(): void {
    if (this.dead || !this.sprite.active) return;
    const now = this.sprite.scene.time.now;
    this.repulseUntil = 0;
    this.repulseVx = 0;
    this.repulseVy = 0;
    this.shieldImmuneUntil = now + 900;
    const x = this.spawnDef.x;
    const y = this.spawnDef.y;
    this.sprite.clearTint();
    if (this.isFlyer()) {
      this.placeFlying(x, y);
    } else {
      this.sprite.setPosition(x, y);
      const body = this.sprite.body as Phaser.Physics.Arcade.Body;
      body.reset(x, y);
      body.setVelocity(0, 0);
    }
    this.syncHpBar();
    this.sprite.setTint(0x85c1e9);
    this.sprite.scene.time.delayedCall(160, () => {
      if (!this.dead && this.sprite.active) this.sprite.clearTint();
    });
  }

  update(player?: Player): void {
    if (this.dead || !this.sprite.active) {
      this.hpBg.setVisible(false);
      this.hpFill.setVisible(false);
      return;
    }

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const now = this.sprite.scene.time.now;
    this.phase += 0.05;

    // Shield knockback overrides AI so the bounce isn't cancelled same-frame.
    if (now < this.repulseUntil) {
      if (this.isFlyer()) {
        this.placeFlying(
          this.sprite.x + this.repulseVx * 0.016,
          this.sprite.y + this.repulseVy * 0.016,
        );
      } else {
        body.setVelocityX(this.repulseVx);
      }
      this.syncHpBar();
      return;
    }

    if (this.type === 'floater') {
      let x = this.sprite.x + this.dir * 0.85;
      const y = this.baseY + Math.sin(now / 260 + this.phase) * 10;
      if (x > this.originX + this.patrol) this.dir = -1;
      if (x < this.originX - this.patrol) this.dir = 1;
      x = this.sprite.x + this.dir * 0.85;
      this.placeFlying(x, y);
      this.sprite.setFlipX(this.dir < 0);
      if (player) this.tryHomingShot(player, 300, 2200, 170);
      this.syncHpBar();
      return;
    }

    if (this.type === 'bat') {
      const t = now / 220 + this.phase;
      let x = this.originX + Math.sin(t) * this.patrol;
      let y = this.baseY + Math.sin(t * 2) * 18;
      if (player && !player.climbing) {
        const dx = player.sprite.x - x;
        const dy = player.sprite.y - y;
        if (Math.hypot(dx, dy) < 160) {
          x += Math.sign(dx) * 1.1;
          y += Math.sign(dy) * 0.7;
        }
        this.dir = dx >= 0 ? 1 : -1;
      }
      // Keep flyers leashed so they don't drift off the showcase ledge.
      x = Phaser.Math.Clamp(x, this.originX - this.patrol, this.originX + this.patrol);
      y = Phaser.Math.Clamp(y, this.baseY - 36, this.baseY + 36);
      this.placeFlying(x, y);
      this.sprite.setFlipX(this.dir < 0);
      this.sprite.rotation = Math.sin(t * 3) * 0.15;
      if (player) this.tryHomingShot(player, 280, 1900, 190);
      this.syncHpBar();
      return;
    }

    if (this.type === 'ghost') {
      const t = now / 300 + this.phase;
      this.sprite.setAlpha(0.45 + Math.sin(t) * 0.25);
      let x = this.sprite.x;
      let y = this.sprite.y;
      if (player && !player.climbing) {
        const dx = player.sprite.x - x;
        const dy = player.sprite.y - y;
        if (Math.hypot(dx, dy) < 260) {
          x += Math.sign(dx || 1) * 0.9;
          y += Math.sign(dy || 1) * 0.55;
          this.dir = dx >= 0 ? 1 : -1;
        }
      } else {
        x = this.originX + Math.sin(t) * 12;
        y = this.baseY + Math.cos(t) * 12;
      }
      x = Phaser.Math.Clamp(x, this.originX - this.patrol, this.originX + this.patrol);
      y = Phaser.Math.Clamp(y, this.baseY - 36, this.baseY + 36);
      this.placeFlying(x, y);
      this.sprite.setFlipX(this.dir < 0);
      if (player) this.tryHomingShot(player, 320, 2400, 160);
      this.syncHpBar();
      return;
    }

    if (this.type === 'chaser' && player && !player.climbing) {
      const dx = player.sprite.x - this.sprite.x;
      if (Math.abs(dx) < 300) this.dir = dx >= 0 ? 1 : -1;
    }

    if (this.type === 'hopper') {
      this.hopCooldown -= 16;
      const onGround = body.blocked.down || body.touching.down;
      if (onGround && this.hopCooldown <= 0) {
        body.setVelocityY(-440 - Math.random() * 40);
        this.hopCooldown = 720 + Math.random() * 280;
        this.sprite.setScale(1.15, 0.85);
        this.sprite.scene.tweens.add({
          targets: this.sprite,
          scaleX: 1,
          scaleY: 1,
          duration: 120,
        });
      }
      body.setVelocityX(this.dir * (75 + Math.sin(this.phase) * 8));
    } else if (this.type === 'roller') {
      const speed = 120;
      body.setVelocityX(this.dir * speed);
      this.sprite.rotation += this.dir * 0.12;
      if (body.blocked.left) this.dir = 1;
      if (body.blocked.right) this.dir = -1;
    } else if (this.type === 'spitter') {
      body.setVelocityX(this.dir * 22);
      if (player) this.tryHomingShot(player, 360, 1200, 210);
    } else {
      const speed =
        this.type === 'tank'
          ? 30
          : this.type === 'spikeball'
            ? 60
            : this.type === 'chaser'
              ? 100
              : 46;
      body.setVelocityX(this.dir * (speed + Math.sin(this.phase * 2) * 4));
    }

    if (this.type !== 'roller') {
      if (this.sprite.x > this.originX + this.patrol) this.dir = -1;
      if (this.sprite.x < this.originX - this.patrol) this.dir = 1;
      this.sprite.setFlipX(this.dir < 0);
    }

    // Turn at ledges so ground foes don't walk off cliffs.
    const onGround = body.blocked.down || body.touching.down;
    if (onGround && !this.hasFloorAhead(this.dir)) {
      this.dir = this.dir < 0 ? 1 : -1;
      body.setVelocityX(Math.abs(body.velocity.x) * this.dir);
      this.sprite.setFlipX(this.dir < 0);
    }
    // Hard leash — never drift past patrol even after a hop.
    if (this.sprite.x > this.originX + this.patrol + 8) {
      this.sprite.setX(this.originX + this.patrol);
      this.dir = -1;
    } else if (this.sprite.x < this.originX - this.patrol - 8) {
      this.sprite.setX(this.originX - this.patrol);
      this.dir = 1;
    }

    if (this.type === 'spikeball') {
      this.sprite.rotation += this.dir * 0.05;
    }

    if (this.type === 'slime') {
      this.sprite.scaleY = 0.92 + Math.sin(now / 180 + this.phase) * 0.1;
      this.sprite.scaleX = 1.08 - Math.sin(now / 180 + this.phase) * 0.1;
      if (player) this.tryHomingShot(player, 260, 2600, 150);
    } else if (this.type === 'hopper' && player) {
      this.tryHomingShot(player, 280, 2300, 175);
    } else if (this.type === 'chaser' && player) {
      this.tryHomingShot(player, 320, 2000, 195);
    } else if (this.type === 'tank' && player) {
      this.tryHomingShot(player, 380, 2800, 140);
    }

    this.syncHpBar();
  }

  /** True if a solid floor exists just ahead of the feet. */
  private hasFloorAhead(dir: number): boolean {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const x = this.sprite.x + dir * (body.halfWidth + 8);
    const y = this.sprite.y + body.halfHeight + 2;
    const hits = this.sprite.scene.physics.overlapRect(x - 3, y, 6, 18, true, true);
    for (const h of hits) {
      const b = h as Phaser.Physics.Arcade.Body;
      if (!b || b === body) continue;
      const go = b.gameObject as Phaser.GameObjects.GameObject | undefined;
      if (go && go !== this.sprite) return true;
    }
    return false;
  }

  /** Fire a homing hazard shot (blocked by terrain in GameScene). */
  private tryHomingShot(player: Player, range: number, cooldownMs: number, speed: number): void {
    if (!this.fireHazard || player.climbing) return;
    this.spitCooldown -= 16;
    if (this.spitCooldown > 0) return;
    const dx = player.sprite.x - this.sprite.x;
    const dy = player.sprite.y - this.sprite.y;
    if (Math.hypot(dx, dy) > range) return;
    const dir = dx >= 0 ? 1 : -1;
    this.dir = dir;
    this.fireHazard(this.sprite.x + dir * 14, this.sprite.y - 6, dir, {
      homing: true,
      speed,
      vy: Phaser.Math.Clamp(dy * 0.35, -120, 120),
    });
    this.spitCooldown = cooldownMs;
    this.sprite.setTint(0xffeaa7);
    this.sprite.scene.time.delayedCall(90, () => {
      if (!this.dead && this.sprite.active) this.sprite.clearTint();
    });
  }

  /** Keep Arcade body glued to sprite after manual flight movement. */
  private placeFlying(x: number, y: number): void {
    this.sprite.setPosition(x, y);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.reset(x, y);
    body.setVelocity(0, 0);
    body.setAllowGravity(false);
  }

  /**
   * One successful weapon connect removes exactly 1 hit.
   * Hard rule: never remove more than 1 per call; i-frames block multi-pellet.
   */
  takeWeaponHit(knockDir: number): boolean {
    if (this.dead || !this.sprite.active) return false;
    const now = this.sprite.scene.time.now;
    if (now < this.hurtUntil) return false;

    this.hurtUntil = now + 280;
    this.stompImmuneUntil = now + 700;

    this.hitsLeft = Math.max(0, this.hitsLeft - 1);
    this.refreshHpBar();
    this.syncHpBar();
    this.spawnDamageFloat();

    this.hpFill.setFillStyle(0xffffff);
    this.sprite.scene.time.delayedCall(80, () => {
      if (!this.dead) this.refreshHpBar();
    });

    this.sprite.setVelocityX(knockDir * 140);
    if (!this.isFlyer()) {
      this.sprite.setVelocityY(-70);
    }
    this.sprite.setTint(0xffffff);
    this.sprite.scene.time.delayedCall(100, () => {
      if (!this.dead && this.sprite.active) this.sprite.clearTint();
    });

    if (this.hitsLeft <= 0) {
      this.die();
      return true;
    }
    return false;
  }

  /** @deprecated alias — old call sites */
  takeHitRatio(_ratio: number, knockDir: number): boolean {
    return this.takeWeaponHit(knockDir);
  }

  /** Instant kill (missile / special skills). */
  instantKill(): void {
    if (this.dead || !this.sprite.active) return;
    this.hitsLeft = 0;
    this.refreshHpBar();
    this.die();
  }

  /** One-hit stomp kill — only for deliberate landings, never after gunfire. */
  stomp(): void {
    if (this.dead || !this.canBeStomped) return;
    const now = this.sprite.scene.time.now;
    if (now < this.stompImmuneUntil) return;
    // Extra guard: if we were just shot, refuse stomp (jump+shoot false OHKO).
    if (now < this.hurtUntil) return;
    this.hitsLeft = 0;
    this.refreshHpBar();
    this.die();
  }

  private spawnDamageFloat(): void {
    const scene = this.sprite.scene;
    const t = scene.add
      .text(this.sprite.x, this.sprite.y - 36, `${this.hitsLeft}/${this.maxHits}`, {
        fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
        fontSize: '15px',
        color: '#ffffff',
        stroke: '#1a1a1a',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(20);
    scene.tweens.add({
      targets: t,
      y: t.y - 26,
      alpha: 0,
      duration: 480,
      ease: 'Quad.easeOut',
      onComplete: () => t.destroy(),
    });
  }

  private die(): void {
    if (this.dead) return;
    this.dead = true;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body | null;
    if (body) {
      body.enable = false;
      body.stop();
    }
    this.hpBg.setVisible(false);
    this.hpFill.setVisible(false);
    this.wobbleTween?.stop();
    this.onDied?.(this);

    const scene = this.sprite.scene;
    scene.tweens.add({
      targets: this.sprite,
      scaleX: 1.3,
      scaleY: 0.15,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        if (this.sprite.active) this.sprite.destroy();
        this.hpBg.destroy();
        this.hpFill.destroy();
      },
    });
  }

  private refreshHpBar(): void {
    const ratio = Phaser.Math.Clamp(this.hitsLeft / this.maxHits, 0, 1);
    this.hpFill.setScale(Math.max(0.001, ratio), 1);
    this.hpFill.setFillStyle(ratio > 0.55 ? 0x2ecc71 : ratio > 0.3 ? 0xf1c40f : 0xe74c3c);
    const show = !this.dead;
    this.hpBg.setVisible(show);
    this.hpFill.setVisible(show && this.hitsLeft > 0);
  }

  private syncHpBar(): void {
    const x = this.sprite.x;
    const y = this.sprite.y - this.sprite.displayHeight * 0.55 - 12;
    this.hpBg.setPosition(x, y);
    this.hpFill.setPosition(x - HP_BAR_W / 2 + 2, y);
    const show = !this.dead;
    this.hpBg.setVisible(show);
    this.hpFill.setVisible(show && this.hitsLeft > 0);
  }

  destroy(): void {
    this.dead = true;
    this.wobbleTween?.stop();
    if (this.hpBg.active) this.hpBg.destroy();
    if (this.hpFill.active) this.hpFill.destroy();
    if (this.sprite.active) this.sprite.destroy();
  }
}
