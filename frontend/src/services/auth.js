const STORAGE_KEY = 'temple_meals_auth';

export const getStoredAuth = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const isValid =
      parsed &&
      typeof parsed === 'object' &&
      typeof parsed.token === 'string' &&
      parsed.user &&
      typeof parsed.user === 'object' &&
      typeof parsed.user.username === 'string' &&
      typeof parsed.user.role === 'string';

    if (!isValid) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

export const setStoredAuth = (auth) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
};

export const clearAuth = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const getAuthToken = () => {
  const a = getStoredAuth();
  return a?.token || null;
};

