import type { WeaponType } from '../systems/SaveSystem';

/** Stronger baseline combat numbers for all weapons. */
export const WEAPON_STATS: Record<
  WeaponType,
  {
    labelKey: string;
    meleeDamage: number;
    meleeRange: number;
    projDamage: number;
    projSpeed: number;
    projKey: string;
    pellets: number;
    spread: number;
    cooldownMs: number;
  }
> = {
  none: {
    labelKey: 'weaponNone',
    meleeDamage: 0,
    meleeRange: 30,
    projDamage: 0,
    projSpeed: 0,
    projKey: 'pea',
    pellets: 0,
    spread: 0,
    cooldownMs: 280,
  },
  glove: {
    labelKey: 'weaponGlove',
    meleeDamage: 2,
    meleeRange: 52,
    projDamage: 0,
    projSpeed: 0,
    projKey: 'pea',
    pellets: 0,
    spread: 0,
    cooldownMs: 240,
  },
  hammer: {
    labelKey: 'weaponHammer',
    meleeDamage: 3,
    meleeRange: 62,
    projDamage: 0,
    projSpeed: 0,
    projKey: 'pea',
    pellets: 0,
    spread: 0,
    cooldownMs: 320,
  },
  peashooter: {
    labelKey: 'weaponPeashooter',
    meleeDamage: 0,
    meleeRange: 0,
    projDamage: 2,
    projSpeed: 560,
    projKey: 'pea',
    pellets: 1,
    spread: 0,
    cooldownMs: 220,
  },
  fireball: {
    labelKey: 'weaponFireball',
    meleeDamage: 0,
    meleeRange: 0,
    projDamage: 3,
    projSpeed: 420,
    projKey: 'fireball',
    pellets: 1,
    spread: 0,
    cooldownMs: 340,
  },
  shotgun: {
    labelKey: 'weaponShotgun',
    meleeDamage: 0,
    meleeRange: 0,
    projDamage: 2,
    projSpeed: 500,
    projKey: 'pellet',
    pellets: 3,
    spread: 0.28,
    cooldownMs: 380,
  },
};
