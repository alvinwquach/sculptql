export function getLocalStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") {
    return defaultValue; // Return default value during SSR
  }
  try {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : defaultValue;
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error);
    return defaultValue;
  }
}

export function setLocalStorageItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") {
    return; // Do nothing during SSR
  }
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing localStorage key "${key}":`, error);
  }
}

export function removeLocalStorageItem(key: string): void {
  if (typeof window === "undefined") {
    return; // Do nothing during SSR
  }
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing localStorage key "${key}":`, error);
  }
}
