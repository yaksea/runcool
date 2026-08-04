import Phaser from 'phaser';
import { ZH } from '../i18n/zh';
import { THEME } from '../style/theme';

const AD_MS = 30_000;
const BAR_W = 560;
const SHAPE_KEYS = [
  'player_square',
  'player_round',
  'player_diamond',
  'player_triangle',
  'player_pill',
  'player_hex',
] as const;
const TINTS = [THEME.player, 0x5dade2, 0x58d68d, 0xaf7ac5, 0xf4d03f, 0xff8c69];

function texFallbackCoin(scene: Phaser.Scene): string {
  if (scene.textures.exists('coin')) return 'coin';
  if (!scene.textures.exists('__ad_coin')) {
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xf1c40f, 1);
    g.fillCircle(10, 10, 10);
    g.generateTexture('__ad_coin', 20, 20);
    g.destroy();
  }
  return '__ad_coin';
}

type Waypoint = { x: number; y: number; at: number };

/**
 * In-level self-promo “ad”: 30s lively trailer for 跑酷酷, then callback.
 */
export class AdPromoOverlay {
  private root: Phaser.GameObjects.Container;
  private stage!: Phaser.GameObjects.Container;
  private barFill!: Phaser.GameObjects.Rectangle;
  private countdown!: Phaser.GameObjects.Text;
  private slogan!: Phaser.GameObjects.Text;
  private burst!: Phaser.GameObjects.Text;
  private hero!: Phaser.GameObjects.Image;
  private flag!: Phaser.GameObjects.GameObject;
  private coinSprites: Phaser.GameObjects.Image[] = [];
  private coinPopped = new Set<Phaser.GameObjects.Image>();
  private finished = false;
  private elapsed = 0;
  private shapeIdx = 0;
  private sloganIdx = 0;
  private nextSparkAt = 400;
  private nextCoinRainAt = 2200;
  private waypoints: Waypoint[] = [];
  private wpIndex = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly onComplete: () => void,
  ) {
    const w = THEME.width;
    const h = THEME.height;
    const cx = w / 2;
    const cy = h / 2;

    this.root = scene.add.container(0, 0).setDepth(300).setScrollFactor(0);
    this.root.add(scene.add.rectangle(cx, cy, w, h, 0x08141f, 0.94));

    this.stage = scene.add.container(0, 0);
    this.root.add(this.stage);

    // Soft sky panel
    this.stage.add(scene.add.rectangle(cx, cy - 28, w - 40, h - 88, THEME.skyTop, 1));
    this.paintClouds();
    this.paintHills();

    // Ground
    this.stage.add(
      scene.add.rectangle(cx, h - 108, w - 64, 64, THEME.grass, 1).setStrokeStyle(2, 0x3d9a4e),
    );

    // Platforms for a longer parkour path
    const plats = [
      { x: 150, y: 390, ww: 110 },
      { x: 290, y: 340, ww: 90 },
      { x: 430, y: 290, ww: 100 },
      { x: 560, y: 250, ww: 88 },
      { x: 690, y: 210, ww: 96 },
      { x: 820, y: 175, ww: 100 },
    ];
    plats.forEach((p, i) => {
      const plat = scene.add
        .rectangle(p.x, p.y, p.ww, 16, THEME.dirt, 1)
        .setStrokeStyle(2, THEME.dirtDark)
        .setAlpha(0);
      this.stage.add(plat);
      scene.tweens.add({
        targets: plat,
        alpha: 1,
        delay: 180 + i * 220,
        duration: 320,
        ease: 'Back.easeOut',
      });
      scene.tweens.add({
        targets: plat,
        y: p.y - 3,
        duration: 900 + i * 80,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: 400 + i * 120,
      });
    });

    // Finish flag with a little wave
    if (scene.textures.exists('finish')) {
      this.flag = scene.add.image(880, 138, 'finish').setScale(1.35).setAngle(-6);
    } else {
      this.flag = scene.add.rectangle(880, 138, 28, 48, THEME.finish, 1);
    }
    this.stage.add(this.flag);
    scene.tweens.add({
      targets: this.flag,
      angle: 8,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    scene.tweens.add({
      targets: this.flag,
      scale: 1.48,
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const heroTex = SHAPE_KEYS.find((k) => scene.textures.exists(k)) ?? 'player';
    this.seedPathCoins();

    this.hero = scene.add.image(90, 360, heroTex).setTint(THEME.player).setScale(1.4);
    this.stage.add(this.hero);
    this.buildHeroPath();
    this.startHeroMotion();

    // Squash-stretch idle bounce (layered on path tweens via scale only)
    scene.tweens.add({
      targets: this.hero,
      scaleY: 1.22,
      scaleX: 1.55,
      duration: 240,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Morph shape periodically
    scene.time.addEvent({
      delay: 2200,
      repeat: 12,
      callback: () => this.morphHero(),
    });

    // Title with pop-in
    const title = scene.add
      .text(cx, 42, ZH.title, {
        fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
        fontSize: '48px',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#ff6b4a',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setScale(0.6)
      .setAlpha(0);
    this.root.add(title);
    scene.tweens.add({
      targets: title,
      alpha: 1,
      scale: 1,
      duration: 520,
      ease: 'Back.easeOut',
    });
    scene.tweens.add({
      targets: title,
      y: 48,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: 520,
    });

    const subtitle = scene.add
      .text(cx, 92, ZH.adPromoSubtitle, {
        fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
        fontSize: '16px',
        color: '#dff6ff',
      })
      .setOrigin(0.5)
      .setAlpha(0);
    this.root.add(subtitle);
    scene.tweens.add({ targets: subtitle, alpha: 1, delay: 400, duration: 400 });

    // Rotating slogan (main promo lines)
    this.slogan = scene.add
      .text(cx, 126, ZH.adSlogans[0], {
        fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
        fontSize: '22px',
        color: '#ffe08a',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: 820 },
      })
      .setOrigin(0.5)
      .setAlpha(0);
    this.root.add(this.slogan);
    this.cycleSlogan(true);
    scene.time.addEvent({
      delay: 3500,
      repeat: 7,
      callback: () => this.cycleSlogan(false),
    });

    // Occasional big burst callout
    this.burst = scene.add
      .text(cx, 220, '', {
        fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
        fontSize: '28px',
        color: '#ffffff',
        fontStyle: 'bold',
        backgroundColor: '#ff6b4acc',
        padding: { x: 16, y: 8 },
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setScale(0.7);
    this.root.add(this.burst);
    this.scheduleBursts();

    // Feature chips — staggered, bounce in
    const chips = [ZH.adChipJump, ZH.adChipShop, ZH.adChipStars, ZH.adChipWeapons];
    chips.forEach((label, i) => {
      const chip = scene.add
        .text(110 + i * 190, h - 78, label, {
          fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
          fontSize: '14px',
          color: '#1f2d3d',
          backgroundColor: '#ffffffee',
          padding: { x: 10, y: 6 },
        })
        .setOrigin(0.5)
        .setAlpha(0)
        .setScale(0.8);
      this.root.add(chip);
      scene.tweens.add({
        targets: chip,
        alpha: 1,
        scale: 1,
        delay: 900 + i * 700,
        duration: 420,
        ease: 'Back.easeOut',
      });
      scene.tweens.add({
        targets: chip,
        y: h - 84,
        duration: 1400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: 1400 + i * 200,
      });
    });

    // Progress bar
    const barY = h - 34;
    this.root.add(scene.add.rectangle(cx, barY, BAR_W, 14, 0x243447, 1));
    this.barFill = scene.add
      .rectangle(cx - BAR_W / 2, barY, 4, 14, THEME.button, 1)
      .setOrigin(0, 0.5);
    this.root.add(this.barFill);
    this.countdown = scene.add
      .text(cx, barY - 26, ZH.adWatching(30), {
        fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
        fontSize: '15px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    this.root.add(this.countdown);

    scene.events.on('update', this.tick, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }

  private paintClouds(): void {
    const spots = [
      { x: 120, y: 160, s: 1 },
      { x: 340, y: 130, s: 1.3 },
      { x: 560, y: 150, s: 0.9 },
      { x: 760, y: 125, s: 1.15 },
    ];
    spots.forEach((c, i) => {
      const cloud = this.scene.add.container(c.x, c.y);
      const a = this.scene.add.ellipse(0, 0, 70 * c.s, 28 * c.s, 0xffffff, 0.55);
      const b = this.scene.add.ellipse(-22 * c.s, -6, 40 * c.s, 24 * c.s, 0xffffff, 0.5);
      const d = this.scene.add.ellipse(24 * c.s, -4, 36 * c.s, 22 * c.s, 0xffffff, 0.5);
      cloud.add([a, b, d]);
      this.stage.add(cloud);
      this.scene.tweens.add({
        targets: cloud,
        x: c.x + 40,
        duration: 5000 + i * 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });
  }

  private paintHills(): void {
    const h = THEME.height;
    const hill = this.scene.add.graphics();
    hill.fillStyle(0x6ecf8a, 0.55);
    hill.fillEllipse(200, h - 130, 280, 90);
    hill.fillStyle(0x5bbd6c, 0.5);
    hill.fillEllipse(520, h - 120, 320, 100);
    hill.fillStyle(0x4aa85c, 0.45);
    hill.fillEllipse(820, h - 125, 260, 85);
    this.stage.add(hill);
  }

  private seedPathCoins(): void {
    const spots = [
      { x: 200, y: 350 },
      { x: 320, y: 300 },
      { x: 450, y: 250 },
      { x: 580, y: 210 },
      { x: 710, y: 175 },
      { x: 800, y: 150 },
    ];
    spots.forEach((p, i) => {
      const coin = this.scene.add.image(p.x, p.y, texFallbackCoin(this.scene)).setScale(1.15);
      this.coinSprites.push(coin);
      this.stage.add(coin);
      this.scene.tweens.add({
        targets: coin,
        y: p.y - 10,
        angle: 360,
        duration: 700 + i * 60,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });
  }

  private buildHeroPath(): void {
    // Timed waypoints across ~28s of the ad
    this.waypoints = [
      { x: 90, y: 360, at: 0 },
      { x: 170, y: 300, at: 2500 },
      { x: 300, y: 250, at: 5500 },
      { x: 440, y: 210, at: 9000 },
      { x: 560, y: 175, at: 13000 },
      { x: 700, y: 145, at: 17500 },
      { x: 820, y: 130, at: 22000 },
      { x: 870, y: 125, at: 26000 },
    ];
  }

  private startHeroMotion(): void {
    // Chain bounce hops along waypoints (keeps ~28s of motion lively)
    const runHop = (i: number): void => {
      if (this.finished || i >= this.waypoints.length - 1) return;
      const from = this.waypoints[i];
      const to = this.waypoints[i + 1];
      const dur = Math.max(400, to.at - from.at);
      const peakY = Math.min(from.y, to.y) - 58;

      this.scene.tweens.add({
        targets: this.hero,
        x: to.x,
        duration: dur,
        ease: 'Sine.easeInOut',
      });
      this.scene.tweens.add({
        targets: this.hero,
        y: peakY,
        duration: dur * 0.42,
        ease: 'Quad.easeOut',
        onComplete: () => {
          if (this.finished) return;
          this.scene.tweens.add({
            targets: this.hero,
            y: to.y,
            duration: dur * 0.58,
            ease: 'Bounce.easeOut',
            onComplete: () => {
              if (this.finished) return;
              this.scene.tweens.add({
                targets: this.hero,
                scaleX: 1.72,
                scaleY: 1.08,
                duration: 90,
                yoyo: true,
              });
              runHop(i + 1);
            },
          });
        },
      });
    };
    runHop(0);
  }

  private morphHero(): void {
    if (this.finished) return;
    this.shapeIdx = (this.shapeIdx + 1) % SHAPE_KEYS.length;
    const next = SHAPE_KEYS[this.shapeIdx];
    if (this.scene.textures.exists(next)) this.hero.setTexture(next);
    this.hero.setTint(TINTS[this.shapeIdx % TINTS.length]);
    this.scene.tweens.add({
      targets: this.hero,
      angle: this.hero.angle + 360,
      duration: 420,
      ease: 'Cubic.easeOut',
    });
  }

  private cycleSlogan(first: boolean): void {
    if (this.finished) return;
    const lines = ZH.adSlogans;
    if (!first) {
      this.sloganIdx = (this.sloganIdx + 1) % lines.length;
    }
    const text = lines[this.sloganIdx];
    this.scene.tweens.killTweensOf(this.slogan);
    this.scene.tweens.add({
      targets: this.slogan,
      alpha: 0,
      y: 118,
      duration: first ? 0 : 180,
      onComplete: () => {
        this.slogan.setText(text);
        this.slogan.setY(134);
        this.scene.tweens.add({
          targets: this.slogan,
          alpha: 1,
          y: 126,
          duration: 320,
          ease: 'Back.easeOut',
        });
      },
    });
  }

  private scheduleBursts(): void {
    const times = [4500, 11000, 18000, 24500];
    times.forEach((t, i) => {
      this.scene.time.delayedCall(t, () => {
        if (this.finished) return;
        const line = ZH.adBursts[i % ZH.adBursts.length];
        this.burst.setText(line).setAlpha(0).setScale(0.65);
        this.scene.tweens.add({
          targets: this.burst,
          alpha: 1,
          scale: 1.05,
          duration: 280,
          ease: 'Back.easeOut',
          hold: 1400,
          yoyo: true,
        });
      });
    });
  }

  private spawnSpark(x: number, y: number): void {
    const spark = this.scene.add
      .text(x, y, '✦', {
        fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
        fontSize: `${12 + Math.floor(Math.random() * 10)}px`,
        color: Phaser.Math.RND.pick(['#fff7ae', '#ffffff', '#ffd4c4', '#a8f0ff']),
      })
      .setOrigin(0.5)
      .setAlpha(0.9);
    this.stage.add(spark);
    this.scene.tweens.add({
      targets: spark,
      y: y - 40 - Math.random() * 30,
      x: x + (Math.random() - 0.5) * 50,
      alpha: 0,
      scale: 0.3,
      duration: 600 + Math.random() * 400,
      onComplete: () => spark.destroy(),
    });
  }

  private rainCoin(): void {
    const x = 80 + Math.random() * (THEME.width - 160);
    const coin = this.scene.add
      .image(x, 100, texFallbackCoin(this.scene))
      .setScale(0.85)
      .setAlpha(0.85);
    this.stage.add(coin);
    this.scene.tweens.add({
      targets: coin,
      y: THEME.height - 130,
      angle: 360,
      alpha: 0.2,
      duration: 1600 + Math.random() * 800,
      ease: 'Quad.easeIn',
      onComplete: () => coin.destroy(),
    });
  }

  private tick(_t: number, delta: number): void {
    if (this.finished) return;
    this.elapsed += delta;
    const p = Math.min(1, this.elapsed / AD_MS);
    this.barFill.width = Math.max(4, BAR_W * p);
    const left = Math.max(0, Math.ceil((AD_MS - this.elapsed) / 1000));
    this.countdown.setText(ZH.adWatching(left));

    // Pop path coins near hero
    this.coinSprites.forEach((c) => {
      if (this.coinPopped.has(c) || !c.active || !c.visible) return;
      if (this.hero.x > c.x - 24) {
        this.coinPopped.add(c);
        this.scene.tweens.killTweensOf(c);
        this.spawnSpark(c.x, c.y);
        this.scene.tweens.add({
          targets: c,
          scale: 0,
          alpha: 0,
          y: c.y - 36,
          duration: 220,
          onComplete: () => c.setVisible(false),
        });
      }
    });

    if (this.elapsed >= this.nextSparkAt) {
      this.nextSparkAt = this.elapsed + 280 + Math.random() * 220;
      this.spawnSpark(this.hero.x + (Math.random() - 0.5) * 30, this.hero.y - 20);
    }

    if (this.elapsed >= this.nextCoinRainAt && this.elapsed < AD_MS - 2000) {
      this.nextCoinRainAt = this.elapsed + 900 + Math.random() * 700;
      this.rainCoin();
    }

    // Celebrate near finish
    if (this.elapsed > 25500 && this.wpIndex === 0) {
      this.wpIndex = 1;
      for (let i = 0; i < 12; i++) {
        this.scene.time.delayedCall(i * 60, () => {
          if (!this.finished) this.spawnSpark(860 + Math.random() * 40, 120 + Math.random() * 40);
        });
      }
    }

    if (this.elapsed >= AD_MS) {
      this.finish();
    }
  }

  private finish(): void {
    if (this.finished) return;
    this.finished = true;
    this.scene.events.off('update', this.tick, this);
    this.scene.tweens.add({
      targets: this.root,
      alpha: 0,
      duration: 320,
      onComplete: () => {
        this.destroy();
        this.onComplete();
      },
    });
  }

  destroy(): void {
    this.scene.events.off('update', this.tick, this);
    this.root.destroy(true);
  }
}
