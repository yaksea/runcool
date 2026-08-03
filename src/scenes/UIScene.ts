import Phaser from 'phaser';
import { ZH } from '../i18n/zh';
import { THEME } from '../style/theme';
import type { GameScene } from './GameScene';

export class UIScene extends Phaser.Scene {
  private timeText!: Phaser.GameObjects.Text;
  private deathText!: Phaser.GameObjects.Text;
  private weaponText!: Phaser.GameObjects.Text;
  private toastText!: Phaser.GameObjects.Text;
  private pauseLayer?: Phaser.GameObjects.Container;
  private winLayer?: Phaser.GameObjects.Container;

  constructor() {
    super('UIScene');
  }

  create(data: { levelIndex: number }): void {
    const style = {
      fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
      fontSize: '18px',
      color: THEME.uiText,
      backgroundColor: '#ffffffcc',
      padding: { x: 10, y: 6 },
    };

    this.add
      .text(16, 12, ZH.level(data.levelIndex), style)
      .setScrollFactor(0)
      .setDepth(100);

    this.timeText = this.add.text(16, 48, `${ZH.time}: 0.0s`, style).setScrollFactor(0).setDepth(100);
    this.deathText = this.add.text(16, 84, `${ZH.deaths}: 0`, style).setScrollFactor(0).setDepth(100);
    this.weaponText = this.add
      .text(16, 120, `${ZH.weapon}: ${ZH.weaponNone}`, style)
      .setScrollFactor(0)
      .setDepth(100);

    this.toastText = this.add
      .text(THEME.width / 2, 160, '', {
        fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
        fontSize: '20px',
        color: '#ffffff',
        backgroundColor: '#1f2d3dcc',
        padding: { x: 14, y: 8 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(120)
      .setAlpha(0);

    const game = this.scene.get('GameScene') as GameScene;
    game.events.on('hud', (payload: { timeMs: number; deaths: number; weaponLabel: string }) => {
      this.timeText.setText(`${ZH.time}: ${(payload.timeMs / 1000).toFixed(1)}s`);
      this.deathText.setText(`${ZH.deaths}: ${payload.deaths}`);
      this.weaponText.setText(`${ZH.weapon}: ${payload.weaponLabel}`);
    });
    game.events.on('toast', (msg: string) => this.showToast(msg));
    game.events.on('pause', (paused: boolean) => {
      if (paused) this.showPause();
      else this.hidePause();
    });
    game.events.on('win', (payload: {
      timeMs: number;
      deaths: number;
      stars: number;
      hasNext: boolean;
      nextLevelId?: string;
      levelId: string;
    }) => this.showWin(payload));

    this.events.on('shutdown', () => {
      game.events.off('hud');
      game.events.off('toast');
      game.events.off('pause');
      game.events.off('win');
    });
  }

  private showToast(msg: string): void {
    this.toastText.setText(msg);
    this.tweens.add({
      targets: this.toastText,
      alpha: 1,
      duration: 120,
      hold: 1200,
      yoyo: true,
    });
  }

  private makeBtn(
    container: Phaser.GameObjects.Container,
    x: number,
    y: number,
    label: string,
    onClick: () => void,
  ): void {
    const bg = this.add
      .rectangle(x, y, 180, 44, THEME.button)
      .setStrokeStyle(2, THEME.playerStroke)
      .setInteractive({ useHandCursor: true });
    const text = this.add
      .text(x, y, label, {
        fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
        fontSize: '20px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    bg.on('pointerover', () => bg.setFillStyle(THEME.buttonHover));
    bg.on('pointerout', () => bg.setFillStyle(THEME.button));
    bg.on('pointerdown', onClick);
    container.add([bg, text]);
  }

  private showPause(): void {
    if (this.pauseLayer) return;
    const game = this.scene.get('GameScene') as GameScene;
    const c = this.add.container(0, 0).setDepth(200).setScrollFactor(0);
    c.add(this.add.rectangle(THEME.width / 2, THEME.height / 2, THEME.width, THEME.height, 0x000000, 0.45));
    c.add(
      this.add
        .text(THEME.width / 2, 160, ZH.paused, {
          fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
          fontSize: '40px',
          color: '#ffffff',
        })
        .setOrigin(0.5),
    );
    this.makeBtn(c, THEME.width / 2, 240, ZH.resume, () => game.togglePause());
    this.makeBtn(c, THEME.width / 2, 300, ZH.restart, () => {
      this.hidePause();
      game.restartLevel();
    });
    this.makeBtn(c, THEME.width / 2, 360, ZH.backToMenu, () => game.goMenu());
    this.pauseLayer = c;
  }

  private hidePause(): void {
    this.pauseLayer?.destroy(true);
    this.pauseLayer = undefined;
  }

  private showWin(payload: {
    timeMs: number;
    deaths: number;
    stars: number;
    hasNext: boolean;
    nextLevelId?: string;
  }): void {
    if (this.winLayer) return;
    const game = this.scene.get('GameScene') as GameScene;
    const c = this.add.container(0, 0).setDepth(220).setScrollFactor(0);
    c.add(this.add.rectangle(THEME.width / 2, THEME.height / 2, THEME.width, THEME.height, 0x000000, 0.5));
    c.add(
      this.add
        .rectangle(THEME.width / 2, THEME.height / 2, 420, 320, 0xffffff, 0.96)
        .setStrokeStyle(3, THEME.button),
    );
    c.add(
      this.add
        .text(THEME.width / 2, 150, ZH.clear, {
          fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
          fontSize: '40px',
          color: '#1f2d3d',
          fontStyle: 'bold',
        })
        .setOrigin(0.5),
    );
    c.add(
      this.add
        .text(
          THEME.width / 2,
          210,
          `${ZH.elapsed}: ${(payload.timeMs / 1000).toFixed(1)}s\n${ZH.deathCount}: ${payload.deaths}\n${ZH.rating}: ${ZH.stars(payload.stars)}`,
          {
            fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
            fontSize: '20px',
            color: '#334455',
            align: 'center',
          },
        )
        .setOrigin(0.5),
    );

    let y = 300;
    if (payload.hasNext && payload.nextLevelId) {
      this.makeBtn(c, THEME.width / 2, y, ZH.nextLevel, () => {
        this.winLayer?.destroy(true);
        this.winLayer = undefined;
        game.goNext(payload.nextLevelId!);
      });
      y += 56;
    }
    this.makeBtn(c, THEME.width / 2, y, ZH.playAgain, () => {
      this.winLayer?.destroy(true);
      this.winLayer = undefined;
      game.restartLevel();
    });
    y += 56;
    this.makeBtn(c, THEME.width / 2, y, ZH.backToMenu, () => game.goMenu());
    this.winLayer = c;
  }
}
