import Phaser from 'phaser';
import { ZH, shapeLabel, skinLabel, skillDesc, skillLabel, specialDesc, specialLabel, petDesc, petLabel, shieldDesc, shieldLabel, passiveDesc, passiveLabel } from '../i18n/zh';
import { THEME } from '../style/theme';
import { isTutorialLevel, LEVELS } from '../levels';
import {
  MISSILE_MAX_LEVEL,
  MISSILE_SALVO_MAX_LEVEL,
  MISSILE_SALVO_UPGRADE_PRICE,
  MISSILE_UPGRADE_PRICE,
  ORBIT_MAX_LEVEL,
  ORBIT_UPGRADE_PRICE,
  PASSIVES,
  PETS,
  SHIELDS,
  SHAPES,
  SKILLS,
  SKINS,
  SPECIALS,
  missileCooldownMs,
  missileSalvoCount,
  orbitCapacity,
  shieldsUnlocked,
  shapeById,
  skinById,
} from '../game/shopCatalog';
import {
  SaveSystem,
  type EquippedPassive,
  type EquippedPet,
  type EquippedSkill,
  type PassiveId,
  type PetId,
  type ShapeId,
  type ShieldId,
  type SkinId,
  type SkillId,
  type SpecialId,
} from '../systems/SaveSystem';
import { SoundSystem } from '../systems/SoundSystem';

type ShopTab = 'look' | 'skills' | 'specials' | 'pets' | 'passives';

export class MenuScene extends Phaser.Scene {
  private mode: 'main' | 'levels' | 'confirmClear' | 'shop' = 'main';
  private shopTab: ShopTab = 'look';
  private shopMsg = '';

  constructor() {
    super('MenuScene');
  }

  create(): void {
    this.mode = 'main';
    this.shopTab = 'look';
    this.shopMsg = '';
    this.drawBackground();
    this.renderMain();
    this.input.once('pointerdown', () => SoundSystem.unlock());
  }

  private setHeroVisible(visible: boolean): void {
    const hero = this.children.list.find(
      (c) => (c as Phaser.GameObjects.GameObject & { getData?: (k: string) => unknown }).getData?.('hero'),
    ) as Phaser.GameObjects.Image | undefined;
    if (hero) hero.setVisible(visible);
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
    this.setHeroVisible(true);
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
    this.setHeroVisible(false);
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
      const name = isTutorialLevel(level) ? ZH.tutorialLevel : ZH.level(level.index);
      const label = unlocked ? `${name} ${stars}` : `${name} ${ZH.locked}`;
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = width / 2 - 220 + col * 220;
      const y = 100 + row * 52;
      if (unlocked) {
        this.makeButton(x, y, label, () => {
          SaveSystem.startRun(level.id);
          this.scene.start('GameScene', { levelId: level.id, continueRun: false });
        }, 200, 40);
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

    this.makeButton(width / 2, 520, ZH.back, () => {
      this.mode = 'main';
      this.renderMain();
    });
  }

  private renderShop(): void {
    this.clearUi();
    this.setHeroVisible(false);
    const { width } = this.scale;
    const save = SaveSystem.load();

    this.tag(
      this.add
        .text(width / 2, 22, ZH.shop, {
          fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
          fontSize: '26px',
          color: '#1f2d3d',
          fontStyle: 'bold',
        })
        .setOrigin(0.5),
    );
    this.tag(
      this.add
        .text(width / 2, 48, `${ZH.coins}: ${save.coins}`, {
          fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
          fontSize: '15px',
          color: '#b7950b',
          fontStyle: 'bold',
        })
        .setOrigin(0.5),
    );

    if (this.shopMsg) {
      this.tag(
        this.add
          .text(width / 2, 68, this.shopMsg, {
            fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
            fontSize: '13px',
            color: '#c0392b',
          })
          .setOrigin(0.5),
      );
    }

    this.renderShopTabs(width);

    if (this.shopTab === 'look') this.renderShopLook(save);
    else if (this.shopTab === 'skills') this.renderShopSkills(save, width);
    else if (this.shopTab === 'specials') this.renderShopSpecials(save, width);
    else if (this.shopTab === 'pets') this.renderShopPets(save, width);
    else this.renderShopPassives(save, width);

    this.makeButton(width / 2, 528, ZH.back, () => {
      this.mode = 'main';
      this.shopMsg = '';
      this.setHeroVisible(true);
      this.renderMain();
    }, 160, 40);
  }

  private renderShopTabs(width: number): void {
    const tabs: { id: ShopTab; label: string }[] = [
      { id: 'look', label: ZH.shopTabLook },
      { id: 'skills', label: ZH.shopTabSkills },
      { id: 'specials', label: ZH.shopTabSpecials },
      { id: 'pets', label: ZH.shopTabPets },
      { id: 'passives', label: ZH.shopTabPassives },
    ];
    const gap = 92;
    const startX = width / 2 - ((tabs.length - 1) * gap) / 2;
    tabs.forEach((tab, i) => {
      const x = startX + i * gap;
      const active = this.shopTab === tab.id;
      const bg = this.add
        .rectangle(x, 88, 84, 32, active ? THEME.button : 0xffffff, active ? 1 : 0.85)
        .setStrokeStyle(2, THEME.playerStroke)
        .setInteractive({ useHandCursor: true });
      const text = this.add
        .text(x, 88, tab.label, {
          fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
          fontSize: '13px',
          color: active ? THEME.uiLight : '#1f2d3d',
          fontStyle: active ? 'bold' : 'normal',
        })
        .setOrigin(0.5);
      this.tag(bg);
      this.tag(text);
      bg.on('pointerdown', () => {
        this.shopTab = tab.id;
        this.shopMsg = '';
        this.renderShop();
      });
    });
  }

  private shopSectionTitle(x: number, y: number, label: string): void {
    this.tag(
      this.add.text(x, y, label, {
        fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
        fontSize: '15px',
        color: '#1f2d3d',
        fontStyle: 'bold',
      }),
    );
  }

  private shopHint(x: number, y: number, label: string, maxWidth: number): void {
    this.tag(
      this.add
        .text(x, y, label, {
          fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
          fontSize: '12px',
          color: '#566573',
          wordWrap: { width: maxWidth },
        })
        .setOrigin(0, 0),
    );
  }

  private shopStatusOrButton(
    x: number,
    y: number,
    opts: { equipped?: boolean; owned?: boolean; buyLabel?: string; onEquip?: () => void; onBuy?: () => void },
  ): void {
    if (opts.equipped) {
      this.tag(
        this.add
          .text(x, y, ZH.equipped, {
            fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
            fontSize: '13px',
            color: '#27ae60',
            fontStyle: 'bold',
          })
          .setOrigin(0.5),
      );
      return;
    }
    if (opts.owned && opts.onEquip) {
      this.makeButton(x, y, '装备', opts.onEquip, 84, 28);
      return;
    }
    if (opts.onBuy && opts.buyLabel) {
      this.makeButton(x, y, opts.buyLabel, opts.onBuy, 84, 28);
    }
  }

  private renderShopLook(save: ReturnType<typeof SaveSystem.load>): void {
    this.shopHint(40, 112, ZH.shopLookHint, 880);

    // 左：形状
    this.shopSectionTitle(40, 138, ZH.shopShapes);
    SHAPES.forEach((shape, i) => {
      const owned = save.ownedShapes.includes(shape.id);
      const equipped = save.equippedShape === shape.id;
      const y = 172 + i * 42;
      this.tag(
        this.add
          .image(56, y, shape.texture)
          .setScale(0.62)
          .setTint(skinById(save.equippedSkin).tint),
      );
      this.tag(
        this.add
          .text(78, y, `${shapeLabel(shape.id)}${shape.price > 0 ? `  ${shape.price}` : ''}`, {
            fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
            fontSize: '13px',
            color: '#1f2d3d',
          })
          .setOrigin(0, 0.5),
      );
      this.shopStatusOrButton(250, y, {
        equipped,
        owned,
        buyLabel: `${ZH.buy} ${shape.price}`,
        onEquip: () => this.onBuyOrEquipShape(shape.id, shape.price),
        onBuy: () => this.onBuyOrEquipShape(shape.id, shape.price),
      });
    });

    // 右：颜色
    this.shopSectionTitle(360, 138, ZH.shopColors);
    SKINS.forEach((skin, i) => {
      const owned = save.ownedSkins.includes(skin.id);
      const equipped = save.equippedSkin === skin.id;
      const y = 172 + i * 48;
      this.tag(this.add.rectangle(380, y, 22, 22, skin.tint).setStrokeStyle(2, 0x333333));
      this.tag(
        this.add
          .text(400, y, `${skinLabel(skin.id)}${skin.price > 0 ? `  ${skin.price}` : ''}`, {
            fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
            fontSize: '13px',
            color: '#1f2d3d',
          })
          .setOrigin(0, 0.5),
      );
      this.shopStatusOrButton(580, y, {
        equipped,
        owned,
        buyLabel: `${ZH.buy} ${skin.price}`,
        onEquip: () => this.onBuyOrEquipSkin(skin.id, skin.price),
        onBuy: () => this.onBuyOrEquipSkin(skin.id, skin.price),
      });
    });
  }

  private renderShopSkills(save: ReturnType<typeof SaveSystem.load>, width: number): void {
    this.shopSectionTitle(40, 118, ZH.shopSkills);
    this.shopHint(40, 140, ZH.shopSkillsHint, 880);

    const btnX = width - 90;
    const textW = btnX - 160;

    // 空手 / 卸下
    {
      const y = 178;
      this.tag(
        this.add
          .text(56, y, ZH.skillNone, {
            fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
            fontSize: '14px',
            color: '#1f2d3d',
          })
          .setOrigin(0, 0.5),
      );
      if (save.equippedSkill === 'none') {
        this.tag(
          this.add
            .text(btnX, y, ZH.equipped, {
              fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
              fontSize: '13px',
              color: '#27ae60',
              fontStyle: 'bold',
            })
            .setOrigin(0.5),
        );
      } else {
        this.makeButton(btnX, y, ZH.unequip, () => this.onEquipSkill('none'), 88, 30);
      }
    }

    SKILLS.forEach((skill, i) => {
      const owned = save.ownedSkills.includes(skill.id);
      const equipped = save.equippedSkill === skill.id;
      const y = 230 + i * 70;
      this.tag(
        this.add
          .text(56, y - 12, `${skillLabel(skill.id)} · ${skill.price}`, {
            fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
            fontSize: '14px',
            color: '#1f2d3d',
            fontStyle: 'bold',
          })
          .setOrigin(0, 0.5),
      );
      this.tag(
        this.add
          .text(56, y + 12, skillDesc(skill.id), {
            fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
            fontSize: '12px',
            color: '#566573',
            wordWrap: { width: textW },
          })
          .setOrigin(0, 0.5),
      );
      this.shopStatusOrButton(btnX, y, {
        equipped,
        owned,
        buyLabel: `${ZH.buy} ${skill.price}`,
        onEquip: () => this.onEquipSkill(skill.id),
        onBuy: () => this.onBuySkill(skill.id, skill.price),
      });
    });
  }

  private renderShopSpecials(save: ReturnType<typeof SaveSystem.load>, width: number): void {
    this.shopSectionTitle(40, 110, ZH.shopSpecials);
    this.shopHint(40, 128, ZH.shopSpecialsHint, 880);

    const btnX = width - 90;
    const textW = width - 220;

    SPECIALS.forEach((spec, i) => {
      const owned = save.ownedSpecials.includes(spec.id);
      const equipped = save.equippedSpecials.includes(spec.id);
      const blockTop = 152 + i * 118;

      let title = `${specialLabel(spec.id)} · ${spec.price}`;
      if (owned && spec.id === 'missile') {
        title = `${specialLabel(spec.id)}  CD ${save.missileLevel}/${MISSILE_MAX_LEVEL}  齐射 ${save.missileSalvoLevel}/${MISSILE_SALVO_MAX_LEVEL}`;
      } else if (owned && spec.id === 'orbit') {
        title = `${specialLabel(spec.id)}  存储 ${save.orbitLevel}/${ORBIT_MAX_LEVEL}`;
      }

      this.tag(
        this.add
          .text(56, blockTop, title, {
            fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
            fontSize: '14px',
            color: '#1f2d3d',
            fontStyle: 'bold',
          })
          .setOrigin(0, 0),
      );

      let detail = specialDesc(spec.id);
      if (owned && spec.id === 'missile') {
        detail = ZH.specialMissileLv(
          save.missileLevel,
          MISSILE_MAX_LEVEL,
          (missileCooldownMs(save.missileLevel) / 1000).toFixed(1),
          save.missileSalvoLevel,
          MISSILE_SALVO_MAX_LEVEL,
          missileSalvoCount(save.missileSalvoLevel),
        );
      } else if (owned && spec.id === 'orbit') {
        detail = ZH.specialOrbitLv(save.orbitLevel, ORBIT_MAX_LEVEL, orbitCapacity(save.orbitLevel));
      }

      this.tag(
        this.add
          .text(56, blockTop + 22, detail, {
            fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
            fontSize: '12px',
            color: '#566573',
            lineSpacing: 4,
            wordWrap: { width: textW },
          })
          .setOrigin(0, 0),
      );

      if (!owned) {
        this.makeButton(btnX, blockTop + 28, `${ZH.buy} ${spec.price}`, () => {
          this.onBuySpecial(spec.id, spec.price);
        }, 96, 28);
        return;
      }

      if (equipped) {
        this.makeButton(btnX, blockTop + 4, ZH.unequip, () => this.onUnequipSpecial(spec.id), 96, 26);
      } else {
        this.makeButton(btnX, blockTop + 4, '装备', () => this.onEquipSpecial(spec.id), 96, 26);
      }

      if (spec.id === 'missile') {
        if (save.missileLevel >= MISSILE_MAX_LEVEL) {
          this.tag(
            this.add
              .text(btnX, blockTop + 40, `冷却 ${ZH.specialMaxLevel}`, {
                fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
                fontSize: '11px',
                color: '#27ae60',
              })
              .setOrigin(0.5),
          );
        } else {
          this.makeButton(
            btnX,
            blockTop + 40,
            ZH.specialUpgradeCd(MISSILE_UPGRADE_PRICE),
            () => this.onUpgradeMissile(),
            96,
            24,
          );
        }
        if (save.missileSalvoLevel >= MISSILE_SALVO_MAX_LEVEL) {
          this.tag(
            this.add
              .text(btnX, blockTop + 70, `齐射 ${ZH.specialMaxLevel}`, {
                fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
                fontSize: '11px',
                color: '#27ae60',
              })
              .setOrigin(0.5),
          );
        } else {
          this.makeButton(
            btnX,
            blockTop + 70,
            ZH.specialUpgradeSalvo(MISSILE_SALVO_UPGRADE_PRICE),
            () => this.onUpgradeMissileSalvo(),
            96,
            24,
          );
        }
      } else if (spec.id === 'orbit') {
        if (save.orbitLevel >= ORBIT_MAX_LEVEL) {
          this.tag(
            this.add
              .text(btnX, blockTop + 40, `存储 ${ZH.specialMaxLevel}`, {
                fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
                fontSize: '11px',
                color: '#27ae60',
              })
              .setOrigin(0.5),
          );
        } else {
          this.makeButton(
            btnX,
            blockTop + 40,
            ZH.specialUpgradeOrbit(ORBIT_UPGRADE_PRICE),
            () => this.onUpgradeOrbit(),
            96,
            24,
          );
        }
      }
    });

    // Shields — independent of orbit missiles.
    const shieldTop = 400;
    const unlocked = shieldsUnlocked(save);
    this.shopSectionTitle(40, shieldTop, ZH.shopShields);
    if (!unlocked) {
      this.shopHint(40, shieldTop + 22, ZH.shopShieldsLocked, 880);
      return;
    }

    SHIELDS.forEach((shield, i) => {
      const y = shieldTop + 48 + i * 36;
      const equipped = save.equippedShields.includes(shield.id);
      this.tag(
        this.add
          .text(56, y, `${shieldLabel(shield.id)} · ${shieldDesc(shield.id)}`, {
            fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
            fontSize: '13px',
            color: '#1f2d3d',
          })
          .setOrigin(0, 0.5),
      );
      if (equipped) {
        this.makeButton(btnX, y, ZH.unequip, () => this.onUnequipShield(shield.id), 88, 28);
      } else {
        this.makeButton(btnX, y, '装备', () => this.onEquipShield(shield.id), 88, 28);
      }
    });
  }

  private renderShopPets(save: ReturnType<typeof SaveSystem.load>, width: number): void {
    this.shopSectionTitle(40, 118, ZH.shopPets);
    this.shopHint(40, 140, ZH.shopPetsHint, 880);

    const btnX = width - 90;
    const textW = btnX - 160;

    {
      const y = 178;
      this.tag(
        this.add
          .text(56, y, ZH.petNone, {
            fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
            fontSize: '14px',
            color: '#1f2d3d',
          })
          .setOrigin(0, 0.5),
      );
      if (save.equippedPet === 'none') {
        this.tag(
          this.add
            .text(btnX, y, ZH.equipped, {
              fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
              fontSize: '13px',
              color: '#27ae60',
              fontStyle: 'bold',
            })
            .setOrigin(0.5),
        );
      } else {
        this.makeButton(btnX, y, ZH.unequip, () => this.onEquipPet('none'), 88, 30);
      }
    }

    PETS.forEach((pet, i) => {
      const owned = save.ownedPets.includes(pet.id);
      const equipped = save.equippedPet === pet.id;
      const y = 230 + i * 70;
      this.tag(
        this.add
          .text(56, y - 12, `${petLabel(pet.id)} · ${pet.price}`, {
            fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
            fontSize: '14px',
            color: '#1f2d3d',
            fontStyle: 'bold',
          })
          .setOrigin(0, 0.5),
      );
      this.tag(
        this.add
          .text(56, y + 12, petDesc(pet.id), {
            fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
            fontSize: '12px',
            color: '#566573',
            wordWrap: { width: textW },
          })
          .setOrigin(0, 0.5),
      );
      this.shopStatusOrButton(btnX, y, {
        equipped,
        owned,
        buyLabel: `${ZH.buy} ${pet.price}`,
        onEquip: () => this.onEquipPet(pet.id),
        onBuy: () => this.onBuyPet(pet.id, pet.price),
      });
    });
  }

  private renderShopPassives(save: ReturnType<typeof SaveSystem.load>, width: number): void {
    this.shopSectionTitle(40, 118, ZH.shopPassives);
    this.shopHint(40, 140, ZH.shopPassivesHint, 880);

    const btnX = width - 90;
    const textW = btnX - 160;

    {
      const y = 190;
      this.tag(
        this.add
          .text(56, y, ZH.passiveNone, {
            fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
            fontSize: '14px',
            color: '#1f2d3d',
          })
          .setOrigin(0, 0.5),
      );
      if (save.equippedPassive === 'none') {
        this.tag(
          this.add
            .text(btnX, y, ZH.equipped, {
              fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
              fontSize: '13px',
              color: '#27ae60',
              fontStyle: 'bold',
            })
            .setOrigin(0.5),
        );
      } else {
        this.makeButton(btnX, y, ZH.unequip, () => this.onEquipPassive('none'), 88, 30);
      }
    }

    PASSIVES.forEach((passive, i) => {
      const owned = save.ownedPassives.includes(passive.id);
      const equipped = save.equippedPassive === passive.id;
      const y = 248 + i * 96;
      this.tag(
        this.add
          .text(56, y - 14, `${passiveLabel(passive.id)} · ${passive.price}`, {
            fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
            fontSize: '15px',
            color: '#1f2d3d',
            fontStyle: 'bold',
          })
          .setOrigin(0, 0.5),
      );
      this.tag(
        this.add
          .text(56, y + 14, passiveDesc(passive.id), {
            fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
            fontSize: '12px',
            color: '#566573',
            wordWrap: { width: textW },
          })
          .setOrigin(0, 0.5),
      );
      this.shopStatusOrButton(btnX, y, {
        equipped,
        owned,
        buyLabel: `${ZH.buy} ${passive.price}`,
        onEquip: () => this.onEquipPassive(passive.id),
        onBuy: () => this.onBuyPassive(passive.id, passive.price),
      });
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

  private onBuyPet(id: PetId, price: number): void {
    const result = SaveSystem.buyPet(id, price);
    this.shopMsg = result.ok ? '' : ZH.notEnoughCoins;
    this.renderShop();
  }

  private onEquipPet(id: EquippedPet): void {
    SaveSystem.equipPet(id);
    this.shopMsg = '';
    this.renderShop();
  }

  private onBuyPassive(id: PassiveId, price: number): void {
    const result = SaveSystem.buyPassive(id, price);
    this.shopMsg = result.ok ? '' : ZH.notEnoughCoins;
    this.renderShop();
  }

  private onEquipPassive(id: EquippedPassive): void {
    SaveSystem.equipPassive(id);
    this.shopMsg = '';
    this.renderShop();
  }

  private onBuySpecial(id: SpecialId, price: number): void {
    const result = SaveSystem.buySpecial(id, price);
    this.shopMsg = result.ok ? '' : ZH.notEnoughCoins;
    this.renderShop();
  }

  private onEquipSpecial(id: SpecialId): void {
    SaveSystem.equipSpecial(id);
    this.shopMsg = '';
    this.renderShop();
  }

  private onUnequipSpecial(id: SpecialId): void {
    SaveSystem.unequipSpecial(id);
    this.shopMsg = '';
    this.renderShop();
  }

  private onEquipShield(id: ShieldId): void {
    SaveSystem.equipShield(id);
    this.shopMsg = '';
    this.renderShop();
  }

  private onUnequipShield(id: ShieldId): void {
    SaveSystem.unequipShield(id);
    this.shopMsg = '';
    this.renderShop();
  }

  private onUpgradeMissile(): void {
    const result = SaveSystem.upgradeMissile(MISSILE_UPGRADE_PRICE);
    if (result.ok) {
      this.shopMsg = '';
    } else if (result.reason === 'coins') {
      this.shopMsg = ZH.notEnoughCoins;
    } else if (result.reason === 'max') {
      this.shopMsg = ZH.specialMaxLevel;
    } else {
      this.shopMsg = '';
    }
    this.renderShop();
  }

  private onUpgradeMissileSalvo(): void {
    const result = SaveSystem.upgradeMissileSalvo(MISSILE_SALVO_UPGRADE_PRICE);
    if (result.ok) {
      this.shopMsg = '';
    } else if (result.reason === 'coins') {
      this.shopMsg = ZH.notEnoughCoins;
    } else if (result.reason === 'max') {
      this.shopMsg = ZH.specialMaxLevel;
    } else {
      this.shopMsg = '';
    }
    this.renderShop();
  }

  private onUpgradeOrbit(): void {
    const result = SaveSystem.upgradeOrbit(ORBIT_UPGRADE_PRICE);
    if (result.ok) {
      this.shopMsg = '';
    } else if (result.reason === 'coins') {
      this.shopMsg = ZH.notEnoughCoins;
    } else if (result.reason === 'max') {
      this.shopMsg = ZH.specialMaxLevel;
    } else {
      this.shopMsg = '';
    }
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
