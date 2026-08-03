import Phaser from 'phaser';
import { THEME, PHYSICS } from '../style/theme';
import { BootScene } from '../scenes/BootScene';
import { MenuScene } from '../scenes/MenuScene';
import { GameScene } from '../scenes/GameScene';
import { UIScene } from '../scenes/UIScene';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  width: THEME.width,
  height: THEME.height,
  backgroundColor: THEME.skyTop,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: PHYSICS.gravityY },
      debug: false,
    },
  },
  scene: [BootScene, MenuScene, GameScene, UIScene],
};
