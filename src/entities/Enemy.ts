import Phaser from 'phaser';
import type { EnemyDef } from '../levels/types';

export class Enemy {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  readonly type: EnemyDef['type'];
  readonly afterCheckpoint: number;
  hp: number;
  private readonly originX: number;
  private readonly patrol: number;
  private dir = 1;
  private readonly baseY: number;

  constructor(scene: Phaser.Scene, def: EnemyDef) {
    this.type = def.type;
    this.afterCheckpoint = def.afterCheckpoint ?? -1;
    this.originX = def.x;
    this.patrol = def.patrol;
    this.baseY = def.y;
    this.hp = def.type === 'spikeball' ? 2 : 1;

    const key = def.type;
    this.sprite = scene.physics.add.sprite(def.x, def.y, key);
    this.sprite.setDepth(8);
    this.sprite.setData('enemy', this);

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    if (def.type === 'floater') {
      body.setAllowGravity(false);
      body.setSize(28, 20);
    } else if (def.type === 'spikeball') {
      body.setAllowGravity(true);
      body.setSize(26, 26);
      body.setBounce(0, 0);
    } else {
      body.setAllowGravity(true);
      body.setSize(30, 26);
      body.setOffset(5, 8);
    }
  }

  get lethalOnTouch(): boolean {
    return this.type === 'spikeball';
  }

  update(): void {
    if (!this.sprite.active) return;

    if (this.type === 'floater') {
      this.sprite.y = this.baseY + Math.sin(this.sprite.scene.time.now / 280) * 8;
      this.sprite.x += this.dir * 0.7;
      if (this.sprite.x > this.originX + this.patrol) this.dir = -1;
      if (this.sprite.x < this.originX - this.patrol) this.dir = 1;
      this.sprite.setFlipX(this.dir < 0);
      return;
    }

    const speed = this.type === 'spikeball' ? 55 : 40;
    this.sprite.setVelocityX(this.dir * speed);
    if (this.sprite.x > this.originX + this.patrol) this.dir = -1;
    if (this.sprite.x < this.originX - this.patrol) this.dir = 1;
    this.sprite.setFlipX(this.dir < 0);

    if (this.type === 'spikeball') {
      this.sprite.rotation += this.dir * 0.04;
    }
  }

  takeHit(damage: number, knockDir: number): boolean {
    this.hp -= damage;
    this.sprite.setVelocityX(knockDir * 180);
    this.sprite.setTintFill(0xffffff);
    this.sprite.scene.time.delayedCall(80, () => {
      if (this.sprite.active) this.sprite.clearTint();
    });
    if (this.hp <= 0) {
      this.die();
      return true;
    }
    return false;
  }

  private die(): void {
    const scene = this.sprite.scene;
    scene.tweens.add({
      targets: this.sprite,
      scaleX: 0.1,
      scaleY: 0.1,
      alpha: 0,
      duration: 180,
      onComplete: () => this.sprite.destroy(),
    });
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
