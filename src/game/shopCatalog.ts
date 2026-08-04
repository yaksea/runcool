import type { ShapeId, SkinId, SkillId } from '../systems/SaveSystem';

export type { ShapeId, SkinId, SkillId };

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
  { id: 'blink', price: 15, cooldownMs: 2800, durationMs: 0 },
  { id: 'haste', price: 18, cooldownMs: 4500, durationMs: 2800 },
  { id: 'flight', price: 22, cooldownMs: 5000, durationMs: 2600 },
];

export function skinById(id: SkinId): SkinDef {
  return SKINS.find((s) => s.id === id) ?? SKINS[0];
}

export function shapeById(id: ShapeId): ShapeDef {
  return SHAPES.find((s) => s.id === id) ?? SHAPES[0];
}

export function skillById(id: SkillId): SkillDef | undefined {
  return SKILLS.find((s) => s.id === id);
}
