import Phaser from 'phaser';
import { ZH, shapeLabel, skinLabel, skillDesc, skillLabel } from '../i18n/zh';
import { THEME } from '../style/theme';
import { LEVELS } from '../levels';
import { SHAPES, SKILLS, SKINS, shapeById, skinById } from '../game/shopCatalog';
import {
  SaveSystem,
  type EquippedSkill,
  type ShapeId,
  type SkinId,
  type SkillId,
} from '../systems/SaveSystem';
import { SoundSystem } from '../systems/SoundSystem';

export class MenuScene extends Phaser.Scene {
  private mode: 'main' | 'levels' | 'confirmClear' | 'shop' = 'main';
  private shopMsg = '';

  constructor() {
    super('MenuScene');
  }

  create(): void {
    this.mode = 'main';
    this.shopMsg = '';
    this.drawBackground();
    this.renderMain();
    this.input.once('pointerdown', () => SoundSystem.unlock());
  }

  private drawBackground(): void {
    const { width, height } = this.scale;
    const g = this.add.graphics();
    g.fillGradientStyle(0x6eb6e0, 0x6eb6e0, THEME.skyBottom, 0xb8efd4, 1);
    g.fillRect(0, 0, width, height);

    this.add.image(width - 110, 88, 'sun').setAlpha(0.9).setScale(1.05);
    this.add.image(160, height * 0.5, 'mountain').setOrigin(0.5, 1).setAlpha(0.45).setScale(1.3);
    this.add.image(520, height * 0.48, 'mountain').setOrigin(0.5, 1).setAlpha(0.4).setScale(1.1);
    this.add.image(820, height * 0.5, 'mountain').setOrigin(0.5, 1).setAlpha(0.42).setScale(1.25);

    for (let i = 0; i < 5; i++) {
      const cloud = this.add
        .image(80 + i * 200, 70 + (i % 2) * 28, 'cloud')
        .setAlpha(0.75)
        .setScale(1.1 + (i % 3) * 0.15);
      this.tweens.add({
        targets: cloud,
        x: cloud.x + 36,
        duration: 5000 + i * 400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    this.add.image(180, height - 36, 'hill').setOrigin(0.5, 1).setScale(1.5);
    this.add.image(520, height - 20, 'hill').setOrigin(0.5, 1).setScale(1.9);
    this.add.image(820, height - 30, 'hill').setOrigin(0.5, 1).setScale(1.6);
    this.add.image(120, height - 70, 'tree').setOrigin(0.5, 1).setScale(1.2);
    this.add.image(860, height - 65, 'tree').setOrigin(0.5, 1).setScale(1.05);
    this.add.image(300, height - 48, 'bush').setOrigin(0.5, 1).setScale(1.2);
    this.add.image(700, height - 48, 'bush').setOrigin(0.5, 1);

    const save = SaveSystem.load();
    const hero = this.add
      .image(width / 2, height - 80, shapeById(save.equippedShape).texture)
      .setScale(2.2);
    hero.setTint(skinById(save.equippedSkin).tint);
    hero.setData('hero', true);
    this.tweens.add({
      targets: hero,
      y: hero.y - 8,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private refreshHeroLook(): void {
    const hero = this.children.list.find(
      (c) => (c as Phaser.GameObjects.GameObject & { getData?: (k: string) => unknown }).getData?.('hero'),
    ) as Phaser.GameObjects.Image | undefined;
    if (!hero) return;
    const save = SaveSystem.load();
    const tex = shapeById(save.equippedShape).texture;
    if (this.textures.exists(tex)) hero.setTexture(tex);
    hero.setTint(skinById(save.equippedSkin).tint);
  }

  private clearUi(): void {
    this.children.list
      .filter((c) => (c as Phaser.GameObjects.GameObject & { getData?: (k: string) => unknown }).getData?.('ui'))
      .forEach((c) => c.destroy());
  }

  private tag(obj: Phaser.GameObjects.GameObject): void {
    obj.setData('ui', true);
  }

  private makeButton(x: number, y: number, label: string, onClick: () => void, w = 220, h = 48): void {
    const bg = this.add
      .rectangle(x, y, w, h, THEME.button, 1)
      .setStrokeStyle(3, THEME.playerStroke)
      .setInteractive({ useHandCursor: true });
    const text = this.add
      .text(x, y, label, {
        fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
        fontSize: w < 160 ? '14px' : w < 200 ? '16px' : '22px',
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
    this.refreshHeroLook();
    const { width, height } = this.scale;
    const save = SaveSystem.load();

    const title = this.add
      .text(width / 2, 88, ZH.title, {
        fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
        fontSize: '64px',
        color: '#1f2d3d',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const sub = this.add
      .text(width / 2, 142, ZH.subtitle, {
        fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
        fontSize: '18px',
        color: '#334455',
      })
      .setOrigin(0.5);
    const coinBar = this.add
      .text(width / 2, 176, `${ZH.coins}: ${save.coins}`, {
        fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
        fontSize: '18px',
        color: '#b7950b',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.tag(title);
    this.tag(sub);
    this.tag(coinBar);

    let y = 220;
    if (save.activeRun) {
      this.makeButton(width / 2, y, ZH.continueGame, () => {
        this.scene.start('GameScene', {
          levelId: save.activeRun!.levelId,
          continueRun: true,
        });
      });
      y += 56;
    }

    this.makeButton(width / 2, y, save.activeRun ? ZH.selectLevel : ZH.startGame, () => {
      this.mode = 'levels';
      this.renderLevels();
    });
    y += 56;
    this.makeButton(width / 2, y, ZH.shop, () => {
      this.mode = 'shop';
      this.shopMsg = '';
      this.renderShop();
    });
    y += 56;
    this.makeButton(width / 2, y, ZH.clearSave, () => {
      this.mode = 'confirmClear';
      this.renderConfirmClear();
    });

    const tip = this.add
      .text(width / 2, height - 28, ZH.controls, {
        fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
        fontSize: '13px',
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
      .text(width / 2, 56, ZH.selectLevel, {
        fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
        fontSize: '32px',
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
        ? `${ZH.level(level.index)} ${stars}`
        : `${ZH.level(level.index)} ${ZH.locked}`;
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = width / 2 - 140 + col * 280;
      const y = 110 + row * 58;
      if (unlocked) {
        this.makeButton(x, y, label, () => {
          SaveSystem.startRun(level.id);
          this.scene.start('GameScene', { levelId: level.id, continueRun: false });
        }, 250, 44);
      } else {
        const t = this.add
          .text(x, y, label, {
            fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
            fontSize: '16px',
            color: '#7f8c8d',
          })
          .setOrigin(0.5);
        this.tag(t);
      }
    });

    this.makeButton(width / 2, 500, ZH.back, () => {
      this.mode = 'main';
      this.renderMain();
    });
  }

  private renderShop(): void {
    this.clearUi();
    this.refreshHeroLook();
    const { width } = this.scale;
    const save = SaveSystem.load();

    const title = this.add
      .text(width / 2, 28, ZH.shop, {
        fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
        fontSize: '28px',
        color: '#1f2d3d',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const coins = this.add
      .text(width / 2, 56, `${ZH.coins}: ${save.coins}  ·  形状与颜色可自由搭配`, {
        fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
        fontSize: '15px',
        color: '#b7950b',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.tag(title);
    this.tag(coins);

    if (this.shopMsg) {
      const msg = this.add
        .text(width / 2, 76, this.shopMsg, {
          fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
          fontSize: '13px',
          color: '#c0392b',
        })
        .setOrigin(0.5);
      this.tag(msg);
    }

    // —— 形状（左）——
    const shapeTitle = this.add.text(28, 92, ZH.shopShapes, {
      fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
      fontSize: '16px',
      color: '#1f2d3d',
      fontStyle: 'bold',
    });
    this.tag(shapeTitle);

    SHAPES.forEach((shape, i) => {
      const owned = save.ownedShapes.includes(shape.id);
      const equipped = save.equippedShape === shape.id;
      const y = 122 + i * 48;
      const preview = this.add
        .image(48, y, shape.texture)
        .setScale(0.7)
        .setTint(skinById(save.equippedSkin).tint);
      const name = this.add
        .text(72, y, `${shapeLabel(shape.id)}${shape.price > 0 ? ` · ${shape.price}` : ''}`, {
          fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
          fontSize: '13px',
          color: '#1f2d3d',
        })
        .setOrigin(0, 0.5);
      this.tag(preview);
      this.tag(name);
      if (equipped) {
        const t = this.add
          .text(210, y, ZH.equipped, {
            fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
            fontSize: '12px',
            color: '#27ae60',
          })
          .setOrigin(0.5);
        this.tag(t);
      } else {
        const btnLabel = owned ? '装备' : `${ZH.buy} ${shape.price}`;
        this.makeButton(210, y, btnLabel, () => this.onBuyOrEquipShape(shape.id, shape.price), 96, 30);
      }
    });

    // —— 颜色（中）——
    const colorTitle = this.add.text(280, 92, ZH.shopColors, {
      fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
      fontSize: '16px',
      color: '#1f2d3d',
      fontStyle: 'bold',
    });
    this.tag(colorTitle);

    SKINS.forEach((skin, i) => {
      const owned = save.ownedSkins.includes(skin.id);
      const equipped = save.equippedSkin === skin.id;
      const y = 122 + i * 52;
      const swatch = this.add.rectangle(300, y, 24, 24, skin.tint).setStrokeStyle(2, 0x333333);
      const name = this.add
        .text(320, y, `${skinLabel(skin.id)}${skin.price > 0 ? ` · ${skin.price}` : ''}`, {
          fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
          fontSize: '13px',
          color: '#1f2d3d',
        })
        .setOrigin(0, 0.5);
      this.tag(swatch);
      this.tag(name);
      if (equipped) {
        const t = this.add
          .text(455, y, ZH.equipped, {
            fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
            fontSize: '12px',
            color: '#27ae60',
          })
          .setOrigin(0.5);
        this.tag(t);
      } else {
        const btnLabel = owned ? '装备' : `${ZH.buy} ${skin.price}`;
        this.makeButton(455, y, btnLabel, () => this.onBuyOrEquipSkin(skin.id, skin.price), 96, 30);
      }
    });

    // —— 技能（右）——
    const skillTitle = this.add.text(520, 92, ZH.shopSkills, {
      fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
      fontSize: '15px',
      color: '#1f2d3d',
      fontStyle: 'bold',
    });
    this.tag(skillTitle);

    {
      const y = 122;
      const name = this.add
        .text(520, y, ZH.skillNone, {
          fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
          fontSize: '13px',
          color: '#1f2d3d',
        })
        .setOrigin(0, 0.5);
      this.tag(name);
      if (save.equippedSkill === 'none') {
        const t = this.add
          .text(width - 70, y, ZH.equipped, {
            fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
            fontSize: '12px',
            color: '#27ae60',
          })
          .setOrigin(0.5);
        this.tag(t);
      } else {
        this.makeButton(width - 70, y, ZH.unequip, () => this.onEquipSkill('none'), 96, 30);
      }
    }

    SKILLS.forEach((skill, i) => {
      const owned = save.ownedSkills.includes(skill.id);
      const equipped = save.equippedSkill === skill.id;
      const y = 168 + i * 70;
      const name = this.add
        .text(520, y - 10, `${skillLabel(skill.id)} · ${skill.price}`, {
          fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
          fontSize: '13px',
          color: '#1f2d3d',
        })
        .setOrigin(0, 0.5);
      const desc = this.add
        .text(520, y + 10, skillDesc(skill.id), {
          fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
          fontSize: '11px',
          color: '#566573',
        })
        .setOrigin(0, 0.5);
      this.tag(name);
      this.tag(desc);
      if (equipped) {
        const t = this.add
          .text(width - 70, y, ZH.equipped, {
            fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
            fontSize: '12px',
            color: '#27ae60',
          })
          .setOrigin(0.5);
        this.tag(t);
      } else if (owned) {
        this.makeButton(width - 70, y, '装备', () => this.onEquipSkill(skill.id), 96, 30);
      } else {
        this.makeButton(
          width - 70,
          y,
          `${ZH.buy} ${skill.price}`,
          () => this.onBuySkill(skill.id, skill.price),
          96,
          30,
        );
      }
    });

    this.makeButton(width / 2, 510, ZH.back, () => {
      this.mode = 'main';
      this.shopMsg = '';
      this.renderMain();
    });
  }

  private onBuyOrEquipShape(id: ShapeId, price: number): void {
    const save = SaveSystem.load();
    if (save.ownedShapes.includes(id)) {
      SaveSystem.equipShape(id);
      this.shopMsg = '';
    } else {
      const result = SaveSystem.buyShape(id, price);
      this.shopMsg = result.ok ? '' : ZH.notEnoughCoins;
    }
    this.renderShop();
  }

  private onBuyOrEquipSkin(id: SkinId, price: number): void {
    const save = SaveSystem.load();
    if (save.ownedSkins.includes(id)) {
      SaveSystem.equipSkin(id);
      this.shopMsg = '';
    } else {
      const result = SaveSystem.buySkin(id, price);
      this.shopMsg = result.ok ? '' : ZH.notEnoughCoins;
    }
    this.renderShop();
  }

  private onBuySkill(id: SkillId, price: number): void {
    const result = SaveSystem.buySkill(id, price);
    this.shopMsg = result.ok ? '' : ZH.notEnoughCoins;
    this.renderShop();
  }

  private onEquipSkill(id: EquippedSkill): void {
    SaveSystem.equipSkill(id);
    this.shopMsg = '';
    this.renderShop();
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
