/**
 * Simple in-memory cache service with TTL support.
 */
class MemoryCache {
    constructor() {
        this.cache = new Map();
    }

    /**
     * Set a value in the cache.
     * @param {string} key 
     * @param {any} value 
     * @param {number} ttl - Time to live in seconds.
     */
    set(key, value, ttl = 300) {
        const expiry = Date.now() + ttl * 1000;
        this.cache.set(key, { value, expiry });
    }

    /**
     * Get a value from the cache.
     * @param {string} key 
     * @returns {any|null}
     */
    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;

        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }

        return item.value;
    }

    /**
     * Get a value from the cache or fetch it using the provider.
     * @param {string} key 
     * @param {function} provider - Async function to fetch data.
     * @param {number} ttl 
     */
    async getOrSet(key, provider, ttl = 300) {
        const cached = this.get(key);
        if (cached !== null) {
            console.log(`[Cache HIT] ${key}`);
            return cached;
        }

        console.log(`[Cache MISS] ${key}`);
        const fresh = await provider();
        this.set(key, fresh, ttl);
        return fresh;
    }

    /**
     * Clear specific key or entire cache.
     * @param {string} key 
     */
    delete(key) {
        this.cache.delete(key);
    }

    clear() {
        this.cache.clear();
    }
}

// Global instance to ensure it persists across hot-reloads in dev
const globalForCache = global;
export const cacheService = globalForCache.memoryCache || (globalForCache.memoryCache = new MemoryCache());
