import NodeCache from 'node-cache';
import { Request, Response, NextFunction } from 'express';

// Single shared cache instance — TTL in seconds
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

/**
 * In-memory cache middleware.
 * Caches GET responses by URL key for a given TTL (seconds).
 *
 * @param ttlSeconds - How long to cache this response (default: 300s / 5 min)
 *
 * @example
 * router.get('/plans', cacheResponse(300), InvestmentController.getPlans);
 */
export const cacheResponse = (ttlSeconds = 300) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = `__cache__${req.originalUrl}`;
    const cached = cache.get(key);

    if (cached !== undefined) {
      res.status(200).json(cached);
      return;
    }

    // Monkey-patch res.json to intercept the response and store it
    const originalJson = res.json.bind(res);
    res.json = (body: any): Response => {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(key, body, ttlSeconds);
      }
      return originalJson(body);
    };

    next();
  };
};

/**
 * Invalidates all cache keys matching a prefix.
 * Call this after write operations that mutate cached resources.
 *
 * @example
 * invalidateCache('/api/v1/investments/plans');
 */
export const invalidateCache = (prefix: string): void => {
  const keys = cache.keys().filter((k) => k.includes(prefix));
  cache.del(keys);
};
