import Phaser from 'phaser';
import { ZH } from '../i18n/zh';
import type { BreakableDef, GateDef, LeverDef } from '../levels/types';
import type { Player } from './Player';

export type InteractHint = { hint: string } | null;

export type InteractTargetBus = {
  toggleGate: (id: string) => boolean;
  reverseConveyor: (id: string) => boolean;
  toggleFan: (id: string) => boolean;
};

/** Solid barrier that levers can open/close. */
export class Gate {
  readonly id: string;
  private open: boolean;
  private readonly sprite: Phaser.Physics.Arcade.Sprite;
  private readonly scene: Phaser.Scene;

  constructor(scene: Phaser.Scene, platforms: Phaser.Physics.Arcade.StaticGroup, def: GateDef) {
    this.scene = scene;
    this.id = def.id;
    this.open = !!def.open;
    this.sprite = platforms.create(
      def.x + def.w / 2,
      def.y + def.h / 2,
      'gate',
    ) as Phaser.Physics.Arcade.Sprite;
    this.sprite.setDisplaySize(def.w, def.h);
    this.sprite.refreshBody();
    this.sprite.setDepth(6);
    this.applyVisual();
  }

  toggle(): void {
    this.open = !this.open;
    this.applyVisual();
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: this.open ? 0.2 : 1,
      duration: 160,
    });
  }

  private applyVisual(): void {
    const body = this.sprite.body as Phaser.Physics.Arcade.StaticBody;
    if (this.open) {
      body.enable = false;
      this.sprite.setAlpha(0.2);
    } else {
      body.enable = true;
      this.sprite.setAlpha(1);
      this.sprite.refreshBody();
    }
  }
}

/** Nearby X toggles a linked gate / conveyor / fan. */
export class Lever {
  private readonly sprite: Phaser.GameObjects.Image;
  private readonly def: LeverDef;
  private on = false;
  private readonly bus: InteractTargetBus;
  private readonly scene: Phaser.Scene;
  private cooldownUntil = 0;

  constructor(scene: Phaser.Scene, def: LeverDef, bus: InteractTargetBus) {
    this.scene = scene;
    this.def = def;
    this.bus = bus;
    this.sprite = scene.add.image(def.x, def.y, 'lever_off').setDepth(7);
    scene.tweens.add({
      targets: this.sprite,
      y: def.y - 3,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  inRange(player: Player): boolean {
    return (
      Math.abs(player.sprite.x - this.def.x) < 42 &&
      Math.abs(player.sprite.y - this.def.y) < 48
    );
  }

  tryInteract(player: Player): boolean {
    if (!this.inRange(player)) return false;
    const now = this.scene.time.now;
    if (now < this.cooldownUntil) return false;
    this.cooldownUntil = now + 200;

    let ok = false;
    if (this.def.targetType === 'gate') ok = this.bus.toggleGate(this.def.targetId);
    else if (this.def.targetType === 'conveyor') ok = this.bus.reverseConveyor(this.def.targetId);
    else if (this.def.targetType === 'fan') ok = this.bus.toggleFan(this.def.targetId);

    if (!ok) return false;
    this.on = !this.on;
    this.sprite.setTexture(this.on ? 'lever_on' : 'lever_off');
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: 1.2,
      scaleY: 0.85,
      duration: 80,
      yoyo: true,
    });
    return true;
  }
}

/** Crate/wall smashed with X — respawns after a short delay. */
export class Breakable {
  private sprite: Phaser.Physics.Arcade.Sprite | null = null;
  private hitsLeft: number;
  private readonly maxHits: number;
  private broken = false;
  private readonly scene: Phaser.Scene;
  private readonly group: Phaser.Physics.Arcade.StaticGroup;
  private readonly def: BreakableDef;
  private readonly x: number;
  private readonly y: number;
  private readonly respawnMs = 2200;

  constructor(scene: Phaser.Scene, platforms: Phaser.Physics.Arcade.StaticGroup, def: BreakableDef) {
    this.scene = scene;
    this.group = platforms;
    this.def = def;
    this.x = def.x + def.w / 2;
    this.y = def.y + def.h / 2;
    this.maxHits = def.hits ?? 1;
    this.hitsLeft = this.maxHits;
    this.spawnSprite();
  }

  private spawnSprite(): void {
    this.sprite = this.group.create(this.x, this.y, 'breakable') as Phaser.Physics.Arcade.Sprite;
    this.sprite.setDisplaySize(this.def.w, this.def.h);
    this.sprite.setAlpha(1);
    this.sprite.clearTint();
    this.sprite.setScale(1);
    this.sprite.refreshBody();
    this.sprite.setDepth(6);
    this.broken = false;
    this.hitsLeft = this.maxHits;
  }

  inRange(player: Player): boolean {
    if (this.broken || !this.sprite?.active) return false;
    return (
      Math.abs(player.sprite.x - this.x) < 50 &&
      Math.abs(player.sprite.y - this.y) < 52
    );
  }

  tryInteract(player: Player): boolean {
    if (!this.inRange(player) || this.broken || !this.sprite) return false;
    this.hitsLeft -= 1;
    this.scene.tweens.add({
      targets: this.sprite,
      x: this.x + 4,
      duration: 40,
      yoyo: true,
      repeat: 2,
    });
    this.sprite.setTint(0xffffff);

    if (this.hitsLeft > 0) {
      this.sprite.setAlpha(0.45 + (this.hitsLeft / this.maxHits) * 0.55);
      this.scene.time.delayedCall(80, () => {
        if (!this.broken && this.sprite?.active) this.sprite.clearTint();
      });
      return true;
    }

    this.broken = true;
    const body = this.sprite.body as Phaser.Physics.Arcade.StaticBody | null;
    if (body) body.enable = false;
    const dying = this.sprite;
    this.sprite = null;
    this.scene.tweens.add({
      targets: dying,
      scaleX: 1.4,
      scaleY: 0.2,
      alpha: 0,
      duration: 180,
      onComplete: () => {
        if (dying.active) dying.destroy();
      },
    });
    this.scene.time.delayedCall(this.respawnMs, () => {
      if (!this.sprite) this.spawnSprite();
    });
    return true;
  }
}

export class InteractSystem {
  private readonly gates = new Map<string, Gate>();
  private readonly levers: Lever[] = [];
  private readonly breakables: Breakable[] = [];

  constructor(
    scene: Phaser.Scene,
    platforms: Phaser.Physics.Arcade.StaticGroup,
    defs: {
      gates?: GateDef[];
      levers?: LeverDef[];
      breakables?: BreakableDef[];
    },
    private readonly bus: InteractTargetBus,
  ) {
    (defs.gates ?? []).forEach((g) => {
      const gate = new Gate(scene, platforms, g);
      this.gates.set(g.id, gate);
    });
    (defs.levers ?? []).forEach((l) => {
      this.levers.push(new Lever(scene, l, {
        toggleGate: (id) => this.toggleGate(id),
        reverseConveyor: (id) => this.bus.reverseConveyor(id),
        toggleFan: (id) => this.bus.toggleFan(id),
      }));
    });
    (defs.breakables ?? []).forEach((b) => {
      this.breakables.push(new Breakable(scene, platforms, b));
    });
  }

  toggleGate(id: string): boolean {
    const gate = this.gates.get(id);
    if (!gate) return false;
    gate.toggle();
    return true;
  }

  nearestHint(player: Player): InteractHint {
    for (const b of this.breakables) {
      if (b.inRange(player)) return { hint: ZH.interactBreak };
    }
    for (const l of this.levers) {
      if (l.inRange(player)) return { hint: ZH.interactControl };
    }
    return null;
  }

  tryInteract(player: Player): 'break' | 'control' | null {
    for (const b of this.breakables) {
      if (b.tryInteract(player)) return 'break';
    }
    for (const l of this.levers) {
      if (l.tryInteract(player)) return 'control';
    }
    return null;
  }
}
