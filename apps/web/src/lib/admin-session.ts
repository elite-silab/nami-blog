export const ADMIN_API_BASE =
  import.meta.env.PUBLIC_API_URL || "http://localhost:8788";

const SESSION_KEY = "nami-admin-session";

export type AdminSession = {
  accessToken: string;
  refreshToken: string;
};

function storage(): Storage | null {
  return typeof sessionStorage === "undefined" ? null : sessionStorage;
}

export function readAdminSession(): AdminSession | null {
  const raw = storage()?.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as Partial<AdminSession>;
    if (typeof session.accessToken !== "string" || typeof session.refreshToken !== "string") {
      clearAdminSession();
      return null;
    }
    return session as AdminSession;
  } catch {
    clearAdminSession();
    return null;
  }
}

export function saveAdminSession(session: AdminSession) {
  storage()?.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearAdminSession() {
  storage()?.removeItem(SESSION_KEY);
}

async function fetchWithAccess(input: RequestInfo | URL, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  const accessToken = readAdminSession()?.accessToken;
  if (accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  return fetch(input, {
    ...init,
    headers,
    credentials: init.credentials || "include",
  });
}

let refreshPromise: Promise<boolean> | null = null;

async function refreshAdminSession() {
  const current = readAdminSession();
  if (!current?.refreshToken) return false;

  try {
    const response = await fetch(`${ADMIN_API_BASE}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ refreshToken: current.refreshToken }),
    });
    if (!response.ok) {
      clearAdminSession();
      return false;
    }

    const result = (await response.json()) as { data?: Partial<AdminSession> };
    if (!result.data?.accessToken || !result.data.refreshToken) {
      clearAdminSession();
      return false;
    }
    saveAdminSession(result.data as AdminSession);
    return true;
  } catch {
    return false;
  }
}

export async function adminFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const response = await fetchWithAccess(input, init);
  if (response.status !== 401 || !readAdminSession()?.refreshToken) return response;

  refreshPromise ||= refreshAdminSession().finally(() => {
    refreshPromise = null;
  });
  if (!(await refreshPromise)) return response;

  const retried = await fetchWithAccess(input, init);
  if (retried.status === 401) clearAdminSession();
  return retried;
}

export async function logoutAdminSession() {
  const refreshToken = readAdminSession()?.refreshToken;
  try {
    await fetch(`${ADMIN_API_BASE}/api/v1/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ refreshToken }),
    });
  } finally {
    clearAdminSession();
  }
}
