import Phaser from 'phaser';
import { ZH } from '../i18n/zh';
import { THEME } from '../style/theme';
import { LEVELS } from '../levels';
import { SaveSystem } from '../systems/SaveSystem';

export class MenuScene extends Phaser.Scene {
  private mode: 'main' | 'levels' | 'confirmClear' = 'main';

  constructor() {
    super('MenuScene');
  }

  create(): void {
    this.mode = 'main';
    this.drawBackground();
    this.renderMain();
  }

  private drawBackground(): void {
    const { width, height } = this.scale;
    const g = this.add.graphics();
    g.fillGradientStyle(THEME.skyTop, THEME.skyTop, THEME.skyBottom, THEME.skyBottom, 1);
    g.fillRect(0, 0, width, height);
    for (let i = 0; i < 4; i++) {
      this.add.image(120 + i * 220, 90 + (i % 2) * 30, 'cloud').setAlpha(0.7).setScale(1.2);
    }
    this.add.image(200, height - 40, 'hill').setOrigin(0.5, 1).setScale(1.4);
    this.add.image(700, height - 20, 'hill').setOrigin(0.5, 1).setScale(1.8);
    this.add.image(width / 2, height - 80, 'player').setScale(2.2);
  }

  private clearUi(): void {
    this.children.list
      .filter((c) => (c as Phaser.GameObjects.GameObject & { getData?: (k: string) => unknown }).getData?.('ui'))
      .forEach((c) => c.destroy());
  }

  private tag(obj: Phaser.GameObjects.GameObject): void {
    obj.setData('ui', true);
  }

  private makeButton(x: number, y: number, label: string, onClick: () => void): void {
    const bg = this.add
      .rectangle(x, y, 220, 48, THEME.button, 1)
      .setStrokeStyle(3, THEME.playerStroke)
      .setInteractive({ useHandCursor: true });
    const text = this.add
      .text(x, y, label, {
        fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
        fontSize: '22px',
        color: THEME.uiLight,
      })
      .setOrigin(0.5);
    this.tag(bg);
    this.tag(text);
    bg.on('pointerover', () => bg.setFillStyle(THEME.buttonHover));
    bg.on('pointerout', () => bg.setFillStyle(THEME.button));
    bg.on('pointerdown', onClick);
  }

  private renderMain(): void {
    this.clearUi();
    const { width, height } = this.scale;
    const save = SaveSystem.load();

    const title = this.add
      .text(width / 2, 100, ZH.title, {
        fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
        fontSize: '64px',
        color: '#1f2d3d',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const sub = this.add
      .text(width / 2, 160, ZH.subtitle, {
        fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
        fontSize: '18px',
        color: '#334455',
      })
      .setOrigin(0.5);
    this.tag(title);
    this.tag(sub);

    let y = 240;
    if (save.activeRun) {
      this.makeButton(width / 2, y, ZH.continueGame, () => {
        this.scene.start('GameScene', {
          levelId: save.activeRun!.levelId,
          continueRun: true,
        });
      });
      y += 64;
    }

    this.makeButton(width / 2, y, save.activeRun ? ZH.selectLevel : ZH.startGame, () => {
      this.mode = 'levels';
      this.renderLevels();
    });
    y += 64;
    this.makeButton(width / 2, y, ZH.clearSave, () => {
      this.mode = 'confirmClear';
      this.renderConfirmClear();
    });

    const tip = this.add
      .text(width / 2, height - 36, ZH.controls, {
        fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
        fontSize: '14px',
        color: '#2c3e50',
      })
      .setOrigin(0.5);
    this.tag(tip);
  }

  private renderLevels(): void {
    this.clearUi();
    const { width } = this.scale;
    const save = SaveSystem.load();

    const title = this.add
      .text(width / 2, 80, ZH.selectLevel, {
        fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
        fontSize: '36px',
        color: '#1f2d3d',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.tag(title);

    LEVELS.forEach((level, i) => {
      const unlocked = level.index <= save.unlockedMax;
      const record = save.levels[level.id];
      const stars = record ? ZH.stars(record.bestStars) : ZH.stars(0);
      const label = unlocked
        ? `${ZH.level(level.index)}  ${stars}`
        : `${ZH.level(level.index)}  ${ZH.locked}`;
      const y = 180 + i * 70;
      if (unlocked) {
        this.makeButton(width / 2, y, label, () => {
          SaveSystem.startRun(level.id);
          this.scene.start('GameScene', { levelId: level.id, continueRun: false });
        });
      } else {
        const t = this.add
          .text(width / 2, y, label, {
            fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
            fontSize: '20px',
            color: '#7f8c8d',
          })
          .setOrigin(0.5);
        this.tag(t);
      }
    });

    this.makeButton(width / 2, 460, ZH.back, () => {
      this.mode = 'main';
      this.renderMain();
    });
  }

  private renderConfirmClear(): void {
    this.clearUi();
    const { width, height } = this.scale;
    const panel = this.add.rectangle(width / 2, height / 2, 420, 220, 0xffffff, 0.95).setStrokeStyle(3, THEME.button);
    const msg = this.add
      .text(width / 2, height / 2 - 40, ZH.confirmClear, {
        fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
        fontSize: '22px',
        color: '#1f2d3d',
      })
      .setOrigin(0.5);
    this.tag(panel);
    this.tag(msg);
    this.makeButton(width / 2 - 90, height / 2 + 40, ZH.confirm, () => {
      SaveSystem.clear();
      this.mode = 'main';
      this.renderMain();
    });
    this.makeButton(width / 2 + 90, height / 2 + 40, ZH.cancel, () => {
      this.mode = 'main';
      this.renderMain();
    });
  }
}
