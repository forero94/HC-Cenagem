const DEFAULT_API_PREFIX = '/api/v1';
const AUTH_EVENT_TOKEN_UPDATE = 'cenagem:auth:updateTokens';
const AUTH_EVENT_CLEAR = 'cenagem:auth:clear';

let authTokens = null;
let refreshPromise = null;

const trimTrailingSlash = (value) => value.replace(/\/+$/, '');

const resolveApiBase = () => {
  const raw = import.meta.env?.VITE_API_BASE_URL;
  if (typeof raw === 'string' && raw.trim()) {
    const trimmed = raw.trim();
    // Absolute URL provided
    if (/^https?:\/\//i.test(trimmed)) {
      if (typeof window !== 'undefined' && trimmed.includes('localhost')) {
        try {
          const url = new URL(trimmed);
          const currentHost = window.location.hostname;
          if (currentHost && !['localhost', '127.0.0.1'].includes(currentHost)) {
            url.hostname = currentHost;
            return trimTrailingSlash(`${url.origin}${url.pathname}`);
          }
        } catch {
          // Fallback to the provided URL when parsing fails
        }
      }
      return trimTrailingSlash(trimmed);
    }
    // Relative URL (`/api/v1`) or bare prefix (`api/v1`)
    if (trimmed.startsWith('/')) {
      return trimTrailingSlash(trimmed);
    }
    return trimTrailingSlash(`/${trimmed}`);
  }

  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    const port = import.meta.env?.VITE_API_PORT || '3000';
    const prefix = import.meta.env?.VITE_API_PREFIX || DEFAULT_API_PREFIX;
    const normalizedPrefix = prefix.startsWith('/') ? prefix : `/${prefix}`;
    const normalizedPort = port ? `:${port}` : '';
    return trimTrailingSlash(`${protocol}//${hostname}${normalizedPort}${normalizedPrefix}`);
  }

  return trimTrailingSlash(`http://localhost:3000${DEFAULT_API_PREFIX}`);
};

const API_BASE = resolveApiBase();

const dispatchAuthEvent = (type, detail) => {
  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') {
    return;
  }
  try {
    window.dispatchEvent(new CustomEvent(type, { detail }));
  } catch {
    // Older browsers without CustomEvent constructor support.
    try {
      const event = document.createEvent('CustomEvent');
      event.initCustomEvent(type, false, false, detail);
      window.dispatchEvent(event);
    } catch {
      // Ignore dispatch failures.
    }
  }
};

const shouldSkipAuthRetry = (path) => path.startsWith('/auth/');

const isFormData = (value) =>
  typeof FormData !== 'undefined' && value instanceof FormData;

const refreshAccessToken = async () => {
  if (!authTokens?.refreshToken) {
    throw new Error('Missing refresh token');
  }

  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const response = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken: authTokens.refreshToken }),
        });

        if (!response.ok) {
          const error = new Error(`Refresh failed (${response.status})`);
          error.status = response.status;
          throw error;
        }

        const tokenPair = await response.json();
        setAuthTokens(tokenPair);
        dispatchAuthEvent(AUTH_EVENT_TOKEN_UPDATE, tokenPair);
        return tokenPair;
      } catch (error) {
        clearAuthTokens();
        dispatchAuthEvent(AUTH_EVENT_CLEAR);
        console.warn('[auth] Token refresh failed', error);
        throw error;
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
};

export const setAuthTokens = (tokens) => {
  authTokens = tokens
    ? {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn ?? null,
        refreshExpiresIn: tokens.refreshExpiresIn ?? null,
      }
    : null;
};

export const getAuthTokens = () => authTokens;

export const clearAuthTokens = () => {
  authTokens = null;
};

function buildQuery(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (
      value === undefined ||
      value === null ||
      (typeof value === 'string' && value.trim() === '')
    ) {
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null) {
          query.append(key, String(item));
        }
      });
    } else {
      query.append(key, String(value));
    }
  });
  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

async function request(path, options = {}) {
  const { _retry, ...fetchOptions } = options;
  const url = `${API_BASE}${path}`;
  const headers = new Headers(fetchOptions.headers || undefined);
  const init = { ...fetchOptions, headers };

  if (!headers.has('Content-Type') && !isFormData(fetchOptions.body)) {
    headers.set('Content-Type', 'application/json');
  }

  const publicPaths = ['/auth/login', '/auth/refresh', '/auth/upload-ticket'];
  if (authTokens?.accessToken && !publicPaths.includes(path)) {
    headers.set('Authorization', `Bearer ${authTokens.accessToken}`);
  }

  let response;
  try {
    response = await fetch(url, init);
  } catch (cause) {
    console.error('[api] Network error', { path, url, method: init.method ?? 'GET', cause });
    const networkError = new Error('No se pudo conectar con la API de CENAGEM.');
    networkError.cause = cause;
    networkError.status = 0;
    throw networkError;
  }

  if (
    response.status === 401 &&
    authTokens?.refreshToken &&
    !_retry &&
    !shouldSkipAuthRetry(path)
  ) {
    try {
      await refreshAccessToken();
      return request(path, { ...fetchOptions, _retry: true });
    } catch {
      // Fall through to the standard 401 handling below.
    }
  }

  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`;
    let errorPayload;
    try {
      errorPayload = await response.json();
      if (errorPayload?.message) {
        message = Array.isArray(errorPayload.message)
          ? errorPayload.message.join(', ')
          : errorPayload.message;
      }
    } catch {
      // ignore parse error
    }
    const error = new Error(message);
    error.status = response.status;
    const info = {
      method: init.method ?? 'GET',
      path,
      url,
      status: response.status,
      statusText: response.statusText,
      payload: errorPayload,
    };
    error.info = info;
    if (response.status === 401) {
      console.warn('[api] Unauthorized response', info);
    } else if (response.status >= 500) {
      console.error('[api] Server error response', info);
    } else {
      console.debug('[api] Request failed', info);
    }
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  return response.arrayBuffer();
}

export const cenagemApi = {
  login(credentials) {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },
  refresh(refreshToken) {
    return request('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  },
  logout() {
    return request('/auth/logout', {
      method: 'POST',
    });
  },
  logoutAll() {
    return request('/auth/logout-all', {
      method: 'POST',
    });
  },
  getCurrentUser() {
    return request('/users/me');
  },
  listUsers() {
    return request('/users');
  },
  createUser(payload) {
    return request('/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  updateUser(userId, payload) {
    return request(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
  updateUserStatus(userId, status) {
    return request(`/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
  updateUserRoles(userId, roles) {
    return request(`/users/${userId}/roles`, {
      method: 'PATCH',
      body: JSON.stringify({ roles }),
    });
  },
  deleteUser(userId) {
    return request(`/users/${userId}`, {
      method: 'DELETE',
    });
  },
  listRoles() {
    return request('/roles');
  },
  listFamilies(params = {}) {
    return request(`/families${buildQuery(params)}`);
  },
  getFamily(familyId) {
    return request(`/families/${familyId}`);
  },
  createFamily(payload) {
    return request('/families', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  updateFamily(familyId, payload) {
    return request(`/families/${familyId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
  listFamilyMembers(familyId) {
    return request(`/families/${familyId}/members`);
  },
  createFamilyMember(familyId, payload) {
    return request(`/families/${familyId}/members`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  deleteFamilyMember(familyId, memberId) {
    return request(`/families/${familyId}/members/${memberId}`, {
      method: 'DELETE',
    });
  },
  updateFamilyMember(familyId, memberId, payload) {
    return request(`/families/${familyId}/members/${memberId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
  listEvolutions(familyId, params = {}) {
    return request(
      `/families/${familyId}/evolutions${buildQuery(params)}`,
    );
  },
  createEvolution(familyId, memberId, payload) {
    return request(
      `/families/${familyId}/members/${memberId}/evolutions`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    );
  },
  listAppointments(params = {}) {
    return request(`/appointments${buildQuery(params)}`);
  },
  listFamilyAppointments(familyId, params = {}) {
    return request(
      `/families/${familyId}/appointments${buildQuery(params)}`,
    );
  },
  createAppointment(payload) {
    return request('/appointments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  createFamilyAppointment(familyId, payload) {
    return request(`/families/${familyId}/appointments`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  updateAppointment(appointmentId, payload) {
    return request(`/appointments/${appointmentId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
  deleteAppointment(appointmentId) {
    return request(`/appointments/${appointmentId}`, {
      method: 'DELETE',
    });
  },
  listStudies(params = {}) {
    return request(`/studies${buildQuery(params)}`);
  },
  listFamilyStudies(familyId, params = {}) {
    return request(
      `/families/${familyId}/studies${buildQuery(params)}`,
    );
  },
  createStudy(payload) {
    return request('/studies', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  createFamilyStudy(familyId, payload) {
    return request(`/families/${familyId}/studies`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  updateStudy(studyId, payload) {
    return request(`/studies/${studyId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
  deleteStudy(studyId) {
    return request(`/studies/${studyId}`, {
      method: 'DELETE',
    });
  },
  listAttachments(params = {}) {
    return request(`/attachments${buildQuery(params)}`);
  },
  listFamilyAttachments(familyId, params = {}) {
    return request(
      `/families/${familyId}/attachments${buildQuery(params)}`,
    );
  },
  createAttachment(payload) {
    return request('/attachments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  createFamilyAttachment(familyId, payload) {
    return request(`/families/${familyId}/attachments`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  createUploadTicket(familyId, payload = {}) {
    return request(`/families/${familyId}/attachments/upload-ticket`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  loginWithUploadTicket(ticket) {
    return request('/auth/upload-ticket', {
      method: 'POST',
      body: JSON.stringify({ ticket }),
    });
  },
  updateAttachment(attachmentId, payload) {
    return request(`/attachments/${attachmentId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
  deleteAttachment(attachmentId) {
    return request(`/attachments/${attachmentId}`, {
      method: 'DELETE',
    });
  },
  async downloadAttachment(attachmentId) {
    const url = `${API_BASE}/attachments/${attachmentId}/download`;
    const response = await fetch(url, {
      headers: authTokens?.accessToken
        ? { Authorization: `Bearer ${authTokens.accessToken}` }
        : undefined,
    });
    if (!response.ok) {
      const error = new Error(`No se pudo descargar el adjunto (${response.status})`);
      error.status = response.status;
      throw error;
    }
    return response.blob();
  },
};
