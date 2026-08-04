import type { WeaponType } from '../systems/SaveSystem';

/**
 * 武器伤害用「命中格数」：每次成功命中固定扣 1 格。
 * 怪物有多格生命，因此单次攻击不可能秒杀（踩踏仍是独立一击必杀）。
 */
export const WEAPON_STATS: Record<
  WeaponType,
  {
    labelKey: string;
    /** 近战是否造成命中（1 格） */
    melee: boolean;
    meleeRange: number;
    /** 弹道是否造成命中（1 格；散射弹共用受击帧，整发射击只结算 1 格） */
    projectile: boolean;
    projSpeed: number;
    projKey: string;
    pellets: number;
    spread: number;
    cooldownMs: number;
  }
> = {
  none: {
    labelKey: 'weaponNone',
    melee: true,
    meleeRange: 36,
    projectile: false,
    projSpeed: 0,
    projKey: 'pea',
    pellets: 0,
    spread: 0,
    cooldownMs: 320,
  },
  glove: {
    labelKey: 'weaponGlove',
    melee: true,
    meleeRange: 52,
    projectile: false,
    projSpeed: 0,
    projKey: 'pea',
    pellets: 0,
    spread: 0,
    cooldownMs: 280,
  },
  hammer: {
    labelKey: 'weaponHammer',
    melee: true,
    meleeRange: 62,
    projectile: false,
    projSpeed: 0,
    projKey: 'pea',
    pellets: 0,
    spread: 0,
    cooldownMs: 360,
  },
  peashooter: {
    labelKey: 'weaponPeashooter',
    melee: false,
    meleeRange: 0,
    projectile: true,
    // Slightly slower than before to reduce tunneling through flyers when jumping.
    projSpeed: 480,
    projKey: 'pea',
    pellets: 1,
    spread: 0,
    cooldownMs: 260,
  },
  fireball: {
    labelKey: 'weaponFireball',
    melee: false,
    meleeRange: 0,
    projectile: true,
    projSpeed: 420,
    projKey: 'fireball',
    pellets: 1,
    spread: 0,
    cooldownMs: 380,
  },
  shotgun: {
    labelKey: 'weaponShotgun',
    melee: false,
    meleeRange: 0,
    projectile: true,
    projSpeed: 500,
    projKey: 'pellet',
    pellets: 3,
    spread: 0.28,
    cooldownMs: 420,
  },
};
