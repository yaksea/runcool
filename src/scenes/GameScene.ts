import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { WeaponPickup } from '../entities/WeaponPickup';
import { CoinPickup } from '../entities/CoinPickup';
import { fireProjectile, retirePhysicsSprite, segmentHitsBody } from '../entities/Projectile';
import { Seesaw } from '../entities/Seesaw';
import { FanZone } from '../entities/FanZone';
import { CrumblePlatform } from '../entities/CrumblePlatform';
import { Bumper } from '../entities/Bumper';
import { PortalPairSystem } from '../entities/Portal';
import { Geyser } from '../entities/Geyser';
import { FlameVent } from '../entities/FlameVent';
import { AcidPool } from '../entities/AcidPool';
import { TimedPlatform } from '../entities/TimedPlatform';
import { InteractSystem } from '../entities/Interactables';
import { getLevelById, isTutorialLevel, LEVELS } from '../levels';
import type { EnemyDef, LadderDef, LevelDef } from '../levels/types';
import {
  buildTutorialZones,
  nearestTutorialZone,
  tipForEnemyType,
  type TutorialZone,
} from '../game/tutorialAssist';
import { ZH, skillLabel, specialLabel, weaponLabel, weaponPickupToast } from '../i18n/zh';
import { THEME } from '../style/theme';
import { WEAPON_STATS } from '../game/weapons';
import {
  ORBIT_ENGAGE_RANGE,
  missileCooldownMs,
  missileSalvoCount,
  orbitCapacity,
  orbitShieldsUnlocked,
  shapeById,
  skillById,
  skinById,
  specialById,
} from '../game/shopCatalog';
import { rollEnemyCoinDrop } from '../game/loot';
import {
  PIPE_ARENA,
  PIPE_ARENA_HITS,
  PIPE_ENTER_INVINCIBLE_MS,
  arenaOriginX,
  pipeArenaPack,
  pipeArenaReward,
} from '../game/pipeArena';
import { SaveSystem, type WeaponType } from '../systems/SaveSystem';
import { SoundSystem } from '../systems/SoundSystem';

export type GameSceneData = {
  levelId: string;
  continueRun?: boolean;
};

export class GameScene extends Phaser.Scene {
  private level!: LevelDef;
  private player!: Player;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private movingGroup!: Phaser.Physics.Arcade.Group;
  private spikes!: Phaser.Physics.Arcade.StaticGroup;
  private pads!: Phaser.Physics.Arcade.StaticGroup;
  private finish!: Phaser.Physics.Arcade.Sprite;
  private enemies: Enemy[] = [];
  /** Overworld spawn points: death→respawn, alive→reinforce, every 30s. */
  private spawnPoints: {
    def: EnemyDef;
    current: Enemy | null;
    nextAt: number;
    extras: Enemy[];
  }[] = [];
  private tutorialZones: TutorialZone[] = [];
  private tutorialAssistOn = true;
  private lastTutorialZoneId: string | null = null;
  private pickups: WeaponPickup[] = [];
  private coins: CoinPickup[] = [];
  private projectiles!: Phaser.Physics.Arcade.Group;
  private hazardProjectiles!: Phaser.Physics.Arcade.Group;
  private checkpointSprites: Phaser.GameObjects.Sprite[] = [];
  /** Warp pipe → monster arena (one per level). */
  private pipeSprite?: Phaser.Physics.Arcade.Sprite;
  private pipeState: 'available' | 'active' | 'done' = 'available';
  private arenaEnemies: Enemy[] = [];
  private pipeReturn = { x: 0, y: 0 };
  /** Vitals snapshot taken on pipe enter; restored on exit. */
  private pipeSavedVitals = { hp: 3, armor: 3 };
  private arenaOrigin = { x: 0, y: 0 };
  private arenaVeil?: Phaser.GameObjects.Rectangle;
  private overworldBounds = { w: 0, h: 0 };

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keyW!: Phaser.Input.Keyboard.Key;
  private keyS!: Phaser.Input.Keyboard.Key;
  private keySpace!: Phaser.Input.Keyboard.Key;
  private keyJ!: Phaser.Input.Keyboard.Key;
  private keyK!: Phaser.Input.Keyboard.Key;
  private keyM!: Phaser.Input.Keyboard.Key;
  private keyN!: Phaser.Input.Keyboard.Key;
  private keyP!: Phaser.Input.Keyboard.Key;
  private keyB!: Phaser.Input.Keyboard.Key;
  private keyX!: Phaser.Input.Keyboard.Key;
  private skillReadyAt = 0;
  private missileReadyAt = 0;
  private orbitReadyAt = 0;
  private missiles: {
    sprite: Phaser.Physics.Arcade.Sprite;
    target: Enemy | null;
    /** True while circling the player (orbit special). */
    orbiting: boolean;
    orbitAngle: number;
  }[] = [];
  /** Shared spin for evenly spaced orbit missiles. */
  private orbitBaseAngle = 0;
  private orbitRing?: Phaser.GameObjects.Graphics;
  /** After firing a gun, suppress stomp so jump+shoot is not mistaken for OHKO. */
  private stompSuppressUntil = 0;
  private enemiesGroup!: Phaser.GameObjects.Group;

  private checkpointIndex = -1;
  private elapsedMs = 0;
  private deaths = 0;
  private runActive = true;
  private paused = false;
  private inventoryOpen = false;
  private adOpen = false;
  private dying = false;
  private ladders: LadderDef[] = [];
  private seesaws: Seesaw[] = [];
  private fans: FanZone[] = [];
  private crumbles: CrumblePlatform[] = [];
  private bumpers: Bumper[] = [];
  private portals: PortalPairSystem | null = null;
  private geysers: Geyser[] = [];
  private flameVents: FlameVent[] = [];
  private acidPools: AcidPool[] = [];
  private timedPlatforms: TimedPlatform[] = [];
  private interact!: InteractSystem;
  private conveyors: {
    id?: string;
    sprite: Phaser.Physics.Arcade.Sprite;
    dir: -1 | 1;
    speed: number;
    x: number;
    y: number;
    w: number;
    h: number;
  }[] = [];
  private movingMeta: {
    sprite: Phaser.Physics.Arcade.Sprite;
    axis: 'x' | 'y';
    origin: number;
    range: number;
    speed: number;
    dir: number;
  }[] = [];

  constructor() {
    super('GameScene');
  }

  init(data: GameSceneData): void {
    const level = getLevelById(data.levelId) ?? LEVELS[0];
    this.level = level;
    this.enemies = [];
    this.spawnPoints = [];
    this.tutorialZones = [];
    this.lastTutorialZoneId = null;
    this.tutorialAssistOn = SaveSystem.load().tutorialAssist !== false;
    this.pickups = [];
    this.coins = [];
    this.checkpointSprites = [];
    this.movingMeta = [];
    this.ladders = [];
    this.seesaws = [];
    this.fans = [];
    this.crumbles = [];
    this.bumpers = [];
    this.portals = null;
    this.geysers = [];
    this.flameVents = [];
    this.acidPools = [];
    this.timedPlatforms = [];
    this.conveyors = [];
    this.checkpointFloorIds = null;
    this.pipeSprite = undefined;
    this.pipeState = 'available';
    this.arenaEnemies = [];
    this.arenaVeil = undefined;
    this.runActive = true;
    this.paused = false;
    this.inventoryOpen = false;
    this.adOpen = false;
    this.dying = false;
    this.skillReadyAt = 0;
    this.missileReadyAt = 0;
    this.orbitReadyAt = 0;
    this.missiles = [];
    this.orbitBaseAngle = 0;
    this.orbitRing?.destroy();
    this.orbitRing = undefined;
    this.stompSuppressUntil = 0;

    const save = SaveSystem.load();
    if (data.continueRun && save.activeRun?.levelId === level.id) {
      this.checkpointIndex = save.activeRun.checkpointIndex;
      this.elapsedMs = save.activeRun.elapsedMs;
      this.deaths = save.activeRun.deaths;
    } else {
      this.checkpointIndex = -1;
      this.elapsedMs = 0;
      this.deaths = 0;
      SaveSystem.startRun(level.id);
    }
  }

  create(): void {
    this.overworldBounds = { w: this.level.worldWidth, h: this.level.worldHeight };
    const hasPipe = !!this.level.pipe;
    this.arenaOrigin = { x: arenaOriginX(this.level.worldWidth), y: 40 };
    const worldW = hasPipe
      ? this.arenaOrigin.x + PIPE_ARENA.width + 40
      : this.level.worldWidth;
    const worldH = hasPipe
      ? Math.max(this.level.worldHeight, this.arenaOrigin.y + PIPE_ARENA.height + 40)
      : this.level.worldHeight;
    this.physics.world.setBounds(0, 0, worldW, worldH);
    this.cameras.main.setBounds(0, 0, this.level.worldWidth, this.level.worldHeight);
    this.drawParallax();

    this.platforms = this.physics.add.staticGroup();
    this.spikes = this.physics.add.staticGroup();
    this.pads = this.physics.add.staticGroup();
    this.movingGroup = this.physics.add.group({ allowGravity: false, immovable: true });
    this.projectiles = this.physics.add.group();
    this.hazardProjectiles = this.physics.add.group();
    // Plain group so we don't rewrite enemy body flags when adding sprites.
    this.enemiesGroup = this.add.group();

    this.buildPlatforms();
    this.buildMovingPlatforms();
    this.buildLadders();
    this.buildSeesaws();
    this.buildConveyors();
    this.buildFans();
    this.buildCrumbles();
    this.buildBumpers();
    this.buildPortals();
    this.buildGeysers();
    this.buildFlameVents();
    this.buildAcidPools();
    this.buildTimedPlatforms();
    this.buildInteractables();
    this.buildSpikes();
    this.buildPads();
    this.buildCheckpoints();
    this.buildFinish();
    this.buildPipeAndArena();
    this.spawnPlayer();
    this.spawnEnemies();
    this.spawnWeapons();
    this.spawnCoins();
    this.portals?.suppress(1500);

    this.physics.add.overlap(this.player.sprite, this.hazardProjectiles, (_p, shot) => {
      const s = shot as Phaser.Physics.Arcade.Sprite;
      // Spent or already bounced back by the orbit shield — never hurt the player.
      if (!s.active || s.getData('spent') === true || s.getData('reflected') === true) return;
      retirePhysicsSprite(s);
      this.hurtPlayer();
    });
    // Homing hazard shots are blocked by solid terrain (static + moving floors).
    // Reflected shots ignore terrain and keep flying.
    this.physics.add.overlap(this.hazardProjectiles, this.platforms, (proj) => {
      const s = proj as Phaser.Physics.Arcade.Sprite;
      if (s.getData('reflected') === true) return;
      retirePhysicsSprite(s);
    });
    this.physics.add.overlap(this.hazardProjectiles, this.movingGroup, (proj) => {
      const s = proj as Phaser.Physics.Arcade.Sprite;
      if (s.getData('reflected') === true) return;
      retirePhysicsSprite(s);
    });
    // Bounced hazard shots damage enemies (sweep in update is the reliable path).
    this.physics.add.overlap(this.hazardProjectiles, this.enemiesGroup, (a, b) => {
      this.onReflectedHazardHitEnemy(
        a as Phaser.Physics.Arcade.Sprite,
        b as Phaser.Physics.Arcade.Sprite,
      );
    });

    // Climbing: skip solid floors so ladders can pass through platforms.
    this.physics.add.collider(
      this.player.sprite,
      this.platforms,
      undefined,
      () => !this.player.climbing,
      this,
    );
    this.physics.add.collider(
      this.player.sprite,
      this.movingGroup,
      undefined,
      () => !this.player.climbing,
      this,
    );

    this.physics.add.overlap(this.player.sprite, this.spikes, () => this.hurtPlayer());
    this.physics.add.overlap(this.player.sprite, this.pads, (_p, pad) => {
      const s = pad as Phaser.Physics.Arcade.Sprite;
      const now = this.time.now;
      if (now < ((s.getData('cd') as number) || 0)) return;
      s.setData('cd', now + 350);
      this.player.bounce();
      this.tweens.add({ targets: s, scaleY: 0.7, yoyo: true, duration: 100 });
    });
    this.physics.add.overlap(this.player.sprite, this.finish, () => this.winLevel());

    this.physics.add.overlap(this.projectiles, this.platforms, (proj) => {
      retirePhysicsSprite(proj as Phaser.Physics.Arcade.Sprite);
    });
    // One shared handler — each pea can only damage once.
    this.physics.add.overlap(this.projectiles, this.enemiesGroup, (proj, enemyObj) => {
      this.onProjectileHitEnemy(
        proj as Phaser.Physics.Arcade.Sprite,
        enemyObj as Phaser.Physics.Arcade.Sprite,
      );
    });

    this.setupInput();
    // Unlock WebAudio after first gesture (autoplay policy).
    this.input.once('pointerdown', () => SoundSystem.unlock());
    this.input.keyboard?.once('keydown', () => SoundSystem.unlock());
    this.cameras.main.startFollow(this.player.sprite, true, 0.12, 0.12);
    this.cameras.main.setDeadzone(80, 60);

    // J is read here BEFORE Arcade overlaps — scene.update runs too late to block stomp.
    this.events.on(Phaser.Scenes.Events.PRE_UPDATE, this.preUpdateGunStompGuard, this);
    // Support after Arcade step so seesaws feel solid.
    this.events.on(Phaser.Scenes.Events.POST_UPDATE, this.postUpdateSeesaws, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off(Phaser.Scenes.Events.PRE_UPDATE, this.preUpdateGunStompGuard, this);
      this.events.off(Phaser.Scenes.Events.POST_UPDATE, this.postUpdateSeesaws, this);
    });

    if (this.scene.isActive('UIScene') || this.scene.isSleeping('UIScene')) {
      this.scene.stop('UIScene');
    }
    this.scene.launch('UIScene', {
      levelIndex: this.level.index,
      isTutorial: isTutorialLevel(this.level),
    });
    this.events.emit('hud', this.getHudPayload());

    if (isTutorialLevel(this.level)) {
      this.tutorialZones = buildTutorialZones(this.level);
      this.time.delayedCall(200, () => this.events.emit('toast', ZH.tutorialWelcome));
      this.events.emit('tutorialAssistState', this.tutorialAssistOn);
    } else if (this.level.index === 1 && this.checkpointIndex < 0) {
      this.time.delayedCall(200, () => this.events.emit('toast', ZH.controls));
    }
  }

  update(_time: number, delta: number): void {
    if (this.adOpen) return;

    if (this.runActive && !this.dying) {
      if (Phaser.Input.Keyboard.JustDown(this.keyB)) {
        this.toggleInventory();
      } else if (Phaser.Input.Keyboard.JustDown(this.keyP) && !this.inventoryOpen) {
        this.togglePause();
      }
    }

    if (!this.runActive || this.paused || this.inventoryOpen || this.dying) return;

    // Attack first so stomp suppression is active before contact checks feel "gun OHKO".
    if (Phaser.Input.Keyboard.JustDown(this.keyJ)) {
      this.tryAttack();
    }
    if (this.keyJ.isDown) {
      this.stompSuppressUntil = Math.max(this.stompSuppressUntil, this.time.now + 120);
    }

    this.elapsedMs += delta;
    const onLadder = this.isPlayerOnLadder();
    this.player.update(
      this.cursors,
      {
        a: this.keyA,
        d: this.keyD,
        w: this.keyW,
        s: this.keyS,
        space: this.keySpace,
      },
      onLadder,
    );

    if (Phaser.Input.Keyboard.JustDown(this.keyK)) {
      this.tryUseSkill();
    }
    // M = tracking salvo; N = orbit fill (both can be equipped together).
    if (Phaser.Input.Keyboard.JustDown(this.keyM)) {
      this.tryUseMissile();
    }
    if (this.keyN.isDown) {
      if (SaveSystem.isSpecialEquipped('orbit')) {
        this.tryUseOrbit(true);
      } else if (Phaser.Input.Keyboard.JustDown(this.keyN)) {
        this.events.emit('toast', ZH.noOrbitEquipped);
      }
    }
    if (Phaser.Input.Keyboard.JustDown(this.keyX)) {
      this.tryInteract();
    }

    const hint = this.pipeNearHint() ?? this.interact?.nearestHint(this.player) ?? null;
    this.events.emit('interactHint', hint?.hint ?? '');

    this.enemies.forEach((e) => e.update(this.player));
    this.updateSpawnPoints();
    this.updateTutorialAssist();
    this.player.tickVitals(delta);
    // After flyers sync their bodies, sweep fast shots so peas can't tunnel through bats.
    this.sweepPlayerProjectiles();
    this.updateHazardHoming();
    this.updateOrbitMissiles(delta);
    this.sweepReflectedHazards();
    this.updateMissiles(delta);
    this.updateMovingPlatforms(delta);
    this.seesaws.forEach((s) => s.updateTilt(this.player, delta));
    this.fans.forEach((f) => f.apply(this.player, delta));
    this.crumbles.forEach((c) => c.update(this.player, delta));
    this.bumpers.forEach((b) => b.tryHit(this.player));
    if (this.pipeState !== 'active') this.portals?.tryTeleport(this.player);
    this.geysers.forEach((g) => g.update(this.player));
    for (const vent of this.flameVents) {
      if (vent.update(this.player, this.enemies)) this.hurtPlayer();
    }
    for (const pool of this.acidPools) {
      if (pool.update(this.player, this.enemies)) this.hurtPlayer();
    }
    this.timedPlatforms.forEach((t) => t.update());
    this.applyConveyors(delta);
    this.checkFallDeath();
    if (this.pipeState === 'active') this.checkPipeArenaClear();
    if (this.pipeState !== 'active') this.checkCheckpoints();
    this.events.emit('hud', this.getHudPayload());
  }

  /** Keep stomp suppressed while firing so gun+contact never looks like a bullet OHKO. */
  private preUpdateGunStompGuard(): void {
    if (!this.runActive || this.paused || this.inventoryOpen || this.dying || !this.keyJ) return;
    if (this.keyJ.isDown || this.hasLivePlayerShot()) {
      this.stompSuppressUntil = Math.max(this.stompSuppressUntil, this.time.now + 200);
    }
  }

  private postUpdateSeesaws(): void {
    if (!this.runActive || this.paused || this.inventoryOpen || this.dying || !this.player) return;
    this.seesaws.forEach((s) => s.supportPlayer(this.player));
  }

  private setupInput(): void {
    const kb = this.input.keyboard!;
    this.cursors = kb.createCursorKeys();
    this.keyA = kb.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = kb.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyW = kb.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyS = kb.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keySpace = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyJ = kb.addKey(Phaser.Input.Keyboard.KeyCodes.J);
    this.keyK = kb.addKey(Phaser.Input.Keyboard.KeyCodes.K);
    this.keyM = kb.addKey(Phaser.Input.Keyboard.KeyCodes.M);
    this.keyN = kb.addKey(Phaser.Input.Keyboard.KeyCodes.N);
    this.keyP = kb.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    this.keyB = kb.addKey(Phaser.Input.Keyboard.KeyCodes.B);
    this.keyX = kb.addKey(Phaser.Input.Keyboard.KeyCodes.X);
  }

  private drawParallax(): void {
    const w = this.level.worldWidth;
    const h = this.level.worldHeight;

    const sky = this.add.graphics().setScrollFactor(0);
    sky.fillGradientStyle(0x6eb6e0, 0x6eb6e0, THEME.skyBottom, 0xb8efd4, 1);
    sky.fillRect(0, 0, THEME.width, THEME.height);

    // Soft sun glow (camera-fixed)
    const sun = this.add.image(THEME.width - 120, 90, 'sun').setScrollFactor(0).setDepth(-20).setAlpha(0.9);
    this.tweens.add({
      targets: sun,
      scale: { from: 1, to: 1.08 },
      alpha: { from: 0.85, to: 1 },
      duration: 2800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Far mountains
    const mountainCount = Math.ceil(w / 280) + 2;
    for (let i = 0; i < mountainCount; i++) {
      this.add
        .image(i * 280 + (i % 2) * 40, h * 0.42, 'mountain')
        .setScrollFactor(0.12)
        .setOrigin(0.5, 1)
        .setScale(1.1 + (i % 3) * 0.25)
        .setAlpha(0.55)
        .setTint(i % 2 === 0 ? 0xffffff : 0xd5e4f0)
        .setDepth(-15);
    }

    // Drifting clouds
    const cloudCount = Math.ceil(w / 320) + 3;
    for (let i = 0; i < cloudCount; i++) {
      const cloud = this.add
        .image(120 + i * 340, 70 + (i % 4) * 36, 'cloud')
        .setScrollFactor(0.18)
        .setAlpha(0.7 + (i % 3) * 0.08)
        .setScale(0.9 + (i % 3) * 0.35)
        .setDepth(-14);
      this.tweens.add({
        targets: cloud,
        x: cloud.x + 90 + (i % 3) * 40,
        duration: 9000 + i * 700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // Mid hills
    const hillCount = Math.ceil(w / 400) + 2;
    for (let i = 0; i < hillCount; i++) {
      this.add
        .image(80 + i * 420, h - 40, 'hill')
        .setScrollFactor(0.32)
        .setOrigin(0.5, 1)
        .setScale(1.4 + (i % 2) * 0.5)
        .setAlpha(0.75)
        .setDepth(-10);
    }

    // Trees / bushes along the mid-ground
    for (let i = 0; i < Math.ceil(w / 260); i++) {
      const x = 60 + i * 260 + (i % 3) * 30;
      if (i % 2 === 0) {
        this.add
          .image(x, h - 70, 'tree')
          .setScrollFactor(0.45)
          .setOrigin(0.5, 1)
          .setScale(0.85 + (i % 3) * 0.2)
          .setDepth(-8)
          .setAlpha(0.9);
      } else {
        this.add
          .image(x, h - 55, 'bush')
          .setScrollFactor(0.5)
          .setOrigin(0.5, 1)
          .setScale(1 + (i % 2) * 0.25)
          .setDepth(-7);
      }
    }

    // Near grass tufts
    for (let i = 0; i < Math.ceil(w / 90); i++) {
      this.add
        .image(20 + i * 90 + (i % 5) * 8, h - 18, 'grass_tuft')
        .setScrollFactor(0.7)
        .setOrigin(0.5, 1)
        .setScale(0.8 + (i % 3) * 0.25)
        .setDepth(-3)
        .setAlpha(0.85);
    }

    // Birds looping across the sky
    for (let i = 0; i < 4; i++) {
      const bird = this.add
        .image(100 + i * 400, 110 + i * 28, 'bird')
        .setScrollFactor(0.22)
        .setAlpha(0.7)
        .setDepth(-13)
        .setScale(1.2);
      this.tweens.add({
        targets: bird,
        x: bird.x + w * 0.35,
        y: bird.y + (i % 2 === 0 ? 18 : -14),
        duration: 14000 + i * 1200,
        repeat: -1,
        ease: 'Sine.easeInOut',
        onRepeat: () => {
          bird.x = -40 + i * 60;
        },
      });
      this.tweens.add({
        targets: bird,
        scaleY: { from: 1.1, to: 0.85 },
        duration: 320,
        yoyo: true,
        repeat: -1,
      });
    }

    // Floating pollen / dust
    for (let i = 0; i < 18; i++) {
      const mote = this.add
        .circle(
          Phaser.Math.Between(40, w - 40),
          Phaser.Math.Between(40, h - 80),
          Phaser.Math.Between(2, 4),
          0xffffff,
          0.35,
        )
        .setScrollFactor(0.55)
        .setDepth(-2);
      this.tweens.add({
        targets: mote,
        y: mote.y - Phaser.Math.Between(30, 70),
        x: mote.x + Phaser.Math.Between(-40, 40),
        alpha: { from: 0.15, to: 0.45 },
        duration: 2200 + i * 120,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  private buildPlatforms(): void {
    this.level.platforms.forEach((p) => {
      const img = this.platforms.create(
        p.x + p.w / 2,
        p.y + p.h / 2,
        'platform',
      ) as Phaser.Physics.Arcade.Sprite;
      img.setDisplaySize(p.w, p.h);
      img.refreshBody();
    });
  }

  private buildMovingPlatforms(): void {
    (this.level.movingPlatforms ?? []).forEach((p) => {
      const sprite = this.movingGroup.create(
        p.x + p.w / 2,
        p.y + p.h / 2,
        'platform',
      ) as Phaser.Physics.Arcade.Sprite;
      sprite.setDisplaySize(p.w, p.h);
      sprite.setImmovable(true);
      const body = sprite.body as Phaser.Physics.Arcade.Body;
      body.setAllowGravity(false);
      body.setImmovable(true);
      this.movingMeta.push({
        sprite,
        axis: p.axis,
        origin: p.axis === 'x' ? sprite.x : sprite.y,
        range: p.range,
        speed: p.speed,
        dir: 1,
      });
    });
  }

  private buildLadders(): void {
    this.ladders = this.level.ladders ?? [];
    this.ladders.forEach((l) => {
      // Texture is 40px wide with thick edge rails — never draw narrower or rails get clipped.
      const visualW = Math.max(40, l.w);
      const cx = l.x + l.w / 2;
      const cy = l.y + l.h / 2;
      this.add.tileSprite(cx, cy, visualW, l.h, 'ladder').setDepth(4);
    });
  }

  private buildSeesaws(): void {
    (this.level.seesaws ?? []).forEach((def) => {
      this.seesaws.push(new Seesaw(this, def));
    });
  }

  private buildConveyors(): void {
    (this.level.conveyors ?? []).forEach((c) => {
      const sprite = this.platforms.create(
        c.x + c.w / 2,
        c.y + c.h / 2,
        'conveyor',
      ) as Phaser.Physics.Arcade.Sprite;
      sprite.setDisplaySize(c.w, c.h);
      sprite.setFlipX(c.dir < 0);
      sprite.refreshBody();
      this.conveyors.push({
        id: c.id,
        sprite,
        dir: c.dir,
        speed: c.speed,
        x: c.x,
        y: c.y,
        w: c.w,
        h: c.h,
      });
    });
  }

  private checkpointFloorIds: Set<string> | null = null;

  /** Resolve which solid floor a point rests on (platforms / conveyors). */
  private floorIdAt(x: number, y: number): string | null {
    const floors: { id: string; x: number; y: number; w: number; h: number }[] = [
      ...this.level.platforms.map((p, i) => ({ id: `p${i}`, ...p })),
      ...(this.level.conveyors ?? []).map((p, i) => ({ id: `c${i}`, ...p })),
    ];
    let best: string | null = null;
    let bestScore = Infinity;
    for (const f of floors) {
      if (x < f.x - 8 || x > f.x + f.w + 8) continue;
      const dy = y - f.y;
      // Allow standing slightly above the top, or authored a bit into the slab.
      if (dy < -100 || dy > 56) continue;
      const score = Math.abs(dy);
      if (score < bestScore) {
        bestScore = score;
        best = f.id;
      }
    }
    return best;
  }

  private getCheckpointFloorIds(): Set<string> {
    if (!this.checkpointFloorIds) {
      this.checkpointFloorIds = new Set();
      for (const c of this.level.checkpoints) {
        const id = this.floorIdAt(c.x, c.y);
        if (id) this.checkpointFloorIds.add(id);
      }
    }
    return this.checkpointFloorIds;
  }

  /** Only the platform that holds a checkpoint stays clear — other platforms keep denser content. */
  private onCheckpointPlatform(x: number, y: number): boolean {
    const id = this.floorIdAt(x, y);
    return id != null && this.getCheckpointFloorIds().has(id);
  }

  private buildInteractables(): void {
    const gates = (this.level.gates ?? []).filter(
      (g) => !this.onCheckpointPlatform(g.x + g.w / 2, g.y + g.h / 2),
    );
    const levers = (this.level.levers ?? []).filter((l) => !this.onCheckpointPlatform(l.x, l.y));
    const breakables = (this.level.breakables ?? []).filter(
      (b) => !this.onCheckpointPlatform(b.x + b.w / 2, b.y + b.h / 2),
    );
    this.interact = new InteractSystem(
      this,
      this.platforms,
      { gates, levers, breakables },
      {
        toggleGate: (id) => this.interact.toggleGate(id),
        reverseConveyor: (id) => {
          const c = this.conveyors.find((x) => x.id === id);
          if (!c) return false;
          c.dir = (c.dir * -1) as -1 | 1;
          c.sprite.setFlipX(c.dir < 0);
          return true;
        },
        toggleFan: (id) => {
          const fan = this.fans.find((f) => f.id === id);
          if (!fan) return false;
          fan.toggle();
          return true;
        },
      },
    );
  }

  private tryInteract(): void {
    if (this.tryEnterPipe()) return;
    if (!this.interact) return;
    const result = this.interact.tryInteract(this.player);
    if (result === 'break') {
      SoundSystem.interact('break');
      this.events.emit('toast', ZH.brokeBlock);
    } else if (result === 'control') {
      SoundSystem.interact('control');
      this.events.emit('toast', ZH.toggledDevice);
    }
  }

  private buildFans(): void {
    (this.level.fans ?? []).forEach((def) => {
      if (this.onCheckpointPlatform(def.x + def.w / 2, def.y + def.h / 2)) return;
      this.fans.push(new FanZone(this, def));
    });
  }

  private buildCrumbles(): void {
    (this.level.crumbles ?? []).forEach((def) => {
      if (this.onCheckpointPlatform(def.x + def.w / 2, def.y + def.h / 2)) return;
      this.crumbles.push(new CrumblePlatform(this, this.platforms, def));
    });
  }

  private buildBumpers(): void {
    (this.level.bumpers ?? []).forEach((def) => {
      if (this.onCheckpointPlatform(def.x, def.y)) return;
      this.bumpers.push(new Bumper(this, def));
    });
  }

  private buildPortals(): void {
    let defs = (this.level.portals ?? []).filter((p) => !this.onCheckpointPlatform(p.x, p.y));
    const ids = new Set(defs.map((d) => d.id));
    defs = defs.filter((p) => ids.has(p.pairId));
    if (defs.length) this.portals = new PortalPairSystem(this, defs);
  }

  private buildGeysers(): void {
    (this.level.geysers ?? []).forEach((def) => {
      if (this.onCheckpointPlatform(def.x, def.y)) return;
      this.geysers.push(new Geyser(this, def));
    });
  }

  private buildFlameVents(): void {
    (this.level.flameVents ?? []).forEach((def) => {
      if (this.onCheckpointPlatform(def.x, def.y)) return;
      // Snap to platform top so vents sit on floors and stay visible.
      const groundY = this.findPlatformTopAt(def.x, def.y);
      this.flameVents.push(new FlameVent(this, { ...def, y: groundY }));
    });
  }

  private buildAcidPools(): void {
    (this.level.acidPools ?? []).forEach((def) => {
      if (this.onCheckpointPlatform(def.x, def.y)) return;
      const groundY = this.findPlatformTopAt(def.x, def.y);
      this.acidPools.push(new AcidPool(this, { ...def, y: groundY }));
    });
  }

  private buildTimedPlatforms(): void {
    // Timed platforms are floors — keep them even if a checkpoint sits nearby on another slab.
    (this.level.timedPlatforms ?? []).forEach((def) => {
      this.timedPlatforms.push(new TimedPlatform(this, this.platforms, def));
    });
  }

  private applyConveyors(delta: number): void {
    if (this.player.climbing) return;
    const body = this.player.sprite.body as Phaser.Physics.Arcade.Body;
    // Prefer geometry check; also accept physics touching for reliability.
    const px = this.player.sprite.x;
    const foot = this.player.sprite.y + 18;
    const dt = delta / 1000;

    for (const c of this.conveyors) {
      const onBelt =
        px > c.x + 2 &&
        px < c.x + c.w - 2 &&
        foot > c.y - 10 &&
        foot < c.y + c.h + 12 &&
        (body.blocked.down || body.touching.down || body.velocity.y >= 0);
      if (!onBelt) continue;

      // Position carry — survives player setVelocityX(0) + drag.
      this.player.sprite.x += c.dir * c.speed * dt;
      body.velocity.x += c.dir * c.speed * 0.35;
      this.player.markSupported();
    }
  }

  private isPlayerOnLadder(): boolean {
    const body = this.player.sprite.body as Phaser.Physics.Arcade.Body;
    // Slightly padded so climbing through a floor doesn't instantly leave the ladder zone.
    const pad = 6;
    const bx = body.x - pad;
    const by = body.y - pad;
    const bw = body.width + pad * 2;
    const bh = body.height + pad * 2;
    return this.ladders.some(
      (l) => bx < l.x + l.w && bx + bw > l.x && by < l.y + l.h && by + bh > l.y,
    );
  }

  private updateMovingPlatforms(_delta: number): void {
    this.movingMeta.forEach((m) => {
      if (m.axis === 'x') {
        m.sprite.setVelocityX(m.dir * m.speed);
        m.sprite.setVelocityY(0);
        if (m.sprite.x > m.origin + m.range) m.dir = -1;
        if (m.sprite.x < m.origin - m.range) m.dir = 1;
      } else {
        m.sprite.setVelocityY(m.dir * m.speed);
        m.sprite.setVelocityX(0);
        if (m.sprite.y > m.origin + m.range) m.dir = -1;
        if (m.sprite.y < m.origin - m.range) m.dir = 1;
      }
    });
  }

  private buildSpikes(): void {
    this.level.spikes.forEach((s) => {
      if (this.onCheckpointPlatform(s.x, s.y)) return;
      for (let i = 0; i < s.count; i++) {
        const sx = s.x + i * 22;
        // Bottom-anchored: snap to the platform top under this x so spikes never float.
        const groundY = this.findPlatformTopAt(sx, s.y);
        const spike = this.spikes.create(sx, groundY, 'spike') as Phaser.Physics.Arcade.Sprite;
        spike.setOrigin(0.5, 1);
        const body = spike.body as Phaser.Physics.Arcade.StaticBody;
        body.setSize(16, 18);
        body.setOffset(4, 10);
        spike.refreshBody();
      }
    });
  }

  /** Nearest platform top at x; prefers tops near hintY, else any platform under x. */
  private findPlatformTopAt(x: number, hintY: number): number {
    let bandY = hintY;
    let bandDist = Number.POSITIVE_INFINITY;
    let anyY = hintY;
    let anyDist = Number.POSITIVE_INFINITY;
    for (const p of this.level.platforms) {
      if (x < p.x - 4 || x > p.x + p.w + 4) continue;
      const top = p.y;
      const dist = Math.abs(top - hintY);
      if (dist < anyDist) {
        anyDist = dist;
        anyY = top;
      }
      // Prefer a top close to the authored y (or slightly below floating spikes).
      if (dist < bandDist && top >= hintY - 80 && top <= hintY + 72) {
        bandDist = dist;
        bandY = top;
      }
    }
    return bandDist < Number.POSITIVE_INFINITY ? bandY : anyY;
  }

  private buildPads(): void {
    this.level.pads.forEach((p) => {
      const pad = this.pads.create(p.x, p.y, 'pad') as Phaser.Physics.Arcade.Sprite;
      pad.refreshBody();
    });
  }

  private buildCheckpoints(): void {
    this.level.checkpoints.forEach((c, i) => {
      const key = i <= this.checkpointIndex ? 'checkpoint_on' : 'checkpoint';
      const sprite = this.add.sprite(c.x, c.y, key).setDepth(6);
      this.checkpointSprites.push(sprite);
    });
  }

  private buildFinish(): void {
    this.finish = this.physics.add.sprite(this.level.finish.x, this.level.finish.y, 'finish');
    const body = this.finish.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setSize(30, 50);
  }

  private buildPipeAndArena(): void {
    const def = this.level.pipe;
    if (!def) return;

    this.pipeSprite = this.physics.add.sprite(def.x, def.y, 'pipe');
    this.pipeSprite.setOrigin(0.5, 1);
    this.pipeSprite.setDepth(7);
    const pBody = this.pipeSprite.body as Phaser.Physics.Arcade.Body;
    pBody.setAllowGravity(false);
    pBody.setImmovable(true);
    pBody.setSize(40, 56);
    pBody.setOffset(4, 8);

    // Arena room to the right of the overworld.
    const ox = this.arenaOrigin.x;
    const oy = this.arenaOrigin.y;
    const aw = PIPE_ARENA.width;
    const ah = PIPE_ARENA.height;
    const floorY = oy + ah - PIPE_ARENA.floorH;

    const addWall = (x: number, y: number, w: number, h: number, tint = 0x5b2c6f) => {
      const wall = this.platforms.create(x + w / 2, y + h / 2, 'platform') as Phaser.Physics.Arcade.Sprite;
      wall.setDisplaySize(w, h);
      wall.setTint(tint);
      wall.refreshBody();
    };

    addWall(ox, floorY, aw, PIPE_ARENA.floorH, 0x4a235a);
    addWall(ox, oy, 36, ah, 0x4a235a);
    addWall(ox + aw - 36, oy, 36, ah, 0x4a235a);
    addWall(ox, oy, aw, 28, 0x4a235a);
    // Safe landing pad (left) — player enters here, clear of monster spawns.
    addWall(
      ox + 48,
      floorY - PIPE_ARENA.safePadGap,
      PIPE_ARENA.safePadW,
      PIPE_ARENA.safePadH,
      0x58d68d,
    );
    // Mid platforms for vertical play (right/center — combat space, past safe zone)
    const combatX = ox + 48 + PIPE_ARENA.safePadW + PIPE_ARENA.safeClear;
    addWall(combatX + 40, floorY - 120, 180, 22, 0x6c3483);
    addWall(ox + aw - 300, floorY - 120, 180, 22, 0x6c3483);
    addWall(ox + aw / 2 + 40, floorY - 220, 180, 22, 0x6c3483);

    // Dim veil (camera-fixed) toggled when inside.
    this.arenaVeil = this.add
      .rectangle(THEME.width / 2, THEME.height / 2, THEME.width, THEME.height, 0x3b0a57, 0.28)
      .setScrollFactor(0)
      .setDepth(5)
      .setVisible(false);
  }

  private pipeNearHint(): { hint: string } | null {
    if (!this.pipeSprite || this.pipeState === 'active') return null;
    if (!this.isNearPipe()) return null;
    return { hint: this.pipeState === 'available' ? ZH.pipeHint : ZH.pipeSealed };
  }

  private isNearPipe(): boolean {
    if (!this.pipeSprite?.active) return false;
    const dx = Math.abs(this.player.sprite.x - this.pipeSprite.x);
    const dy = Math.abs(this.player.sprite.y - (this.pipeSprite.y - 40));
    return dx < 42 && dy < 56;
  }

  private tryEnterPipe(): boolean {
    if (!this.pipeSprite || this.pipeState !== 'available') {
      if (this.pipeState === 'done' && this.isNearPipe()) {
        this.events.emit('toast', ZH.pipeSealed);
        return true;
      }
      return false;
    }
    if (!this.isNearPipe()) return false;

    this.pipeReturn = {
      x: this.pipeSprite.x + 56,
      y: this.pipeSprite.y - 48,
    };
    this.pipeSavedVitals = { hp: this.player.hp, armor: this.player.armor };
    this.pipeState = 'active';
    this.cameras.main.flash(280, 90, 40, 140);
    this.arenaVeil?.setVisible(true);

    const ox = this.arenaOrigin.x;
    const oy = this.arenaOrigin.y;
    this.cameras.main.setBounds(ox, oy, PIPE_ARENA.width, PIPE_ARENA.height);

    // Safe left ledge — clear of arena monster spawn columns.
    const floorY = oy + PIPE_ARENA.height - PIPE_ARENA.floorH;
    const spawnX = ox + 48 + PIPE_ARENA.safePadW / 2;
    const spawnY = floorY - PIPE_ARENA.safePadGap - 36;
    this.player.sprite.setPosition(spawnX, spawnY);
    const body = this.player.sprite.body as Phaser.Physics.Arcade.Body;
    body.reset(spawnX, spawnY);
    body.setVelocity(0, 0);
    this.player.restoreVitals();
    this.player.makeInvincible(this.time.now, PIPE_ENTER_INVINCIBLE_MS);
    this.portals?.suppress(PIPE_ENTER_INVINCIBLE_MS);

    this.spawnArenaEnemies();
    this.events.emit('toast', ZH.pipeEnter(pipeArenaReward(this.level.index)));
    this.events.emit('hud', this.getHudPayload());
    return true;
  }

  private spawnArenaEnemies(): void {
    this.clearArenaEnemies();
    const ox = this.arenaOrigin.x;
    const floorY = this.arenaOrigin.y + PIPE_ARENA.height - PIPE_ARENA.floorH;
    // Keep the left safe pad + clear zone empty — denser packing to the right.
    const spawnLeft = ox + 48 + PIPE_ARENA.safePadW + PIPE_ARENA.safeClear;
    const packs = pipeArenaPack(this.level.index);
    const total = packs.reduce((sum, p) => sum + p.count, 0);
    // Final 100-cap arena uses a tighter grid so everyone fits in the room.
    const cols = total > 40 ? 16 : 10;
    const xStep = total > 40 ? 46 : 62;
    const flyRowGap = total > 40 ? 26 : 36;
    let slot = 0;
    for (const pack of packs) {
      for (let i = 0; i < pack.count; i++) {
        const flying = pack.type === 'floater' || pack.type === 'bat' || pack.type === 'ghost';
        const col = slot % cols;
        const row = Math.floor(slot / cols);
        const x = spawnLeft + col * xStep + (row % 2) * 12;
        const y = flying
          ? floorY - 120 - row * flyRowGap
          : floorY - 36 - (row % 2) * 14;
        // Short patrol so they don't wander into the safe pad.
        const enemy = new Enemy(
          this,
          { type: pack.type, x, y, patrol: 36 + (slot % 3) * 10 },
          (fx, fy, dir, opts) => this.fireEnemyHazard(fx, fy, dir, opts),
          PIPE_ARENA_HITS,
          (e) => this.dropEnemyCoins(e.sprite.x, e.sprite.y),
        );
        enemy.sprite.setData('arena', true);
        this.enemies.push(enemy);
        this.arenaEnemies.push(enemy);
        this.enemiesGroup.add(enemy.sprite);
        if (!flying) {
          this.physics.add.collider(enemy.sprite, this.platforms);
          this.physics.add.collider(enemy.sprite, this.movingGroup);
        }
        this.physics.add.overlap(this.player.sprite, enemy.sprite, () => this.onTouchEnemy(enemy));
        this.physics.add.overlap(enemy.sprite, this.spikes, () => this.onEnemyHitSpike(enemy));
        slot += 1;
      }
    }
  }

  private clearArenaEnemies(): void {
    for (const e of this.arenaEnemies) {
      if (!e.dead) e.destroy();
    }
    this.enemies = this.enemies.filter((e) => e.sprite.getData('arena') !== true);
    this.arenaEnemies = [];
  }

  private checkPipeArenaClear(): void {
    if (this.pipeState !== 'active' || this.dying) return;
    if (this.arenaEnemies.length === 0) return;

    // Yeeted out of the room → recall to spawn (does not count as a kill).
    this.recallArenaEnemiesOutOfBounds();

    if (this.arenaEnemies.some((e) => !e.dead && e.sprite.active)) return;

    this.pipeState = 'done';
    const reward = pipeArenaReward(this.level.index);
    SaveSystem.addCoins(reward);
    this.events.emit('toast', ZH.pipeClear(reward));
    this.sealPipe();
    this.exitPipeRealm(false);
    this.events.emit('hud', this.getHudPayload());
  }

  /** Pipe arena: monsters knocked outside respawn at their spawn point. */
  private recallArenaEnemiesOutOfBounds(): void {
    const ox = this.arenaOrigin.x;
    const oy = this.arenaOrigin.y;
    const aw = PIPE_ARENA.width;
    const ah = PIPE_ARENA.height;
    const pad = 48;
    for (const e of this.arenaEnemies) {
      if (e.dead || !e.sprite.active) continue;
      const { x, y } = e.sprite;
      if (x < ox - pad || x > ox + aw + pad || y < oy - pad || y > oy + ah + pad) {
        e.recallToSpawn();
      }
    }
  }

  private failPipeChallenge(): void {
    if (this.pipeState !== 'active') return;
    this.pipeState = 'done';
    this.clearArenaEnemies();
    this.sealPipe();
    this.exitPipeRealm(true);
    this.events.emit('toast', ZH.pipeFail);
  }

  private sealPipe(): void {
    if (!this.pipeSprite) return;
    this.pipeSprite.setTexture('pipe_sealed');
  }

  private exitPipeRealm(fromDeath: boolean): void {
    this.arenaVeil?.setVisible(false);
    this.cameras.main.setBounds(0, 0, this.overworldBounds.w, this.overworldBounds.h);
    this.cameras.main.flash(220, 255, 255, 255);

    const x = this.pipeReturn.x;
    const y = this.pipeReturn.y;
    // Position reset only — vitals go back to the pre-pipe snapshot, not a full heal.
    this.player.respawn(x, y);
    this.player.setVitals(this.pipeSavedVitals.hp, this.pipeSavedVitals.armor);
    this.player.makeInvincible(this.time.now, fromDeath ? 1200 : 800);
    this.portals?.suppress(1500);
    this.cameras.main.centerOn(x, y);
    this.events.emit('hud', this.getHudPayload());
  }

  private spawnPlayer(): void {
    let x = this.level.playerStart.x;
    let y = this.level.playerStart.y;
    if (this.checkpointIndex >= 0) {
      const cp = this.level.checkpoints[this.checkpointIndex];
      x = cp.x;
      y = cp.y - 20;
    }
    this.player = new Player(this, x, y);
    const save = SaveSystem.load();
    const weapon = save.activeRun?.weapon ?? save.equipped;
    this.player.setWeapon(weapon);
    this.player.applyAppearance(
      shapeById(save.equippedShape).texture,
      skinById(save.equippedSkin).tint,
    );
  }

  /** Overworld (non-pipe) enemy density vs authored level defs. */
  private static readonly OVERWORLD_ENEMY_MULT = 3;
  /** Respawn / reinforce interval at each overworld spawn point. */
  private static readonly SPAWN_REFRESH_MS = 30_000;
  /** Soft cap of living monsters tied to one spawn point (primary + extras). */
  private static readonly SPAWN_POINT_ALIVE_CAP = 6;

  private spawnEnemies(): void {
    this.spawnPoints = [];
    const tutorial = isTutorialLevel(this.level);
    this.level.enemies.forEach((def) => {
      const minCp = def.afterCheckpoint ?? -1;
      if (minCp > this.checkpointIndex) return;
      if (this.onCheckpointPlatform(def.x, def.y)) return;

      if (tutorial) {
        // One of each, low HP, no reinforce spam in the showcase hall.
        this.addOverworldEnemy(def, (enemy) => this.dropEnemyCoins(enemy.sprite.x, enemy.sprite.y));
        return;
      }

      // 3× refresh: place clones on different nearby platforms, not a tight cluster.
      for (const spot of this.spreadEnemySpots(def, GameScene.OVERWORLD_ENEMY_MULT)) {
        this.registerSpawnPoint({ ...def, ...spot });
      }
    });
  }

  private updateTutorialAssist(): void {
    if (!isTutorialLevel(this.level) || !this.player) return;
    if (!this.tutorialAssistOn) {
      if (this.lastTutorialZoneId != null) {
        this.lastTutorialZoneId = null;
        this.events.emit('tutorialTip', null);
      }
      return;
    }

    const px = this.player.sprite.x;
    const py = this.player.sprite.y;

    // Prefer living enemies — tip follows the monster, not the spawn point.
    let bestEnemyTip: { id: string; title: string; body: string } | null = null;
    let bestEnemyD = 160;
    for (const e of this.enemies) {
      if (e.dead || !e.sprite.active) continue;
      if (e.sprite.getData('arena') === true) continue;
      const d = Phaser.Math.Distance.Between(px, py, e.sprite.x, e.sprite.y);
      if (d >= bestEnemyD) continue;
      const tip = tipForEnemyType(e.type);
      if (!tip) continue;
      bestEnemyD = d;
      bestEnemyTip = tip;
    }

    const zone = bestEnemyTip
      ? null
      : nearestTutorialZone(this.tutorialZones, px, py);
    const next = bestEnemyTip ?? (zone ? { id: zone.id, title: zone.title, body: zone.body } : null);
    const id = next?.id ?? null;
    if (id === this.lastTutorialZoneId) return;
    this.lastTutorialZoneId = id;
    this.events.emit('tutorialTip', next ? { title: next.title, body: next.body } : null);
  }

  /** Called from UI: player dismissed or re-enabled assist tips. */
  setTutorialAssist(enabled: boolean): void {
    this.tutorialAssistOn = enabled;
    SaveSystem.setTutorialAssist(enabled);
    this.lastTutorialZoneId = null;
    this.events.emit('tutorialAssistState', enabled);
    if (!enabled) {
      this.events.emit('tutorialTip', null);
      this.events.emit('toast', ZH.tutorialDismissed);
    } else {
      this.events.emit('toast', ZH.tutorialEnabled);
      this.updateTutorialAssist();
    }
  }

  private registerSpawnPoint(def: EnemyDef): void {
    const point = {
      def,
      current: null as Enemy | null,
      nextAt: this.time.now + GameScene.SPAWN_REFRESH_MS,
      extras: [] as Enemy[],
    };
    point.current = this.addOverworldEnemy(def, (enemy) => this.onSpawnPointEnemyDied(point, enemy));
    this.spawnPoints.push(point);
  }

  private onSpawnPointEnemyDied(
    point: { def: EnemyDef; current: Enemy | null; nextAt: number; extras: Enemy[] },
    enemy: Enemy,
  ): void {
    this.dropEnemyCoins(enemy.sprite.x, enemy.sprite.y);
    if (point.current === enemy) {
      point.current = null;
      point.nextAt = this.time.now + GameScene.SPAWN_REFRESH_MS;
      return;
    }
    point.extras = point.extras.filter((e) => e !== enemy && !e.dead);
  }

  /** Roll loot table and scatter coin pickups at the death position. */
  private dropEnemyCoins(x: number, y: number): void {
    if (!this.runActive || this.dying) return;
    const count = rollEnemyCoinDrop();
    if (count <= 0) return;
    for (let i = 0; i < count; i++) {
      const ang = -Math.PI / 2 + (i - (count - 1) / 2) * 0.55;
      const dist = 18 + i * 6;
      const cx = x + Math.cos(ang) * dist;
      const cy = y + Math.sin(ang) * dist - 8;
      const coin = new CoinPickup(this, cx, cy, 1);
      coin.sprite.setScale(0.4);
      this.tweens.add({
        targets: coin.sprite,
        scale: 1,
        duration: 180,
        ease: 'Back.easeOut',
      });
      this.coins.push(coin);
      this.physics.add.overlap(this.player.sprite, coin.sprite, () => this.onCoin(coin));
    }
  }

  /**
   * Every 10s per spawn point:
   * - if the primary died → respawn at the point
   * - if still alive → spawn an extra monster at the point
   */
  private updateSpawnPoints(): void {
    if (!this.runActive || this.paused || this.dying || this.pipeState === 'active') return;
    const now = this.time.now;
    for (const point of this.spawnPoints) {
      if (now < point.nextAt) continue;
      point.extras = point.extras.filter((e) => !e.dead && e.sprite.active);
      const primaryAlive = !!(point.current && !point.current.dead && point.current.sprite.active);
      const aliveCount = (primaryAlive ? 1 : 0) + point.extras.length;

      if (!primaryAlive) {
        point.current = this.addOverworldEnemy(point.def, (enemy) =>
          this.onSpawnPointEnemyDied(point, enemy),
        );
        point.nextAt = now + GameScene.SPAWN_REFRESH_MS;
        continue;
      }

      // Still alive → reinforce with a new monster at the spawn point.
      if (aliveCount < GameScene.SPAWN_POINT_ALIVE_CAP) {
        const extra = this.addOverworldEnemy(point.def, (enemy) =>
          this.onSpawnPointEnemyDied(point, enemy),
        );
        point.extras.push(extra);
      }
      point.nextAt = now + GameScene.SPAWN_REFRESH_MS;
    }
  }

  /**
   * Pick distinct spawn spots for overworld density clones.
   * Prefer other nearby floors; fall back to wide horizontal offsets.
   */
  private spreadEnemySpots(
    def: EnemyDef,
    count: number,
  ): { x: number; y: number; patrol: number }[] {
    const flying = def.type === 'floater' || def.type === 'bat' || def.type === 'ghost';
    const floors = [
      ...this.level.platforms.map((p, i) => ({ id: `p${i}`, ...p })),
      ...(this.level.conveyors ?? []).map((p, i) => ({ id: `c${i}`, ...p })),
    ].filter((f) => f.w >= 72 && !this.getCheckpointFloorIds().has(f.id));

    const homeId = this.floorIdAt(def.x, def.y);
    const ranked = floors
      .map((f) => {
        const cx = f.x + f.w / 2;
        const top = f.y;
        const dist = Math.hypot(cx - def.x, top - def.y);
        return { f, dist };
      })
      .filter(({ f, dist }) => {
        if (dist > 520) return false;
        // Keep some room so clones don't sit on the exact same slab when possible.
        if (f.id === homeId && count > 1) return false;
        return true;
      })
      .sort((a, b) => a.dist - b.dist);

    const spots: { x: number; y: number; patrol: number }[] = [];
    const usedFloor = new Set<string>();

    // Slot 0 stays near the authored spawn.
    spots.push({ x: def.x, y: def.y, patrol: def.patrol });
    if (homeId) usedFloor.add(homeId);

    for (let i = 1; i < count; i++) {
      const pick = ranked.find(({ f }) => !usedFloor.has(f.id));
      if (pick) {
        usedFloor.add(pick.f.id);
        const margin = 28;
        const t = 0.25 + ((i * 0.31) % 0.5);
        const x = Phaser.Math.Clamp(
          pick.f.x + margin + t * Math.max(16, pick.f.w - margin * 2),
          pick.f.x + margin,
          pick.f.x + pick.f.w - margin,
        );
        const y = flying ? pick.f.y - (70 + (i % 3) * 28) : pick.f.y - 28;
        spots.push({
          x,
          y,
          patrol: Math.max(24, Math.min(def.patrol, pick.f.w * 0.35 - i * 4)),
        });
        continue;
      }

      // Fallback: wide horizontal stagger when no free floor is nearby.
      const side = i % 2 === 0 ? 1 : -1;
      const step = 90 + i * 55;
      spots.push({
        x: def.x + side * step,
        y: flying ? def.y - 24 * i : def.y,
        patrol: Math.max(20, def.patrol - i * 8),
      });
    }

    return spots;
  }

  private fireEnemyHazard(
    x: number,
    y: number,
    dir: number,
    opts?: { homing?: boolean; speed?: number; vy?: number },
  ): void {
    fireProjectile(this, this.hazardProjectiles, {
      x,
      y,
      dir,
      key: 'hazard_shot',
      speed: opts?.speed ?? 260,
      dealsHit: false,
      homing: opts?.homing === true,
      vy: opts?.vy,
      lifeMs: opts?.homing ? 2800 : 2000,
    });
  }

  private addOverworldEnemy(def: EnemyDef, onDied?: (enemy: Enemy) => void): Enemy {
    const hitsOverride = isTutorialLevel(this.level) ? 2 : undefined;
    const enemy = new Enemy(
      this,
      def,
      (x, y, dir, opts) => this.fireEnemyHazard(x, y, dir, opts),
      hitsOverride,
      onDied,
    );
    this.enemies.push(enemy);
    this.enemiesGroup.add(enemy.sprite);

    const flying = enemy.type === 'floater' || enemy.type === 'bat' || enemy.type === 'ghost';
    if (!flying) {
      this.physics.add.collider(enemy.sprite, this.platforms);
      this.physics.add.collider(enemy.sprite, this.movingGroup);
    }

    this.physics.add.overlap(this.player.sprite, enemy.sprite, () => this.onTouchEnemy(enemy));
    this.physics.add.overlap(enemy.sprite, this.spikes, () => this.onEnemyHitSpike(enemy));
    return enemy;
  }

  /** Spikes hurt monsters too — same 1-hit chip with their i-frames. */
  private onEnemyHitSpike(enemy: Enemy): void {
    if (enemy.dead || !enemy.sprite.active) return;
    enemy.takeWeaponHit(enemy.sprite.flipX ? -1 : 1);
  }

  /** Steer enemy seeking shots toward the player (terrain still retires them on overlap). */
  private updateHazardHoming(): void {
    if (!this.player) return;
    const px = this.player.sprite.x;
    const py = this.player.sprite.y;
    const shots = this.hazardProjectiles.getChildren() as Phaser.Physics.Arcade.Sprite[];
    for (const shot of shots) {
      if (!shot.active || shot.getData('spent') === true) continue;
      if (shot.getData('reflected') === true) continue;
      if (shot.getData('homing') !== true) continue;
      const speed = (shot.getData('homingSpeed') as number) || 200;
      const body = shot.body as Phaser.Physics.Arcade.Body;
      const desired = Phaser.Math.Angle.Between(shot.x, shot.y, px, py);
      const current = Math.atan2(body.velocity.y, body.velocity.x);
      // Limited turn rate so platforms can still intercept.
      const next = Phaser.Math.Angle.RotateTo(current, desired, 0.065);
      shot.setRotation(next);
      body.setVelocity(Math.cos(next) * speed, Math.sin(next) * speed);
    }
  }

  /** Orbit-reflected hazard shot: chips 1 hit then despawns. */
  private onReflectedHazardHitEnemy(
    a: Phaser.Physics.Arcade.Sprite,
    b: Phaser.Physics.Arcade.Sprite,
  ): void {
    // Overlap arg order can swap — identify shot vs enemy by data flags.
    const shot =
      a.getData('reflected') === true ? a : b.getData('reflected') === true ? b : null;
    const enemySprite = shot === a ? b : shot === b ? a : null;
    if (!shot || !enemySprite || !shot.active) return;
    if (shot.getData('spent') === true || shot.getData('retiring') === true) return;
    shot.setData('spent', true);
    retirePhysicsSprite(shot);
    const enemy = enemySprite.getData('enemy') as Enemy | undefined;
    if (!enemy || enemy.dead) return;
    const knock =
      Math.sign(enemy.sprite.x - (this.player?.sprite.x ?? enemy.sprite.x)) ||
      this.player?.facing ||
      1;
    enemy.takeWeaponHit(knock);
  }

  /** Segment sweep so fast reflected shots don't tunnel through foes. */
  private sweepReflectedHazards(): void {
    const shots = this.hazardProjectiles.getChildren() as Phaser.Physics.Arcade.Sprite[];
    for (const shot of shots) {
      if (!shot.active || shot.getData('reflected') !== true) continue;
      if (shot.getData('spent') === true || shot.getData('retiring') === true) continue;
      const prevX = Number(shot.getData('prevX') ?? shot.x);
      const prevY = Number(shot.getData('prevY') ?? shot.y);
      for (const enemy of this.enemies) {
        if (enemy.dead || !enemy.sprite.active) continue;
        const body = enemy.sprite.body as Phaser.Physics.Arcade.Body | null;
        if (!body) continue;
        if (segmentHitsBody(prevX, prevY, shot.x, shot.y, body, 14)) {
          this.onReflectedHazardHitEnemy(shot, enemy.sprite);
          break;
        }
      }
      if (shot.active && shot.getData('spent') !== true) {
        shot.setData('prevX', shot.x);
        shot.setData('prevY', shot.y);
      }
    }
  }

  private onProjectileHitEnemy(
    pea: Phaser.Physics.Arcade.Sprite,
    enemySprite: Phaser.Physics.Arcade.Sprite,
  ): void {
    if (!pea.active || pea.getData('spent') === true || pea.getData('retiring') === true) {
      return;
    }
    // Consume first — one pea / volley pellet can never multi-hit or chain-stomp.
    const dealsHit = pea.getData('dealsHit') === true;
    pea.setData('spent', true);
    retirePhysicsSprite(pea);

    if (!dealsHit) return;
    const enemy = enemySprite.getData('enemy') as Enemy | undefined;
    if (!enemy || enemy.dead) return;
    // Guns always chip exactly 1 hit and refresh the bar (never instantKill / stomp).
    enemy.takeWeaponHit(this.player.facing);
    this.stompSuppressUntil = Math.max(this.stompSuppressUntil, this.time.now + 1000);
  }

  /** Continuous hit test for high-speed peas vs small / flying foes. */
  private sweepPlayerProjectiles(): void {
    const shots = this.projectiles.getChildren() as Phaser.Physics.Arcade.Sprite[];
    for (const pea of shots) {
      if (!pea.active || pea.getData('spent') || pea.getData('dealsHit') !== true) continue;
      const prevX = Number(pea.getData('prevX') ?? pea.x);
      const prevY = Number(pea.getData('prevY') ?? pea.y);
      for (const enemy of this.enemies) {
        if (enemy.dead || !enemy.sprite.active) continue;
        const body = enemy.sprite.body as Phaser.Physics.Arcade.Body | null;
        if (!body) continue;
        if (segmentHitsBody(prevX, prevY, pea.x, pea.y, body, 12)) {
          this.onProjectileHitEnemy(pea, enemy.sprite);
          break;
        }
      }
      if (pea.active && !pea.getData('spent')) {
        pea.setData('prevX', pea.x);
        pea.setData('prevY', pea.y);
      }
    }
  }

  private hasLivePlayerShot(): boolean {
    return this.projectiles.getChildren().some((obj) => {
      const s = obj as Phaser.Physics.Arcade.Sprite;
      return s.active && s.getData('dealsHit') === true && s.getData('spent') !== true;
    });
  }

  private spawnWeapons(): void {
    this.level.weapons.forEach((def) => {
      const minCp = def.afterCheckpoint ?? -1;
      if (minCp > this.checkpointIndex) return;
      const pickup = new WeaponPickup(this, def);
      this.pickups.push(pickup);
      this.physics.add.overlap(this.player.sprite, pickup.sprite, () => this.onPickup(pickup));
    });
  }

  private spawnCoins(): void {
    (this.level.coins ?? []).forEach((def) => {
      const coin = new CoinPickup(this, def.x, def.y, def.value ?? 1);
      this.coins.push(coin);
      this.physics.add.overlap(this.player.sprite, coin.sprite, () => this.onCoin(coin));
    });
  }

  private onCoin(coin: CoinPickup): void {
    // Ignore pickups after clear — avoids overlap+destroy during win transition.
    if (!this.runActive || this.dying || !coin.sprite.active) return;
    const gained = coin.collect();
    if (gained <= 0) return;
    SaveSystem.addCoins(gained);
    this.events.emit('toast', ZH.gotCoin(gained));
    this.events.emit('hud', this.getHudPayload());
  }

  private tryUseSkill(): void {
    const save = SaveSystem.load();
    const skillId = save.equippedSkill;
    if (skillId === 'none') {
      this.events.emit('toast', ZH.noSkillEquipped);
      return;
    }
    const now = this.time.now;
    if (now < this.skillReadyAt) {
      this.events.emit('toast', ZH.skillCooldown);
      return;
    }
    const def = skillById(skillId);
    if (!def) return;
    this.skillReadyAt = now + def.cooldownMs;
    if (skillId === 'blink') {
      this.player.blinkForward(150);
      SoundSystem.skill('blink');
    } else if (skillId === 'haste') {
      this.player.activateHaste(now, def.durationMs);
      SoundSystem.skill('haste');
    } else if (skillId === 'flight') {
      this.player.activateFlight(now, def.durationMs);
      SoundSystem.skill('flight');
    }
    this.events.emit('hud', this.getHudPayload());
  }

  private tryUseMissile(): void {
    const save = SaveSystem.load();
    if (!specialById('missile')) return;
    if (!save.equippedSpecials.includes('missile')) {
      this.events.emit('toast', ZH.noMissileEquipped);
      return;
    }
    const now = this.time.now;
    if (now < this.missileReadyAt) {
      this.events.emit('toast', ZH.skillCooldown);
      return;
    }
    const count = missileSalvoCount(save.missileSalvoLevel);
    const targets = this.findNearestEnemies(count);
    if (targets.length === 0) {
      this.events.emit('toast', ZH.noMissileTarget);
      return;
    }

    this.missileReadyAt = now + missileCooldownMs(save.missileLevel);
    const px = this.player.sprite.x;
    const py = this.player.sprite.y - 8;
    for (let i = 0; i < count; i++) {
      const target = targets[i % targets.length];
      const ox = (i - (count - 1) / 2) * 10;
      const oy = (i % 2 === 0 ? -1 : 1) * Math.floor(i / 2) * 6;
      const sprite = this.physics.add.sprite(px + ox, py + oy, 'missile');
      sprite.setDepth(12);
      const body = sprite.body as Phaser.Physics.Arcade.Body;
      body.setAllowGravity(false);
      body.setSize(28, 14);
      // No platform collider — flies through terrain.
      this.missiles.push({ sprite, target, orbiting: false, orbitAngle: 0 });
    }
    SoundSystem.shoot('fire');
    this.events.emit('hud', this.getHudPayload());
  }

  /**
   * @param held When true (long-press), skip failure toasts and pace spawns so the ring fills smoothly.
   */
  private tryUseOrbit(held: boolean): void {
    const save = SaveSystem.load();
    const def = specialById('orbit');
    if (!def) return;
    if (!save.equippedSpecials.includes('orbit')) {
      if (!held) this.events.emit('toast', ZH.noOrbitEquipped);
      return;
    }
    const now = this.time.now;
    if (now < this.orbitReadyAt) {
      if (!held) this.events.emit('toast', ZH.skillCooldown);
      return;
    }
    const cap = orbitCapacity(save.orbitLevel);
    const orbiting = this.missiles.filter((m) => m.orbiting && m.sprite.active).length;
    if (orbiting >= cap) {
      if (!held) this.events.emit('toast', ZH.orbitMissileFull);
      return;
    }

    // Catalog CD is 0; keep a short autofill pace so hold-to-load looks sequential.
    const paceMs = held ? Math.max(def.cooldownMs, 80) : def.cooldownMs;
    this.orbitReadyAt = now + paceMs;
    // Insert into the ring; even spacing is applied every frame in updateOrbitMissiles.
    const nextCount = orbiting + 1;
    const angle = this.orbitBaseAngle + ((nextCount - 1) / nextCount) * Math.PI * 2;
    const radius = this.orbitRadiusForCount(nextCount);
    const px = this.player.sprite.x + Math.cos(angle) * radius;
    const py = this.player.sprite.y + Math.sin(angle) * radius;
    const sprite = this.physics.add.sprite(px, py, 'orbit_missile');
    sprite.setDepth(12);
    sprite.setScale(0.92);
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setVelocity(0, 0);
    body.setSize(26, 14);
    this.missiles.push({ sprite, target: null, orbiting: true, orbitAngle: angle });
    SoundSystem.shoot('fire');
    this.events.emit('hud', this.getHudPayload());
  }

  /** Orbit / shield radius (missiles sit on the same circle). */
  private orbitRadiusForCount(count: number): number {
    return 52 + Math.min(12, Math.max(0, count - 1) * 2);
  }

  /** Passive shield radius while orbit skill is equipped (no missiles required). */
  private static readonly ORBIT_SHIELD_RADIUS = 54;

  private findNearestEnemy(): Enemy | null {
    return this.findNearestEnemies(1)[0] ?? null;
  }

  /** Nearest living enemies (closest first), up to `n`. */
  private findNearestEnemies(n: number): Enemy[] {
    if (n <= 0) return [];
    const px = this.player.sprite.x;
    const py = this.player.sprite.y;
    const scored: { e: Enemy; d: number }[] = [];
    for (const e of this.enemies) {
      if (e.dead || !e.sprite.active) continue;
      scored.push({
        e,
        d: Phaser.Math.Distance.Between(px, py, e.sprite.x, e.sprite.y),
      });
    }
    scored.sort((a, b) => a.d - b.d);
    return scored.slice(0, n).map((s) => s.e);
  }

  /**
   * Orbit skill: free auto-shield ring while equipped; optional missiles orbit on the same circle.
   */
  private updateOrbitMissiles(delta: number): void {
    if (!this.player) return;
    const px = this.player.sprite.x;
    const py = this.player.sprite.y;
    const orbitEquipped = SaveSystem.isSpecialEquipped('orbit');
    const orbiting = this.missiles.filter((m) => m.orbiting && m.sprite.active);

    this.orbitBaseAngle = Phaser.Math.Angle.Wrap(this.orbitBaseAngle + 0.0024 * delta);

    // Shields unlock only after owning everything in the shop (still need orbit equipped).
    if (orbitEquipped) {
      const save = SaveSystem.load();
      const shieldsOn = orbitShieldsUnlocked(save);
      if (shieldsOn) {
        const shieldR = GameScene.ORBIT_SHIELD_RADIUS;
        this.drawOrbitShield(px, py, shieldR, orbiting.length, true);
        this.reflectHazardsWithOrbitShield(px, py, shieldR);
        this.repulseEnemiesWithOrbitShield(px, py, shieldR);
      } else {
        this.orbitRing?.clear();
      }
    } else {
      this.orbitRing?.clear();
    }

    if (orbiting.length === 0) return;

    const n = orbiting.length;
    const radius = Math.max(GameScene.ORBIT_SHIELD_RADIUS, this.orbitRadiusForCount(n));

    for (let i = 0; i < n; i++) {
      const m = orbiting[i];
      const targetAngle = Phaser.Math.Angle.Wrap(this.orbitBaseAngle + (i / n) * Math.PI * 2);
      m.orbitAngle = Phaser.Math.Angle.RotateTo(m.orbitAngle, targetAngle, 0.14);
      const x = px + Math.cos(m.orbitAngle) * radius;
      const y = py + Math.sin(m.orbitAngle) * radius;
      m.sprite.setPosition(x, y);
      m.sprite.setRotation(m.orbitAngle + Math.PI / 2);
      const body = m.sprite.body as Phaser.Physics.Arcade.Body;
      body.reset(x, y);
      body.setVelocity(0, 0);
    }

    if (!orbitEquipped) return;

    const target = this.findNearestEnemy();
    if (!target) return;
    const dist = Phaser.Math.Distance.Between(px, py, target.sprite.x, target.sprite.y);
    if (dist > ORBIT_ENGAGE_RANGE) return;

    const aim = Phaser.Math.Angle.Between(px, py, target.sprite.x, target.sprite.y);
    let best = orbiting[0];
    let bestScore = Number.POSITIVE_INFINITY;
    for (const m of orbiting) {
      const score = Math.abs(Phaser.Math.Angle.Wrap(m.orbitAngle - aim));
      if (score < bestScore) {
        bestScore = score;
        best = m;
      }
    }
    best.orbiting = false;
    best.target = target;
  }

  /**
   * Reflect enemy hazard shots that cross the orbit shield ring.
   * Bounced shots turn blue, ignore terrain, and can hurt monsters.
   */
  private reflectHazardsWithOrbitShield(px: number, py: number, radius: number): void {
    const shots = this.hazardProjectiles.getChildren() as Phaser.Physics.Arcade.Sprite[];
    const band = 18;
    for (const shot of shots) {
      if (!shot.active || shot.getData('spent') === true || shot.getData('retiring') === true) {
        continue;
      }
      if (shot.getData('reflected') === true) continue;
      const distToPlayer = Phaser.Math.Distance.Between(px, py, shot.x, shot.y);
      if (Math.abs(distToPlayer - radius) > band) continue;

      let dx = shot.x - px;
      let dy = shot.y - py;
      let len = Math.hypot(dx, dy);
      if (len < 1) {
        dx = 1;
        dy = 0;
        len = 1;
      }
      const nx = dx / len;
      const ny = dy / len;
      const speed = Math.max(260, (shot.getData('homingSpeed') as number) || 260) * 1.2;

      shot.setData('reflected', true);
      shot.setData('homing', false);
      shot.setData('dealsHit', true);
      if (this.textures.exists('hazard_shot_reflected')) {
        shot.setTexture('hazard_shot_reflected');
      } else {
        shot.setTint(0x5dade2);
      }

      const ox = px + nx * (radius + 22);
      const oy = py + ny * (radius + 22);
      shot.setPosition(ox, oy);
      shot.setRotation(Math.atan2(ny, nx));
      const body = shot.body as Phaser.Physics.Arcade.Body;
      body.setSize(14, 14);
      body.reset(ox, oy);
      body.setVelocity(nx * speed, ny * speed);
      shot.setData('prevX', ox);
      shot.setData('prevY', oy);

      this.spawnOrbitBlockFx(ox, oy, false);
    }
  }

  /**
   * Orbit perk: bounce enemies at the rim; eject anyone already inside.
   */
  private repulseEnemiesWithOrbitShield(px: number, py: number, radius: number): void {
    const contactR = radius + 18;
    const rimR = radius + 22;
    for (const e of this.enemies) {
      if (e.dead || !e.sprite.active) continue;
      const dist = Phaser.Math.Distance.Between(px, py, e.sprite.x, e.sprite.y);
      if (dist > contactR) continue;

      let dx = e.sprite.x - px;
      let dy = e.sprite.y - py;
      let len = Math.hypot(dx, dy);
      if (len < 1) {
        dx = 1;
        dy = 0;
        len = 1;
      }
      const nx = dx / len;
      const ny = dy / len;

      // Already inside the bubble — snap to the outer rim, then knock away.
      if (dist < radius) {
        const ox = px + nx * rimR;
        const oy = py + ny * rimR;
        e.sprite.setPosition(ox, oy);
        const body = e.sprite.body as Phaser.Physics.Arcade.Body;
        body.reset(ox, oy);
      }

      if (e.applyOrbitRepulse(px, py)) {
        this.spawnOrbitBlockFx(e.sprite.x, e.sprite.y, true);
      }
    }
  }

  private spawnOrbitBlockFx(x: number, y: number, strong = false): void {
    const spark = this.add
      .circle(x, y, strong ? 8 : 6, strong ? 0xf4d03f : 0x5dade2, 0.95)
      .setDepth(13);
    this.tweens.add({
      targets: spark,
      scale: strong ? 2.6 : 2.2,
      alpha: 0,
      duration: strong ? 220 : 180,
      ease: 'Quad.easeOut',
      onComplete: () => spark.destroy(),
    });
  }

  /** Always-on shield ring while orbit shields are unlocked. */
  private drawOrbitShield(
    px: number,
    py: number,
    radius: number,
    missileCount: number,
    _repulse = false,
  ): void {
    if (!this.orbitRing) {
      this.orbitRing = this.add.graphics().setDepth(11);
    }
    const g = this.orbitRing;
    g.clear();
    // Blue reflect shield identity.
    const main = 0x3498db;
    const outer = 0x5dade2;
    g.lineStyle(4, main, 0.55);
    g.strokeCircle(px, py, radius);
    g.lineStyle(1.5, outer, 0.45);
    g.strokeCircle(px, py, radius + 5);
    g.lineStyle(1, 0xffffff, 0.22);
    g.strokeCircle(px, py, radius - 4);
    // Soft rotating ticks so the shield feels alive even with 0 missiles.
    const ticks = Math.max(6, missileCount * 2);
    const tickR0 = radius - 4;
    const tickR1 = radius + 4;
    for (let i = 0; i < ticks; i++) {
      const a = this.orbitBaseAngle + (i / ticks) * Math.PI * 2;
      g.lineStyle(1.5, 0xffffff, 0.35);
      g.beginPath();
      g.moveTo(px + Math.cos(a) * tickR0, py + Math.sin(a) * tickR0);
      g.lineTo(px + Math.cos(a) * tickR1, py + Math.sin(a) * tickR1);
      g.strokePath();
    }
  }

  private updateMissiles(_delta: number): void {
    const speed = 420;
    for (let i = this.missiles.length - 1; i >= 0; i--) {
      const m = this.missiles[i];
      if (!m.sprite.active) {
        this.missiles.splice(i, 1);
        continue;
      }
      if (m.orbiting) continue;

      let target = m.target;
      if (!target || target.dead || !target.sprite.active) {
        target = this.findNearestEnemy();
        m.target = target;
      }
      if (!target) {
        // No target left — fly forward briefly then despawn.
        m.sprite.x += this.player.facing * speed * 0.016;
        if (m.sprite.x < -80 || m.sprite.x > this.physics.world.bounds.width + 80) {
          m.sprite.destroy();
          this.missiles.splice(i, 1);
        }
        continue;
      }

      const angle = Phaser.Math.Angle.Between(m.sprite.x, m.sprite.y, target.sprite.x, target.sprite.y);
      m.sprite.setRotation(angle);
      const body = m.sprite.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

      const dist = Phaser.Math.Distance.Between(m.sprite.x, m.sprite.y, target.sprite.x, target.sprite.y);
      if (dist < 28) {
        const tx = target.sprite.x;
        const ty = target.sprite.y;
        target.instantKill();
        this.spawnMissileExplosion(tx, ty);
        m.sprite.destroy();
        this.missiles.splice(i, 1);
      }
    }
  }

  private spawnMissileExplosion(x: number, y: number): void {
    const boom = this.add.image(x, y, 'explosion').setDepth(14).setScale(0.4);
    this.cameras.main.shake(120, 0.006);
    SoundSystem.interact('break');
    this.tweens.add({
      targets: boom,
      scale: 1.6,
      alpha: 0,
      duration: 320,
      ease: 'Quad.easeOut',
      onComplete: () => boom.destroy(),
    });
  }

  private tryAttack(): void {
    const now = this.time.now;
    if (!this.player.canAttack(now)) return;
    const stats = WEAPON_STATS[this.player.weapon];
    this.player.markAttack(now, stats.cooldownMs);

    const px = this.player.sprite.x + this.player.facing * 28;
    const py = this.player.sprite.y;
    const dir = this.player.facing;

    if (stats.projectile && stats.pellets > 0) {
      this.stompSuppressUntil = Math.max(this.stompSuppressUntil, now + 800);
      const shootKind =
        this.player.weapon === 'fireball'
          ? 'fire'
          : this.player.weapon === 'shotgun'
            ? 'shot'
            : 'pea';
      SoundSystem.shoot(shootKind);
      for (let i = 0; i < stats.pellets; i++) {
        const t = stats.pellets === 1 ? 0 : i / (stats.pellets - 1) - 0.5;
        const vy = t * stats.spread * stats.projSpeed;
        fireProjectile(this, this.projectiles, {
          x: px,
          y: py,
          dir,
          key: stats.projKey,
          speed: stats.projSpeed,
          dealsHit: true,
          scale: this.player.weapon === 'fireball' ? 1.35 : 1,
          vy,
        });
      }
      return;
    }

    if (!stats.melee) return;
    SoundSystem.shoot('melee');
    const range = stats.meleeRange || 30;
    let meleeHit = false;
    this.enemies.forEach((enemy) => {
      if (!enemy.sprite.active || enemy.dead) return;
      const dx = enemy.sprite.x - this.player.sprite.x;
      const dy = Math.abs(enemy.sprite.y - this.player.sprite.y);
      if (Math.sign(dx || dir) === dir && Math.abs(dx) < range && dy < 40) {
        const before = enemy.hitsLeft;
        enemy.takeWeaponHit(dir);
        if (enemy.hitsLeft < before || enemy.dead) meleeHit = true;
      }
    });
    if (meleeHit) this.player.makeInvincible(now, 280);

    const swipe = this.add
      .rectangle(px, py, range, this.player.weapon === 'hammer' ? 36 : 24, 0xffffff, 0.35)
      .setDepth(11);
    this.tweens.add({
      targets: swipe,
      alpha: 0,
      duration: 120,
      onComplete: () => swipe.destroy(),
    });
  }

  private onTouchEnemy(enemy: Enemy): void {
    if (enemy.dead || !enemy.sprite.active || !this.runActive || this.dying) return;
    const now = this.time.now;
    if (this.player.isInvincible(now)) return;

    const pBody = this.player.sprite.body as Phaser.Physics.Arcade.Body;
    const eBody = enemy.sprite.body as Phaser.Physics.Arcade.Body;
    const playerBottom = pBody.bottom;
    const enemyTop = eBody.top;
    const descending = pBody.velocity.y > 120;
    const fromAbove = playerBottom <= enemyTop + 8;

    // Gunfire must never resolve as a stomp OHKO (looks like the bullet skipped the HP bar).
    const suppressStomp =
      this.keyJ.isDown ||
      now < this.stompSuppressUntil ||
      this.player.didAttackRecently(now, 1200) ||
      this.hasLivePlayerShot() ||
      enemy.isStompImmune(now);

    if (suppressStomp) {
      // During / after shots: no stomp, and ignore "from above" contact damage.
      if (fromAbove || enemy.isStompImmune(now) || this.hasLivePlayerShot() || this.keyJ.isDown) {
        return;
      }
      this.hurtPlayer();
      return;
    }

    const canStomp = descending && fromAbove && enemy.canBeStomped;
    if (canStomp) {
      enemy.stomp();
      this.player.launch(pBody.velocity.x * 0.25, -460);
      this.player.makeInvincible(now, 320);
      return;
    }

    this.hurtPlayer();
  }

  private onPickup(pickup: WeaponPickup): void {
    if (!pickup.sprite.active) return;
    const owned = SaveSystem.getInventory().includes(pickup.weapon);
    SaveSystem.collectWeapon(pickup.weapon);
    this.player.setWeapon(pickup.weapon);
    this.events.emit('toast', owned ? ZH.alreadyOwned : weaponPickupToast(pickup.weapon));
    this.events.emit('hud', this.getHudPayload());
    pickup.destroy();
  }

  private checkFallDeath(): void {
    if (this.pipeState === 'active') {
      const floor = this.arenaOrigin.y + PIPE_ARENA.height - 8;
      if (this.player.sprite.y > floor) this.killPlayer();
      return;
    }
    if (this.player.sprite.y > this.level.worldHeight - 20) {
      // Void fall: instant checkpoint respawn (full vitals restore).
      this.killPlayer();
    }
  }

  /** Monster / spike / spit: 1 armor, else 1 HP. Death → checkpoint. */
  private hurtPlayer(): void {
    if (!this.runActive || this.dying) return;
    const now = this.time.now;
    if (this.player.isInvincible(now)) return;

    const result = this.player.takeDamage(now);
    this.cameras.main.shake(80, 0.004);
    this.events.emit('toast', result.hitArmor ? ZH.armorLost : ZH.hpLost);
    this.events.emit('hud', this.getHudPayload());

    if (result.dead) {
      this.killPlayer();
    }
  }

  private checkCheckpoints(): void {
    this.level.checkpoints.forEach((c, i) => {
      if (i <= this.checkpointIndex) return;
      if (Math.abs(this.player.sprite.x - c.x) < 48 && Math.abs(this.player.sprite.y - c.y) < 64) {
        this.checkpointIndex = i;
        this.checkpointSprites[i]?.setTexture('checkpoint_on');
        SaveSystem.updateRun({
          checkpointIndex: i,
          elapsedMs: Math.floor(this.elapsedMs),
          deaths: this.deaths,
          weapon: this.player.weapon,
        });
        this.events.emit('toast', ZH.checkpoint);
      }
    });
  }

  private killPlayer(): void {
    if (!this.runActive || this.dying) return;

    // Death inside pipe arena: eject + seal (no retry this run).
    if (this.pipeState === 'active') {
      this.dying = true;
      this.deaths += 1;
      this.cameras.main.flash(150, 255, 255, 255);
      this.time.delayedCall(350, () => {
        this.failPipeChallenge();
        this.dying = false;
      });
      return;
    }

    this.dying = true;
    this.deaths += 1;
    this.cameras.main.flash(150, 255, 255, 255);
    this.events.emit('toast', ZH.tryAgain);

    SaveSystem.updateRun({
      checkpointIndex: this.checkpointIndex,
      elapsedMs: Math.floor(this.elapsedMs),
      deaths: this.deaths,
      weapon: this.player.weapon,
    });

    this.time.delayedCall(400, () => {
      let x = this.level.playerStart.x;
      let y = this.level.playerStart.y;
      if (this.checkpointIndex >= 0) {
        const cp = this.level.checkpoints[this.checkpointIndex];
        x = cp.x;
        y = cp.y - 20;
      }
      this.player.respawn(x, y);
      this.player.makeInvincible(this.time.now, 1000);
      this.portals?.suppress(1500);
      this.dying = false;
    });
  }

  private winLevel(): void {
    if (!this.runActive || this.dying) return;
    this.runActive = false;
    // Stop Arcade immediately so coin/finish overlaps can't destroy bodies mid-step.
    this.physics.pause();
    const finishBody = this.finish.body as Phaser.Physics.Arcade.Body | null;
    if (finishBody) finishBody.enable = false;

    const stars = this.calcStars();
    const payload = {
      timeMs: Math.floor(this.elapsedMs),
      deaths: this.deaths,
      stars,
      hasNext: !!LEVELS.find((l) => l.index === this.level.index + 1),
      nextLevelId: LEVELS.find((l) => l.index === this.level.index + 1)?.id,
      levelId: this.level.id,
    };

    // Defer save + UI out of the current physics callback stack.
    this.time.delayedCall(0, () => {
      SaveSystem.completeLevel(this.level.id, stars, payload.timeMs, this.level.index);
      this.events.emit('win', payload);
    });
  }

  private calcStars(): number {
    if (this.elapsedMs <= this.level.threeStarMs && this.deaths <= 1) return 3;
    if (this.elapsedMs <= this.level.twoStarMs && this.deaths <= 5) return 2;
    return 1;
  }

  private getHudPayload() {
    const save = SaveSystem.load();
    const now = this.time.now;
    const cdLeft = Math.max(0, this.skillReadyAt - now);
    const missileCdLeft = Math.max(0, this.missileReadyAt - now);
    const parts: string[] = [];
    if (save.equippedSpecials.includes('missile')) {
      parts.push(`M ${specialLabel('missile')} CD${save.missileLevel}/齐射${save.missileSalvoLevel}`);
    }
    if (save.equippedSpecials.includes('orbit')) {
      const n = this.missiles.filter((m) => m.orbiting).length;
      parts.push(`N ${specialLabel('orbit')} 存${save.orbitLevel}(${n}/${orbitCapacity(save.orbitLevel)})`);
    }
    return {
      timeMs: Math.floor(this.elapsedMs),
      deaths: this.deaths,
      coins: save.coins,
      hp: this.player.hp,
      maxHp: this.player.maxHp,
      armor: this.player.armor,
      maxArmor: this.player.maxArmor,
      weaponLabel: weaponLabel(this.player.weapon),
      skillLabel: skillLabel(save.equippedSkill),
      skillCdMs: cdLeft,
      specialLabel: parts.length > 0 ? parts.join(' · ') : ZH.specialNone,
      specialCdMs: missileCdLeft,
      levelIndex: this.level.index,
    };
  }

  togglePause(): void {
    if (this.dying || this.inventoryOpen || this.adOpen) return;
    if (!this.runActive && !this.paused) return;
    this.paused = !this.paused;
    if (this.paused) {
      this.physics.pause();
      this.events.emit('pause', true);
    } else {
      this.physics.resume();
      this.events.emit('pause', false);
    }
  }

  /** Open self-promo ad overlay; on finish, grant remaining coins and clear the level. */
  openAdSkip(): void {
    if (!this.runActive || this.dying || this.adOpen || this.pipeState === 'active') return;
    if (this.inventoryOpen) {
      this.inventoryOpen = false;
      this.events.emit('inventory', { open: false });
    }
    if (this.paused) {
      this.paused = false;
      this.events.emit('pause', false);
    }
    this.adOpen = true;
    this.physics.pause();
    this.events.emit('adSkip');
  }

  /** Called after the 10s promo finishes: collect leftover coins, teleport, win. */
  completeAdSkip(): void {
    if (!this.adOpen || !this.runActive || this.dying) {
      this.adOpen = false;
      return;
    }
    this.adOpen = false;

    let gained = 0;
    for (const coin of this.coins) {
      gained += coin.collect();
    }
    if (gained > 0) {
      SaveSystem.addCoins(gained);
      this.events.emit('toast', ZH.adSkipCoins(gained));
    }

    const fx = this.level.finish.x;
    const fy = this.level.finish.y - 24;
    this.player.sprite.setPosition(fx, fy);
    const body = this.player.sprite.body as Phaser.Physics.Arcade.Body | null;
    if (body) {
      body.reset(fx, fy);
      body.setVelocity(0, 0);
    }
    this.cameras.main.centerOn(fx, fy);
    this.events.emit('hud', this.getHudPayload());
    this.winLevel();
  }

  toggleInventory(): void {
    if (this.dying || this.paused || this.adOpen) return;
    if (!this.runActive && !this.inventoryOpen) return;
    this.inventoryOpen = !this.inventoryOpen;
    if (this.inventoryOpen) {
      this.physics.pause();
      this.emitInventory();
    } else {
      this.physics.resume();
      this.events.emit('inventory', { open: false });
    }
  }

  equipWeapon(weapon: WeaponType): void {
    const data = SaveSystem.equipWeapon(weapon);
    this.player.setWeapon(data.equipped);
    this.events.emit('hud', this.getHudPayload());
    if (this.inventoryOpen) this.emitInventory();
  }

  private emitInventory(): void {
    const data = SaveSystem.load();
    this.events.emit('inventory', {
      open: true,
      inventory: data.inventory,
      equipped: data.equipped,
    });
  }

  restartLevel(): void {
    this.scene.stop('UIScene');
    SaveSystem.startRun(this.level.id);
    this.scene.restart({ levelId: this.level.id, continueRun: false });
  }

  goMenu(): void {
    if (this.player) {
      SaveSystem.updateRun({
        checkpointIndex: this.checkpointIndex,
        elapsedMs: Math.floor(this.elapsedMs),
        deaths: this.deaths,
        weapon: this.player.weapon,
      });
    }
    this.scene.stop('UIScene');
    this.scene.start('MenuScene');
  }

  goNext(levelId: string): void {
    this.scene.stop('UIScene');
    SaveSystem.startRun(levelId);
    this.scene.restart({ levelId, continueRun: false });
  }
}
