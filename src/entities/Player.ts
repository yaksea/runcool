import Phaser from 'phaser';
import { PHYSICS, VITALS } from '../style/theme';
import type { WeaponType } from '../systems/SaveSystem';
import { SoundSystem } from '../systems/SoundSystem';

export class Player {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  facing = 1;
  weapon: WeaponType = 'none';
  climbing = false;
  hp: number = VITALS.maxHp;
  armor: number = VITALS.maxArmor;
  readonly maxHp: number = VITALS.maxHp;
  readonly maxArmor: number = VITALS.maxArmor;
  private armorRegenAcc = 0;
  private jumpsUsed = 0;
  private wasOnGround = false;
  private coyoteUntil = 0;
  private jumpBufferUntil = 0;
  private invincibleUntil = 0;
  private attackCooldownUntil = 0;
  private lastAttackAt = -9999;
  private supportedUntil = 0;
  private hasteUntil = 0;
  private flightUntil = 0;
  private skinTint = 0xffffff;
  private squashTween?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.sprite = scene.physics.add.sprite(x, y, 'player');
    this.sprite.setCollideWorldBounds(false);
    this.sprite.setMaxVelocity(520, 900);
    this.sprite.setDragX(1200);
    this.sprite.setDepth(10);
    this.sprite.setTint(0xff6b4a);
    this.skinTint = 0xff6b4a;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(28, 32);
    body.setOffset(6, 6);
  }

  setWeapon(weapon: WeaponType): void {
    this.weapon = weapon;
  }

  applySkin(tint: number): void {
    this.skinTint = tint;
    this.sprite.setTint(tint);
  }

  /** Shape texture + color tint (freely combinable). */
  applyAppearance(textureKey: string, tint: number): void {
    if (this.sprite.texture.key !== textureKey && this.sprite.scene.textures.exists(textureKey)) {
      this.sprite.setTexture(textureKey);
      const body = this.sprite.body as Phaser.Physics.Arcade.Body;
      body.setSize(28, 32);
      body.setOffset(6, 6);
    }
    this.applySkin(tint);
  }

  isHasting(now: number): boolean {
    return now < this.hasteUntil;
  }

  isFlying(now: number): boolean {
    return now < this.flightUntil;
  }

  activateHaste(now: number, durationMs: number): void {
    this.hasteUntil = now + durationMs;
  }

  activateFlight(now: number, durationMs: number): void {
    this.stopClimb();
    this.flightUntil = now + durationMs;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setVelocityY(Math.min(body.velocity.y, 0));
  }

  blinkForward(distance: number): void {
    this.stopClimb();
    this.sprite.x += this.facing * distance;
    this.makeInvincible(this.sprite.scene.time.now, 220);
    this.sprite.scene.cameras.main.flash(80, 255, 255, 200);
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
    const now = this.sprite.scene.time.now;
    if (this.isFlying(now)) return;
    if (!this.isInvincible(now)) {
      this.sprite.setAlpha(1);
      this.sprite.setTint(this.skinTint);
    }
  }

  canAttack(now: number): boolean {
    return now >= this.attackCooldownUntil;
  }

  markAttack(now: number, cooldownMs?: number): void {
    this.lastAttackAt = now;
    this.attackCooldownUntil = now + (cooldownMs ?? PHYSICS.attackCooldownMs);
  }

  /** True shortly after pressing attack — blocks accidental stomp/contact kill. */
  didAttackRecently(now: number, windowMs = 500): boolean {
    return now - this.lastAttackAt < windowMs;
  }

  /**
   * Hit by monster / hazard: armor first (1), then HP (1).
   * Returns whether this blow emptied HP.
   */
  takeDamage(now: number): { dead: boolean; hitArmor: boolean } {
    if (this.isInvincible(now)) return { dead: false, hitArmor: false };

    let hitArmor = false;
    if (this.armor > 0) {
      this.armor -= 1;
      hitArmor = true;
      this.armorRegenAcc = 0;
    } else {
      this.hp = Math.max(0, this.hp - 1);
    }

    this.makeInvincible(now, PHYSICS.invincibleMs);
    this.sprite.setTint(0xffffff);
    this.sprite.scene.time.delayedCall(120, () => {
      if (this.sprite.active) this.sprite.setTint(this.skinTint);
    });

    return { dead: this.hp <= 0, hitArmor };
  }

  /** Armor +1 every 10s while below max. HP never regenerates. */
  tickVitals(delta: number): void {
    if (this.armor >= this.maxArmor) {
      this.armorRegenAcc = 0;
      return;
    }
    this.armorRegenAcc += delta;
    if (this.armorRegenAcc >= VITALS.armorRegenMs) {
      this.armorRegenAcc = 0;
      this.armor = Math.min(this.maxArmor, this.armor + 1);
    }
  }

  /** Full restore after checkpoint respawn. */
  restoreVitals(): void {
    this.hp = this.maxHp;
    this.armor = this.maxArmor;
    this.armorRegenAcc = 0;
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

    if (this.isFlying(now)) {
      this.updateFlight(up, down, left, right, now);
      this.clearInvincibleVisual();
      return;
    }

    if (!this.climbing && body.allowGravity === false) {
      body.setAllowGravity(true);
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

    const haste = this.isHasting(now) ? 1.75 : 1;
    const speed = (onGround ? PHYSICS.moveSpeed : PHYSICS.airMoveSpeed) * haste;

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

  private updateFlight(
    up: boolean,
    down: boolean,
    left: boolean,
    right: boolean,
    now: number,
  ): void {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    const haste = this.isHasting(now) ? 1.4 : 1;
    const speed = PHYSICS.moveSpeed * 1.15 * haste;
    let vx = 0;
    let vy = 0;
    if (left) {
      vx = -speed;
      this.facing = -1;
      this.sprite.setFlipX(true);
    } else if (right) {
      vx = speed;
      this.facing = 1;
      this.sprite.setFlipX(false);
    }
    if (up) vy = -speed;
    else if (down) vy = speed;
    body.setVelocity(vx, vy);
    this.sprite.setAngle(Phaser.Math.Clamp(vx * 0.03, -14, 14));
    this.sprite.setAlpha(0.85);
    if (!this.isFlying(now)) {
      body.setAllowGravity(true);
      this.sprite.setAlpha(this.isInvincible(now) ? 0.55 : 1);
    }
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
      SoundSystem.jump(false);
      return true;
    }

    if (this.jumpsUsed === 1) {
      this.sprite.setVelocityY(PHYSICS.doubleJumpVelocity);
      this.jumpsUsed = 2;
      this.playJumpStretch();
      SoundSystem.jump(true);
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
    this.hasteUntil = 0;
    this.flightUntil = 0;
    this.restoreVitals();
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(true);
    this.sprite.setPosition(x, y);
    this.sprite.setVelocity(0, 0);
    this.sprite.setAlpha(1);
    this.sprite.setTint(this.skinTint);
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
