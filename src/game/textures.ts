import Phaser from 'phaser';
import { THEME } from '../style/theme';

function ensure(scene: Phaser.Scene, key: string, draw: (g: Phaser.GameObjects.Graphics) => void, w: number, h: number) {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0 });
  draw(g);
  g.generateTexture(key, w, h);
  g.destroy();
}

export function generateTextures(scene: Phaser.Scene): void {
  ensure(
    scene,
    'player',
    (g) => {
      g.fillStyle(THEME.player, 1);
      g.fillRoundedRect(2, 2, 36, 36, 10);
      g.lineStyle(3, THEME.playerStroke, 1);
      g.strokeRoundedRect(2, 2, 36, 36, 10);
      g.fillStyle(0x1a1a1a, 1);
      g.fillCircle(14, 16, 3.5);
      g.fillCircle(28, 16, 3.5);
      g.fillStyle(0xffffff, 0.35);
      g.fillRoundedRect(8, 6, 12, 8, 4);
    },
    40,
    40,
  );

  ensure(
    scene,
    'platform',
    (g) => {
      g.fillStyle(THEME.dirt, 1);
      g.fillRoundedRect(0, 8, 64, 56, 6);
      g.fillStyle(THEME.grass, 1);
      g.fillRoundedRect(0, 0, 64, 16, 8);
    },
    64,
    64,
  );

  ensure(
    scene,
    'spike',
    (g) => {
      g.fillStyle(THEME.spike, 1);
      g.fillTriangle(12, 2, 2, 26, 22, 26);
      g.fillStyle(0xb03a2e, 1);
      g.fillTriangle(12, 8, 6, 26, 18, 26);
    },
    24,
    28,
  );

  ensure(
    scene,
    'pad',
    (g) => {
      g.fillStyle(THEME.pad, 1);
      g.fillRoundedRect(0, 8, 48, 16, 8);
      g.fillStyle(0xfff3a1, 1);
      g.fillRoundedRect(6, 4, 36, 10, 6);
    },
    48,
    24,
  );

  ensure(
    scene,
    'checkpoint',
    (g) => {
      g.fillStyle(0x7f8c8d, 1);
      g.fillRect(10, 8, 6, 40);
      g.fillStyle(THEME.checkpointOff, 1);
      g.fillTriangle(16, 8, 40, 18, 16, 28);
    },
    44,
    48,
  );

  ensure(
    scene,
    'checkpoint_on',
    (g) => {
      g.fillStyle(0x7f8c8d, 1);
      g.fillRect(10, 8, 6, 40);
      g.fillStyle(THEME.checkpointOn, 1);
      g.fillTriangle(16, 8, 40, 18, 16, 28);
    },
    44,
    48,
  );

  ensure(
    scene,
    'finish',
    (g) => {
      g.fillStyle(0x566573, 1);
      g.fillRect(8, 0, 6, 56);
      g.fillStyle(THEME.finish, 1);
      g.fillTriangle(14, 4, 48, 18, 14, 32);
      g.fillStyle(0xffffff, 1);
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 2; j++) {
          if ((i + j) % 2 === 0) g.fillRect(18 + i * 8, 10 + j * 8, 8, 8);
        }
      }
    },
    52,
    56,
  );

  ensure(
    scene,
    'slime',
    (g) => {
      g.fillStyle(THEME.slime, 1);
      g.fillEllipse(20, 22, 36, 28);
      g.fillStyle(0x27ae60, 1);
      g.fillEllipse(20, 28, 28, 12);
      g.fillStyle(0x1a1a1a, 1);
      g.fillCircle(12, 18, 3);
      g.fillCircle(28, 18, 3);
    },
    40,
    36,
  );

  ensure(
    scene,
    'spikeball',
    (g) => {
      g.fillStyle(THEME.spikeball, 1);
      g.fillCircle(18, 18, 14);
      g.fillStyle(0x5b2c6f, 1);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const x = 18 + Math.cos(a) * 16;
        const y = 18 + Math.sin(a) * 16;
        g.fillTriangle(18, 18, x + Math.cos(a + 0.3) * 4, y + Math.sin(a + 0.3) * 4, x, y);
      }
    },
    36,
    36,
  );

  ensure(
    scene,
    'floater',
    (g) => {
      g.fillStyle(THEME.floater, 1);
      g.fillEllipse(18, 16, 28, 20);
      g.fillStyle(0x1a1a1a, 1);
      g.fillCircle(12, 14, 3);
      g.fillCircle(24, 14, 3);
      g.fillStyle(0x85c1e9, 0.8);
      g.fillTriangle(4, 16, 0, 10, 0, 22);
      g.fillTriangle(32, 16, 36, 10, 36, 22);
    },
    36,
    28,
  );

  ensure(
    scene,
    'glove',
    (g) => {
      g.fillStyle(THEME.glove, 1);
      g.fillRoundedRect(4, 6, 28, 24, 8);
      g.fillStyle(0xffc093, 1);
      g.fillRoundedRect(8, 10, 12, 16, 4);
    },
    36,
    36,
  );

  ensure(
    scene,
    'peashooter',
    (g) => {
      g.fillStyle(THEME.peashooter, 1);
      g.fillRoundedRect(2, 12, 28, 12, 4);
      g.fillCircle(8, 18, 10);
      g.fillStyle(0x2e86c1, 1);
      g.fillRect(28, 14, 10, 8);
    },
    40,
    36,
  );

  ensure(
    scene,
    'pea',
    (g) => {
      g.fillStyle(0x58d68d, 1);
      g.fillCircle(6, 6, 6);
    },
    12,
    12,
  );

  ensure(
    scene,
    'cloud',
    (g) => {
      g.fillStyle(0xffffff, 0.85);
      g.fillEllipse(30, 22, 50, 24);
      g.fillEllipse(16, 26, 28, 18);
      g.fillEllipse(46, 26, 30, 18);
    },
    64,
    40,
  );

  ensure(
    scene,
    'hill',
    (g) => {
      g.fillStyle(0x6bbf8a, 0.55);
      g.fillEllipse(80, 60, 160, 80);
    },
    160,
    80,
  );

  ensure(
    scene,
    'ladder',
    (g) => {
      g.fillStyle(THEME.woodDark, 1);
      g.fillRect(4, 0, 6, 64);
      g.fillRect(34, 0, 6, 64);
      g.fillStyle(THEME.ladder, 1);
      for (let i = 0; i < 5; i++) {
        g.fillRoundedRect(4, 6 + i * 12, 36, 5, 2);
      }
    },
    44,
    64,
  );

  ensure(
    scene,
    'seesaw_plank',
    (g) => {
      g.fillStyle(THEME.wood, 1);
      g.fillRoundedRect(0, 4, 128, 14, 5);
      g.fillStyle(THEME.woodDark, 1);
      g.fillRect(0, 14, 128, 4);
      g.fillStyle(0xe8b86d, 0.5);
      g.fillRoundedRect(8, 6, 40, 6, 3);
    },
    128,
    22,
  );

  ensure(
    scene,
    'seesaw_fulcrum',
    (g) => {
      g.fillStyle(THEME.woodDark, 1);
      g.fillTriangle(20, 4, 4, 28, 36, 28);
      g.fillStyle(THEME.dirt, 1);
      g.fillRect(8, 24, 24, 8);
    },
    40,
    32,
  );

  ensure(
    scene,
    'conveyor',
    (g) => {
      g.fillStyle(0x5d6d7e, 1);
      g.fillRoundedRect(0, 8, 64, 40, 4);
      g.fillStyle(0xf5b041, 1);
      g.fillRoundedRect(0, 0, 64, 14, 4);
      g.fillStyle(0xd68910, 1);
      for (let i = 0; i < 4; i++) g.fillTriangle(8 + i * 14, 3, 8 + i * 14, 11, 18 + i * 14, 7);
    },
    64,
    48,
  );

  ensure(
    scene,
    'fan',
    (g) => {
      g.fillStyle(0x85929e, 1);
      g.fillRoundedRect(8, 28, 40, 12, 4);
      g.fillStyle(0x5dade2, 1);
      g.fillCircle(28, 20, 16);
      g.fillStyle(0xffffff, 0.85);
      g.fillTriangle(28, 20, 28, 6, 40, 20);
      g.fillTriangle(28, 20, 28, 34, 16, 20);
    },
    56,
    40,
  );

  ensure(
    scene,
    'gust',
    (g) => {
      g.fillStyle(0xaed6f1, 0.9);
      g.fillEllipse(12, 8, 20, 10);
    },
    24,
    16,
  );

  ensure(
    scene,
    'crumble',
    (g) => {
      g.fillStyle(0xb9770e, 1);
      g.fillRoundedRect(0, 8, 64, 40, 4);
      g.fillStyle(0xd4ac0d, 1);
      g.fillRoundedRect(0, 0, 64, 14, 5);
      g.lineStyle(2, 0x6e2c00, 0.6);
      g.lineBetween(12, 4, 20, 20);
      g.lineBetween(36, 2, 44, 22);
      g.lineBetween(50, 8, 58, 24);
    },
    64,
    48,
  );

  ensure(
    scene,
    'bumper',
    (g) => {
      g.fillStyle(0xe74c3c, 1);
      g.fillRoundedRect(4, 8, 28, 36, 10);
      g.fillStyle(0xf5b7b1, 1);
      g.fillRoundedRect(10, 14, 10, 24, 5);
      g.fillStyle(0xffffff, 0.7);
      g.fillCircle(30, 26, 6);
    },
    40,
    52,
  );
}
