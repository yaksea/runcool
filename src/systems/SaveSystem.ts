import { isShopFullyOwned } from '../game/shopCatalog';
import { LEVELS } from '../levels';

export type WeaponType = 'none' | 'glove' | 'peashooter' | 'hammer' | 'fireball' | 'shotgun';
export type InventoryWeapon = Exclude<WeaponType, 'none'>;
/** Color tint id (shop “颜色”). */
export type SkinId = 'default' | 'sky' | 'mint' | 'grape' | 'sun';
/** Body shape id (shop “形状”). */
export type ShapeId = 'square' | 'round' | 'diamond' | 'triangle' | 'pill' | 'hex';
export type SkillId = 'blink' | 'haste' | 'flight';
export type EquippedSkill = SkillId | 'none';
/** Independent from K-skills; missile=M, orbit=N; both can be equipped. */
export type SpecialId = 'missile' | 'orbit';
/** Shop pets — snowman + fish may equip together; kitten is exclusive. */
export type PetId = 'kitten' | 'snowman' | 'fish';
export type EquippedPet = PetId | 'none';
/** Passive shields — equip independently of orbit missiles. */
export type ShieldId = 'reflect' | 'repulse';
/** Premium passives (separate shop class). */
export type PassiveId = 'immortal' | 'nuke';
export type EquippedPassive = PassiveId | 'none';
/** Easy = authored density, no respawn; Hard = dense + reinforce; Nightmare = 3s spam. */
export type DifficultyId = 'easy' | 'hard' | 'nightmare';

export type SaveData = {
  version: 1;
  /** Display name of this profile (unique among local profiles). */
  playerName: string;
  unlockedMax: number;
  coins: number;
  inventory: InventoryWeapon[];
  equipped: WeaponType;
  ownedSkins: SkinId[];
  equippedSkin: SkinId;
  ownedShapes: ShapeId[];
  equippedShape: ShapeId;
  ownedSkills: SkillId[];
  equippedSkill: EquippedSkill;
  ownedSpecials: SpecialId[];
  /** Missile and orbit can both be equipped at once. */
  equippedSpecials: SpecialId[];
  ownedPets: PetId[];
  /** Active companions; snowman+fish allowed together, kitten alone. */
  equippedPets: PetId[];
  /**
   * Reflect / repulse shields. Unlock after full shop; each can be
   * equipped or unequipped without orbit missiles.
   */
  equippedShields: ShieldId[];
  /** True after the player manually equips/unequips a shield. */
  shieldsConfigured: boolean;
  ownedPassives: PassiveId[];
  equippedPassive: EquippedPassive;
  /** Missile cooldown upgrade level 0–8 (each level −0.5s cooldown). */
  missileLevel: number;
  /** Missile salvo upgrade level 0–8 (each level +0.5 missiles/shot, floored). */
  missileSalvoLevel: number;
  /** Orbit-missile storage upgrade 0–8 (capacity = 1 + level). */
  orbitLevel: number;
  /** Newbie proximity tips (can be dismissed anytime). */
  tutorialAssist: boolean;
  /** Overworld spawn pressure. */
  difficulty: DifficultyId;
  levels: Record<
    string,
    {
      bestStars: number;
      bestTimeMs: number | null;
    }
  >;
  activeRun: null | {
    levelId: string;
    checkpointIndex: number;
    elapsedMs: number;
    deaths: number;
    weapon: WeaponType;
  };
};

/** Legacy single-slot key — migrated into a named profile on first launch. */
const LEGACY_KEY = 'runcool.save.v1';
const PROFILE_KEY = 'runcool.profiles.v1';
const NAME_MIN = 1;
const NAME_MAX = 12;

/** Logged-in users: single server-backed profile, cached locally for sync reads. */
const CLOUD_KEY = 'runcool.cloudsave.v1';

export type AuthMode = 'guest' | 'user';
export type CloudUser = { id: string; nickname: string };

let authMode: AuthMode = 'guest';
let cloudUser: CloudUser | null = null;
let saveHook: ((data: SaveData) => void) | null = null;

/**
 * Storage backend for the current auth mode.
 * Guest → sessionStorage (progress lives for the tab session only).
 * Logged-in → localStorage cache of the server save (write-through).
 */
function store(): Storage {
  if (authMode === 'guest') {
    try {
      return sessionStorage;
    } catch {
      return localStorage;
    }
  }
  return localStorage;
}

type ProfileIndex = {
  active: string | null;
  names: string[];
};

const ALL_WEAPONS: InventoryWeapon[] = ['glove', 'peashooter', 'hammer', 'fireball', 'shotgun'];
const ALL_SKINS: SkinId[] = ['default', 'sky', 'mint', 'grape', 'sun'];
const ALL_SHAPES: ShapeId[] = ['square', 'round', 'diamond', 'triangle', 'pill', 'hex'];
const ALL_SKILLS: SkillId[] = ['blink', 'haste', 'flight'];
const ALL_SPECIALS: SpecialId[] = ['missile', 'orbit'];
const ALL_PETS: PetId[] = ['kitten', 'snowman', 'fish'];
const ALL_SHIELDS: ShieldId[] = ['reflect', 'repulse'];
const ALL_PASSIVES: PassiveId[] = ['immortal', 'nuke'];
const MAX_LEVEL_INDEX = Math.max(...LEVELS.map((l) => l.index));

function fullStarsLevels(): SaveData['levels'] {
  const out: SaveData['levels'] = {};
  for (const level of LEVELS) {
    out[level.id] = { bestStars: 3, bestTimeMs: level.threeStarMs };
  }
  return out;
}

function profileSaveKey(name: string): string {
  return `${LEGACY_KEY}:${encodeURIComponent(name)}`;
}

function loadProfileIndex(): ProfileIndex {
  try {
    const raw = store().getItem(PROFILE_KEY);
    if (!raw) return { active: null, names: [] };
    const data = JSON.parse(raw) as ProfileIndex;
    const names = Array.isArray(data.names)
      ? data.names.filter((n) => typeof n === 'string' && n.trim().length > 0)
      : [];
    const active =
      typeof data.active === 'string' && names.includes(data.active) ? data.active : names[0] ?? null;
    return { active, names };
  } catch {
    return { active: null, names: [] };
  }
}

function saveProfileIndex(index: ProfileIndex): void {
  store().setItem(PROFILE_KEY, JSON.stringify(index));
}

/** Case-insensitive identity for uniqueness checks. */
function nameIdentity(name: string): string {
  return name.trim().toLowerCase();
}

export type NameValidateResult =
  | { ok: true; name: string }
  | { ok: false; reason: 'empty' | 'tooLong' | 'invalid' | 'taken' };

function normalizePlayerName(raw: string, takenByOthers: string[]): NameValidateResult {
  const name = raw.trim().replace(/\s+/g, ' ');
  if (!name) return { ok: false, reason: 'empty' };
  if ([...name].length > NAME_MAX) return { ok: false, reason: 'tooLong' };
  // Letters, numbers, CJK, underscore, hyphen, space.
  if (!/^[\w\u4e00-\u9fff\- ]+$/u.test(name)) return { ok: false, reason: 'invalid' };
  const id = nameIdentity(name);
  if (takenByOthers.some((n) => nameIdentity(n) === id)) return { ok: false, reason: 'taken' };
  return { ok: true, name };
}

function defaultSave(playerName = ''): SaveData {
  return {
    version: 1,
    playerName,
    unlockedMax: MAX_LEVEL_INDEX,
    coins: 0,
    inventory: [],
    equipped: 'none',
    ownedSkins: ['default'],
    equippedSkin: 'default',
    ownedShapes: ['square'],
    equippedShape: 'square',
    ownedSkills: [],
    equippedSkill: 'none',
    ownedSpecials: [],
    equippedSpecials: [],
    ownedPets: [],
    equippedPets: [],
    equippedShields: [],
    shieldsConfigured: false,
    ownedPassives: [],
    equippedPassive: 'none',
    missileLevel: 0,
    missileSalvoLevel: 0,
    orbitLevel: 0,
    tutorialAssist: true,
    difficulty: 'hard',
    levels: fullStarsLevels(),
    activeRun: null,
  };
}

function normalizeDifficulty(v: unknown): DifficultyId {
  if (v === 'easy' || v === 'nightmare') return v;
  return 'hard';
}

const MISSILE_LEVEL_CAP = 8;
const MISSILE_SALVO_LEVEL_CAP = 8;
const ORBIT_LEVEL_CAP = 8;

function normalizeMissileLevel(v: unknown): number {
  const n = Math.floor(Number(v) || 0);
  return Math.max(0, Math.min(MISSILE_LEVEL_CAP, n));
}

function normalizeMissileSalvoLevel(v: unknown): number {
  const n = Math.floor(Number(v) || 0);
  return Math.max(0, Math.min(MISSILE_SALVO_LEVEL_CAP, n));
}

function normalizeOrbitLevel(v: unknown): number {
  const n = Math.floor(Number(v) || 0);
  return Math.max(0, Math.min(ORBIT_LEVEL_CAP, n));
}

function normalizeWeapon(w: unknown): WeaponType {
  const ok: WeaponType[] = ['none', 'glove', 'peashooter', 'hammer', 'fireball', 'shotgun'];
  return ok.includes(w as WeaponType) ? (w as WeaponType) : 'none';
}

function normalizeInventory(list: unknown): InventoryWeapon[] {
  if (!Array.isArray(list)) return [];
  const out: InventoryWeapon[] = [];
  for (const item of list) {
    const w = normalizeWeapon(item);
    if (w !== 'none' && !out.includes(w)) out.push(w);
  }
  return out;
}

function normalizeSkins(list: unknown): SkinId[] {
  if (!Array.isArray(list)) return ['default'];
  const out: SkinId[] = ['default'];
  for (const item of list) {
    if (ALL_SKINS.includes(item as SkinId) && !out.includes(item as SkinId)) {
      out.push(item as SkinId);
    }
  }
  return out;
}

function normalizeSkin(w: unknown, owned: SkinId[]): SkinId {
  const id = ALL_SKINS.includes(w as SkinId) ? (w as SkinId) : 'default';
  return owned.includes(id) ? id : 'default';
}

function normalizeShapes(list: unknown): ShapeId[] {
  if (!Array.isArray(list)) return ['square'];
  const out: ShapeId[] = ['square'];
  for (const item of list) {
    if (ALL_SHAPES.includes(item as ShapeId) && !out.includes(item as ShapeId)) {
      out.push(item as ShapeId);
    }
  }
  return out;
}

function normalizeShape(w: unknown, owned: ShapeId[]): ShapeId {
  const id = ALL_SHAPES.includes(w as ShapeId) ? (w as ShapeId) : 'square';
  return owned.includes(id) ? id : 'square';
}

function normalizeSkills(list: unknown): SkillId[] {
  if (!Array.isArray(list)) return [];
  const out: SkillId[] = [];
  for (const item of list) {
    if (ALL_SKILLS.includes(item as SkillId) && !out.includes(item as SkillId)) {
      out.push(item as SkillId);
    }
  }
  return out;
}

function normalizeEquippedSkill(w: unknown, owned: SkillId[]): EquippedSkill {
  if (w === 'none' || w == null) return 'none';
  if (ALL_SKILLS.includes(w as SkillId) && owned.includes(w as SkillId)) return w as SkillId;
  return 'none';
}

function normalizeSpecials(list: unknown): SpecialId[] {
  if (!Array.isArray(list)) return [];
  const out: SpecialId[] = [];
  for (const item of list) {
    if (ALL_SPECIALS.includes(item as SpecialId) && !out.includes(item as SpecialId)) {
      out.push(item as SpecialId);
    }
  }
  return out;
}

function normalizeEquippedSpecials(
  list: unknown,
  owned: SpecialId[],
  legacySingle?: unknown,
): SpecialId[] {
  const raw = Array.isArray(list)
    ? list
    : legacySingle && legacySingle !== 'none'
      ? [legacySingle]
      : [];
  const out: SpecialId[] = [];
  for (const item of raw) {
    if (
      ALL_SPECIALS.includes(item as SpecialId) &&
      owned.includes(item as SpecialId) &&
      !out.includes(item as SpecialId)
    ) {
      out.push(item as SpecialId);
    }
  }
  return out;
}

function normalizePets(list: unknown): PetId[] {
  if (!Array.isArray(list)) return [];
  const out: PetId[] = [];
  for (const item of list) {
    if (ALL_PETS.includes(item as PetId) && !out.includes(item as PetId)) {
      out.push(item as PetId);
    }
  }
  return out;
}

/** Normalize multi-pet loadout; migrates legacy single `equippedPet`. */
function normalizeEquippedPets(
  list: unknown,
  owned: PetId[],
  legacySingle?: unknown,
): PetId[] {
  let raw: unknown[] = [];
  if (Array.isArray(list)) raw = list;
  else if (legacySingle && legacySingle !== 'none') raw = [legacySingle];
  const out: PetId[] = [];
  for (const item of raw) {
    if (ALL_PETS.includes(item as PetId) && owned.includes(item as PetId) && !out.includes(item as PetId)) {
      out.push(item as PetId);
    }
  }
  // Kitten cannot share the loadout with other pets.
  if (out.includes('kitten') && out.length > 1) {
    return out.filter((p) => p !== 'kitten');
  }
  return out;
}

/** Apply equip rules onto a mutable pets array. */
function applyEquipPet(current: PetId[], id: PetId): PetId[] {
  if (id === 'kitten') return ['kitten'];
  const withoutKitten = current.filter((p) => p !== 'kitten');
  if (withoutKitten.includes(id)) return withoutKitten;
  return [...withoutKitten, id];
}

function normalizeEquippedShields(list: unknown): ShieldId[] {
  if (!Array.isArray(list)) return [];
  const out: ShieldId[] = [];
  for (const item of list) {
    if (ALL_SHIELDS.includes(item as ShieldId) && !out.includes(item as ShieldId)) {
      out.push(item as ShieldId);
    }
  }
  return out;
}

function normalizePassives(list: unknown): PassiveId[] {
  if (!Array.isArray(list)) return [];
  const out: PassiveId[] = [];
  for (const item of list) {
    if (ALL_PASSIVES.includes(item as PassiveId) && !out.includes(item as PassiveId)) {
      out.push(item as PassiveId);
    }
  }
  return out;
}

function normalizeEquippedPassive(v: unknown, owned: PassiveId[]): EquippedPassive {
  if (v === 'none' || v == null) return 'none';
  if (ALL_PASSIVES.includes(v as PassiveId) && owned.includes(v as PassiveId)) return v as PassiveId;
  return 'none';
}

function parseSaveRaw(raw: string | null, fallbackName = ''): SaveData {
  if (!raw) return defaultSave(fallbackName);
  try {
    const data = JSON.parse(raw) as SaveData;
    if (data.version !== 1) return defaultSave(fallbackName);
    const ownedSkins = normalizeSkins(data.ownedSkins);
    const ownedShapes = normalizeShapes(data.ownedShapes);
    const ownedSkills = normalizeSkills(data.ownedSkills);
    const ownedSpecials = normalizeSpecials(data.ownedSpecials);
    const ownedPets = normalizePets(data.ownedPets);
    const ownedPassives = normalizePassives(data.ownedPassives);
    const shieldsConfigured = data.shieldsConfigured === true;
    const legacy = data as SaveData & { equippedSpecial?: unknown; equippedPet?: unknown };
    const playerName =
      typeof data.playerName === 'string' && data.playerName.trim()
        ? data.playerName.trim()
        : fallbackName;
    const merged: SaveData = {
      ...defaultSave(playerName),
      ...data,
      playerName,
      coins: Math.max(0, Math.floor(Number(data.coins) || 0)),
      levels: data.levels ?? {},
      inventory: normalizeInventory(data.inventory),
      equipped: normalizeWeapon(data.equipped),
      ownedSkins,
      equippedSkin: normalizeSkin(data.equippedSkin, ownedSkins),
      ownedShapes,
      equippedShape: normalizeShape(data.equippedShape, ownedShapes),
      ownedSkills,
      equippedSkill: normalizeEquippedSkill(data.equippedSkill, ownedSkills),
      ownedSpecials,
      equippedSpecials: normalizeEquippedSpecials(
        data.equippedSpecials,
        ownedSpecials,
        legacy.equippedSpecial,
      ),
      ownedPets,
      equippedPets: normalizeEquippedPets(data.equippedPets, ownedPets, legacy.equippedPet),
      equippedShields: normalizeEquippedShields(data.equippedShields),
      shieldsConfigured,
      ownedPassives,
      equippedPassive: normalizeEquippedPassive(data.equippedPassive, ownedPassives),
      missileLevel: ownedSpecials.includes('missile')
        ? normalizeMissileLevel(data.missileLevel)
        : 0,
      missileSalvoLevel: ownedSpecials.includes('missile')
        ? normalizeMissileSalvoLevel(data.missileSalvoLevel)
        : 0,
      orbitLevel: ownedSpecials.includes('orbit') ? normalizeOrbitLevel(data.orbitLevel) : 0,
      tutorialAssist: data.tutorialAssist !== false,
      difficulty: normalizeDifficulty(data.difficulty),
    };
    if (isShopFullyOwned(merged)) {
      if (!shieldsConfigured) {
        merged.equippedShields = ['reflect', 'repulse'];
      }
    } else {
      merged.equippedShields = [];
      merged.shieldsConfigured = false;
    }

    merged.unlockedMax = Math.max(merged.unlockedMax, MAX_LEVEL_INDEX);
    const stars = { ...merged.levels };
    for (const level of LEVELS) {
      const prev = stars[level.id] ?? { bestStars: 0, bestTimeMs: null };
      stars[level.id] = {
        bestStars: Math.max(prev.bestStars, 3),
        bestTimeMs: prev.bestTimeMs ?? level.threeStarMs,
      };
    }
    merged.levels = stars;

    if (merged.activeRun) {
      merged.activeRun.weapon = normalizeWeapon(merged.activeRun.weapon);
    }
    if (merged.equipped !== 'none' && !merged.inventory.includes(merged.equipped)) {
      merged.equipped = 'none';
    }
    return merged;
  } catch {
    return defaultSave(fallbackName);
  }
}

/** Move legacy single-slot save into the profile system once. */
function migrateLegacySave(): void {
  const index = loadProfileIndex();
  if (index.names.length > 0) return;
  // Pre-cloud saves lived in localStorage; stage them into the active store.
  const legacy = localStorage.getItem(LEGACY_KEY) ?? store().getItem(LEGACY_KEY);
  if (!legacy) return;
  // Keep raw until the player names this migrated slot.
  store().setItem(`${LEGACY_KEY}:__legacy__`, legacy);
  saveProfileIndex({ active: null, names: [] });
  // Marker so Menu can prompt: has pending legacy.
  store().setItem(`${PROFILE_KEY}:pendingLegacy`, '1');
}

/** One-shot: only the :6001 origin, and only the active profile there. */
const PORT_6001_COIN_GRANT_KEY = 'runcool.devGrant.port6001.1m.v1';
const PORT_6001_COIN_GRANT = 1_000_000;

function maybeGrantPort6001Coins(): void {
  if (authMode !== 'guest') return;
  if (typeof location === 'undefined' || location.port !== '6001') return;
  if (store().getItem(PORT_6001_COIN_GRANT_KEY) === '1') return;
  const index = loadProfileIndex();
  if (!index.active) return;
  const raw = store().getItem(profileSaveKey(index.active));
  const data = parseSaveRaw(raw, index.active);
  data.coins = Math.max(data.coins, PORT_6001_COIN_GRANT);
  store().setItem(profileSaveKey(index.active), JSON.stringify(data));
  store().setItem(PORT_6001_COIN_GRANT_KEY, '1');
}

export const SaveSystem = {
  /** Call once at menu boot. No-op while a cloud profile is active. */
  ensureProfilesReady(): void {
    if (authMode === 'user') return;
    migrateLegacySave();
    maybeGrantPort6001Coins();
  },

  hasPendingLegacy(): boolean {
    return store().getItem(`${PROFILE_KEY}:pendingLegacy`) === '1';
  },

  listProfiles(): string[] {
    return [...loadProfileIndex().names];
  },

  getActiveProfileName(): string | null {
    if (authMode === 'user') return cloudUser?.nickname ?? null;
    return loadProfileIndex().active;
  },

  hasActiveProfile(): boolean {
    if (authMode === 'user') return !!cloudUser;
    return !!loadProfileIndex().active;
  },

  isNameTaken(name: string, except?: string): boolean {
    const id = nameIdentity(name);
    return loadProfileIndex().names.some(
      (n) => nameIdentity(n) === id && (!except || nameIdentity(except) !== id),
    );
  },

  validateName(raw: string, exceptActive = false): NameValidateResult {
    const index = loadProfileIndex();
    const others = exceptActive
      ? index.names.filter((n) => n !== index.active)
      : index.names;
    return normalizePlayerName(raw, others);
  },

  createProfile(rawName: string): NameValidateResult {
    const validated = this.validateName(rawName, false);
    if (!validated.ok) return validated;
    const index = loadProfileIndex();
    const name = validated.name;

    let data = defaultSave(name);
    if (this.hasPendingLegacy()) {
      const legacyRaw = store().getItem(`${LEGACY_KEY}:__legacy__`);
      data = parseSaveRaw(legacyRaw, name);
      data.playerName = name;
      store().removeItem(`${LEGACY_KEY}:__legacy__`);
      store().removeItem(`${PROFILE_KEY}:pendingLegacy`);
      localStorage.removeItem(LEGACY_KEY);
    }

    store().setItem(profileSaveKey(name), JSON.stringify(data));
    index.names.push(name);
    index.active = name;
    saveProfileIndex(index);
    // First profile on :6001 may be created after boot — grant then.
    maybeGrantPort6001Coins();
    return { ok: true, name };
  },

  selectProfile(name: string): boolean {
    const index = loadProfileIndex();
    if (!index.names.includes(name)) return false;
    index.active = name;
    saveProfileIndex(index);
    return true;
  },

  /** Delete the active profile (or named one). Guest mode only. */
  deleteProfile(name?: string): void {
    const index = loadProfileIndex();
    const target = name ?? index.active;
    if (!target) return;
    store().removeItem(profileSaveKey(target));
    index.names = index.names.filter((n) => n !== target);
    if (index.active === target) {
      index.active = index.names[0] ?? null;
    }
    saveProfileIndex(index);
  },

  load(): SaveData {
    if (authMode === 'user' && cloudUser) {
      const cached = parseSaveRaw(localStorage.getItem(CLOUD_KEY), cloudUser.nickname);
      cached.playerName = cloudUser.nickname;
      return cached;
    }
    const index = loadProfileIndex();
    if (!index.active) return defaultSave();
    const raw = store().getItem(profileSaveKey(index.active));
    const data = parseSaveRaw(raw, index.active);
    data.playerName = index.active;
    return data;
  },

  save(data: SaveData): void {
    if (authMode === 'user' && cloudUser) {
      data.playerName = cloudUser.nickname;
      localStorage.setItem(CLOUD_KEY, JSON.stringify(data));
      saveHook?.(data);
      return;
    }
    const index = loadProfileIndex();
    if (!index.active) return;
    data.playerName = index.active;
    store().setItem(profileSaveKey(index.active), JSON.stringify(data));
  },

  /** Clears the active profile's progress (keeps the name / slot). */
  clear(): void {
    if (authMode === 'user' && cloudUser) {
      const data = defaultSave(cloudUser.nickname);
      localStorage.setItem(CLOUD_KEY, JSON.stringify(data));
      saveHook?.(data);
      return;
    }
    const index = loadProfileIndex();
    if (!index.active) return;
    store().setItem(profileSaveKey(index.active), JSON.stringify(defaultSave(index.active)));
  },

  getInventory(): InventoryWeapon[] {
    return this.load().inventory;
  },

  getEquipped(): WeaponType {
    return this.load().equipped;
  },

  addCoins(amount: number): SaveData {
    const data = this.load();
    data.coins += Math.max(0, Math.floor(amount));
    this.save(data);
    return data;
  },

  spendCoins(amount: number): SaveData | null {
    const data = this.load();
    const cost = Math.max(0, Math.floor(amount));
    if (data.coins < cost) return null;
    data.coins -= cost;
    this.save(data);
    return data;
  },

  buySkin(id: SkinId, price: number): { ok: boolean; reason?: string; data: SaveData } {
    const data = this.load();
    if (data.ownedSkins.includes(id)) {
      data.equippedSkin = id;
      this.save(data);
      return { ok: true, data };
    }
    if (data.coins < price) return { ok: false, reason: 'coins', data };
    data.coins -= price;
    data.ownedSkins.push(id);
    data.equippedSkin = id;
    this.save(data);
    return { ok: true, data };
  },

  equipSkin(id: SkinId): SaveData {
    const data = this.load();
    if (!data.ownedSkins.includes(id)) return data;
    data.equippedSkin = id;
    this.save(data);
    return data;
  },

  buyShape(id: ShapeId, price: number): { ok: boolean; reason?: string; data: SaveData } {
    const data = this.load();
    if (data.ownedShapes.includes(id)) {
      data.equippedShape = id;
      this.save(data);
      return { ok: true, data };
    }
    if (data.coins < price) return { ok: false, reason: 'coins', data };
    data.coins -= price;
    data.ownedShapes.push(id);
    data.equippedShape = id;
    this.save(data);
    return { ok: true, data };
  },

  equipShape(id: ShapeId): SaveData {
    const data = this.load();
    if (!data.ownedShapes.includes(id)) return data;
    data.equippedShape = id;
    this.save(data);
    return data;
  },

  buySkill(id: SkillId, price: number): { ok: boolean; reason?: string; data: SaveData } {
    const data = this.load();
    if (data.ownedSkills.includes(id)) {
      data.equippedSkill = id;
      this.save(data);
      return { ok: true, data };
    }
    if (data.coins < price) return { ok: false, reason: 'coins', data };
    data.coins -= price;
    data.ownedSkills.push(id);
    data.equippedSkill = id;
    this.save(data);
    return { ok: true, data };
  },

  equipSkill(id: EquippedSkill): SaveData {
    const data = this.load();
    if (id !== 'none' && !data.ownedSkills.includes(id)) return data;
    data.equippedSkill = id;
    this.save(data);
    return data;
  },

  buySpecial(id: SpecialId, price: number): { ok: boolean; reason?: string; data: SaveData } {
    const data = this.load();
    if (data.ownedSpecials.includes(id)) {
      if (!data.equippedSpecials.includes(id)) data.equippedSpecials.push(id);
      this.save(data);
      return { ok: true, data };
    }
    if (data.coins < price) return { ok: false, reason: 'coins', data };
    data.coins -= price;
    data.ownedSpecials.push(id);
    if (!data.equippedSpecials.includes(id)) data.equippedSpecials.push(id);
    this.save(data);
    return { ok: true, data };
  },

  /** Equip one special without unequipping the other. */
  equipSpecial(id: SpecialId): SaveData {
    const data = this.load();
    if (!data.ownedSpecials.includes(id)) return data;
    if (!data.equippedSpecials.includes(id)) data.equippedSpecials.push(id);
    this.save(data);
    return data;
  },

  unequipSpecial(id: SpecialId): SaveData {
    const data = this.load();
    data.equippedSpecials = data.equippedSpecials.filter((s) => s !== id);
    this.save(data);
    return data;
  },

  isSpecialEquipped(id: SpecialId): boolean {
    return this.load().equippedSpecials.includes(id);
  },

  buyPet(id: PetId, price: number): { ok: boolean; reason?: string; data: SaveData } {
    const data = this.load();
    if (data.ownedPets.includes(id)) {
      data.equippedPets = applyEquipPet(data.equippedPets, id);
      this.save(data);
      return { ok: true, data };
    }
    if (data.coins < price) return { ok: false, reason: 'coins', data };
    data.coins -= price;
    data.ownedPets.push(id);
    data.equippedPets = applyEquipPet(data.equippedPets, id);
    this.save(data);
    return { ok: true, data };
  },

  equipPet(id: PetId): SaveData {
    const data = this.load();
    if (!data.ownedPets.includes(id)) return data;
    data.equippedPets = applyEquipPet(data.equippedPets, id);
    this.save(data);
    return data;
  },

  unequipPet(id: PetId): SaveData {
    const data = this.load();
    data.equippedPets = data.equippedPets.filter((p) => p !== id);
    this.save(data);
    return data;
  },

  /** Unequip every companion. */
  clearPets(): SaveData {
    const data = this.load();
    data.equippedPets = [];
    this.save(data);
    return data;
  },

  isPetEquipped(id: PetId): boolean {
    return this.load().equippedPets.includes(id);
  },

  equipShield(id: ShieldId): SaveData {
    const data = this.load();
    if (!isShopFullyOwned(data)) return data;
    if (!data.equippedShields.includes(id)) data.equippedShields.push(id);
    data.shieldsConfigured = true;
    this.save(data);
    return data;
  },

  unequipShield(id: ShieldId): SaveData {
    const data = this.load();
    data.equippedShields = data.equippedShields.filter((s) => s !== id);
    data.shieldsConfigured = true;
    this.save(data);
    return data;
  },

  isShieldEquipped(id: ShieldId): boolean {
    const data = this.load();
    return isShopFullyOwned(data) && data.equippedShields.includes(id);
  },

  buyPassive(id: PassiveId, price: number): { ok: boolean; reason?: string; data: SaveData } {
    const data = this.load();
    if (data.ownedPassives.includes(id)) {
      data.equippedPassive = id;
      this.save(data);
      return { ok: true, data };
    }
    if (data.coins < price) return { ok: false, reason: 'coins', data };
    data.coins -= price;
    data.ownedPassives.push(id);
    data.equippedPassive = id;
    this.save(data);
    return { ok: true, data };
  },

  equipPassive(id: EquippedPassive): SaveData {
    const data = this.load();
    if (id !== 'none' && !data.ownedPassives.includes(id)) return data;
    data.equippedPassive = id;
    this.save(data);
    return data;
  },

  setTutorialAssist(enabled: boolean): SaveData {
    const data = this.load();
    data.tutorialAssist = enabled;
    this.save(data);
    return data;
  },

  setDifficulty(id: DifficultyId): SaveData {
    const data = this.load();
    data.difficulty = normalizeDifficulty(id);
    this.save(data);
    return data;
  },

  /** Upgrade missile cooldown one level. Costs `price` coins. */
  upgradeMissile(price: number): { ok: boolean; reason?: string; data: SaveData } {
    const data = this.load();
    if (!data.ownedSpecials.includes('missile')) {
      return { ok: false, reason: 'owned', data };
    }
    if (data.missileLevel >= MISSILE_LEVEL_CAP) {
      return { ok: false, reason: 'max', data };
    }
    if (data.coins < price) return { ok: false, reason: 'coins', data };
    data.coins -= price;
    data.missileLevel += 1;
    this.save(data);
    return { ok: true, data };
  },

  /** Upgrade missile salvo one level (+0.5 missiles/shot). Costs `price` coins. */
  upgradeMissileSalvo(price: number): { ok: boolean; reason?: string; data: SaveData } {
    const data = this.load();
    if (!data.ownedSpecials.includes('missile')) {
      return { ok: false, reason: 'owned', data };
    }
    if (data.missileSalvoLevel >= MISSILE_SALVO_LEVEL_CAP) {
      return { ok: false, reason: 'max', data };
    }
    if (data.coins < price) return { ok: false, reason: 'coins', data };
    data.coins -= price;
    data.missileSalvoLevel += 1;
    this.save(data);
    return { ok: true, data };
  },

  /** Upgrade orbit-missile storage one level (+1 capacity). Costs `price` coins. */
  upgradeOrbit(price: number): { ok: boolean; reason?: string; data: SaveData } {
    const data = this.load();
    if (!data.ownedSpecials.includes('orbit')) {
      return { ok: false, reason: 'owned', data };
    }
    if (data.orbitLevel >= ORBIT_LEVEL_CAP) {
      return { ok: false, reason: 'max', data };
    }
    if (data.coins < price) return { ok: false, reason: 'coins', data };
    data.coins -= price;
    data.orbitLevel += 1;
    this.save(data);
    return { ok: true, data };
  },

  collectWeapon(weapon: InventoryWeapon): SaveData {
    const data = this.load();
    if (!data.inventory.includes(weapon)) data.inventory.push(weapon);
    data.equipped = weapon;
    if (data.activeRun) data.activeRun.weapon = weapon;
    this.save(data);
    return data;
  },

  equipWeapon(weapon: WeaponType): SaveData {
    const data = this.load();
    if (weapon !== 'none' && !data.inventory.includes(weapon)) return data;
    data.equipped = weapon;
    if (data.activeRun) data.activeRun.weapon = weapon;
    this.save(data);
    return data;
  },

  startRun(levelId: string): SaveData {
    const data = this.load();
    data.activeRun = {
      levelId,
      checkpointIndex: -1,
      elapsedMs: 0,
      deaths: 0,
      weapon: data.equipped,
    };
    this.save(data);
    return data;
  },

  updateRun(partial: Partial<NonNullable<SaveData['activeRun']>>): SaveData {
    const data = this.load();
    if (!data.activeRun) return data;
    data.activeRun = { ...data.activeRun, ...partial };
    if (partial.weapon !== undefined) {
      data.equipped = normalizeWeapon(partial.weapon);
    }
    this.save(data);
    return data;
  },

  completeLevel(levelId: string, stars: number, timeMs: number, levelIndex: number): SaveData {
    const data = this.load();
    const prev = data.levels[levelId] ?? { bestStars: 0, bestTimeMs: null };
    data.levels[levelId] = {
      bestStars: Math.max(prev.bestStars, stars),
      bestTimeMs:
        prev.bestTimeMs == null ? timeMs : Math.min(prev.bestTimeMs, timeMs),
    };
    data.unlockedMax = Math.max(data.unlockedMax, levelIndex + 1);
    data.activeRun = null;
    this.save(data);
    return data;
  },

  allWeaponSlots(): InventoryWeapon[] {
    return [...ALL_WEAPONS];
  },

  // —— Cloud (logged-in) mode management, driven by CloudSync ——

  getMode(): AuthMode {
    return authMode;
  },

  getCloudUser(): CloudUser | null {
    return cloudUser;
  },

  /** Register a hook fired after every save in user mode (used by CloudSync). */
  setSaveHook(fn: ((data: SaveData) => void) | null): void {
    saveHook = fn;
  },

  /**
   * Switch to the logged-in profile. `data` may be raw/untrusted server JSON or
   * a merged save — it is normalized through parseSaveRaw on the next load().
   */
  enterUserMode(user: CloudUser, data: SaveData | null): void {
    authMode = 'user';
    cloudUser = user;
    const normalized = data
      ? parseSaveRaw(JSON.stringify(data), user.nickname)
      : defaultSave(user.nickname);
    normalized.playerName = user.nickname;
    localStorage.setItem(CLOUD_KEY, JSON.stringify(normalized));
  },

  /** Return to guest mode; guest sessionStorage profiles stay intact. */
  exitUserMode(): void {
    authMode = 'guest';
    cloudUser = null;
    localStorage.removeItem(CLOUD_KEY);
  },
};
