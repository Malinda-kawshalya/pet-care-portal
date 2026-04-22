import type { AuthState } from "@/types/auth";

const STORAGE_KEY = "petai_auth_state";
const STORAGE_EVENT = "petai_auth_state_change";

let cachedRaw: string | null = null;
let cachedState: AuthState | null = null;

const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

function readFromStorage() {
  if (typeof window === "undefined") {
    cachedRaw = null;
    cachedState = null;
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw) {
    return cachedState;
  }

  cachedRaw = raw;
  if (!raw) {
    cachedState = null;
    return null;
  }

  try {
    cachedState = JSON.parse(raw) as AuthState;
    return cachedState;
  } catch {
    cachedState = null;
    return null;
  }
}

function handleWindowStorageChange() {
  readFromStorage();
  notifyListeners();
}

export function getAuthState(): AuthState | null {
  return readFromStorage();
}

export function subscribeAuthState(onStoreChange: () => void) {
  listeners.add(onStoreChange);

  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleWindowStorageChange);
    window.addEventListener(STORAGE_EVENT, handleWindowStorageChange);
  }

  return () => {
    listeners.delete(onStoreChange);

    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleWindowStorageChange);
      window.removeEventListener(STORAGE_EVENT, handleWindowStorageChange);
    }
  };
}

export function setAuthState(value: AuthState) {
  if (typeof window === "undefined") {
    return;
  }

  const serialized = JSON.stringify(value);
  cachedRaw = serialized;
  cachedState = value;

  window.localStorage.setItem(STORAGE_KEY, serialized);
  window.dispatchEvent(new Event(STORAGE_EVENT));
  notifyListeners();
}

export function clearAuthState() {
  if (typeof window === "undefined") {
    return;
  }

  cachedRaw = null;
  cachedState = null;

  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(STORAGE_EVENT));
  notifyListeners();
}
