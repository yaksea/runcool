import Phaser from 'phaser';
import { PHYSICS } from '../style/theme';
import type { WeaponType } from '../systems/SaveSystem';

export class Player {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  facing = 1;
  weapon: WeaponType = 'none';
  climbing = false;
  private jumpsUsed = 0;
  private wasOnGround = false;
  private coyoteUntil = 0;
  private jumpBufferUntil = 0;
  private invincibleUntil = 0;
  private attackCooldownUntil = 0;
  private supportedUntil = 0;
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

  /** Seesaw / temporary floor support counts as grounded for a short time. */
  markSupported(): void {
    const now = this.sprite.scene.time.now;
    if (now >= this.supportedUntil) {
      this.jumpsUsed = 0;
    }
    this.supportedUntil = now + 50;
    this.coyoteUntil = now + PHYSICS.coyoteMs;
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

  markAttack(now: number, cooldownMs?: number): void {
    this.attackCooldownUntil = now + (cooldownMs ?? PHYSICS.attackCooldownMs);
  }

  update(
    cursors: Phaser.Types.Input.Keyboard.CursorKeys,
    keys: {
      a: Phaser.Input.Keyboard.Key;
      d: Phaser.Input.Keyboard.Key;
      w: Phaser.Input.Keyboard.Key;
      s: Phaser.Input.Keyboard.Key;
      space: Phaser.Input.Keyboard.Key;
    },
    onLadder: boolean,
  ): void {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const now = this.sprite.scene.time.now;
    const up = cursors.up.isDown || keys.w.isDown;
    const down = cursors.down.isDown || keys.s.isDown;
    const left = cursors.left.isDown || keys.a.isDown;
    const right = cursors.right.isDown || keys.d.isDown;

    // On ladders, W/↑ only climb; Space jumps off. Off ladders, W/↑ also jump.
    const spaceJump = Phaser.Input.Keyboard.JustDown(keys.space);
    const dirJump =
      !onLadder &&
      (Phaser.Input.Keyboard.JustDown(keys.w) || Phaser.Input.Keyboard.JustDown(cursors.up));

    // Ladder: start when overlapping and pressing vertical; leave on jump / walk off.
    if (onLadder && (up || down || this.climbing)) {
      if (!this.climbing) this.startClimb();
    } else if (this.climbing && !onLadder) {
      this.stopClimb();
    }

    if (this.climbing) {
      this.updateClimb(up, down, left, right, spaceJump, onLadder);
      this.clearInvincibleVisual();
      return;
    }

    const onGround =
      body.blocked.down || body.touching.down || now < this.supportedUntil;

    if (onGround) {
      if (!this.wasOnGround) {
        this.jumpsUsed = 0;
        this.playLandSquash();
      }
      this.coyoteUntil = now + PHYSICS.coyoteMs;
    } else if (this.wasOnGround) {
      if (this.jumpsUsed === 0) {
        this.coyoteUntil = now + PHYSICS.coyoteMs;
      }
    }
    this.wasOnGround = onGround;

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

    if (spaceJump || dirJump) {
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

  private startClimb(): void {
    this.climbing = true;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setVelocity(0, 0);
    // Disable world collision so floors the ladder passes through cannot block/push us.
    body.checkCollision.none = true;
    this.jumpsUsed = 0;
    this.sprite.setAngle(0);
  }

  private stopClimb(): void {
    if (!this.climbing) return;
    this.climbing = false;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(true);
    body.checkCollision.none = false;
  }

  private updateClimb(
    up: boolean,
    down: boolean,
    left: boolean,
    right: boolean,
    jumpPressed: boolean,
    onLadder: boolean,
  ): void {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;

    if (jumpPressed) {
      this.stopClimb();
      this.sprite.setVelocityY(PHYSICS.jumpVelocity);
      this.jumpsUsed = 1;
      this.playJumpStretch();
      return;
    }

    // Keep climbing through platforms; only drop off after clearly leaving the ladder.
    if (!onLadder) {
      this.stopClimb();
      return;
    }

    let vy = 0;
    if (up) vy = -PHYSICS.climbSpeed;
    else if (down) vy = PHYSICS.climbSpeed;
    body.setVelocityY(vy);

    if (left) {
      this.facing = -1;
      this.sprite.setFlipX(true);
      body.setVelocityX(-PHYSICS.moveSpeed * 0.25);
    } else if (right) {
      this.facing = 1;
      this.sprite.setFlipX(false);
      body.setVelocityX(PHYSICS.moveSpeed * 0.25);
    } else {
      body.setVelocityX(0);
    }
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
    this.launch(this.sprite.body?.velocity.x ?? 0, PHYSICS.bouncePadVelocity);
  }

  launch(vx: number, vy: number): void {
    this.stopClimb();
    this.sprite.setVelocity(vx, vy);
    this.jumpsUsed = 1;
    this.coyoteUntil = 0;
    this.jumpBufferUntil = 0;
    this.playJumpStretch();
  }

  respawn(x: number, y: number): void {
    this.stopClimb();
    this.sprite.setPosition(x, y);
    this.sprite.setVelocity(0, 0);
    this.sprite.setAlpha(1);
    this.jumpsUsed = 0;
    this.wasOnGround = false;
    this.coyoteUntil = 0;
    this.jumpBufferUntil = 0;
    this.supportedUntil = 0;
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
