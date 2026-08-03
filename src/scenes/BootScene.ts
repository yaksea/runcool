import Phaser from 'phaser';
import { generateTextures } from '../game/textures';
import { ZH } from '../i18n/zh';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create(): void {
    generateTextures(this);
    const { width, height } = this.scale;
    this.add
      .text(width / 2, height / 2, ZH.title, {
        fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
        fontSize: '42px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    this.time.delayedCall(350, () => this.scene.start('MenuScene'));
  }
}
