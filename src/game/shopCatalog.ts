import type {
  InventoryWeapon,
  PassiveId,
  PetId,
  SaveData,
  ShapeId,
  ShieldId,
  SkinId,
  SkillId,
  SpecialId,
} from '../systems/SaveSystem';

export type { ShapeId, SkinId, SkillId, SpecialId, PetId, ShieldId, PassiveId };

/** Every shop weapon that must be owned for full completion. */
export const SHOP_WEAPONS: InventoryWeapon[] = [
  'glove',
  'peashooter',
  'hammer',
  'fireball',
  'shotgun',
];

/** Color (tint) — independent of shape. */
export type SkinDef = {
  id: SkinId;
  price: number;
  tint: number;
};

/** Body shape — independent of color. */
export type ShapeDef = {
  id: ShapeId;
  price: number;
  /** Phaser texture key */
  texture: string;
};

export type SkillDef = {
  id: SkillId;
  price: number;
  cooldownMs: number;
  durationMs: number;
};

export const SKINS: SkinDef[] = [
  { id: 'default', price: 0, tint: 0xff6b4a },
  { id: 'sky', price: 12, tint: 0x5dade2 },
  { id: 'mint', price: 12, tint: 0x58d68d },
  { id: 'grape', price: 18, tint: 0xaf7ac5 },
  { id: 'sun', price: 22, tint: 0xf4d03f },
];

export const SHAPES: ShapeDef[] = [
  { id: 'square', price: 0, texture: 'player_square' },
  { id: 'round', price: 10, texture: 'player_round' },
  { id: 'diamond', price: 12, texture: 'player_diamond' },
  { id: 'triangle', price: 14, texture: 'player_triangle' },
  { id: 'pill', price: 16, texture: 'player_pill' },
  { id: 'hex', price: 18, texture: 'player_hex' },
];

export const SKILLS: SkillDef[] = [
  { id: 'blink', price: 35, cooldownMs: 0, durationMs: 0 },
  { id: 'haste', price: 18, cooldownMs: 4500, durationMs: 2800 },
  { id: 'flight', price: 22, cooldownMs: 5000, durationMs: 2600 },
];

export type SpecialDef = {
  id: SpecialId;
  price: number;
  /** Base cooldown before upgrades. */
  cooldownMs: number;
};

/** Independent specials (M=missile, N=orbit); both can be equipped with K skills. */
export const SPECIALS: SpecialDef[] = [
  { id: 'missile', price: 50, cooldownMs: 4500 },
  { id: 'orbit', price: 100, cooldownMs: 0 },
];

export type PetDef = {
  id: PetId;
  price: number;
  texture: string;
};

/** Companion pets — one equipped at a time. */
export const PETS: PetDef[] = [
  { id: 'kitten', price: 100, texture: 'pet_kitten' },
  { id: 'snowman', price: 1000, texture: 'pet_snowman' },
  { id: 'fish', price: 1000, texture: 'pet_fish' },
];

export const MISSILE_MAX_LEVEL = 8;
export const MISSILE_UPGRADE_PRICE = 10;
/** Cooldown reduction per upgrade level. */
export const MISSILE_CD_REDUCE_MS = 500;

/** Salvo upgrade: +0.5 missiles/shot per level (floored). */
export const MISSILE_SALVO_MAX_LEVEL = 8;
export const MISSILE_SALVO_UPGRADE_PRICE = 20;
export const MISSILE_SALVO_PER_LEVEL = 0.5;

/** Orbit missile: storage upgrade (+1 capacity / level). */
export const ORBIT_MAX_LEVEL = 8;
export const ORBIT_UPGRADE_PRICE = 50;
/** Engage range while orbiting (px). */
export const ORBIT_ENGAGE_RANGE = 300;

export function skinById(id: SkinId): SkinDef {
  return SKINS.find((s) => s.id === id) ?? SKINS[0];
}

export function shapeById(id: ShapeId): ShapeDef {
  return SHAPES.find((s) => s.id === id) ?? SHAPES[0];
}

export function skillById(id: SkillId): SkillDef | undefined {
  return SKILLS.find((s) => s.id === id);
}

export function specialById(id: SpecialId): SpecialDef | undefined {
  return SPECIALS.find((s) => s.id === id);
}

export function petById(id: PetId): PetDef | undefined {
  return PETS.find((p) => p.id === id);
}

/** Missile cooldown after upgrades (min floor 500ms). */
export function missileCooldownMs(level: number): number {
  const def = specialById('missile');
  const base = def?.cooldownMs ?? 4500;
  const lv = Math.max(0, Math.min(MISSILE_MAX_LEVEL, Math.floor(level)));
  return Math.max(500, base - lv * MISSILE_CD_REDUCE_MS);
}

/**
 * Missiles fired per N-press.
 * Base 1 + 0.5 per salvo level, floored (Lv1→1, Lv2→2, …, Lv8→5).
 */
export function missileSalvoCount(salvoLevel: number): number {
  const lv = Math.max(0, Math.min(MISSILE_SALVO_MAX_LEVEL, Math.floor(salvoLevel)));
  return Math.max(1, Math.floor(1 + lv * MISSILE_SALVO_PER_LEVEL));
}

/** Orbit storage capacity: 1 at unlock, +1 per upgrade level. */
export function orbitCapacity(orbitLevel: number): number {
  const lv = Math.max(0, Math.min(ORBIT_MAX_LEVEL, Math.floor(orbitLevel)));
  return 1 + lv;
}

/**
 * True when every buyable shop item is owned / maxed:
 * skins, shapes, skills, specials, and special upgrades.
 * (Weapons are level pickups — not required for shop completion / shields.)
 */
export function isShopFullyOwned(save: SaveData): boolean {
  if (!SKINS.every((s) => save.ownedSkins.includes(s.id))) return false;
  if (!SHAPES.every((s) => save.ownedShapes.includes(s.id))) return false;
  if (!SKILLS.every((s) => save.ownedSkills.includes(s.id))) return false;
  if (!SPECIALS.every((s) => save.ownedSpecials.includes(s.id))) return false;
  if (save.missileLevel < MISSILE_MAX_LEVEL) return false;
  if (save.missileSalvoLevel < MISSILE_SALVO_MAX_LEVEL) return false;
  if (save.orbitLevel < ORBIT_MAX_LEVEL) return false;
  return true;
}

/** Orbit bullet-block + enemy-repulse shields unlock after full shop (equip separately). */
export function shieldsUnlocked(save: SaveData): boolean {
  return isShopFullyOwned(save);
}

/** @deprecated use shieldsUnlocked — kept for call-site clarity during migration. */
export function orbitShieldsUnlocked(save: SaveData): boolean {
  return shieldsUnlocked(save);
}

export const SHIELDS: { id: ShieldId }[] = [{ id: 'reflect' }, { id: 'repulse' }];

export type PassiveDef = {
  id: PassiveId;
  price: number;
};

/** Premium passives — separate shop class from K skills. */
export const PASSIVES: PassiveDef[] = [
  { id: 'immortal', price: 100_000 },
  { id: 'nuke', price: 100_000 },
];

export function passiveById(id: PassiveId): PassiveDef | undefined {
  return PASSIVES.find((p) => p.id === id);
}
