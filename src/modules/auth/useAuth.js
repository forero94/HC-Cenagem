import { cenagemApi, setAuthTokens, clearAuthTokens } from '@/lib/apiClient';
import { storage } from '@/modules/shared/utils/storage';

const AUTH_STATE_KEY = 'cenagem_auth_state_v1';
const AUTH_EVENT_TOKEN_UPDATE = 'cenagem:auth:updateTokens';
const AUTH_EVENT_CLEAR = 'cenagem:auth:clear';

let hydrated = false;
let cachedState = null;

const normalizeState = (maybeState) => {
  if (
    maybeState &&
    maybeState.tokens &&
    typeof maybeState.tokens.accessToken === 'string' &&
    maybeState.tokens.accessToken.trim()
  ) {
    return {
      tokens: {
        accessToken: maybeState.tokens.accessToken,
        refreshToken: maybeState.tokens.refreshToken ?? null,
        expiresIn: maybeState.tokens.expiresIn ?? null,
        refreshExpiresIn: maybeState.tokens.refreshExpiresIn ?? null,
      },
      user: maybeState.user ?? null,
    };
  }
  return null;
};

const hydrate = () => {
  if (hydrated) {
    return cachedState;
  }
  const stored = normalizeState(storage.get(AUTH_STATE_KEY, null));
  if (stored) {
    setAuthTokens(stored.tokens);
  } else {
    storage.remove(AUTH_STATE_KEY);
    clearAuthTokens();
  }
  cachedState = stored;
  hydrated = true;
  return cachedState;
};

const persistState = (state) => {
  const normalized = normalizeState(state);
  cachedState = normalized;
  hydrated = true;
  if (!normalized) {
    storage.remove(AUTH_STATE_KEY);
    clearAuthTokens();
    return;
  }
  storage.set(AUTH_STATE_KEY, normalized);
  setAuthTokens(normalized.tokens);
};

if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener(AUTH_EVENT_TOKEN_UPDATE, (event) => {
    const detail = event?.detail ?? null;
    if (!detail || typeof detail.accessToken !== 'string') {
      persistState(null);
      return;
    }
    const current = hydrate();
    persistState({
      tokens: {
        accessToken: detail.accessToken,
        refreshToken:
          detail.refreshToken ?? current?.tokens?.refreshToken ?? null,
        expiresIn: detail.expiresIn ?? null,
        refreshExpiresIn: detail.refreshExpiresIn ?? null,
      },
      user: current?.user ?? null,
    });
  });

  window.addEventListener(AUTH_EVENT_CLEAR, () => {
    persistState(null);
  });
}

export const getUser = () => {
  const state = hydrate();
  return state?.user ?? null;
};

export const login = async (email, password) => {
  const credentials = { email, password };
  try {
    const tokenPair = await cenagemApi.login(credentials);
    setAuthTokens(tokenPair);
    const user = await cenagemApi.getCurrentUser();
    persistState({
      tokens: tokenPair,
      user,
    });
    return user;
  } catch (error) {
    clearAuthTokens();
    persistState(null);
    throw error;
  }
};

export const logout = async () => {
  try {
    await cenagemApi.logout();
  } catch {
    // Ignore API failures on logout to avoid locking the user in.
  } finally {
    persistState(null);
  }
};
