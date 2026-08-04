import Phaser from 'phaser';

export class CoinPickup {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  readonly value: number;
  private taken = false;

  constructor(scene: Phaser.Scene, x: number, y: number, value = 1) {
    this.value = value;
    this.sprite = scene.physics.add.sprite(x, y, 'coin');
    this.sprite.setDepth(7);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setSize(18, 18);
    scene.tweens.add({
      targets: this.sprite,
      y: y - 6,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    scene.tweens.add({
      targets: this.sprite,
      angle: 360,
      duration: 1800,
      repeat: -1,
    });
  }

  collect(): number {
    if (this.taken || !this.sprite.active) return 0;
    this.taken = true;
    const v = this.value;
    const scene = this.sprite.scene;

    // Leave the Arcade step immediately — destroying mid-overlap freezes Phaser.
    scene.tweens.killTweensOf(this.sprite);
    this.sprite.disableBody(true, false);

    const y = this.sprite.y;
    scene.tweens.add({
      targets: this.sprite,
      scale: 1.6,
      alpha: 0,
      y: y - 24,
      duration: 180,
      onComplete: () => {
        scene.time.delayedCall(0, () => {
          if (this.sprite?.scene && this.sprite.active) this.sprite.destroy();
        });
      },
    });
    return v;
  }
}
