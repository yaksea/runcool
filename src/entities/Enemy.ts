import Phaser from 'phaser';
import type { EnemyDef } from '../levels/types';
import type { Player } from './Player';

function hpFor(type: EnemyDef['type']): number {
  switch (type) {
    case 'tank':
      return 4;
    case 'spikeball':
    case 'hopper':
    case 'chaser':
      return 2;
    default:
      return 1;
  }
}

export class Enemy {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  readonly type: EnemyDef['type'];
  readonly afterCheckpoint: number;
  hp: number;
  dead = false;
  private readonly originX: number;
  private readonly patrol: number;
  private dir = 1;
  private readonly baseY: number;
  private hopCooldown = 0;

  constructor(scene: Phaser.Scene, def: EnemyDef) {
    this.type = def.type;
    this.afterCheckpoint = def.afterCheckpoint ?? -1;
    this.originX = def.x;
    this.patrol = def.patrol;
    this.baseY = def.y;
    this.hp = hpFor(def.type);

    this.sprite = scene.physics.add.sprite(def.x, def.y, def.type);
    this.sprite.setDepth(8);
    this.sprite.setData('enemy', this);

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    if (def.type === 'floater') {
      body.setAllowGravity(false);
      body.setSize(28, 20);
    } else if (def.type === 'spikeball') {
      body.setAllowGravity(true);
      body.setSize(26, 26);
    } else if (def.type === 'tank') {
      body.setAllowGravity(true);
      body.setSize(34, 30);
      body.setOffset(4, 6);
    } else {
      body.setAllowGravity(true);
      body.setSize(30, 26);
      body.setOffset(5, 8);
    }
  }

  get lethalOnTouch(): boolean {
    return this.type === 'spikeball';
  }

  update(player?: Player): void {
    if (this.dead || !this.sprite.active) return;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;

    if (this.type === 'floater') {
      this.sprite.y = this.baseY + Math.sin(this.sprite.scene.time.now / 280) * 8;
      this.sprite.x += this.dir * 0.75;
      if (this.sprite.x > this.originX + this.patrol) this.dir = -1;
      if (this.sprite.x < this.originX - this.patrol) this.dir = 1;
      this.sprite.setFlipX(this.dir < 0);
      return;
    }

    if (this.type === 'chaser' && player && !player.climbing) {
      const dx = player.sprite.x - this.sprite.x;
      if (Math.abs(dx) < 280) this.dir = dx >= 0 ? 1 : -1;
    }

    if (this.type === 'hopper') {
      this.hopCooldown -= 16;
      const onGround = body.blocked.down || body.touching.down;
      if (onGround && this.hopCooldown <= 0) {
        body.setVelocityY(-420);
        this.hopCooldown = 900;
      }
      body.setVelocityX(this.dir * 70);
    } else {
      const speed = this.type === 'tank' ? 28 : this.type === 'spikeball' ? 55 : this.type === 'chaser' ? 95 : 42;
      body.setVelocityX(this.dir * speed);
    }

    if (this.sprite.x > this.originX + this.patrol) this.dir = -1;
    if (this.sprite.x < this.originX - this.patrol) this.dir = 1;
    this.sprite.setFlipX(this.dir < 0);

    if (this.type === 'spikeball') {
      this.sprite.rotation += this.dir * 0.04;
    }
  }

  takeHit(damage: number, knockDir: number): boolean {
    if (this.dead || !this.sprite.active) return false;

    this.hp -= damage;
    this.sprite.setVelocityX(knockDir * 200);
    this.sprite.setTint(0xffffff);
    this.sprite.scene.time.delayedCall(80, () => {
      if (!this.dead && this.sprite.active) this.sprite.clearTint();
    });

    if (this.hp <= 0) {
      this.die();
      return true;
    }
    return false;
  }

  private die(): void {
    if (this.dead) return;
    this.dead = true;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body | null;
    if (body) {
      body.enable = false;
      body.stop();
    }
    const scene = this.sprite.scene;
    scene.tweens.add({
      targets: this.sprite,
      scaleX: 0.1,
      scaleY: 0.1,
      alpha: 0,
      duration: 180,
      onComplete: () => {
        if (this.sprite.active) this.sprite.destroy();
      },
    });
  }

  destroy(): void {
    this.dead = true;
    this.sprite.destroy();
  }
}
