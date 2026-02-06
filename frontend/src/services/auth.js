const STORAGE_KEY = 'temple_meals_auth';

export const getStoredAuth = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
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

