/**
 * Thin wrapper around the Y8 SDK auth surface.
 *
 * index.html dispatches a `y8:auth` CustomEvent from `y8Sdk.onAuth`; this module
 * normalizes it into typed user objects. A `?mockuser=1` URL param simulates a
 * logged-in user for local development (backend must run with
 * NODE_ENV !== 'production' to accept the mock token).
 */

export type Y8User = {
  /** Stable Y8 user id (pid). */
  id: string;
  nickname: string;
  /** Short-lived Y8 access token; exchanged server-side for our own JWT. */
  accessToken: string;
};

type AuthListener = (user: Y8User | null, error?: unknown) => void;

declare global {
  interface Window {
    // Y8 minimal SDK, loaded async in index.html.
    y8?: {
      sdk?: () => {
        login?: () => void;
        logout?: () => void;
        getUser?: () => unknown;
      } | null;
      emitReadyEvent?: () => void;
    };
  }
}

const listeners = new Set<AuthListener>();
let currentUser: Y8User | null = null;
let readyResolved = false;
const readyWaiters: Array<() => void> = [];
let initialized = false;

function sdk(): ReturnType<NonNullable<NonNullable<Window['y8']>['sdk']>> | null {
  try {
    return window.y8?.sdk?.() ?? null;
  } catch {
    return null;
  }
}

function resolveReadyOnce(): void {
  if (readyResolved) return;
  readyResolved = true;
  readyWaiters.splice(0).forEach((fn) => fn());
}

function emit(user: Y8User | null, error?: unknown): void {
  currentUser = user;
  resolveReadyOnce();
  listeners.forEach((fn) => fn(user, error));
}

/** Normalize whatever the SDK put into onAuth's `user` argument. */
function extractUser(raw: unknown): Y8User | null {
  if (!raw || typeof raw !== 'object') return null;
  const u = raw as Record<string, any>;
  const auth = (u.authResponse ?? {}) as Record<string, any>;
  const details = (u.details ?? auth.details ?? {}) as Record<string, any>;
  const id = u.pid ?? u.id ?? u.userId ?? u.user_id ?? u.uid ?? details.pid ?? auth.pid;
  const nickname = u.nickname ?? u.name ?? u.first_name ?? details.nickname ?? details.first_name;
  const accessToken =
    u.accessToken ?? u.access_token ?? auth.accessToken ?? auth.access_token ?? '';
  if ((id === undefined || id === null || id === '') && !nickname) return null;
  return {
    id: String(id ?? nickname),
    nickname: String(nickname ?? 'Player'),
    accessToken: String(accessToken),
  };
}

function initOnce(): void {
  if (initialized) return;
  initialized = true;

  // Dev-only mock login.
  try {
    if (new URLSearchParams(window.location.search).has('mockuser')) {
      const nickname = '云存档测试';
      emit({ id: 'mock-user', nickname, accessToken: `mock.mock-user.${encodeURIComponent(nickname)}` });
      return;
    }
  } catch {
    /* ignore */
  }

  // Real SDK events bridged from index.html.
  window.addEventListener('y8:auth', (ev) => {
    const detail = (ev as CustomEvent).detail ?? {};
    emit(extractUser(detail.user), detail.error);
  });

  // If the SDK never loads (non-Y8 host / offline), settle as guest.
  window.setTimeout(resolveReadyOnce, 3000);
}

export const Y8Auth = {
  init: initOnce,

  getUser(): Y8User | null {
    return currentUser;
  },

  /** Subscribe to future auth changes (does not replay the current user). */
  onChange(fn: AuthListener): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  /** Resolves once the initial auth determination is known (null = guest). */
  ready(): Promise<Y8User | null> {
    return new Promise((resolve) => {
      if (readyResolved) {
        resolve(currentUser);
        return;
      }
      readyWaiters.push(() => resolve(currentUser));
    });
  },

  /** Whether the real SDK (with its login dialog) is usable on this host. */
  isAvailable(): boolean {
    return !!sdk();
  },

  /**
   * Whether the page runs inside Y8's network of portals. The SDK's OAuth
   * flow (redirect / iframe) only completes on these hosts — on localhost it
   * fails with "states do not match" / CSP frame-ancestors violations.
   */
  isY8Host(): boolean {
    try {
      return /(^|\.)(y8\.com|pog\.com|gamepost\.com|dollmania\.com)$/.test(
        window.location.hostname,
      );
    } catch {
      return false;
    }
  },

  login(): void {
    try {
      sdk()?.login?.();
    } catch (err) {
      console.warn('[Y8Auth] login failed', err);
    }
  },

  logout(): void {
    try {
      sdk()?.logout?.();
    } catch (err) {
      console.warn('[Y8Auth] logout failed', err);
    }
  },
};
