export type WeaponType = 'none' | 'glove' | 'peashooter';

export type SaveData = {
  version: 1;
  unlockedMax: number;
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

function defaultSave(): SaveData {
  return {
    version: 1,
    unlockedMax: 1,
    levels: {},
    activeRun: null,
  };
}

export const SaveSystem = {
  load(): SaveData {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaultSave();
      const data = JSON.parse(raw) as SaveData;
      if (data.version !== 1) return defaultSave();
      return {
        ...defaultSave(),
        ...data,
        levels: data.levels ?? {},
      };
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

  startRun(levelId: string, weapon: WeaponType = 'none'): SaveData {
    const data = this.load();
    data.activeRun = {
      levelId,
      checkpointIndex: -1,
      elapsedMs: 0,
      deaths: 0,
      weapon,
    };
    this.save(data);
    return data;
  },

  updateRun(partial: Partial<NonNullable<SaveData['activeRun']>>): SaveData {
    const data = this.load();
    if (!data.activeRun) return data;
    data.activeRun = { ...data.activeRun, ...partial };
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
};
