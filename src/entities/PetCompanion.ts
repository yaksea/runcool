import Phaser from 'phaser';
import type { PetId } from '../systems/SaveSystem';
import type { Enemy } from './Enemy';
import type { Player } from './Player';

export type PetBehavior = 'play' | 'attack' | 'quiet';

const FOLLOW_LERP = 0.12;
const KITTEN_COIN_MS = 2800;
const SNOWMAN_COOLDOWN_MS = 5000;
const SNOWMAN_FREEZE_MS = 2000;
const FISH_WAVE_MS = 500;
const WAVE_SPEED = 320;
const WAVE_TURN = 0.18;
const WAVE_RETURN_SPEED = 380;
const WAVE_ORBIT_RADIUS = 34;
const WAVE_ORBIT_SPIN = 0.0042;
const WAVE_ORBIT_MAX = 8;
const WAVE_SALVO_COOLDOWN_MS = 250;
const WAVE_REHIT_MS = 380;

type WavePhase = 'seek' | 'return' | 'orbit';

type WaveShot = {
  sprite: Phaser.Physics.Arcade.Sprite;
  hit: Set<Enemy>;
  dir: number;
  expireAt: number;
  target: Enemy | null;
  phase: WavePhase;
  orbitAngle: number;
};

/**
 * Equipped companion: follows the player and applies pet-specific effects.
 * Behavior (play / attack / quiet) is set in-level via click menu.
 */
export class PetCompanion {
  readonly id: PetId;
  readonly sprite: Phaser.GameObjects.Sprite;
  behavior: PetBehavior = 'attack';
  private readonly scene: Phaser.Scene;
  private bob = Math.random() * Math.PI * 2;
  private coinAt = 0;
  private freezeAt = 0;
  private waveAt = 0;
  private playFxAt = 0;
  private salvoAt = 0;
  private waves: WaveShot[] = [];
  private hopTween?: Phaser.Tweens.Tween;
  private readonly onOpenMenu: () => void;

  constructor(scene: Phaser.Scene, id: PetId, player: Player, onOpenMenu: () => void) {
    this.scene = scene;
    this.id = id;
    this.onOpenMenu = onOpenMenu;
    const key =
      id === 'kitten' ? 'pet_kitten' : id === 'snowman' ? 'pet_snowman' : 'pet_fish';
    this.sprite = scene.add.sprite(player.sprite.x - 36, player.sprite.y - 8, key);
    this.sprite.setDepth(9);
    this.sprite.setScale(id === 'fish' ? 0.95 : 1);
    this.sprite.setInteractive({ useHandCursor: true, pixelPerfect: false });
    this.sprite.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, ev: Phaser.Types.Input.EventData) => {
      ev.stopPropagation();
      this.onOpenMenu();
    });

    if (id === 'fish') {
      this.hopTween = scene.tweens.add({
        targets: this.sprite,
        scaleY: 1.08,
        duration: 220,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    const now = scene.time.now;
    this.coinAt = now + KITTEN_COIN_MS;
    this.freezeAt = now + 600;
    this.waveAt = now + 200;
    this.playFxAt = now + 400;
    this.salvoAt = now;
    this.applyBehaviorVisual();
  }

  setBehavior(mode: PetBehavior): void {
    this.behavior = mode;
    this.applyBehaviorVisual();
    const now = this.scene.time.now;
    // Reset combat timers so switching back to attack doesn't instantly dump abilities.
    this.freezeAt = now + 800;
    this.waveAt = now + 400;
    this.playFxAt = now + 200;
    this.salvoAt = now + 400;
  }

  update(
    player: Player,
    enemies: Enemy[],
    delta: number,
    onCoin: (amount: number) => void,
  ): void {
    if (!this.sprite.active || !player.sprite.active) return;
    const now = this.scene.time.now;
    this.bob += delta * (this.behavior === 'play' ? 0.014 : this.behavior === 'quiet' ? 0.005 : 0.008);

    const face = player.sprite.flipX ? 1 : -1;
    let side = 34;
    let bobAmp = 5;
    if (this.behavior === 'play') {
      side = 28 + Math.sin(this.bob * 1.6) * 22;
      bobAmp = 14;
    } else if (this.behavior === 'quiet') {
      side = 26;
      bobAmp = 2;
    }

    const tx = player.sprite.x + face * side;
    const ty = player.sprite.y - 10 + Math.sin(this.bob) * bobAmp;
    const lerp = this.behavior === 'play' ? 0.18 : FOLLOW_LERP;
    this.sprite.x += (tx - this.sprite.x) * lerp;
    this.sprite.y += (ty - this.sprite.y) * lerp;
    this.sprite.setFlipX(player.sprite.flipX);

    if (this.behavior === 'play') {
      if (now >= this.playFxAt) {
        this.playFxAt = now + 700;
        this.spawnPlayHeart();
      }
    } else if (this.behavior === 'attack') {
      if (this.id === 'kitten' && now >= this.coinAt) {
        this.coinAt = now + KITTEN_COIN_MS;
        onCoin(1);
        this.spawnCoinPop();
      }

      if (this.id === 'snowman' && now >= this.freezeAt) {
        this.freezeAt = now + SNOWMAN_COOLDOWN_MS;
        this.pulseFreeze(enemies);
      }

      if (this.id === 'fish') {
        if (now >= this.waveAt) {
          this.waveAt = now + FISH_WAVE_MS;
          this.fireWave(player, enemies);
        }
        if (now >= this.salvoAt) {
          this.tryOrbitSalvo(enemies);
        }
      }
    }
    // quiet: follow only — no combat / play FX

    this.updateWaves(enemies, delta);
  }

  destroy(): void {
    this.hopTween?.stop();
    this.sprite.removeAllListeners('pointerdown');
    for (const w of this.waves) {
      if (w.sprite.active) w.sprite.destroy();
    }
    this.waves = [];
    if (this.sprite.active) this.sprite.destroy();
  }

  private applyBehaviorVisual(): void {
    if (this.behavior === 'quiet') {
      this.sprite.setTint(0xb0c4de);
      this.hopTween?.pause();
    } else if (this.behavior === 'play') {
      this.sprite.clearTint();
      this.hopTween?.resume();
    } else {
      this.sprite.clearTint();
      this.hopTween?.resume();
    }
  }

  private spawnPlayHeart(): void {
    const t = this.scene.add
      .text(this.sprite.x, this.sprite.y - 16, '♥', {
        fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
        fontSize: '14px',
        color: '#ff6b8a',
      })
      .setOrigin(0.5)
      .setDepth(22);
    this.scene.tweens.add({
      targets: t,
      y: t.y - 28,
      alpha: 0,
      duration: 560,
      onComplete: () => t.destroy(),
    });
  }

  private spawnCoinPop(): void {
    const t = this.scene.add
      .text(this.sprite.x, this.sprite.y - 18, '+1', {
        fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
        fontSize: '14px',
        color: '#f1c40f',
        stroke: '#1a1a1a',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(22);
    this.scene.tweens.add({
      targets: t,
      y: t.y - 22,
      alpha: 0,
      duration: 500,
      onComplete: () => t.destroy(),
    });
  }

  private pulseFreeze(enemies: Enemy[]): void {
    const view = this.scene.cameras.main.worldView;
    const pad = 8;
    let hit = false;

    for (const e of enemies) {
      if (e.dead || !e.sprite.active) continue;
      const ex = e.sprite.x;
      const ey = e.sprite.y;
      if (
        ex < view.x - pad ||
        ex > view.right + pad ||
        ey < view.y - pad ||
        ey > view.bottom + pad
      ) {
        continue;
      }

      const dmg = Math.ceil(e.hitsLeft / 3);
      const knockDir = ex >= this.sprite.x ? 1 : -1;
      if (dmg > 0) e.takeHits(dmg, knockDir);
      if (!e.dead) e.applyFreeze(SNOWMAN_FREEZE_MS);
      hit = true;
    }

    const cam = this.scene.cameras.main;
    const flash = this.scene.add
      .rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0xaed6f1, 0.28)
      .setScrollFactor(0)
      .setDepth(30);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 280,
      onComplete: () => flash.destroy(),
    });

    if (hit) {
      const ring = this.scene.add.circle(this.sprite.x, this.sprite.y, 10, 0x85c1e9, 0.45).setDepth(8);
      this.scene.tweens.add({
        targets: ring,
        scale: 4,
        alpha: 0,
        duration: 360,
        onComplete: () => ring.destroy(),
      });
    }
  }

  private fireWave(_player: Player, _enemies: Enemy[]): void {
    const live = this.waves.filter((w) => w.sprite.active).length;
    if (live >= WAVE_ORBIT_MAX) return;

    const angle = (live / WAVE_ORBIT_MAX) * Math.PI * 2;
    const x = this.sprite.x + Math.cos(angle) * WAVE_ORBIT_RADIUS;
    const y = this.sprite.y + Math.sin(angle) * WAVE_ORBIT_RADIUS;
    const sprite = this.scene.physics.add.sprite(x, y, 'pet_wave');
    sprite.setDepth(8);
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setVelocity(0, 0);
    body.setSize(18, 18);
    body.setOffset(3, 3);
    body.checkCollision.none = true;

    const w: WaveShot = {
      sprite,
      hit: new Set(),
      dir: 1,
      expireAt: Number.POSITIVE_INFINITY,
      target: null,
      phase: 'orbit',
      orbitAngle: angle,
    };
    this.waves.push(w);
    this.respaceOrbit();
  }

  /** When 8 bubbles orbit and any enemy is on-screen, launch the whole ring. */
  private tryOrbitSalvo(enemies: Enemy[]): void {
    const visible = this.findVisibleEnemies(enemies);
    if (visible.length === 0) return;

    const orbiting = this.waves.filter((w) => w.phase === 'orbit' && w.sprite.active);
    if (orbiting.length < WAVE_ORBIT_MAX) return;

    const now = this.scene.time.now;
    this.salvoAt = now + WAVE_SALVO_COOLDOWN_MS;

    orbiting.forEach((w, i) => {
      const target = visible[i % visible.length];
      w.phase = 'seek';
      w.target = target;
      w.hit = new Set();
      w.expireAt = Number.POSITIVE_INFINITY;
      const dx = target.sprite.x - w.sprite.x;
      const dy = target.sprite.y - w.sprite.y;
      const len = Math.hypot(dx, dy) || 1;
      w.dir = dx >= 0 ? 1 : -1;
      const body = w.sprite.body as Phaser.Physics.Arcade.Body;
      body.setVelocity((dx / len) * WAVE_SPEED, (dy / len) * WAVE_SPEED);
    });
  }

  private findVisibleEnemies(enemies: Enemy[]): Enemy[] {
    const view = this.scene.cameras.main.worldView;
    const pad = 12;
    const px = this.sprite.x;
    const py = this.sprite.y;
    const list: { e: Enemy; d: number }[] = [];
    for (const e of enemies) {
      if (e.dead || !e.sprite.active) continue;
      const ex = e.sprite.x;
      const ey = e.sprite.y;
      if (
        ex < view.x - pad ||
        ex > view.right + pad ||
        ey < view.y - pad ||
        ey > view.bottom + pad
      ) {
        continue;
      }
      list.push({ e, d: Math.hypot(ex - px, ey - py) });
    }
    list.sort((a, b) => a.d - b.d);
    return list.map((x) => x.e);
  }

  private beginOrbit(w: WaveShot): void {
    w.phase = 'orbit';
    w.target = null;
    w.hit = new Set();
    w.expireAt = Number.POSITIVE_INFINITY;
    const body = w.sprite.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    this.respaceOrbit();
  }

  private respaceOrbit(): void {
    const orbiting = this.waves.filter((o) => o.phase === 'orbit' && o.sprite.active);
    orbiting.forEach((o, i) => {
      o.orbitAngle = (i / Math.max(1, orbiting.length)) * Math.PI * 2;
    });
  }

  private pickSeekTarget(enemies: Enemy[], x: number, y: number): Enemy | null {
    const visible = this.findVisibleEnemies(enemies);
    if (visible.length === 0) return null;
    let best: Enemy | null = null;
    let bestDist = Infinity;
    for (const e of visible) {
      const d = Math.hypot(e.sprite.x - x, e.sprite.y - y);
      if (d < bestDist) {
        bestDist = d;
        best = e;
      }
    }
    return best;
  }

  private updateWaves(enemies: Enemy[], delta: number): void {
    const now = this.scene.time.now;
    const world = this.scene.physics.world.bounds;
    const turn = Math.min(1, WAVE_TURN * (delta / 16.67));
    const px = this.sprite.x;
    const py = this.sprite.y;
    const visible = this.findVisibleEnemies(enemies);
    const canHunt = this.behavior === 'attack' && visible.length > 0;

    for (let i = this.waves.length - 1; i >= 0; i--) {
      const w = this.waves[i];
      if (!w.sprite.active) {
        this.waves.splice(i, 1);
        continue;
      }

      if (w.phase !== 'orbit' && Number.isFinite(w.expireAt) && now >= w.expireAt) {
        w.sprite.destroy();
        this.waves.splice(i, 1);
        continue;
      }

      const sx = w.sprite.x;
      const sy = w.sprite.y;
      const body = w.sprite.body as Phaser.Physics.Arcade.Body;

      if (w.phase === 'orbit') {
        w.orbitAngle += WAVE_ORBIT_SPIN * delta;
        const ox = px + Math.cos(w.orbitAngle) * WAVE_ORBIT_RADIUS;
        const oy = py + Math.sin(w.orbitAngle) * WAVE_ORBIT_RADIUS;
        body.setVelocity(0, 0);
        w.sprite.setPosition(ox, oy);
        continue;
      }

      if (w.phase === 'return') {
        const dx = px - sx;
        const dy = py - sy;
        const dist = Math.hypot(dx, dy) || 1;
        if (dist < 26) {
          this.beginOrbit(w);
          continue;
        }
        body.setVelocity((dx / dist) * WAVE_RETURN_SPEED, (dy / dist) * WAVE_RETURN_SPEED);
        continue;
      }

      // seek — keep attacking while anything is on-screen; otherwise fly home.
      if (!canHunt) {
        w.phase = 'return';
        w.target = null;
        w.expireAt = now + 6000;
        continue;
      }

      if (
        sx < world.x - 120 ||
        sx > world.right + 120 ||
        sy < world.y - 120 ||
        sy > world.bottom + 120
      ) {
        // Soft leash: pull back toward camera center if drifted too far.
        const cx = this.scene.cameras.main.worldView.centerX;
        const cy = this.scene.cameras.main.worldView.centerY;
        const dx = cx - sx;
        const dy = cy - sy;
        const len = Math.hypot(dx, dy) || 1;
        body.setVelocity((dx / len) * WAVE_SPEED, (dy / len) * WAVE_SPEED);
      }

      if (!w.target || w.target.dead || !w.target.sprite.active || !visible.includes(w.target)) {
        w.target = this.pickSeekTarget(enemies, sx, sy);
      }

      if (w.target) {
        const dx = w.target.sprite.x - sx;
        const dy = w.target.sprite.y - sy;
        const len = Math.hypot(dx, dy) || 1;
        const tx = (dx / len) * WAVE_SPEED;
        const ty = (dy / len) * WAVE_SPEED;
        body.setVelocity(
          Phaser.Math.Linear(body.velocity.x, tx, turn),
          Phaser.Math.Linear(body.velocity.y, ty, turn),
        );
        w.dir = dx >= 0 ? 1 : -1;
      }

      for (const e of enemies) {
        if (e.dead || !e.sprite.active || w.hit.has(e)) continue;
        const dx = e.sprite.x - sx;
        const dy = e.sprite.y - sy;
        if (Math.abs(dx) > 22 || Math.abs(dy) > 22) continue;
        w.hit.add(e);
        const dmg = Math.ceil(e.hitsLeft / 2);
        e.takeHits(dmg, w.dir);
        // Keep hunting — brief rehit lock so the same enemy isn't multi-ticked same frame.
        this.scene.time.delayedCall(WAVE_REHIT_MS, () => {
          w.hit.delete(e);
        });
        break;
      }
    }
  }
}
