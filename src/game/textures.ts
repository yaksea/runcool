import Phaser from 'phaser';
import { THEME } from '../style/theme';

function ensure(scene: Phaser.Scene, key: string, draw: (g: Phaser.GameObjects.Graphics) => void, w: number, h: number) {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0 });
  draw(g);
  g.generateTexture(key, w, h);
  g.destroy();
}

/** Replace texture even if cached (hot-reload / art fixes). */
function replace(scene: Phaser.Scene, key: string, draw: (g: Phaser.GameObjects.Graphics) => void, w: number, h: number) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  ensure(scene, key, draw, w, h);
}

function drawCuteEyes(g: Phaser.GameObjects.Graphics, lx: number, rx: number, y: number, r = 3.2): void {
  g.fillStyle(0x1a1a1a, 1);
  g.fillCircle(lx, y, r);
  g.fillCircle(rx, y, r);
  g.fillStyle(0xffffff, 0.55);
  g.fillCircle(lx - 0.8, y - 1, r * 0.35);
  g.fillCircle(rx - 0.8, y - 1, r * 0.35);
}

export function generateTextures(scene: Phaser.Scene): void {
  // Shape variants (white body for tint). Keep legacy 'player' = square.
  replace(scene, 'player_square', (g) => {
    g.fillStyle(0xffffff, 1);
    g.fillRoundedRect(2, 2, 36, 36, 10);
    g.lineStyle(3, 0xcccccc, 1);
    g.strokeRoundedRect(2, 2, 36, 36, 10);
    drawCuteEyes(g, 14, 28, 16);
  }, 40, 40);

  replace(scene, 'player_round', (g) => {
    g.fillStyle(0xffffff, 1);
    g.fillCircle(20, 20, 17);
    g.lineStyle(3, 0xcccccc, 1);
    g.strokeCircle(20, 20, 17);
    drawCuteEyes(g, 14, 26, 17);
  }, 40, 40);

  replace(scene, 'player_diamond', (g) => {
    g.fillStyle(0xffffff, 1);
    g.fillPoints(
      [
        { x: 20, y: 2 },
        { x: 38, y: 20 },
        { x: 20, y: 38 },
        { x: 2, y: 20 },
      ],
      true,
    );
    g.lineStyle(3, 0xcccccc, 1);
    g.strokePoints(
      [
        { x: 20, y: 2 },
        { x: 38, y: 20 },
        { x: 20, y: 38 },
        { x: 2, y: 20 },
      ],
      true,
    );
    drawCuteEyes(g, 14, 26, 18);
  }, 40, 40);

  replace(scene, 'player_triangle', (g) => {
    g.fillStyle(0xffffff, 1);
    g.fillRoundedRect(4, 18, 32, 18, 6);
    g.fillTriangle(20, 4, 4, 22, 36, 22);
    g.lineStyle(2, 0xcccccc, 1);
    g.strokeTriangle(20, 4, 4, 22, 36, 22);
    drawCuteEyes(g, 14, 26, 24, 2.8);
  }, 40, 40);

  replace(scene, 'player_pill', (g) => {
    g.fillStyle(0xffffff, 1);
    g.fillRoundedRect(6, 2, 28, 36, 14);
    g.lineStyle(3, 0xcccccc, 1);
    g.strokeRoundedRect(6, 2, 28, 36, 14);
    drawCuteEyes(g, 15, 25, 16);
  }, 40, 40);

  replace(scene, 'player_hex', (g) => {
    const cx = 20;
    const cy = 20;
    const r = 17;
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
    }
    g.fillStyle(0xffffff, 1);
    g.fillPoints(pts, true);
    g.lineStyle(3, 0xcccccc, 1);
    g.strokePoints(pts, true);
    drawCuteEyes(g, 14, 26, 18);
  }, 40, 40);

  // Legacy key (same as square) for older call sites
  replace(scene, 'player', (g) => {
    g.fillStyle(0xffffff, 1);
    g.fillRoundedRect(2, 2, 36, 36, 10);
    g.lineStyle(3, 0xcccccc, 1);
    g.strokeRoundedRect(2, 2, 36, 36, 10);
    drawCuteEyes(g, 14, 28, 16);
  }, 40, 40);

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

  replace(
    scene,
    'cloud',
    (g) => {
      g.fillStyle(0xffffff, 0.92);
      g.fillEllipse(40, 28, 62, 30);
      g.fillEllipse(18, 32, 36, 22);
      g.fillEllipse(58, 30, 40, 24);
      g.fillEllipse(36, 18, 34, 20);
      g.fillStyle(0xeaf6ff, 0.55);
      g.fillEllipse(28, 22, 22, 12);
    },
    80,
    48,
  );

  replace(
    scene,
    'hill',
    (g) => {
      g.fillStyle(0x5aad78, 1);
      g.fillEllipse(90, 70, 180, 100);
      g.fillStyle(0x6bc48a, 1);
      g.fillEllipse(70, 62, 90, 50);
    },
    180,
    90,
  );

  // 40px 宽竖向可平铺：侧杆贴边且够粗，避免 tileSprite 裁切后变细/怪异
  replace(
    scene,
    'ladder',
    (g) => {
      const W = 40;
      const H = 48;
      const rail = 9;
      g.fillStyle(THEME.woodDark, 1);
      g.fillRect(0, 0, rail, H);
      g.fillRect(W - rail, 0, rail, H);
      // rail highlight
      g.fillStyle(0xa67c52, 1);
      g.fillRect(2, 0, 3, H);
      g.fillRect(W - rail + 2, 0, 3, H);
      // rungs
      g.fillStyle(THEME.ladder, 1);
      for (let i = 0; i < 4; i++) {
        const y = 4 + i * 12;
        g.fillRoundedRect(rail - 2, y, W - rail * 2 + 4, 7, 2);
        g.fillStyle(0xe8c49a, 0.55);
        g.fillRoundedRect(rail, y + 1, W - rail * 2, 2, 1);
        g.fillStyle(THEME.ladder, 1);
      }
    },
    40,
    48,
  );

  replace(
    scene,
    'sun',
    (g) => {
      g.fillStyle(0xffe066, 0.35);
      g.fillCircle(40, 40, 38);
      g.fillStyle(0xffd43b, 1);
      g.fillCircle(40, 40, 22);
      g.fillStyle(0xfff3bf, 0.9);
      g.fillCircle(34, 34, 8);
    },
    80,
    80,
  );

  replace(
    scene,
    'mountain',
    (g) => {
      g.fillStyle(0x7f9bb5, 1);
      g.fillTriangle(80, 10, 10, 110, 150, 110);
      g.fillStyle(0x95b0c7, 1);
      g.fillTriangle(80, 10, 55, 70, 100, 70);
      g.fillStyle(0xf8f9fa, 0.85);
      g.fillTriangle(80, 10, 68, 38, 92, 38);
    },
    160,
    112,
  );

  replace(
    scene,
    'tree',
    (g) => {
      g.fillStyle(0x8d6e4c, 1);
      g.fillRect(22, 48, 12, 36);
      g.fillStyle(0x3d8b5a, 1);
      g.fillCircle(28, 36, 26);
      g.fillStyle(0x4caf6e, 1);
      g.fillCircle(18, 42, 16);
      g.fillCircle(38, 40, 17);
      g.fillStyle(0x6fd68f, 0.7);
      g.fillCircle(24, 28, 10);
    },
    56,
    84,
  );

  replace(
    scene,
    'bush',
    (g) => {
      g.fillStyle(0x3f8f5a, 1);
      g.fillEllipse(28, 22, 48, 28);
      g.fillEllipse(14, 26, 28, 20);
      g.fillEllipse(42, 26, 30, 20);
      g.fillStyle(0x5fc97a, 0.7);
      g.fillEllipse(24, 16, 18, 12);
    },
    56,
    40,
  );

  replace(
    scene,
    'grass_tuft',
    (g) => {
      g.fillStyle(0x4caf50, 1);
      g.fillTriangle(8, 24, 4, 6, 12, 24);
      g.fillTriangle(14, 24, 12, 2, 18, 24);
      g.fillTriangle(20, 24, 18, 8, 26, 24);
      g.fillStyle(0x81c784, 1);
      g.fillTriangle(11, 24, 10, 10, 15, 24);
    },
    30,
    26,
  );

  replace(
    scene,
    'bird',
    (g) => {
      g.fillStyle(0x2c3e50, 0.8);
      g.fillTriangle(1, 11, 10, 4, 10, 8);
      g.fillTriangle(10, 4, 19, 11, 10, 8);
    },
    20,
    14,
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

  ensure(scene, 'hammer', (g) => {
    g.fillStyle(0x7f8c8d, 1);
    g.fillRoundedRect(18, 4, 10, 28, 3);
    g.fillStyle(0x566573, 1);
    g.fillRoundedRect(6, 2, 34, 14, 4);
  }, 46, 36);

  ensure(scene, 'fireball', (g) => {
    g.fillStyle(0xe67e22, 1);
    g.fillCircle(12, 12, 11);
    g.fillStyle(0xf1c40f, 1);
    g.fillCircle(12, 12, 6);
    g.fillStyle(0xffffff, 0.8);
    g.fillCircle(9, 9, 2);
  }, 24, 24);

  ensure(scene, 'shotgun', (g) => {
    g.fillStyle(0x1abc9c, 1);
    g.fillRoundedRect(2, 12, 32, 12, 3);
    g.fillCircle(10, 18, 10);
    g.fillStyle(0x148f77, 1);
    g.fillRect(30, 10, 12, 6);
    g.fillRect(30, 18, 12, 6);
  }, 44, 36);

  ensure(scene, 'pellet', (g) => {
    g.fillStyle(0x1abc9c, 1);
    g.fillCircle(5, 5, 5);
  }, 10, 10);

  ensure(scene, 'hopper', (g) => {
    g.fillStyle(0xf39c12, 1);
    g.fillEllipse(20, 22, 34, 26);
    g.fillStyle(0x1a1a1a, 1);
    g.fillCircle(12, 18, 3);
    g.fillCircle(28, 18, 3);
    g.fillStyle(0xe67e22, 1);
    g.fillTriangle(6, 30, 12, 36, 10, 28);
    g.fillTriangle(34, 30, 28, 36, 30, 28);
  }, 40, 40);

  ensure(scene, 'tank', (g) => {
    g.fillStyle(0x7d3c98, 1);
    g.fillRoundedRect(2, 8, 44, 30, 8);
    g.fillStyle(0x1a1a1a, 1);
    g.fillCircle(16, 20, 4);
    g.fillCircle(34, 20, 4);
    g.fillStyle(0x9b59b6, 1);
    g.fillRect(8, 4, 32, 8);
  }, 48, 40);

  ensure(scene, 'chaser', (g) => {
    g.fillStyle(0xe74c3c, 1);
    g.fillEllipse(18, 16, 32, 24);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(12, 14, 5);
    g.fillCircle(26, 14, 5);
    g.fillStyle(0x1a1a1a, 1);
    g.fillCircle(13, 14, 2);
    g.fillCircle(27, 14, 2);
  }, 36, 32);

  ensure(scene, 'portal', (g) => {
    g.fillStyle(0x8e44ad, 0.35);
    g.fillCircle(22, 22, 20);
    g.lineStyle(4, 0xd2b4de, 1);
    g.strokeCircle(22, 22, 18);
    g.lineStyle(3, 0xffffff, 0.7);
    g.strokeCircle(22, 22, 10);
  }, 44, 44);

  ensure(scene, 'geyser', (g) => {
    g.fillStyle(0x5dade2, 0.85);
    g.fillTriangle(20, 4, 6, 48, 34, 48);
    g.fillStyle(0xaed6f1, 0.7);
    g.fillTriangle(20, 14, 12, 48, 28, 48);
  }, 40, 52);

  ensure(scene, 'timed_platform', (g) => {
    g.fillStyle(0x5dade2, 1);
    g.fillRoundedRect(0, 8, 64, 36, 4);
    g.fillStyle(0xd6eaf8, 1);
    g.fillRoundedRect(0, 0, 64, 14, 5);
    g.fillStyle(0x2e86c1, 1);
    g.fillCircle(32, 20, 4);
  }, 64, 44);

  ensure(scene, 'bat', (g) => {
    g.fillStyle(THEME.bat, 1);
    g.fillEllipse(20, 18, 18, 14);
    g.fillStyle(0x34495e, 1);
    g.fillTriangle(4, 18, 16, 10, 16, 26);
    g.fillTriangle(36, 18, 24, 10, 24, 26);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(16, 16, 2.5);
    g.fillCircle(24, 16, 2.5);
  }, 40, 32);

  ensure(scene, 'roller', (g) => {
    g.fillStyle(THEME.roller, 1);
    g.fillCircle(18, 18, 16);
    g.fillStyle(0xf5b041, 1);
    g.fillCircle(18, 18, 8);
    g.fillStyle(0x1a1a1a, 1);
    g.fillRect(16, 4, 4, 28);
    g.fillRect(4, 16, 28, 4);
  }, 36, 36);

  ensure(scene, 'ghost', (g) => {
    g.fillStyle(THEME.ghost, 0.9);
    g.fillEllipse(18, 16, 28, 26);
    g.fillTriangle(6, 26, 12, 36, 18, 26);
    g.fillTriangle(18, 26, 24, 36, 30, 26);
    g.fillStyle(0xffffff, 0.95);
    g.fillCircle(12, 14, 4);
    g.fillCircle(24, 14, 4);
    g.fillStyle(0x1a1a1a, 1);
    g.fillCircle(13, 14, 2);
    g.fillCircle(25, 14, 2);
  }, 36, 38);

  ensure(scene, 'spitter', (g) => {
    g.fillStyle(THEME.spitter, 1);
    g.fillRoundedRect(4, 10, 32, 24, 8);
    g.fillStyle(0x1a1a1a, 1);
    g.fillCircle(14, 20, 3);
    g.fillCircle(26, 20, 3);
    g.fillStyle(0x48c9b0, 1);
    g.fillCircle(36, 20, 7);
    g.fillStyle(0xffffff, 0.7);
    g.fillCircle(34, 18, 2);
  }, 44, 36);

  ensure(scene, 'hazard_shot', (g) => {
    g.fillStyle(0xe74c3c, 1);
    g.fillCircle(6, 6, 6);
    g.fillStyle(0xf5b041, 1);
    g.fillCircle(6, 6, 3);
  }, 12, 12);

  ensure(scene, 'coin', (g) => {
    g.fillStyle(0xf1c40f, 1);
    g.fillCircle(12, 12, 11);
    g.fillStyle(0xf7dc6f, 1);
    g.fillCircle(12, 12, 7);
    g.fillStyle(0xb7950b, 1);
    g.fillRect(10, 5, 4, 14);
  }, 24, 24);

  ensure(scene, 'gate', (g) => {
    g.fillStyle(0x7f8c8d, 1);
    g.fillRoundedRect(0, 0, 48, 64, 4);
    g.fillStyle(0x566573, 1);
    g.fillRect(6, 8, 36, 48);
    g.fillStyle(0xf1c40f, 1);
    g.fillCircle(34, 32, 4);
  }, 48, 64);

  ensure(scene, 'lever_off', (g) => {
    g.fillStyle(0x5d6d7e, 1);
    g.fillRoundedRect(8, 28, 28, 10, 3);
    g.fillStyle(0xe74c3c, 1);
    g.fillRoundedRect(18, 4, 8, 28, 3);
    g.fillCircle(22, 6, 6);
  }, 44, 40);

  ensure(scene, 'lever_on', (g) => {
    g.fillStyle(0x5d6d7e, 1);
    g.fillRoundedRect(8, 28, 28, 10, 3);
    g.fillStyle(0x2ecc71, 1);
    g.fillRoundedRect(18, 4, 8, 28, 3);
    g.fillCircle(22, 6, 6);
  }, 44, 40);

  ensure(scene, 'breakable', (g) => {
    g.fillStyle(0xc68642, 1);
    g.fillRoundedRect(0, 0, 48, 48, 4);
    g.lineStyle(2, 0x8d5a2b, 1);
    g.strokeRoundedRect(2, 2, 44, 44, 3);
    g.lineBetween(4, 24, 44, 24);
    g.lineBetween(24, 4, 24, 44);
    g.fillStyle(0xe8b86d, 0.5);
    g.fillRect(6, 6, 14, 14);
  }, 48, 48);
}
