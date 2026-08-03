import Phaser from 'phaser';
import { PHYSICS } from '../style/theme';
import type { WeaponType } from '../systems/SaveSystem';

export class Player {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  facing = 1;
  weapon: WeaponType = 'none';
  private jumpsUsed = 0;
  private wasOnGround = false;
  private coyoteUntil = 0;
  private jumpBufferUntil = 0;
  private invincibleUntil = 0;
  private attackCooldownUntil = 0;
  private squashTween?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.sprite = scene.physics.add.sprite(x, y, 'player');
    this.sprite.setCollideWorldBounds(false);
    this.sprite.setMaxVelocity(400, 900);
    this.sprite.setDragX(1200);
    this.sprite.setDepth(10);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(28, 32);
    body.setOffset(6, 6);
  }

  setWeapon(weapon: WeaponType): void {
    this.weapon = weapon;
  }

  isInvincible(now: number): boolean {
    return now < this.invincibleUntil;
  }

  makeInvincible(now: number, ms: number = PHYSICS.invincibleMs): void {
    this.invincibleUntil = now + ms;
    this.sprite.setAlpha(0.55);
  }

  clearInvincibleVisual(): void {
    if (!this.isInvincible(this.sprite.scene.time.now)) {
      this.sprite.setAlpha(1);
    }
  }

  canAttack(now: number): boolean {
    return now >= this.attackCooldownUntil;
  }

  markAttack(now: number): void {
    this.attackCooldownUntil = now + PHYSICS.attackCooldownMs;
  }

  update(
    cursors: Phaser.Types.Input.Keyboard.CursorKeys,
    keys: {
      a: Phaser.Input.Keyboard.Key;
      d: Phaser.Input.Keyboard.Key;
      w: Phaser.Input.Keyboard.Key;
      space: Phaser.Input.Keyboard.Key;
    },
  ): void {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const now = this.sprite.scene.time.now;
    const onGround = body.blocked.down || body.touching.down;

    if (onGround) {
      if (!this.wasOnGround) {
        this.jumpsUsed = 0;
        this.playLandSquash();
      }
      this.coyoteUntil = now + PHYSICS.coyoteMs;
    } else if (this.wasOnGround) {
      // Just left the ground: keep coyote window if we didn't already jump.
      if (this.jumpsUsed === 0) {
        this.coyoteUntil = now + PHYSICS.coyoteMs;
      }
    }
    this.wasOnGround = onGround;

    const left = cursors.left.isDown || keys.a.isDown;
    const right = cursors.right.isDown || keys.d.isDown;
    const speed = onGround ? PHYSICS.moveSpeed : PHYSICS.airMoveSpeed;

    if (left) {
      this.sprite.setVelocityX(-speed);
      this.facing = -1;
      this.sprite.setFlipX(true);
    } else if (right) {
      this.sprite.setVelocityX(speed);
      this.facing = 1;
      this.sprite.setFlipX(false);
    } else if (onGround) {
      this.sprite.setVelocityX(0);
    }

    const jumpPressed =
      Phaser.Input.Keyboard.JustDown(keys.space) ||
      Phaser.Input.Keyboard.JustDown(keys.w) ||
      Phaser.Input.Keyboard.JustDown(cursors.up);

    if (jumpPressed) {
      this.jumpBufferUntil = now + PHYSICS.jumpBufferMs;
    }

    if (now <= this.jumpBufferUntil) {
      if (this.tryJump(now, onGround)) {
        this.jumpBufferUntil = 0;
      }
    }

    if (!onGround) {
      this.sprite.setAngle(Phaser.Math.Clamp(body.velocity.x * 0.02, -12, 12));
    } else {
      this.sprite.setAngle(0);
    }

    this.clearInvincibleVisual();
  }

  private tryJump(now: number, onGround: boolean): boolean {
    const canGroundJump =
      this.jumpsUsed === 0 && (onGround || now <= this.coyoteUntil);

    if (canGroundJump) {
      this.sprite.setVelocityY(PHYSICS.jumpVelocity);
      this.jumpsUsed = 1;
      this.coyoteUntil = 0;
      this.playJumpStretch();
      return true;
    }

    if (this.jumpsUsed === 1) {
      this.sprite.setVelocityY(PHYSICS.doubleJumpVelocity);
      this.jumpsUsed = 2;
      this.playJumpStretch();
      return true;
    }

    return false;
  }

  bounce(): void {
    this.sprite.setVelocityY(PHYSICS.bouncePadVelocity);
    this.jumpsUsed = 1;
    this.coyoteUntil = 0;
    this.jumpBufferUntil = 0;
    this.playJumpStretch();
  }

  respawn(x: number, y: number): void {
    this.sprite.setPosition(x, y);
    this.sprite.setVelocity(0, 0);
    this.sprite.setAlpha(1);
    this.jumpsUsed = 0;
    this.wasOnGround = false;
    this.coyoteUntil = 0;
    this.jumpBufferUntil = 0;
  }

  private playLandSquash(): void {
    this.squashTween?.stop();
    this.sprite.setScale(1.25, 0.75);
    this.squashTween = this.sprite.scene.tweens.add({
      targets: this.sprite,
      scaleX: 1,
      scaleY: 1,
      duration: 140,
      ease: 'Back.easeOut',
    });
  }

  private playJumpStretch(): void {
    this.squashTween?.stop();
    this.sprite.setScale(0.85, 1.2);
    this.squashTween = this.sprite.scene.tweens.add({
      targets: this.sprite,
      scaleX: 1,
      scaleY: 1,
      duration: 160,
      ease: 'Quad.easeOut',
    });
  }
}
