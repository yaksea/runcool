import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { WeaponPickup } from '../entities/WeaponPickup';
import { Projectile } from '../entities/Projectile';
import { getLevelById, LEVELS } from '../levels';
import type { LevelDef } from '../levels/types';
import { ZH, weaponLabel } from '../i18n/zh';
import { THEME } from '../style/theme';
import { SaveSystem } from '../systems/SaveSystem';

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
  private pickups: WeaponPickup[] = [];
  private projectiles!: Phaser.Physics.Arcade.Group;
  private checkpointSprites: Phaser.GameObjects.Sprite[] = [];

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keyW!: Phaser.Input.Keyboard.Key;
  private keySpace!: Phaser.Input.Keyboard.Key;
  private keyJ!: Phaser.Input.Keyboard.Key;
  private keyP!: Phaser.Input.Keyboard.Key;

  private checkpointIndex = -1;
  private elapsedMs = 0;
  private deaths = 0;
  private runActive = true;
  private paused = false;
  private dying = false;
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
    this.pickups = [];
    this.checkpointSprites = [];
    this.movingMeta = [];
    this.runActive = true;
    this.paused = false;
    this.dying = false;

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
    this.physics.world.setBounds(0, 0, this.level.worldWidth, this.level.worldHeight);
    this.cameras.main.setBounds(0, 0, this.level.worldWidth, this.level.worldHeight);
    this.drawParallax();

    this.platforms = this.physics.add.staticGroup();
    this.spikes = this.physics.add.staticGroup();
    this.pads = this.physics.add.staticGroup();
    this.movingGroup = this.physics.add.group({ allowGravity: false, immovable: true });
    this.projectiles = this.physics.add.group();

    this.buildPlatforms();
    this.buildMovingPlatforms();
    this.buildSpikes();
    this.buildPads();
    this.buildCheckpoints();
    this.buildFinish();
    this.spawnPlayer();
    this.spawnEnemies();
    this.spawnWeapons();

    this.physics.add.collider(this.player.sprite, this.platforms);
    this.physics.add.collider(this.player.sprite, this.movingGroup);

    this.physics.add.overlap(this.player.sprite, this.spikes, () => this.killPlayer());
    this.physics.add.overlap(this.player.sprite, this.pads, (_p, pad) => {
      this.player.bounce();
      const s = pad as Phaser.Physics.Arcade.Sprite;
      this.tweens.add({ targets: s, scaleY: 0.7, yoyo: true, duration: 100 });
    });
    this.physics.add.overlap(this.player.sprite, this.finish, () => this.winLevel());

    this.physics.add.overlap(this.projectiles, this.platforms, (proj) => {
      (proj as Phaser.Physics.Arcade.Sprite).destroy();
    });

    this.setupInput();
    this.cameras.main.startFollow(this.player.sprite, true, 0.12, 0.12);
    this.cameras.main.setDeadzone(80, 60);

    if (this.scene.isActive('UIScene') || this.scene.isSleeping('UIScene')) {
      this.scene.stop('UIScene');
    }
    this.scene.launch('UIScene', { levelIndex: this.level.index });
    this.events.emit('hud', this.getHudPayload());

    if (this.level.index === 1 && this.checkpointIndex < 0) {
      this.time.delayedCall(200, () => this.events.emit('toast', ZH.controls));
    }
  }

  update(_time: number, delta: number): void {
    if (!this.runActive || this.paused || this.dying) return;

    this.elapsedMs += delta;
    this.player.update(this.cursors, {
      a: this.keyA,
      d: this.keyD,
      w: this.keyW,
      space: this.keySpace,
    });

    if (Phaser.Input.Keyboard.JustDown(this.keyJ)) {
      this.tryAttack();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keyP)) {
      this.togglePause();
    }

    this.enemies.forEach((e) => e.update());
    this.updateMovingPlatforms(delta);
    this.checkFallDeath();
    this.checkCheckpoints();
    this.events.emit('hud', this.getHudPayload());
  }

  private setupInput(): void {
    const kb = this.input.keyboard!;
    this.cursors = kb.createCursorKeys();
    this.keyA = kb.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = kb.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyW = kb.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keySpace = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyJ = kb.addKey(Phaser.Input.Keyboard.KeyCodes.J);
    this.keyP = kb.addKey(Phaser.Input.Keyboard.KeyCodes.P);
  }

  private drawParallax(): void {
    const g = this.add.graphics();
    g.fillGradientStyle(THEME.skyTop, THEME.skyTop, THEME.skyBottom, THEME.skyBottom, 1);
    g.fillRect(0, 0, this.level.worldWidth, this.level.worldHeight);

    for (let i = 0; i < 10; i++) {
      this.add
        .image(200 + i * 380, 100 + (i % 3) * 40, 'cloud')
        .setScrollFactor(0.2)
        .setAlpha(0.75)
        .setScale(1 + (i % 3) * 0.2);
    }
    for (let i = 0; i < 8; i++) {
      this.add
        .image(150 + i * 520, this.level.worldHeight - 80, 'hill')
        .setScrollFactor(0.35)
        .setOrigin(0.5, 1)
        .setScale(1.5 + (i % 2) * 0.4)
        .setAlpha(0.7);
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
      for (let i = 0; i < s.count; i++) {
        const spike = this.spikes.create(s.x + i * 22, s.y, 'spike') as Phaser.Physics.Arcade.Sprite;
        spike.setOrigin(0.5, 1);
        spike.refreshBody();
        const body = spike.body as Phaser.Physics.Arcade.StaticBody;
        body.setSize(16, 18);
        body.setOffset(4, 10);
      }
    });
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
    if (save.activeRun?.weapon) {
      this.player.setWeapon(save.activeRun.weapon);
    }
  }

  private spawnEnemies(): void {
    this.level.enemies.forEach((def) => {
      const minCp = def.afterCheckpoint ?? -1;
      if (minCp > this.checkpointIndex) return;

      const enemy = new Enemy(this, def);
      this.enemies.push(enemy);

      if (enemy.type !== 'floater') {
        this.physics.add.collider(enemy.sprite, this.platforms);
        this.physics.add.collider(enemy.sprite, this.movingGroup);
      }

      this.physics.add.overlap(this.player.sprite, enemy.sprite, () => this.onTouchEnemy(enemy));
      this.physics.add.overlap(this.projectiles, enemy.sprite, (proj) => {
        if (!enemy.sprite.active) return;
        (proj as Phaser.Physics.Arcade.Sprite).destroy();
        enemy.takeHit(1, this.player.facing);
      });
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

  private tryAttack(): void {
    const now = this.time.now;
    if (!this.player.canAttack(now)) return;
    this.player.markAttack(now);

    const px = this.player.sprite.x + this.player.facing * 28;
    const py = this.player.sprite.y;

    if (this.player.weapon === 'peashooter') {
      const pea = new Projectile(this, px, py, this.player.facing);
      this.projectiles.add(pea.sprite);
      return;
    }

    const isGlove = this.player.weapon === 'glove';
    const damage = isGlove ? 1 : 0;
    const range = isGlove ? 46 : 30;
    this.enemies.forEach((enemy) => {
      if (!enemy.sprite.active) return;
      const dx = enemy.sprite.x - this.player.sprite.x;
      const dy = Math.abs(enemy.sprite.y - this.player.sprite.y);
      if (Math.sign(dx || this.player.facing) === this.player.facing && Math.abs(dx) < range && dy < 36) {
        if (damage > 0) {
          enemy.takeHit(damage, this.player.facing);
        } else if (enemy.type === 'slime') {
          enemy.sprite.setVelocityX(this.player.facing * 220);
        }
      }
    });

    const swipe = this.add.rectangle(px, py, range, 24, 0xffffff, 0.35).setDepth(11);
    this.tweens.add({
      targets: swipe,
      alpha: 0,
      duration: 120,
      onComplete: () => swipe.destroy(),
    });
  }

  private onTouchEnemy(enemy: Enemy): void {
    if (!enemy.sprite.active || !this.runActive || this.dying) return;
    const now = this.time.now;
    if (this.player.isInvincible(now)) return;
    this.killPlayer();
  }

  private onPickup(pickup: WeaponPickup): void {
    if (!pickup.sprite.active) return;
    this.player.setWeapon(pickup.weapon);
    SaveSystem.updateRun({ weapon: pickup.weapon });
    const msg = pickup.weapon === 'glove' ? ZH.gotGlove : ZH.gotPeashooter;
    this.events.emit('toast', msg);
    pickup.destroy();
  }

  private checkFallDeath(): void {
    if (this.player.sprite.y > this.level.worldHeight - 20) {
      this.killPlayer();
    }
  }

  private checkCheckpoints(): void {
    this.level.checkpoints.forEach((c, i) => {
      if (i <= this.checkpointIndex) return;
      if (Math.abs(this.player.sprite.x - c.x) < 36 && Math.abs(this.player.sprite.y - c.y) < 50) {
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
      this.dying = false;
    });
  }

  private winLevel(): void {
    if (!this.runActive || this.dying) return;
    this.runActive = false;
    const stars = this.calcStars();
    SaveSystem.completeLevel(this.level.id, stars, Math.floor(this.elapsedMs), this.level.index);
    this.events.emit('win', {
      timeMs: Math.floor(this.elapsedMs),
      deaths: this.deaths,
      stars,
      hasNext: this.level.index < LEVELS.length,
      nextLevelId: LEVELS.find((l) => l.index === this.level.index + 1)?.id,
      levelId: this.level.id,
    });
  }

  private calcStars(): number {
    if (this.elapsedMs <= this.level.threeStarMs && this.deaths <= 1) return 3;
    if (this.elapsedMs <= this.level.twoStarMs && this.deaths <= 5) return 2;
    return 1;
  }

  private getHudPayload() {
    return {
      timeMs: Math.floor(this.elapsedMs),
      deaths: this.deaths,
      weaponLabel: weaponLabel(this.player.weapon),
      levelIndex: this.level.index,
    };
  }

  togglePause(): void {
    if (this.dying) return;
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
