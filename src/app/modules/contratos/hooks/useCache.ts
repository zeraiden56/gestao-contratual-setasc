"use client";

import { useCallback } from "react";

/**
 * Cache simples baseado em localStorage, com TTL.
 */
export function useCache<T>(key: string, ttlMs: number = 60000) {
  const setCache = useCallback(
    (data: T) => {
      const payload = { data, expires: Date.now() + ttlMs };
      localStorage.setItem(key, JSON.stringify(payload));
    },
    [key, ttlMs]
  );

  const getCache = useCallback((): T | null => {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw);
      if (parsed.expires && parsed.expires > Date.now()) {
        return parsed.data as T;
      }
      localStorage.removeItem(key);
      return null;
    } catch {
      localStorage.removeItem(key);
      return null;
    }
  }, [key]);

  const clearCache = useCallback(() => localStorage.removeItem(key), [key]);

  return { getCache, setCache, clearCache };
}
