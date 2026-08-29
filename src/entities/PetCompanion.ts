import Phaser from 'phaser';
import type { PetId } from '../systems/SaveSystem';
import type { Enemy } from './Enemy';
import type { Player } from './Player';

export type PetBehavior = 'play' | 'attack' | 'quiet';

/** Floor slab under an enemy — used to park summoned mini snowmen. */
export type PetPlatform = { x: number; y: number; w: number; h: number };
export type PetPlatformResolver = (x: number, y: number) => PetPlatform | null;
export type PetPlatformLister = () => PetPlatform[];

const FOLLOW_LERP = 0.12;
const KITTEN_COIN_MS = 2800;
const SNOWMAN_ARMY = 50;
/** Soft cap of living minis on one slab. */
const SNOWMAN_PER_PLATFORM = 6;
/** Per-mini melee / snowball pacing (0.2s). */
const SNOWMAN_STRIKE_MS = 200;
const SNOWMAN_SNOWBALL_MS = 200;
/** Penguin-like shuffle — slow so they don't flicker across the slab. */
const SNOWMAN_MOVE = 0.7;
const SNOWMAN_REACH = 30;
const SNOWBALL_SPEED = 280;
/** Main snowman: big tracking snowball. */
const MAIN_SNOWBALL_INTERVAL_MS = 190;
const MAIN_SNOWBALL_LIFE_MS = 3000;
const MAIN_SNOWBALL_SPEED = 320;
/** Visual size relative to main snowman display size. */
const MAIN_SNOWBALL_SIZE_MUL = 1.15;
/** Escort: walk-on-terrain trail (not floating formation). */
const ESCORT_WALK_SPEED = 150;
const ESCORT_AIR_CONTROL = 0.4;
const ESCORT_GRAVITY = 1400;
const ESCORT_MAX_FALL = 920;
const ESCORT_FOOT = 16;
/** Fell this far below the player → snap back behind them. */
const ESCORT_CLIFF_RESCUE = 220;

function enemyIsFlyer(e: Enemy): boolean {
  return e.type === 'floater' || e.type === 'bat' || e.type === 'ghost';
}
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

type MiniSnowman = {
  sprite: Phaser.GameObjects.Sprite;
  target: Enemy | null;
  attackAt: number;
  slot: number;
  /** Solid floor this mini is assigned to. */
  plat: PetPlatform;
  platformKey: string;
  phase: number;
  baseY: number;
  animLockUntil: number;
  jumping: boolean;
  jumpAt: number;
  /** Separate timer so melee is not blocked by snowball cadence. */
  meleeAt: number;
  /** Escort: preferred distance behind the player (casual, per-mini). */
  escortDist: number;
  /** Escort: tiny horizontal wander so the pack isn't a ruler line. */
  escortJitter: number;
  /** Escort: vertical velocity while airborne. */
  vy: number;
  /** Escort: personalized walk speed multiplier. */
  walkMul: number;
};

type SnowballShot = {
  sprite: Phaser.GameObjects.Image;
  target: Enemy;
  expireAt: number;
  /** Locked visual scale — reapplied each frame so nothing can shrink it. */
  scale: number;
};

/** Main-snowman skill: lock-aim then straight flight; OHKO on contact. */
type MegaSnowball = {
  sprite: Phaser.GameObjects.Image;
  /** Locked unit direction at fire time — never retargets. */
  dirX: number;
  dirY: number;
  expireAt: number;
  scale: number;
  /** Enemies already hit this shot (pierce without multi-tick). */
  hit: Set<Enemy>;
};

/** Same visual size as the main snowman companion. */
const MINI_SCALE = 1;

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
  private waveAt = 0;
  private playFxAt = 0;
  private salvoAt = 0;
  private waves: WaveShot[] = [];
  private minis: MiniSnowman[] = [];
  private snowballs: SnowballShot[] = [];
  private megaSnowballs: MegaSnowball[] = [];
  private megaAt = 0;
  /** Snowman C-skill: false = recalled, true = army out and fighting. */
  private armyDeployed = false;
  /** Menu skill: all minis trail behind the player (snowball only, no melee/teleport). */
  private escortActive = false;
  private hopTween?: Phaser.Tweens.Tween;
  private readonly onOpenMenu: () => void;
  private readonly resolvePlatform: PetPlatformResolver | null;
  private readonly listPlatforms: PetPlatformLister | null;
  /** Spread companions when several are equipped. */
  private readonly followSlot: number;

  constructor(
    scene: Phaser.Scene,
    id: PetId,
    player: Player,
    onOpenMenu: () => void,
    resolvePlatform?: PetPlatformResolver,
    listPlatforms?: PetPlatformLister,
    followSlot = 0,
  ) {
    this.scene = scene;
    this.id = id;
    this.onOpenMenu = onOpenMenu;
    this.resolvePlatform = resolvePlatform ?? null;
    this.listPlatforms = listPlatforms ?? null;
    this.followSlot = followSlot;
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
    } else if (id === 'snowman') {
      // Soft body bounce so the main companion doesn't sit stiff.
      this.hopTween = scene.tweens.add({
        targets: this.sprite,
        scaleX: { from: 0.96, to: 1.06 },
        scaleY: { from: 1.06, to: 0.94 },
        angle: { from: -4, to: 4 },
        duration: 520,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    const now = scene.time.now;
    this.coinAt = now + KITTEN_COIN_MS;
    this.waveAt = now + 200;
    this.playFxAt = now + 400;
    this.salvoAt = now;
    this.megaAt = now + 400;
    this.applyBehaviorVisual();
  }

  setBehavior(mode: PetBehavior): void {
    this.behavior = mode;
    this.applyBehaviorVisual();
    const now = this.scene.time.now;
    // Reset combat timers so switching back to attack doesn't instantly dump abilities.
    this.waveAt = now + 400;
    this.playFxAt = now + 200;
    this.salvoAt = now + 400;
    this.megaAt = now + 400;
    if (mode !== 'attack') {
      this.armyDeployed = false;
      this.escortActive = false;
      this.dismissMinis();
      this.clearMegaSnowballs();
    }
  }

  /**
   * Snowman C-skill: deploy army / recall.
   * @returns 'deployed' | 'recalled' | 'none' (wrong pet)
   */
  toggleSnowmanArmy(): 'deployed' | 'recalled' | 'none' {
    if (this.id !== 'snowman') return 'none';
    // Raid and escort are mutually exclusive.
    if (this.escortActive) {
      this.escortActive = false;
      this.dismissMinis();
    }
    this.armyDeployed = !this.armyDeployed;
    if (!this.armyDeployed) {
      this.dismissMinis();
      return 'recalled';
    }
    if (this.behavior !== 'attack') {
      this.behavior = 'attack';
      this.applyBehaviorVisual();
    }
    return 'deployed';
  }

  isSnowmanArmyDeployed(): boolean {
    return this.id === 'snowman' && this.armyDeployed;
  }

  isSnowmanEscortActive(): boolean {
    return this.id === 'snowman' && this.escortActive;
  }

  /**
   * Pet-menu skill: summon the full squad to trail behind the player.
   * Snowballs only — no melee, no platform teleport.
   */
  toggleSnowmanEscort(): 'escort' | 'recalled' | 'none' {
    if (this.id !== 'snowman') return 'none';
    if (this.escortActive) {
      this.escortActive = false;
      this.dismissMinis();
      return 'recalled';
    }
    this.armyDeployed = false;
    this.dismissMinis();
    this.escortActive = true;
    if (this.behavior !== 'attack') {
      this.behavior = 'attack';
      this.applyBehaviorVisual();
    }
    return 'escort';
  }

  /**
   * Called when the player enters / leaves the pipe realm.
   * Clears old-zone minis and immediately refills in the new zone when deployed.
   */
  relocateSnowmanArmy(enemies?: Enemy[], player?: Player): void {
    if (this.id !== 'snowman') return;
    this.dismissMinis();
    this.clearSnowballs();
    if (this.escortActive && player) {
      this.ensureEscortArmy(player);
      return;
    }
    if (this.armyDeployed && enemies) {
      this.ensureSnowmanArmy(enemies);
    }
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
    let side = 34 + this.followSlot * 28;
    let bobAmp = 5;
    if (this.behavior === 'play') {
      side = 28 + this.followSlot * 28 + Math.sin(this.bob * 1.6) * 22;
      bobAmp = 14;
    } else if (this.behavior === 'quiet') {
      side = 26 + this.followSlot * 24;
      bobAmp = 2;
    }
    // Fish prefers the opposite flank when sharing the loadout with snowman.
    const flank = this.id === 'fish' && this.followSlot > 0 ? -face : face;

    const tx = player.sprite.x + flank * side;
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
    // quiet / play: follow only — no combat / play FX (except hearts above)

    if (this.id === 'snowman') {
      if (this.escortActive) this.ensureEscortArmy(player);
      else if (this.armyDeployed) this.ensureSnowmanArmy(enemies);
      if (this.behavior === 'attack' && now >= this.megaAt) {
        const target = this.pickMainSnowballTarget(enemies);
        if (target) {
          this.megaAt = now + MAIN_SNOWBALL_INTERVAL_MS;
          this.fireMegaSnowball(target);
        }
      }
    }

    this.updateMinis(player, enemies, delta);
    this.updateSnowballs(delta);
    this.updateMegaSnowballs(enemies, delta);
    this.updateWaves(enemies, delta);
  }

  destroy(): void {
    this.hopTween?.stop();
    this.sprite.removeAllListeners('pointerdown');
    this.dismissMinis();
    this.clearSnowballs();
    this.clearMegaSnowballs();
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

  private platformKeyFor(plat: PetPlatform): string {
    return `p:${Math.round(plat.x)}:${Math.round(plat.y)}:${Math.round(plat.w)}`;
  }

  private countMinisOnPlatform(key: string): number {
    return this.minis.filter((m) => m.sprite.active && m.platformKey === key).length;
  }

  private nearestFloor(x: number, y: number): PetPlatform | null {
    const floors = this.listPlatforms?.() ?? [];
    let best: PetPlatform | null = null;
    let bestScore = Infinity;
    for (const f of floors) {
      if (f.w < 40) continue;
      const cx = Phaser.Math.Clamp(x, f.x, f.x + f.w);
      const dx = cx - x;
      const dy = f.y - y;
      // Prefer floors below or near the enemy.
      const score = Math.abs(dx) + Math.abs(dy) * 1.35 + (dy < -40 ? 220 : 0);
      if (score < bestScore) {
        bestScore = score;
        best = f;
      }
    }
    return best ? { ...best } : null;
  }

  private livingEnemies(enemies: Enemy[]): Enemy[] {
    return enemies.filter((e) => !e.dead && e.sprite.active);
  }

  private isEnemyOnScreen(enemy: Enemy): boolean {
    const view = this.scene.cameras.main.worldView;
    const pad = 12;
    const ex = enemy.sprite.x;
    const ey = enemy.sprite.y;
    return (
      ex >= view.x - pad &&
      ex <= view.right + pad &&
      ey >= view.y - pad &&
      ey <= view.bottom + pad
    );
  }

  /**
   * Enemies mapped onto a solid floor.
   * Ground foes use their standing slab; flyers use the nearest walkable floor.
   * @param visibleOnly when true, only camera-visible foes (for teleport / melee chase).
   */
  private enemyPlatformSpots(
    enemies: Enemy[],
    visibleOnly = false,
  ): { enemy: Enemy; plat: PetPlatform; key: string; flying: boolean }[] {
    const list = visibleOnly ? this.findVisibleEnemies(enemies) : this.livingEnemies(enemies);
    const spots: { enemy: Enemy; plat: PetPlatform; key: string; flying: boolean }[] = [];
    for (const enemy of list) {
      const flying = enemyIsFlyer(enemy);
      let plat =
        this.resolvePlatform?.(enemy.sprite.x, enemy.sprite.y) ??
        (flying ? this.nearestFloor(enemy.sprite.x, enemy.sprite.y) : null);
      if (!plat || plat.w < 40) continue;
      spots.push({ enemy, plat, key: this.platformKeyFor(plat), flying });
    }
    return spots;
  }

  /** Platforms ranked by how many visible enemies they hold (desc). */
  private platformsByDensity(
    spots: { enemy: Enemy; plat: PetPlatform; key: string; flying: boolean }[],
  ): { key: string; plat: PetPlatform; enemies: Enemy[]; count: number }[] {
    const map = new Map<string, { key: string; plat: PetPlatform; enemies: Enemy[] }>();
    for (const s of spots) {
      const cur = map.get(s.key);
      if (cur) cur.enemies.push(s.enemy);
      else map.set(s.key, { key: s.key, plat: { ...s.plat }, enemies: [s.enemy] });
    }
    return [...map.values()]
      .map((g) => ({ ...g, count: g.enemies.length }))
      .sort((a, b) => b.count - a.count);
  }

  private clampMiniToPlatform(m: MiniSnowman): void {
    const margin = 18;
    const minX = m.plat.x + margin;
    const maxX = Math.max(minX, m.plat.x + m.plat.w - margin);
    m.sprite.x = Phaser.Math.Clamp(m.sprite.x, minX, maxX);
    m.baseY = m.plat.y - 16;
  }

  private respawnMiniToHotPlatform(
    m: MiniSnowman,
    ranked: { key: string; plat: PetPlatform; enemies: Enemy[]; count: number }[],
  ): void {
    if (ranked.length === 0) {
      if (m.sprite.active) m.sprite.destroy();
      return;
    }
    const pick =
      ranked.find((r) => this.countMinisOnPlatform(r.key) < SNOWMAN_PER_PLATFORM) ?? ranked[0];
    const idx = this.countMinisOnPlatform(pick.key);
    const margin = 22;
    const t = (idx % 8) / 7;
    const x = pick.plat.x + margin + t * Math.max(8, pick.plat.w - margin * 2);
    const y = pick.plat.y - 16;
    m.plat = { ...pick.plat };
    m.platformKey = pick.key;
    m.target = pick.enemies[idx % pick.enemies.length] ?? null;
    m.jumping = false;
    m.sprite.setPosition(x, y);
    m.sprite.setAlpha(1);
    m.sprite.setScale(MINI_SCALE);
    m.sprite.setAngle(0);
    m.baseY = y;
    m.animLockUntil = this.scene.time.now + 200;
    const pop = this.scene.add.circle(x, y, 10, 0xaed6f1, 0.55).setDepth(9);
    this.scene.tweens.add({
      targets: pop,
      scale: 2.2,
      alpha: 0,
      duration: 220,
      onComplete: () => pop.destroy(),
    });
  }

  /** Escort: keep full squad; they spawn on the player's floor and walk from there. */
  private ensureEscortArmy(player: Player): void {
    this.minis = this.minis.filter((m) => m.sprite.active);
    while (this.minis.length < SNOWMAN_ARMY) {
      this.spawnEscortMini(player, this.minis.length);
    }
  }

  private spawnEscortMini(player: Player, slot: number): void {
    const now = this.scene.time.now;
    const behind = player.sprite.flipX ? 1 : -1;
    // Uneven pack: irregular spacing + jitter, not a drill formation.
    const escortDist = 34 + slot * (11 + Math.random() * 9) + Math.random() * 16;
    const escortJitter = (Math.random() - 0.5) * 22;
    const walkMul = 0.72 + Math.random() * 0.55;

    const floor =
      this.resolvePlatform?.(player.sprite.x, player.sprite.y + 12) ??
      this.nearestFloor(player.sprite.x, player.sprite.y);
    const wantX = player.sprite.x + behind * escortDist + escortJitter;
    let x = wantX;
    let y = player.sprite.y;
    let plat: PetPlatform = floor
      ? { ...floor }
      : { x: player.sprite.x - 40, y: player.sprite.y + 16, w: 80, h: 16 };
    if (floor) {
      const minX = floor.x + 12;
      const maxX = Math.max(minX, floor.x + floor.w - 12);
      // Prefer behind on the same slab; if off the edge, pile near the trailing lip.
      if (wantX < minX || wantX > maxX) {
        x = behind < 0 ? minX + Math.random() * 18 : maxX - Math.random() * 18;
      } else {
        x = Phaser.Math.Clamp(wantX, minX, maxX);
      }
      y = floor.y - ESCORT_FOOT;
    }

    const sprite = this.scene.add.sprite(player.sprite.x, player.sprite.y, 'pet_snowman');
    sprite.setDepth(8);
    sprite.setScale(MINI_SCALE);
    sprite.setAlpha(0.25);
    sprite.setFlipX(player.sprite.flipX);
    sprite.setPosition(x, y);

    const mini: MiniSnowman = {
      sprite,
      target: null,
      attackAt: now + 180 + Math.floor(Math.random() * 320),
      slot,
      plat,
      platformKey: floor ? this.platformKeyFor(floor) : 'escort',
      phase: Math.random() * Math.PI * 2,
      baseY: y,
      animLockUntil: now + 160,
      jumping: false,
      jumpAt: now,
      meleeAt: Number.POSITIVE_INFINITY,
      escortDist,
      escortJitter,
      vy: 0,
      walkMul,
    };

    this.scene.tweens.add({
      targets: sprite,
      alpha: 1,
      duration: 180,
      onComplete: () => {
        if (sprite.active) mini.animLockUntil = this.scene.time.now;
      },
    });

    this.minis.push(mini);
  }

  /** After a cliff fall: reappear behind the player and keep walking. */
  private rescueEscortMini(m: MiniSnowman, player: Player): void {
    const behind = player.sprite.flipX ? 1 : -1;
    const floor =
      this.resolvePlatform?.(player.sprite.x, player.sprite.y + 12) ??
      this.nearestFloor(player.sprite.x, player.sprite.y);
    let x = player.sprite.x + behind * m.escortDist + m.escortJitter;
    let y = player.sprite.y;
    if (floor) {
      const minX = floor.x + 12;
      const maxX = Math.max(minX, floor.x + floor.w - 12);
      x = Phaser.Math.Clamp(x, minX, maxX);
      y = floor.y - ESCORT_FOOT;
      m.plat = { ...floor };
      m.platformKey = this.platformKeyFor(floor);
    }
    m.vy = 0;
    m.sprite.setPosition(x, y);
    m.sprite.setAlpha(1);
    m.sprite.setScale(MINI_SCALE);
    m.sprite.setAngle(0);
    m.baseY = y;
    m.animLockUntil = this.scene.time.now + 80;
    const puff = this.scene.add.circle(x, y, 9, 0xaed6f1, 0.5).setDepth(9);
    this.scene.tweens.add({
      targets: puff,
      scale: 2,
      alpha: 0,
      duration: 200,
      onComplete: () => puff.destroy(),
    });
  }

  /** Keep army at full strength; prefer denser platforms; max 6 per slab. */
  private ensureSnowmanArmy(enemies: Enemy[]): void {
    this.minis = this.minis.filter((m) => m.sprite.active);
    const spots = this.enemyPlatformSpots(enemies);
    const ranked = this.platformsByDensity(spots);

    // Trim platforms that somehow went over the cap.
    const byPlat = new Map<string, MiniSnowman[]>();
    for (const m of this.minis) {
      if (m.jumping) continue;
      const list = byPlat.get(m.platformKey) ?? [];
      list.push(m);
      byPlat.set(m.platformKey, list);
    }
    for (const list of byPlat.values()) {
      while (list.length > SNOWMAN_PER_PLATFORM) {
        const extra = list.pop()!;
        if (extra.sprite.active) extra.sprite.destroy();
        this.minis = this.minis.filter((m) => m !== extra);
      }
    }

    // Cliff / void rescue before filling slots.
    for (let i = this.minis.length - 1; i >= 0; i--) {
      const m = this.minis[i];
      if (m.jumping) continue;
      const under = this.resolvePlatform?.(m.sprite.x, m.baseY + 10);
      const lost =
        !under ||
        m.sprite.y > m.plat.y + 80 ||
        m.sprite.x < m.plat.x - 64 ||
        m.sprite.x > m.plat.x + m.plat.w + 64;
      if (!lost) continue;
      this.respawnMiniToHotPlatform(m, ranked);
      if (!m.sprite.active) this.minis.splice(i, 1);
    }

    if (ranked.length === 0) return;

    while (this.minis.length < SNOWMAN_ARMY) {
      const pick = ranked.find((r) => this.countMinisOnPlatform(r.key) < SNOWMAN_PER_PLATFORM);
      if (!pick) break;
      const target = pick.enemies[this.minis.length % pick.enemies.length];
      this.spawnMini(target, pick.plat, pick.key, this.minis.length);
    }
  }

  private spawnMini(target: Enemy, plat: PetPlatform, platformKey: string, slot: number): void {
    const indexOnPlat = this.countMinisOnPlatform(platformKey);
    const margin = 22;
    const spread = Math.max(8, plat.w - margin * 2);
    const t = ((indexOnPlat * 0.37) % 1 + slot * 0.05) % 1;
    const x = plat.x + margin + t * spread;
    const y = plat.y - 16;

    const now = this.scene.time.now;
    const sprite = this.scene.add.sprite(this.sprite.x, this.sprite.y, 'pet_snowman');
    sprite.setDepth(8);
    sprite.setScale(MINI_SCALE * 0.55, MINI_SCALE * 1.15);
    sprite.setAlpha(0.15);
    sprite.setAngle(-12 + (indexOnPlat % 5) * 4);

    const mini: MiniSnowman = {
      sprite,
      target,
      attackAt: now + 280 + (slot % 8) * 50,
      slot,
      plat: { ...plat },
      platformKey,
      phase: Math.random() * Math.PI * 2,
      baseY: y,
      animLockUntil: now + 420,
      jumping: false,
      jumpAt: now,
      meleeAt: now + 200,
      escortDist: 0,
      escortJitter: 0,
      vy: 0,
      walkMul: 1,
    };

    this.scene.tweens.add({
      targets: sprite,
      x,
      y: y - 18,
      alpha: 1,
      angle: 0,
      scaleX: MINI_SCALE * 0.9,
      scaleY: MINI_SCALE * 1.15,
      duration: 260,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        if (!sprite.active) return;
        this.scene.tweens.add({
          targets: sprite,
          y,
          scaleX: MINI_SCALE * 1.18,
          scaleY: MINI_SCALE * 0.78,
          duration: 90,
          ease: 'Quad.easeOut',
          yoyo: true,
          hold: 20,
          onComplete: () => {
            if (!sprite.active) return;
            sprite.setScale(MINI_SCALE);
            sprite.setAngle(0);
            this.clampMiniToPlatform(mini);
            mini.animLockUntil = this.scene.time.now;
          },
        });
      },
    });

    this.minis.push(mini);
  }

  private dismissMinis(): void {
    for (const m of this.minis) {
      if (!m.sprite.active) continue;
      const s = m.sprite;
      this.scene.tweens.add({
        targets: s,
        alpha: 0,
        scaleX: 0.15,
        scaleY: 0.35,
        angle: s.angle + (Math.random() > 0.5 ? 24 : -24),
        y: s.y - 16,
        duration: 200,
        ease: 'Back.easeIn',
        onComplete: () => {
          if (s.active) s.destroy();
        },
      });
    }
    this.minis = [];
  }

  private clearSnowballs(): void {
    for (const b of this.snowballs) {
      if (b.sprite.active) b.sprite.destroy();
    }
    this.snowballs = [];
  }

  private clearMegaSnowballs(): void {
    for (const b of this.megaSnowballs) {
      if (b.sprite.active) b.sprite.destroy();
    }
    this.megaSnowballs = [];
  }

  private pickMainSnowballTarget(enemies: Enemy[]): Enemy | null {
    const living = this.livingEnemies(enemies);
    if (living.length === 0) return null;
    const visible = living.filter((e) => this.isEnemyOnScreen(e));
    const pool = visible.length > 0 ? visible : living;
    let best: Enemy | null = null;
    let bestDist = Infinity;
    for (const e of pool) {
      const d = Phaser.Math.Distance.Between(
        this.sprite.x,
        this.sprite.y,
        e.sprite.x,
        e.sprite.y,
      );
      if (d < bestDist) {
        bestDist = d;
        best = e;
      }
    }
    return best;
  }

  private fireMegaSnowball(target: Enemy): void {
    this.ensureSnowballTexture();
    const ox = this.sprite.x;
    const oy = this.sprite.y - 10;
    // Lock aim at fire time — direction is frozen for the whole flight.
    let dx = target.sprite.x - ox;
    let dy = target.sprite.y - oy;
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;

    const ball = this.scene.add.image(ox, oy, 'snowball');
    ball.setDepth(21);
    const snowmanPx = Math.max(this.sprite.displayWidth, this.sprite.displayHeight, 32);
    const wantPx = snowmanPx * MAIN_SNOWBALL_SIZE_MUL;
    const src = Math.max(ball.width, ball.height, 1);
    const scale = wantPx / src;
    ball.setScale(scale);
    ball.setRotation(Math.atan2(dy, dx));
    this.megaSnowballs.push({
      sprite: ball,
      dirX: dx,
      dirY: dy,
      expireAt: this.scene.time.now + MAIN_SNOWBALL_LIFE_MS,
      scale,
      hit: new Set(),
    });
    this.scene.tweens.add({
      targets: this.sprite,
      angle: dx >= 0 ? -18 : 18,
      duration: 70,
      yoyo: true,
    });
  }

  /**
   * Locked straight shot: no homing, ignores terrain, OHKO pierce for 3s.
   */
  private updateMegaSnowballs(enemies: Enemy[], delta: number): void {
    const now = this.scene.time.now;
    const step = MAIN_SNOWBALL_SPEED * (delta / 1000);
    for (let i = this.megaSnowballs.length - 1; i >= 0; i--) {
      const b = this.megaSnowballs[i];
      if (!b.sprite.active) {
        this.megaSnowballs.splice(i, 1);
        continue;
      }
      b.sprite.setScale(b.scale);
      if (now >= b.expireAt) {
        this.scene.tweens.add({
          targets: b.sprite,
          alpha: 0,
          scale: b.scale * 1.4,
          duration: 180,
          onComplete: () => {
            if (b.sprite.active) b.sprite.destroy();
          },
        });
        this.megaSnowballs.splice(i, 1);
        continue;
      }

      b.sprite.x += b.dirX * step;
      b.sprite.y += b.dirY * step;
      b.sprite.angle += 10;

      const hitR = Math.max(28, (b.sprite.displayWidth + b.sprite.displayHeight) * 0.22);
      for (const e of this.livingEnemies(enemies)) {
        if (b.hit.has(e)) continue;
        const dist = Phaser.Math.Distance.Between(b.sprite.x, b.sprite.y, e.sprite.x, e.sprite.y);
        if (dist > hitR) continue;
        b.hit.add(e);
        e.instantKill();
        const burst = this.scene.add
          .circle(e.sprite.x, e.sprite.y, Math.max(22, b.sprite.displayWidth * 0.4), 0xd6eaf8, 0.7)
          .setDepth(21);
        this.scene.tweens.add({
          targets: burst,
          scale: 2.4,
          alpha: 0,
          duration: 240,
          onComplete: () => burst.destroy(),
        });
      }
    }
  }

  private playMiniStrike(m: MiniSnowman, towardX: number): void {
    const s = m.sprite;
    if (!s.active || m.jumping) return;
    const now = this.scene.time.now;
    m.animLockUntil = now + 380;
    this.clampMiniToPlatform(m);
    const face = towardX >= s.x ? 1 : -1;
    const originX = s.x;
    const originY = m.baseY;
    const margin = 18;
    const minX = m.plat.x + margin;
    const maxX = Math.max(minX, m.plat.x + m.plat.w - margin);
    const lungeX = Phaser.Math.Clamp(originX + face * 12, minX, maxX);

    this.scene.tweens.add({
      targets: s,
      x: lungeX,
      y: originY - 12,
      scaleX: MINI_SCALE * 0.82,
      scaleY: MINI_SCALE * 1.22,
      angle: face * -16,
      duration: 110,
      ease: 'Quad.easeOut',
      onComplete: () => {
        if (!s.active) return;
        this.scene.tweens.add({
          targets: s,
          x: lungeX,
          y: originY,
          scaleX: MINI_SCALE * 1.2,
          scaleY: MINI_SCALE * 0.72,
          angle: face * 10,
          duration: 100,
          ease: 'Back.easeOut',
          onComplete: () => {
            if (!s.active) return;
            this.scene.tweens.add({
              targets: s,
              x: originX,
              y: originY,
              scaleX: MINI_SCALE,
              scaleY: MINI_SCALE,
              angle: 0,
              duration: 140,
              ease: 'Sine.easeOut',
              onComplete: () => {
                if (!s.active) return;
                this.clampMiniToPlatform(m);
                m.animLockUntil = this.scene.time.now;
              },
            });
          },
        });
      },
    });
  }

  /** Instant transfer to another slab — no jump tween. */
  private teleportToPlatform(m: MiniSnowman, dest: PetPlatform, destKey: string, aimX: number): void {
    if (!m.sprite.active || m.jumping) return;
    const now = this.scene.time.now;
    if (now < m.jumpAt) return;
    m.jumpAt = now + 180;
    const margin = 18;
    const endX = Phaser.Math.Clamp(
      aimX,
      dest.x + margin,
      Math.max(dest.x + margin, dest.x + dest.w - margin),
    );
    const endY = dest.y - 16;
    m.plat = { ...dest };
    m.platformKey = destKey;
    m.baseY = endY;
    m.sprite.setPosition(endX, endY);
    m.sprite.setScale(MINI_SCALE);
    m.sprite.setAngle(0);
    m.animLockUntil = now;
    this.clampMiniToPlatform(m);
  }

  /** BootScene may not have regenerated this after HMR — build it on demand. */
  private ensureSnowballTexture(): void {
    const key = 'snowball';
    if (this.scene.textures.exists(key)) return;
    const g = this.scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xd6eaf8, 1);
    g.fillCircle(16, 16, 15.5);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(16, 16, 12);
    g.fillStyle(0xaed6f1, 0.9);
    g.fillCircle(11, 11, 3);
    g.generateTexture(key, 32, 32);
    g.destroy();
  }

  private fireSnowball(m: MiniSnowman, target: Enemy): void {
    this.ensureSnowballTexture();
    // Plain Image — no arcade body that can reset / ignore display size.
    const ball = this.scene.add.image(m.sprite.x, m.sprite.y - 8, 'snowball');
    ball.setDepth(20);
    // Visual diameter = 2/3 of the mini snowman's on-screen size.
    const snowmanPx = Math.max(m.sprite.displayWidth, m.sprite.displayHeight, 32 * MINI_SCALE);
    const wantPx = snowmanPx * (2 / 3);
    const src = Math.max(ball.width, ball.height, 1);
    const scale = wantPx / src;
    ball.setScale(scale);
    const dist = Phaser.Math.Distance.Between(ball.x, ball.y, target.sprite.x, target.sprite.y);
    const travelMs = Math.min(10_000, Math.max(900, (dist / SNOWBALL_SPEED) * 1000 + 400));
    this.snowballs.push({
      sprite: ball,
      target,
      expireAt: this.scene.time.now + travelMs,
      scale,
    });
    // Short pose only — must not block the 0.2s throw cadence.
    this.scene.tweens.add({
      targets: m.sprite,
      angle: target.sprite.x >= m.sprite.x ? -14 : 14,
      duration: 70,
      yoyo: true,
    });
  }

  private updateSnowballs(delta: number): void {
    const now = this.scene.time.now;
    for (let i = this.snowballs.length - 1; i >= 0; i--) {
      const b = this.snowballs[i];
      if (!b.sprite.active) {
        this.snowballs.splice(i, 1);
        continue;
      }
      // Keep forced size (guards against any accidental scale reset).
      b.sprite.setScale(b.scale);
      if (now >= b.expireAt || b.target.dead || !b.target.sprite.active) {
        b.sprite.destroy();
        this.snowballs.splice(i, 1);
        continue;
      }
      const tx = b.target.sprite.x;
      const ty = b.target.sprite.y;
      const dx = tx - b.sprite.x;
      const dy = ty - b.sprite.y;
      const dist = Math.hypot(dx, dy) || 1;
      const step = SNOWBALL_SPEED * (delta / 1000);
      const hitR = Math.max(24, (b.sprite.displayWidth + b.sprite.displayHeight) * 0.2);
      if (dist <= step + hitR) {
        const dmg = Math.max(1, Math.ceil(b.target.maxHits / 3));
        b.target.takeHits(dmg, dx >= 0 ? 1 : -1);
        const burst = this.scene.add
          .circle(tx, ty, Math.max(18, b.sprite.displayWidth * 0.35), 0xd6eaf8, 0.75)
          .setDepth(20);
        this.scene.tweens.add({
          targets: burst,
          scale: 2.2,
          alpha: 0,
          duration: 220,
          onComplete: () => burst.destroy(),
        });
        b.sprite.destroy();
        this.snowballs.splice(i, 1);
        continue;
      }
      // Manual flight — ignores terrain.
      b.sprite.x += (dx / dist) * step;
      b.sprite.y += (dy / dist) * step;
      b.sprite.angle += 12;
    }
  }

  /**
   * Target priority: on-screen (local slab → densest) → off-screen (local → densest).
   */
  private pickSnowmanTarget(
    m: MiniSnowman,
    visibleSpots: { enemy: Enemy; plat: PetPlatform; key: string; flying: boolean }[],
    visibleRanked: { key: string; plat: PetPlatform; enemies: Enemy[]; count: number }[],
    allSpots: { enemy: Enemy; plat: PetPlatform; key: string; flying: boolean }[],
    allRanked: { key: string; plat: PetPlatform; enemies: Enemy[]; count: number }[],
  ): Enemy | null {
    const localVisible = visibleSpots.filter((s) => s.key === m.platformKey);
    if (localVisible.length > 0) return localVisible[m.slot % localVisible.length].enemy;
    if (visibleRanked.length > 0) {
      const pack = visibleRanked[0];
      return pack.enemies[m.slot % pack.enemies.length] ?? null;
    }
    const localAll = allSpots.filter((s) => s.key === m.platformKey);
    if (localAll.length > 0) return localAll[m.slot % localAll.length].enemy;
    if (allRanked.length > 0) {
      const pack = allRanked[0];
      return pack.enemies[m.slot % pack.enemies.length] ?? null;
    }
    return null;
  }

  private updateMinis(player: Player, enemies: Enemy[], delta: number): void {
    if (this.minis.length === 0) return;
    if (this.escortActive) {
      this.updateEscortMinis(player, enemies, delta);
      return;
    }

    const now = this.scene.time.now;
    // All living foes — snowballs can reach off-camera. Visible set gates teleport/melee chase.
    const allSpots = this.enemyPlatformSpots(enemies, false);
    const visibleSpots = this.enemyPlatformSpots(enemies, true);
    const allRanked = this.platformsByDensity(allSpots);
    const visibleRanked = this.platformsByDensity(visibleSpots);
    const step = SNOWMAN_MOVE * (delta / 16.67);

    for (let i = this.minis.length - 1; i >= 0; i--) {
      const m = this.minis[i];
      if (!m.sprite.active) {
        this.minis.splice(i, 1);
        continue;
      }
      if (m.jumping) continue;

      m.baseY = m.plat.y - 16;

      // Prefer on-screen foes first, then off-screen. Within each tier: local slab → densest.
      if (!m.target || m.target.dead || !m.target.sprite.active) {
        m.target = this.pickSnowmanTarget(m, visibleSpots, visibleRanked, allSpots, allRanked);
      } else if (!this.isEnemyOnScreen(m.target) && visibleSpots.length > 0) {
        // Switch to an on-screen threat as soon as one appears.
        m.target = this.pickSnowmanTarget(m, visibleSpots, visibleRanked, allSpots, allRanked);
      }

      if (!m.target) {
        m.phase += delta * 0.008;
        if (now >= m.animLockUntil) {
          this.clampMiniToPlatform(m);
          const breathe = Math.sin(m.phase);
          m.sprite.y = m.baseY + Math.sin(m.phase * 1.2) * 2;
          m.sprite.setScale(MINI_SCALE * (1 + breathe * 0.05), MINI_SCALE * (1 - breathe * 0.06));
          m.sprite.setAngle(breathe * 6);
        }
        continue;
      }

      const spot = allSpots.find((s) => s.enemy === m.target);
      const targetKey = spot?.key ?? m.platformKey;
      const targetPlat = spot?.plat ?? m.plat;
      const flying = spot?.flying ?? enemyIsFlyer(m.target);
      const targetOnScreen = this.isEnemyOnScreen(m.target);

      // Teleport only toward on-screen foes — never chase off-camera for melee.
      if (
        targetOnScreen &&
        targetKey !== m.platformKey &&
        now >= m.animLockUntil &&
        now >= m.jumpAt
      ) {
        const roomOnTarget = this.countMinisOnPlatform(targetKey) < SNOWMAN_PER_PLATFORM;
        if (roomOnTarget) {
          this.teleportToPlatform(m, targetPlat, targetKey, m.target.sprite.x);
          continue;
        }
        const alt = visibleRanked.find(
          (r) =>
            r.key !== m.platformKey &&
            this.countMinisOnPlatform(r.key) < SNOWMAN_PER_PLATFORM &&
            r.enemies.length > 0,
        );
        if (alt) {
          m.target = alt.enemies[m.slot % alt.enemies.length] ?? null;
          this.teleportToPlatform(m, alt.plat, alt.key, alt.enemies[0]?.sprite.x ?? m.sprite.x);
          continue;
        }
      }

      const tx = m.target.sprite.x;
      const samePlat = targetKey === m.platformKey;
      const aimX = Phaser.Math.Clamp(
        samePlat ? tx : m.sprite.x,
        m.plat.x + 18,
        Math.max(m.plat.x + 18, m.plat.x + m.plat.w - 18),
      );
      const dx = aimX - m.sprite.x;
      const distX = Math.abs(tx - m.sprite.x);

      if (now < m.animLockUntil) {
        if (distX > 2) m.sprite.setFlipX(tx < m.sprite.x);
        this.clampMiniToPlatform(m);
        continue;
      }

      // Only waddle toward ground foes that share this platform (on-screen melee path).
      const moving = !flying && samePlat && targetOnScreen && distX > SNOWMAN_REACH;
      m.phase += delta * (moving ? 0.01 : 0.009);

      if (flying || !samePlat || !targetOnScreen) {
        this.clampMiniToPlatform(m);
        const breathe = Math.sin(m.phase * 1.1);
        m.sprite.y = m.baseY + Math.sin(m.phase * 1.4) * 2;
        m.sprite.setScale(MINI_SCALE * (1 + breathe * 0.05), MINI_SCALE * (1 - breathe * 0.06));
        m.sprite.setAngle(tx < m.sprite.x ? -8 : 8);
      } else if (moving) {
        const waddle = Math.sin(m.phase * 1.15);
        const stepGate = 0.45 + Math.abs(waddle) * 0.55;
        m.sprite.x += Math.sign(dx || 1) * step * stepGate * Math.min(Math.abs(dx), 3.2);
        this.clampMiniToPlatform(m);
        m.sprite.y = m.baseY - Math.abs(waddle) * 2.4;
        m.sprite.setScale(
          MINI_SCALE * (1 + Math.abs(waddle) * 0.05),
          MINI_SCALE * (1 - Math.abs(waddle) * 0.07),
        );
        m.sprite.setAngle(waddle * 16);
      } else {
        this.clampMiniToPlatform(m);
        const breathe = Math.sin(m.phase * 1.1);
        const sway = Math.sin(m.phase * 0.65);
        m.sprite.y = m.baseY + Math.sin(m.phase * 1.3) * 1.8;
        m.sprite.setScale(
          MINI_SCALE * (1 + breathe * 0.05),
          MINI_SCALE * (1 - breathe * 0.06),
        );
        m.sprite.setAngle(sway * 8 + (dx < 0 ? -2 : 2));
      }

      if (distX > 2) m.sprite.setFlipX(tx < m.sprite.x);

      // Snowballs hit any living foe, including off-camera.
      if (now >= m.attackAt) {
        m.attackAt = now + SNOWMAN_SNOWBALL_MS;
        this.fireSnowball(m, m.target);
      }

      // Melee only when the ground foe is on-screen, on this slab, and in reach.
      if (
        !flying &&
        samePlat &&
        targetOnScreen &&
        distX <= SNOWMAN_REACH + 10 &&
        now >= m.animLockUntil &&
        now >= m.meleeAt
      ) {
        m.meleeAt = now + SNOWMAN_STRIKE_MS;
        const dmg = Math.max(1, Math.ceil(m.target.maxHits / 3));
        const knock = tx >= m.sprite.x ? 1 : -1;
        m.target.takeHits(dmg, knock);
        this.playMiniStrike(m, tx);
      }
    }
  }

  /**
   * Walk behind the player on real floors (can walk off edges and fall).
   * Cliff fall → snap behind player and keep following. Snowballs only.
   */
  private updateEscortMinis(player: Player, enemies: Enemy[], delta: number): void {
    const now = this.scene.time.now;
    const dt = delta / 1000;
    const behind = player.sprite.flipX ? 1 : -1;
    const living = this.livingEnemies(enemies);
    const visible = living.filter((e) => this.isEnemyOnScreen(e));

    for (let i = this.minis.length - 1; i >= 0; i--) {
      const m = this.minis[i];
      if (!m.sprite.active) {
        this.minis.splice(i, 1);
        continue;
      }

      // Casual wander: occasionally nudge personal jitter so the pack breathes.
      if (Math.random() < 0.012) {
        m.escortJitter = Phaser.Math.Clamp(m.escortJitter + (Math.random() - 0.5) * 10, -26, 26);
      }

      const wantX = player.sprite.x + behind * m.escortDist + m.escortJitter;
      const footProbe = m.sprite.y + 10;
      let under = this.resolvePlatform?.(m.sprite.x, footProbe) ?? null;
      let grounded =
        !!under &&
        m.sprite.x >= under.x - 6 &&
        m.sprite.x <= under.x + under.w + 6 &&
        m.sprite.y >= under.y - ESCORT_FOOT - 10 &&
        m.sprite.y <= under.y - ESCORT_FOOT + 8 &&
        m.vy >= 0;

      if (grounded && under) {
        m.sprite.y = under.y - ESCORT_FOOT;
        m.vy = 0;
        m.plat = { ...under };
        m.platformKey = this.platformKeyFor(under);
        m.baseY = m.sprite.y;
      } else {
        m.vy = Math.min(ESCORT_MAX_FALL, m.vy + ESCORT_GRAVITY * dt);
        m.sprite.y += m.vy * dt;
        // Land on a lower / reached slab while falling.
        under = this.resolvePlatform?.(m.sprite.x, m.sprite.y + 10) ?? null;
        if (
          under &&
          m.vy >= 0 &&
          m.sprite.x >= under.x - 6 &&
          m.sprite.x <= under.x + under.w + 6 &&
          m.sprite.y >= under.y - ESCORT_FOOT - 4 &&
          m.sprite.y <= under.y - ESCORT_FOOT + 18
        ) {
          m.sprite.y = under.y - ESCORT_FOOT;
          m.vy = 0;
          grounded = true;
          m.plat = { ...under };
          m.platformKey = this.platformKeyFor(under);
          m.baseY = m.sprite.y;
        }
      }

      // Cliff / void: keep following behind the hero.
      if (m.sprite.y > player.sprite.y + ESCORT_CLIFF_RESCUE || m.sprite.y > player.sprite.y + 420) {
        this.rescueEscortMini(m, player);
        grounded = true;
      }

      const dx = wantX - m.sprite.x;
      const moving = Math.abs(dx) > 4;
      const speed = ESCORT_WALK_SPEED * m.walkMul * (grounded ? 1 : ESCORT_AIR_CONTROL);
      if (moving && now >= m.animLockUntil) {
        m.sprite.x += Math.sign(dx) * Math.min(Math.abs(dx), speed * dt);
      }

      // Face walk direction while shuffling; idle faces the player facing.
      if (moving) m.sprite.setFlipX(dx < 0);
      else m.sprite.setFlipX(player.sprite.flipX);

      m.phase += delta * (moving && grounded ? 0.014 : 0.007);
      if (grounded && moving) {
        const waddle = Math.sin(m.phase * 1.2);
        m.sprite.y = m.baseY - Math.abs(waddle) * 2.2;
        m.sprite.setScale(
          MINI_SCALE * (1 + Math.abs(waddle) * 0.05),
          MINI_SCALE * (1 - Math.abs(waddle) * 0.07),
        );
        m.sprite.setAngle(waddle * 14);
      } else if (grounded) {
        const breathe = Math.sin(m.phase);
        m.sprite.y = m.baseY + Math.sin(m.phase * 1.1) * 1.2;
        m.sprite.setScale(MINI_SCALE * (1 + breathe * 0.03), MINI_SCALE * (1 - breathe * 0.04));
        m.sprite.setAngle(breathe * 4);
      } else {
        m.sprite.setAngle(m.vy > 200 ? 12 : -6);
        m.sprite.setScale(MINI_SCALE * 0.92, MINI_SCALE * 1.08);
      }

      const pool = visible.length > 0 ? visible : living;
      if (!m.target || m.target.dead || !m.target.sprite.active) {
        m.target = pool.length > 0 ? pool[m.slot % pool.length] : null;
      } else if (!this.isEnemyOnScreen(m.target) && visible.length > 0) {
        m.target = visible[m.slot % visible.length];
      }

      if (m.target && now >= m.attackAt && now >= m.animLockUntil) {
        m.attackAt = now + SNOWMAN_SNOWBALL_MS;
        this.fireSnowball(m, m.target);
      }
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
