export type WeaponType = 'none' | 'glove' | 'peashooter' | 'hammer' | 'fireball' | 'shotgun';
export type InventoryWeapon = Exclude<WeaponType, 'none'>;

export type SaveData = {
  version: 1;
  unlockedMax: number;
  /** Owned weapons collected across runs (persisted). */
  inventory: InventoryWeapon[];
  /** Currently equipped weapon. */
  equipped: WeaponType;
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

function defaultSave(): SaveData {
  return {
    version: 1,
    unlockedMax: 1,
    inventory: [],
    equipped: 'none',
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

export const SaveSystem = {
  load(): SaveData {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaultSave();
      const data = JSON.parse(raw) as SaveData;
      if (data.version !== 1) return defaultSave();
      const merged: SaveData = {
        ...defaultSave(),
        ...data,
        levels: data.levels ?? {},
        inventory: normalizeInventory(data.inventory),
        equipped: normalizeWeapon(data.equipped),
      };
      if (merged.activeRun) {
        merged.activeRun.weapon = normalizeWeapon(merged.activeRun.weapon);
      }
      // If equipped isn't owned and isn't bare hands, reset.
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

  /** Add weapon to backpack and equip it. */
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

  /** Slot order for backpack UI. */
  allWeaponSlots(): InventoryWeapon[] {
    return [...ALL_WEAPONS];
  },
};
