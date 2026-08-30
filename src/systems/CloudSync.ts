/**
 * Cloud save orchestration for logged-in Y8 users.
 *
 * Flow: Y8 access token → backend JWT (`POST /api/auth/y8`) → pull server save
 * → merge with guest progress (field-wise, keep the better value) → switch
 * SaveSystem into user mode → push merged save. Every `SaveSystem.save()` in
 * user mode is debounced and pushed to `PUT /api/save`; pagehide flushes with
 * `keepalive`. Failures degrade to local-cache-only play, never block gameplay.
 */

import { SaveSystem, type SaveData } from './SaveSystem';
import { Y8Auth, type Y8User } from './Y8Auth';
import { ZH } from '../i18n/zh';

const JWT_KEY = 'runcool.jwt.v1';
const PUSH_DEBOUNCE_MS = 2000;
const MAX_RETRIES = 5;

export type SyncStatus = 'idle' | 'syncing' | 'error';

let status: SyncStatus = 'idle';
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let pendingPush: SaveData | null = null;
let retryCount = 0;

let readySettled = false;
const menuWaiters: Array<() => void> = [];
const modeListeners: Array<() => void> = [];
const authMsgListeners: Array<(msg: string) => void> = [];
let pendingUser: Y8User | null = null;
let loggingIn = false;
/** Set when the player clicks the in-game login button; clears on any auth event. */
let loginAttempted = false;

/** Login-failure hint depends on where the game is running. */
function loginFailHint(): string {
  return Y8Auth.isY8Host() ? ZH.y8LoginFailed : ZH.y8LoginDevHint;
}

function emitAuthMessage(msg: string): void {
  authMsgListeners.forEach((fn) => fn(msg));
}

// ——— low-level API ———

function authHeaders(): Record<string, string> {
  const token = sessionStorage.getItem(JWT_KEY) ?? '';
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function isUnauthorized(err: unknown): boolean {
  return err instanceof Error && err.message === 'unauthorized';
}

async function exchangeJwt(user: Y8User): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/y8', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken: user.accessToken }),
    });
    if (!res.ok) return false;
    const body = (await res.json()) as { token: string };
    if (!body?.token) return false;
    sessionStorage.setItem(JWT_KEY, body.token);
    return true;
  } catch {
    return false;
  }
}

type SaveResponse = { data: SaveData; updatedAt: string };

async function getSave(): Promise<SaveResponse | 'unauthorized' | null> {
  const res = await fetch('/api/save', { headers: authHeaders() });
  if (res.status === 401) return 'unauthorized';
  if (res.status === 404) return null; // no server save yet
  if (!res.ok) throw new Error(`GET /api/save ${res.status}`);
  return (await res.json()) as SaveResponse;
}

async function putSave(data: SaveData, keepalive = false): Promise<void> {
  const res = await fetch('/api/save', {
    method: 'PUT',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ data }),
    keepalive,
  });
  if (res.status === 401) throw new Error('unauthorized');
  if (!res.ok) throw new Error(`PUT /api/save ${res.status}`);
}

// ——— guest → user merge (field-wise, keep the better value) ———

function union<T>(a: T[] | undefined, b: T[] | undefined): T[] {
  const out: T[] = [];
  for (const item of [...(a ?? []), ...(b ?? [])]) {
    if (!out.includes(item)) out.push(item);
  }
  return out;
}

function mergeSaves(server: SaveData, guest: SaveData): SaveData {
  const levelIds = new Set([
    ...Object.keys(server.levels ?? {}),
    ...Object.keys(guest.levels ?? {}),
  ]);
  const levels: SaveData['levels'] = {};
  for (const id of levelIds) {
    const s = server.levels?.[id];
    const g = guest.levels?.[id];
    const times = [s?.bestTimeMs, g?.bestTimeMs].filter(
      (t): t is number => typeof t === 'number',
    );
    levels[id] = {
      bestStars: Math.max(s?.bestStars ?? 0, g?.bestStars ?? 0),
      bestTimeMs: times.length ? Math.min(...times) : null,
    };
  }

  return {
    ...server,
    coins: Math.max(server.coins ?? 0, guest.coins ?? 0),
    unlockedMax: Math.max(server.unlockedMax ?? 0, guest.unlockedMax ?? 0),
    missileLevel: Math.max(server.missileLevel ?? 0, guest.missileLevel ?? 0),
    missileSalvoLevel: Math.max(server.missileSalvoLevel ?? 0, guest.missileSalvoLevel ?? 0),
    orbitLevel: Math.max(server.orbitLevel ?? 0, guest.orbitLevel ?? 0),
    inventory: union(server.inventory, guest.inventory),
    ownedSkins: union(server.ownedSkins, guest.ownedSkins),
    ownedShapes: union(server.ownedShapes, guest.ownedShapes),
    ownedSkills: union(server.ownedSkills, guest.ownedSkills),
    ownedSpecials: union(server.ownedSpecials, guest.ownedSpecials),
    ownedPets: union(server.ownedPets, guest.ownedPets),
    ownedPassives: union(server.ownedPassives, guest.ownedPassives),
    // Guest just played: prefer its equip choices; SaveSystem normalizes
    // anything the merged ownership no longer covers.
    equipped: guest.equipped ?? server.equipped,
    equippedSkin: guest.equippedSkin ?? server.equippedSkin,
    equippedShape: guest.equippedShape ?? server.equippedShape,
    equippedSkill: guest.equippedSkill ?? server.equippedSkill,
    equippedSpecials: union(guest.equippedSpecials, server.equippedSpecials),
    equippedPets: union(guest.equippedPets, server.equippedPets),
    equippedPassive:
      guest.equippedPassive && guest.equippedPassive !== 'none'
        ? guest.equippedPassive
        : server.equippedPassive,
    shieldsConfigured: server.shieldsConfigured || guest.shieldsConfigured,
    equippedShields: union(guest.equippedShields, server.equippedShields),
    tutorialAssist: guest.tutorialAssist ?? server.tutorialAssist,
    difficulty: guest.difficulty ?? server.difficulty,
    levels,
    activeRun: guest.activeRun ?? server.activeRun ?? null,
  } as SaveData;
}

// ——— login / logout orchestration ———

function fireModeListeners(): void {
  modeListeners.forEach((fn) => fn());
}

function settleReady(): void {
  readySettled = true;
  menuWaiters.splice(0).forEach((fn) => fn());
}

function logoutToGuest(): void {
  SaveSystem.exitUserMode();
  sessionStorage.removeItem(JWT_KEY);
  status = 'idle';
  fireModeListeners();
}

async function loginAndSync(user: Y8User): Promise<void> {
  if (SaveSystem.getMode() === 'user' || loggingIn) return;
  loginAttempted = false;
  // SDK failures surface as a user object without a token — never hit the API
  // with an empty accessToken (it would 400), just tell the player.
  if (!user.accessToken) {
    status = 'error';
    emitAuthMessage(loginFailHint());
    return;
  }
  loggingIn = true;
  try {
    if (!(await exchangeJwt(user))) throw new Error('jwt exchange failed');

    // Snapshot guest progress BEFORE switching storage backends.
    const guestSave = SaveSystem.hasActiveProfile() ? SaveSystem.load() : null;

    let remote = await getSave();
    if (remote === 'unauthorized') {
      if (!(await exchangeJwt(user))) throw new Error('re-auth failed');
      remote = await getSave();
      if (remote === 'unauthorized') throw new Error('unauthorized');
    }
    const serverSave = remote ? remote.data : null;

    const merged =
      serverSave && guestSave
        ? mergeSaves(serverSave, guestSave)
        : (serverSave ?? guestSave);

    SaveSystem.enterUserMode({ id: user.id, nickname: user.nickname || 'Player' }, merged);

    // Push immediately when there was no server save or guest data merged in.
    if (!remote || guestSave) {
      await putSave(SaveSystem.load());
    }
    status = 'idle';
    retryCount = 0;
    fireModeListeners();
  } catch (err) {
    status = 'error';
    emitAuthMessage(loginFailHint());
    console.warn('[CloudSync] login failed, staying as guest:', err);
  } finally {
    loggingIn = false;
  }
}

function handleAuth(user: Y8User | null, error?: unknown): void {
  if (error) {
    if (loginAttempted) emitAuthMessage(loginFailHint());
    loginAttempted = false;
    settleReady();
    return;
  }
  if (!user) {
    loginAttempted = false;
    if (SaveSystem.getMode() === 'user') logoutToGuest();
    settleReady();
    return;
  }
  if (SaveSystem.getMode() === 'user') {
    loginAttempted = false;
    settleReady();
    return;
  }
  // Mid-run: don't flip storage under an active run; MenuScene processes it
  // on the next safe return to the menu.
  if (SaveSystem.load().activeRun) {
    pendingUser = user;
    settleReady();
    return;
  }
  void loginAndSync(user).finally(() => settleReady());
}

// ——— push pipeline ———

function schedulePush(data: SaveData): void {
  if (SaveSystem.getMode() !== 'user') return;
  pendingPush = data;
  status = 'syncing';
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => void doPush(false), PUSH_DEBOUNCE_MS);
}

async function doPush(keepalive: boolean): Promise<void> {
  const data = pendingPush;
  pendingPush = null;
  if (!data) {
    status = 'idle';
    return;
  }
  try {
    await putSave(data, keepalive);
    retryCount = 0;
    status = 'idle';
  } catch (err) {
    if (isUnauthorized(err)) {
      const user = Y8Auth.getUser();
      if (user && (await exchangeJwt(user))) {
        pendingPush = data;
        await doPush(keepalive);
        return;
      }
      status = 'error';
      console.warn('[CloudSync] session expired; progress kept locally');
      return;
    }
    pendingPush = data; // keep for retry
    retryCount += 1;
    if (retryCount <= MAX_RETRIES && !keepalive) {
      const delay = Math.min(30_000, 1000 * 2 ** retryCount);
      status = 'syncing';
      pushTimer = setTimeout(() => void doPush(false), delay);
    } else {
      status = 'error';
      console.warn('[CloudSync] push failed; progress kept locally:', err);
    }
  }
}

function flush(keepalive: boolean): void {
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }
  const data = pendingPush;
  pendingPush = null;
  if (!data || SaveSystem.getMode() !== 'user') return;
  void doPush(keepalive);
}

// ——— public surface ———

export const CloudSync = {
  init(): void {
    SaveSystem.setSaveHook(schedulePush);
    Y8Auth.onChange(handleAuth);
    Y8Auth.init();
    // Y8Auth.init() may have resolved a mock user synchronously.
    const initial = Y8Auth.getUser();
    if (initial) handleAuth(initial);

    window.addEventListener('pagehide', () => flush(true));
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flush(true);
    });
  },

  /**
   * MenuScene calls this before rendering menu UI. The callback runs once the
   * initial auth determination is known and any deferred login is processed.
   */
  beforeMenu(cb: () => void): void {
    if (pendingUser) {
      const user = pendingUser;
      pendingUser = null;
      void loginAndSync(user)
        .catch(() => undefined)
        .finally(cb);
      return;
    }
    if (!readySettled) {
      menuWaiters.push(cb);
      return;
    }
    cb();
  },

  /** Fired on every guest↔user transition (login completed or logout). */
  onModeChange(cb: () => void): void {
    modeListeners.push(cb);
  },

  /** Fired when a login attempt fails; UI should surface `msg` to the player. */
  onAuthMessage(cb: (msg: string) => void): void {
    authMsgListeners.push(cb);
  },

  login(): void {
    // Real login works on any origin whose link/redirect_uri is registered in
    // the Y8 app console (https://account.y8.com/applications) — including
    // localhost. On failure the SDK fires onAuth with an error/no-token user
    // and we surface a hint instead of hitting the API.
    if (!Y8Auth.isAvailable()) {
      emitAuthMessage(loginFailHint());
      return;
    }
    loginAttempted = true;
    Y8Auth.login();
  },

  logout(): void {
    if (SaveSystem.getMode() !== 'user') return;
    Y8Auth.logout();
    // Fallback if the SDK doesn't emit onAuth(null) on this host.
    logoutToGuest();
  },

  getStatus(): SyncStatus {
    return status;
  },

  isCloud(): boolean {
    return SaveSystem.getMode() === 'user';
  },
};
