export type WeaponType = 'none' | 'glove' | 'peashooter' | 'hammer' | 'fireball' | 'shotgun';
export type InventoryWeapon = Exclude<WeaponType, 'none'>;
/** Color tint id (shop “颜色”). */
export type SkinId = 'default' | 'sky' | 'mint' | 'grape' | 'sun';
/** Body shape id (shop “形状”). */
export type ShapeId = 'square' | 'round' | 'diamond' | 'triangle' | 'pill' | 'hex';
export type SkillId = 'blink' | 'haste' | 'flight';
export type EquippedSkill = SkillId | 'none';

export type SaveData = {
  version: 1;
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

const KEY = 'runcool.save.v1';
const ALL_WEAPONS: InventoryWeapon[] = ['glove', 'peashooter', 'hammer', 'fireball', 'shotgun'];
const ALL_SKINS: SkinId[] = ['default', 'sky', 'mint', 'grape', 'sun'];
const ALL_SHAPES: ShapeId[] = ['square', 'round', 'diamond', 'triangle', 'pill', 'hex'];
const ALL_SKILLS: SkillId[] = ['blink', 'haste', 'flight'];

function defaultSave(): SaveData {
  return {
    version: 1,
    unlockedMax: 1,
    coins: 0,
    inventory: [],
    equipped: 'none',
    ownedSkins: ['default'],
    equippedSkin: 'default',
    ownedShapes: ['square'],
    equippedShape: 'square',
    ownedSkills: [],
    equippedSkill: 'none',
    levels: {},
    activeRun: null,
  };
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

export const SaveSystem = {
  load(): SaveData {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaultSave();
      const data = JSON.parse(raw) as SaveData;
      if (data.version !== 1) return defaultSave();
      const ownedSkins = normalizeSkins(data.ownedSkins);
      const ownedShapes = normalizeShapes(data.ownedShapes);
      const ownedSkills = normalizeSkills(data.ownedSkills);
      const merged: SaveData = {
        ...defaultSave(),
        ...data,
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
      };
      if (merged.activeRun) {
        merged.activeRun.weapon = normalizeWeapon(merged.activeRun.weapon);
      }
      if (merged.equipped !== 'none' && !merged.inventory.includes(merged.equipped)) {
        merged.equipped = 'none';
      }
      return merged;
    } catch {
      return defaultSave();
    }
  },

  save(data: SaveData): void {
    localStorage.setItem(KEY, JSON.stringify(data));
  },

  clear(): void {
    localStorage.removeItem(KEY);
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
};
