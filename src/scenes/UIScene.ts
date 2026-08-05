import Phaser from 'phaser';
import { ZH, petLabel, weaponLabel } from '../i18n/zh';
import { THEME } from '../style/theme';
import { SaveSystem, type InventoryWeapon, type WeaponType } from '../systems/SaveSystem';
import { AdPromoOverlay } from '../ui/AdPromoOverlay';
import type { PetBehavior } from '../entities/PetCompanion';
import type { PetId } from '../systems/SaveSystem';
import type { GameScene } from './GameScene';

type InventoryPayload = {
  open: boolean;
  inventory?: InventoryWeapon[];
  equipped?: WeaponType;
};

type PetMenuPayload = {
  open: boolean;
  petId?: PetId;
  behavior?: PetBehavior;
};

export class UIScene extends Phaser.Scene {
  private timeText!: Phaser.GameObjects.Text;
  private deathText!: Phaser.GameObjects.Text;
  private coinText!: Phaser.GameObjects.Text;
  private vitalsRoot!: Phaser.GameObjects.Container;
  private hpPips: Phaser.GameObjects.Image[] = [];
  private armorPips: Phaser.GameObjects.Image[] = [];
  private weaponText!: Phaser.GameObjects.Text;
  private skillText!: Phaser.GameObjects.Text;
  private specialText!: Phaser.GameObjects.Text;
  private toastText!: Phaser.GameObjects.Text;
  private interactHintText!: Phaser.GameObjects.Text;
  private tutorialLayer?: Phaser.GameObjects.Container;
  private tutorialTitle!: Phaser.GameObjects.Text;
  private tutorialBody!: Phaser.GameObjects.Text;
  private isTutorialLevel = false;
  private pauseLayer?: Phaser.GameObjects.Container;
  private bagLayer?: Phaser.GameObjects.Container;
  private petMenuLayer?: Phaser.GameObjects.Container;
  private winLayer?: Phaser.GameObjects.Container;
  private adOverlay?: AdPromoOverlay;
  private adHudBtn?: Phaser.GameObjects.Container;

  constructor() {
    super('UIScene');
  }

  create(data: { levelIndex: number; isTutorial?: boolean }): void {
    this.isTutorialLevel = data.isTutorial === true;
    const style = {
      fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
      fontSize: '11px',
      color: THEME.uiText,
      backgroundColor: '#ffffffcc',
      padding: { x: 5, y: 2 },
    };

    const levelName =
      this.isTutorialLevel || data.levelIndex === 0 ? ZH.tutorialLevel : ZH.level(data.levelIndex);
    this.add.text(12, 8, levelName, style).setScrollFactor(0).setDepth(100);

    this.timeText = this.add.text(12, 28, '0.0s', style).setScrollFactor(0).setDepth(100);
    this.deathText = this.add.text(12, 48, `亡 0`, style).setScrollFactor(0).setDepth(100);
    this.coinText = this.add.text(12, 68, `币 0`, style).setScrollFactor(0).setDepth(100);
    this.buildVitalsBar();
    this.weaponText = this.add
      .text(12, 112, `武 ${ZH.weaponNone}`, style)
      .setScrollFactor(0)
      .setDepth(100);
    this.skillText = this.add
      .text(12, 132, `技 ${ZH.skillNone}`, style)
      .setScrollFactor(0)
      .setDepth(100);
    this.specialText = this.add
      .text(12, 152, `特 ${ZH.specialNone}`, style)
      .setScrollFactor(0)
      .setDepth(100);
    this.add
      .text(12, 172, 'B·K·M·N', style)
      .setScrollFactor(0)
      .setDepth(100);

    this.makeAdHudButton();

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

    this.buildTutorialPanel();

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
        specialLabel: string;
        specialCdMs: number;
      }) => {
        this.timeText.setText(`${(payload.timeMs / 1000).toFixed(1)}s`);
        this.deathText.setText(`亡 ${payload.deaths}`);
        this.coinText.setText(`币 ${payload.coins}`);
        this.refreshVitals(payload.hp, payload.maxHp, payload.armor, payload.maxArmor);
        this.weaponText.setText(`武 ${payload.weaponLabel}`);
        const cd = payload.skillCdMs > 0 ? ` ${(payload.skillCdMs / 1000).toFixed(1)}s` : '';
        this.skillText.setText(`技 ${payload.skillLabel}${cd}`);
        const scd =
          payload.specialCdMs > 0 ? ` ${(payload.specialCdMs / 1000).toFixed(1)}s` : '';
        this.specialText.setText(`特 ${payload.specialLabel}${scd}`);
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
    game.events.on('tutorialTip', (tip: { title: string; body: string } | null) => {
      this.showTutorialTip(tip);
    });
    game.events.on('tutorialAssistState', (on: boolean) => {
      if (!on) this.showTutorialTip(null);
    });
    game.events.on('pause', (paused: boolean) => {
      if (paused) this.showPause();
      else this.hidePause();
    });
    game.events.on('inventory', (payload: InventoryPayload) => {
      if (payload.open) this.showBag(payload);
      else this.hideBag();
    });
    game.events.on('petMenu', (payload: PetMenuPayload) => {
      if (payload.open) this.showPetMenu(payload);
      else this.hidePetMenu();
    });
    game.events.on('win', (payload: {
      timeMs: number;
      deaths: number;
      stars: number;
      hasNext: boolean;
      nextLevelId?: string;
      levelId: string;
    }) => this.showWin(payload));
    game.events.on('adSkip', () => this.showAdSkip());

    this.events.on('shutdown', () => {
      game.events.off('hud');
      game.events.off('toast');
      game.events.off('interactHint');
      game.events.off('tutorialTip');
      game.events.off('tutorialAssistState');
      game.events.off('pause');
      game.events.off('inventory');
      game.events.off('petMenu');
      game.events.off('win');
      game.events.off('adSkip');
      this.adOverlay?.destroy();
      this.adOverlay = undefined;
    });
  }

  private buildTutorialPanel(): void {
    const cx = THEME.width / 2;
    const cy = THEME.height - 96;
    const bg = this.add
      .rectangle(0, 0, 620, 88, 0x1f2d3d, 0.88)
      .setStrokeStyle(2, 0x5dade2);
    this.tutorialTitle = this.add
      .text(-290, -28, '', {
        fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
        fontSize: '18px',
        color: '#f7dc6f',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5);
    this.tutorialBody = this.add
      .text(-290, 8, '', {
        fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
        fontSize: '15px',
        color: '#ffffff',
        wordWrap: { width: 430 },
      })
      .setOrigin(0, 0.5);

    const dismissBg = this.add
      .rectangle(230, 0, 130, 36, THEME.button)
      .setStrokeStyle(2, THEME.playerStroke)
      .setInteractive({ useHandCursor: true });
    const dismissLabel = this.add
      .text(230, 0, ZH.tutorialDismiss, {
        fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
        fontSize: '13px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    dismissBg.on('pointerover', () => dismissBg.setFillStyle(THEME.buttonHover));
    dismissBg.on('pointerout', () => dismissBg.setFillStyle(THEME.button));
    dismissBg.on('pointerdown', () => {
      const game = this.scene.get('GameScene') as GameScene;
      game.setTutorialAssist(false);
    });

    this.tutorialLayer = this.add
      .container(cx, cy, [bg, this.tutorialTitle, this.tutorialBody, dismissBg, dismissLabel])
      .setScrollFactor(0)
      .setDepth(115)
      .setVisible(false);
  }

  private showTutorialTip(tip: { title: string; body: string } | null): void {
    if (!this.tutorialLayer) return;
    if (!tip) {
      this.tutorialLayer.setVisible(false);
      return;
    }
    this.tutorialTitle.setText(tip.title);
    this.tutorialBody.setText(tip.body);
    this.tutorialLayer.setVisible(true);
  }

  private buildVitalsBar(): void {
    const bg = this.add.rectangle(0, 0, 200, 20, 0xffffff, 0.8).setOrigin(0, 0.5);
    const labelStyle = {
      fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
      fontSize: '11px',
      color: THEME.uiText,
    };

    const rowY = 0;
    const hpLabel = this.add.text(6, rowY, '命', labelStyle).setOrigin(0, 0.5);
    this.hpPips = [];
    const hx = 6 + hpLabel.width + 8;
    for (let i = 0; i < 3; i++) {
      const pip = this.add.image(hx + i * 14, rowY, 'hud_hp_on').setOrigin(0.5).setDisplaySize(12, 12);
      this.hpPips.push(pip);
    }

    const armorLabel = this.add
      .text(hx + 3 * 14 + 8, rowY, '甲', labelStyle)
      .setOrigin(0, 0.5);
    this.armorPips = [];
    const ax = armorLabel.x + armorLabel.width + 8;
    for (let i = 0; i < 3; i++) {
      const pip = this.add
        .image(ax + i * 14, rowY, 'hud_armor_on')
        .setOrigin(0.5)
        .setDisplaySize(12, 12);
      this.armorPips.push(pip);
    }

    bg.width = ax + 3 * 14 + 8;

    this.vitalsRoot = this.add
      .container(12, 92, [bg, hpLabel, ...this.hpPips, armorLabel, ...this.armorPips])
      .setScrollFactor(0)
      .setDepth(100);

    this.refreshVitals(3, 3, 3, 3);
  }

  private refreshVitals(hp: number, maxHp: number, armor: number, maxArmor: number): void {
    this.hpPips.forEach((pip, i) => {
      if (i >= maxHp) {
        pip.setVisible(false);
        return;
      }
      pip.setVisible(true);
      pip.setTexture(i < hp ? 'hud_hp_on' : 'hud_hp_off');
    });
    this.armorPips.forEach((pip, i) => {
      if (i >= maxArmor) {
        pip.setVisible(false);
        return;
      }
      pip.setVisible(true);
      pip.setTexture(i < armor ? 'hud_armor_on' : 'hud_armor_off');
    });
  }

  private makeAdHudButton(): void {
    const game = this.scene.get('GameScene') as GameScene;
    const x = THEME.width - 88;
    const y = 28;
    const c = this.add.container(x, y).setDepth(100).setScrollFactor(0);
    const bg = this.add
      .rectangle(0, 0, 150, 36, THEME.button)
      .setStrokeStyle(2, THEME.playerStroke)
      .setInteractive({ useHandCursor: true });
    const label = this.add
      .text(0, 0, ZH.adSkip, {
        fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
        fontSize: '15px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    bg.on('pointerover', () => bg.setFillStyle(THEME.buttonHover));
    bg.on('pointerout', () => bg.setFillStyle(THEME.button));
    bg.on('pointerdown', () => game.openAdSkip());
    c.add([bg, label]);
    this.adHudBtn = c;
  }

  private showAdSkip(): void {
    if (this.adOverlay) return;
    this.hidePause();
    this.hideBag();
    this.adHudBtn?.setVisible(false);
    const game = this.scene.get('GameScene') as GameScene;
    this.adOverlay = new AdPromoOverlay(this, () => {
      this.adOverlay = undefined;
      this.adHudBtn?.setVisible(true);
      game.completeAdSkip();
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
    this.makeBtn(c, THEME.width / 2, 210, ZH.resume, () => game.togglePause());
    this.makeBtn(c, THEME.width / 2, 260, ZH.adSkip, () => game.openAdSkip());
    this.makeBtn(c, THEME.width / 2, 310, ZH.restart, () => {
      this.hidePause();
      game.restartLevel();
    });
    if (this.isTutorialLevel) {
      const assistOn = SaveSystem.load().tutorialAssist !== false;
      this.makeBtn(
        c,
        THEME.width / 2,
        360,
        assistOn ? ZH.tutorialDismiss : ZH.tutorialEnable,
        () => {
          game.setTutorialAssist(!assistOn);
          this.hidePause();
          game.togglePause();
        },
      );
      this.makeBtn(c, THEME.width / 2, 410, ZH.backToMenu, () => game.goMenu());
    } else {
      this.makeBtn(c, THEME.width / 2, 360, ZH.backToMenu, () => game.goMenu());
    }
    c.add(
      this.add
        .text(THEME.width / 2, this.isTutorialLevel ? 470 : 430, ZH.adSkipHint, {
          fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
          fontSize: '13px',
          color: '#dde8f0',
          align: 'center',
          wordWrap: { width: 520 },
        })
        .setOrigin(0.5),
    );
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

  private showPetMenu(payload: PetMenuPayload): void {
    this.hidePetMenu();
    const game = this.scene.get('GameScene') as GameScene;
    const cx = THEME.width / 2;
    const cy = THEME.height / 2;
    const petName = petLabel(payload.petId ?? 'none');
    const current = payload.behavior ?? 'attack';

    const c = this.add.container(0, 0).setDepth(215).setScrollFactor(0);
    const dim = this.add
      .rectangle(cx, cy, THEME.width, THEME.height, 0x000000, 0.45)
      .setInteractive();
    dim.on('pointerdown', () => game.closePetMenu());
    c.add(dim);
    c.add(
      this.add
        .rectangle(cx, cy, 360, 300, 0xffffff, 0.97)
        .setStrokeStyle(3, THEME.button),
    );
    c.add(
      this.add
        .text(cx, cy - 118, ZH.petMenuTitle, {
          fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
          fontSize: '26px',
          color: '#1f2d3d',
          fontStyle: 'bold',
        })
        .setOrigin(0.5),
    );
    c.add(
      this.add
        .text(cx, cy - 88, `${petName} · ${ZH.petMenuHint}`, {
          fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
          fontSize: '13px',
          color: '#667788',
        })
        .setOrigin(0.5),
    );

    const modes: { id: PetBehavior; label: string }[] = [
      { id: 'play', label: ZH.petModePlay },
      { id: 'attack', label: ZH.petModeAttack },
      { id: 'quiet', label: ZH.petModeQuiet },
    ];
    modes.forEach((mode, i) => {
      const y = cy - 36 + i * 52;
      const active = current === mode.id;
      const bg = this.add
        .rectangle(cx, y, 260, 42, active ? THEME.button : 0xf4f7fa)
        .setStrokeStyle(2, active ? THEME.playerStroke : 0xcbd5e1)
        .setInteractive({ useHandCursor: true });
      const text = this.add
        .text(cx, y, active ? `${mode.label} · ${ZH.equipped}` : mode.label, {
          fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
          fontSize: '16px',
          color: active ? '#ffffff' : '#1f2d3d',
          fontStyle: active ? 'bold' : 'normal',
        })
        .setOrigin(0.5);
      bg.on('pointerover', () => {
        if (!active) bg.setFillStyle(0xe8f4ff);
      });
      bg.on('pointerout', () => {
        if (!active) bg.setFillStyle(0xf4f7fa);
      });
      bg.on('pointerdown', () => game.setPetBehavior(mode.id));
      c.add([bg, text]);
    });

    this.makeBtn(c, cx, cy + 118, ZH.back, () => game.closePetMenu());
    this.petMenuLayer = c;
  }

  private hidePetMenu(): void {
    this.petMenuLayer?.destroy(true);
    this.petMenuLayer = undefined;
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
    this.hidePetMenu();
    this.adHudBtn?.setVisible(false);
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
