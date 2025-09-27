// Function to get the local storage item
export function getLocalStorageItem<T>(key: string, defaultValue: T): T {
  // If the window is undefined, return the default value 
  if (typeof window === "undefined") {
    // Return the default value during SSR
    return defaultValue; 
  }
  try {
    // Get the item from the local storage
    const item = localStorage.getItem(key);
    // Return the item parsed as the type or the default value
    return item ? (JSON.parse(item) as T) : defaultValue;
  } catch (error) {
    // Log the error
    console.error(`Error reading localStorage key "${key}":`, error);
    // Return the default value
    return defaultValue;
  }
}

// Function to set the local storage item
export function setLocalStorageItem<T>(key: string, value: T): void {
  // If the window is undefined, return
  if (typeof window === "undefined") {
    // Do nothing during SSR
    return; 
  }
  try {
    // Set the item in the local storage
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Log the error
    console.error(`Error writing localStorage key "${key}":`, error);
  }
}

// Function to remove the local storage item
export function removeLocalStorageItem(key: string): void {
  // If the window is undefined, return
  if (typeof window === "undefined") {
    // Do nothing during SSR
    return;
  }
  try {
    // Remove the item from the local storage
    localStorage.removeItem(key);
  } catch (error) {
    // Log the error
    console.error(`Error removing localStorage key "${key}":`, error);
  }
}
