// Local image cache helper for AI Studio testing without sending images to Firebase Firestore
const CACHE_KEY = 'trade_local_image_cache_v1';

export function getLocalImageCache(): Record<string, string> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveLocalImage(key: string, dataUrl: string) {
  try {
    const cache = getLocalImageCache();
    cache[key] = dataUrl;
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.warn('Failed to save local image cache:', e);
  }
}

export function removeLocalImage(key: string) {
  try {
    const cache = getLocalImageCache();
    delete cache[key];
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.warn('Failed to remove local image cache:', e);
  }
}

// Strip base64 image data strings from object for Firestore sync, saving them to local cache instead
export function cleanObjectForFirestore<T>(obj: T, prefix = ''): T {
  if (!obj || typeof obj !== 'object') return obj;
  const clone: any = Array.isArray(obj) ? [...obj] : { ...obj };
  
  for (const key of Object.keys(clone)) {
    const val = clone[key];
    if (key.toLowerCase().endsWith('image') && typeof val === 'string' && val.startsWith('data:image')) {
      const cacheKey = `${prefix}_${key}`;
      saveLocalImage(cacheKey, val);
      clone[key] = '[local-image]';
    } else if (val && typeof val === 'object') {
      clone[key] = cleanObjectForFirestore(val, `${prefix}_${key}`);
    }
  }
  return clone as T;
}

// Rehydrate base64 images from local cache into pairs and savedTrades
export function rehydrateImagesFromLocal<T>(obj: T, prefix = ''): T {
  if (!obj || typeof obj !== 'object') return obj;
  const clone: any = Array.isArray(obj) ? [...obj] : { ...obj };
  const cache = getLocalImageCache();

  for (const key of Object.keys(clone)) {
    const val = clone[key];
    if (key.toLowerCase().endsWith('image')) {
      const cacheKey = `${prefix}_${key}`;
      if (cache[cacheKey]) {
        clone[key] = cache[cacheKey];
      } else if (val === '[local-image]') {
        clone[key] = null;
      }
    } else if (val && typeof val === 'object') {
      clone[key] = rehydrateImagesFromLocal(val, `${prefix}_${key}`);
    }
  }
  return clone as T;
}
