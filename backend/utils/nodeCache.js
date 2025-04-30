import NodeCache from "node-cache";

const cacheTime = 25 * 60 * 60; // 25 hours
const cache = new NodeCache({ stdTTL: cacheTime });

export function getCached(key) {
  return cache.get(key);
}

export function setCached(key, value) {
  cache.set(key, value);
}

export function deleteCached(key) {
  cache.del(key);
}

export function clearCache() {
  cache.flushAll();
}

export default cache;
