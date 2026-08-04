import Phaser from 'phaser';
import { ZH, weaponLabel } from '../i18n/zh';
import { THEME } from '../style/theme';
import { SaveSystem, type InventoryWeapon, type WeaponType } from '../systems/SaveSystem';
import type { GameScene } from './GameScene';

type InventoryPayload = {
  open: boolean;
  inventory?: InventoryWeapon[];
  equipped?: WeaponType;
};

export class UIScene extends Phaser.Scene {
  private timeText!: Phaser.GameObjects.Text;
  private deathText!: Phaser.GameObjects.Text;
  private coinText!: Phaser.GameObjects.Text;
  private vitalsText!: Phaser.GameObjects.Text;
  private weaponText!: Phaser.GameObjects.Text;
  private skillText!: Phaser.GameObjects.Text;
  private toastText!: Phaser.GameObjects.Text;
  private interactHintText!: Phaser.GameObjects.Text;
  private pauseLayer?: Phaser.GameObjects.Container;
  private bagLayer?: Phaser.GameObjects.Container;
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
    this.coinText = this.add.text(16, 120, `${ZH.coins}: 0`, style).setScrollFactor(0).setDepth(100);
    this.vitalsText = this.add
      .text(16, 156, `${ZH.hp}: ❤❤❤  ${ZH.armor}: ◆◆◆`, style)
      .setScrollFactor(0)
      .setDepth(100);
    this.weaponText = this.add
      .text(16, 192, `${ZH.weapon}: ${ZH.weaponNone}`, style)
      .setScrollFactor(0)
      .setDepth(100);
    this.skillText = this.add
      .text(16, 228, `${ZH.skill}: ${ZH.skillNone}`, style)
      .setScrollFactor(0)
      .setDepth(100);
    this.add
      .text(16, 264, `${ZH.bag}: B · K`, style)
      .setScrollFactor(0)
      .setDepth(100);

    this.interactHintText = this.add
      .text(THEME.width / 2, THEME.height - 36, '', {
        fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
        fontSize: '18px',
        color: '#ffffff',
        backgroundColor: '#1f2d3dcc',
        padding: { x: 12, y: 6 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(110)
      .setAlpha(0);

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
    game.events.on(
      'hud',
      (payload: {
        timeMs: number;
        deaths: number;
        coins: number;
        hp: number;
        maxHp: number;
        armor: number;
        maxArmor: number;
        weaponLabel: string;
        skillLabel: string;
        skillCdMs: number;
      }) => {
        this.timeText.setText(`${ZH.time}: ${(payload.timeMs / 1000).toFixed(1)}s`);
        this.deathText.setText(`${ZH.deaths}: ${payload.deaths}`);
        this.coinText.setText(`${ZH.coins}: ${payload.coins}`);
        const hearts =
          '❤'.repeat(Math.max(0, payload.hp)) + '♡'.repeat(Math.max(0, payload.maxHp - payload.hp));
        const shields =
          '◆'.repeat(Math.max(0, payload.armor)) +
          '◇'.repeat(Math.max(0, payload.maxArmor - payload.armor));
        this.vitalsText.setText(`${ZH.hp}: ${hearts}  ${ZH.armor}: ${shields}`);
        this.weaponText.setText(`${ZH.weapon}: ${payload.weaponLabel}`);
        const cd = payload.skillCdMs > 0 ? ` (${(payload.skillCdMs / 1000).toFixed(1)}s)` : '';
        this.skillText.setText(`${ZH.skill}: ${payload.skillLabel}${cd}`);
      },
    );
    game.events.on('toast', (msg: string) => this.showToast(msg));
    game.events.on('interactHint', (hint: string) => {
      if (hint) {
        this.interactHintText.setText(hint);
        this.interactHintText.setAlpha(1);
      } else {
        this.interactHintText.setAlpha(0);
      }
    });
    game.events.on('pause', (paused: boolean) => {
      if (paused) this.showPause();
      else this.hidePause();
    });
    game.events.on('inventory', (payload: InventoryPayload) => {
      if (payload.open) this.showBag(payload);
      else this.hideBag();
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
      game.events.off('interactHint');
      game.events.off('pause');
      game.events.off('inventory');
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

  private showBag(payload: InventoryPayload): void {
    this.hideBag();
    const game = this.scene.get('GameScene') as GameScene;
    const inventory = payload.inventory ?? [];
    const equipped = payload.equipped ?? 'none';
    const cx = THEME.width / 2;
    const cy = THEME.height / 2;

    const c = this.add.container(0, 0).setDepth(210).setScrollFactor(0);
    c.add(this.add.rectangle(cx, cy, THEME.width, THEME.height, 0x000000, 0.5));
    c.add(
      this.add
        .rectangle(cx, cy, 560, 340, 0xffffff, 0.97)
        .setStrokeStyle(3, THEME.button),
    );
    c.add(
      this.add
        .text(cx, cy - 140, ZH.bag, {
          fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
          fontSize: '32px',
          color: '#1f2d3d',
          fontStyle: 'bold',
        })
        .setOrigin(0.5),
    );
    c.add(
      this.add
        .text(cx, cy - 104, ZH.bagHint, {
          fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
          fontSize: '16px',
          color: '#667788',
        })
        .setOrigin(0.5),
    );

    const slots: Array<{ weapon: WeaponType; texture?: string }> = [
      { weapon: 'none' },
      ...SaveSystem.allWeaponSlots().map((w) => ({ weapon: w as WeaponType, texture: w })),
    ];
    const slotW = 72;
    const gap = 14;
    const totalW = slots.length * slotW + (slots.length - 1) * gap;
    const startX = cx - totalW / 2 + slotW / 2;
    const slotY = cy - 10;

    slots.forEach((slot, i) => {
      const x = startX + i * (slotW + gap);
      const owned = slot.weapon === 'none' || inventory.includes(slot.weapon as InventoryWeapon);
      const isEquipped = equipped === slot.weapon;
      const bg = this.add
        .rectangle(x, slotY, slotW, 96, owned ? 0xf4f7fa : 0xe8ecf0)
        .setStrokeStyle(3, isEquipped ? THEME.button : 0xcbd5e1);

      const kids: Phaser.GameObjects.GameObject[] = [bg];
      if (slot.texture && this.textures.exists(slot.texture)) {
        const icon = this.add.image(x, slotY - 16, slot.texture).setScale(owned ? 1.1 : 0.85);
        if (!owned) icon.setAlpha(0.35);
        kids.push(icon);
      } else {
        kids.push(
          this.add
            .text(x, slotY - 16, '·', {
              fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
              fontSize: '28px',
              color: owned ? '#1f2d3d' : '#99aabb',
            })
            .setOrigin(0.5),
        );
      }

      kids.push(
        this.add
          .text(x, slotY + 28, weaponLabel(slot.weapon), {
            fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
            fontSize: '12px',
            color: owned ? '#1f2d3d' : '#99aabb',
            align: 'center',
            wordWrap: { width: slotW - 6 },
          })
          .setOrigin(0.5),
      );

      if (isEquipped) {
        kids.push(
          this.add
            .text(x, slotY + 46, ZH.equipped, {
              fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
              fontSize: '11px',
              color: '#ff6b4a',
            })
            .setOrigin(0.5),
        );
      }

      if (owned) {
        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerover', () => {
          if (!isEquipped) bg.setFillStyle(0xe8f4ff);
        });
        bg.on('pointerout', () => {
          bg.setFillStyle(0xf4f7fa);
        });
        bg.on('pointerdown', () => game.equipWeapon(slot.weapon));
      }

      c.add(kids);
    });

    if (inventory.length === 0) {
      c.add(
        this.add
          .text(cx, cy + 70, ZH.bagEmpty, {
            fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
            fontSize: '16px',
            color: '#778899',
          })
          .setOrigin(0.5),
      );
    }

    this.makeBtn(c, cx, cy + 120, ZH.resume, () => game.toggleInventory());
    this.bagLayer = c;
  }

  private hideBag(): void {
    this.bagLayer?.destroy(true);
    this.bagLayer = undefined;
  }

  private showWin(payload: {
    timeMs: number;
    deaths: number;
    stars: number;
    hasNext: boolean;
    nextLevelId?: string;
  }): void {
    if (this.winLayer) return;
    this.hideBag();
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
