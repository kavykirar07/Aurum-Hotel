// src/lib/redis.ts
// Upstash Redis client + soft-lock helpers for Aurum Hotel OS

import { Redis } from "@upstash/redis";
import type { Result } from "@/types/booking";

// ============================================================
// CLIENT
// ============================================================

if (!process.env.UPSTASH_REDIS_REST_URL) {
  throw new Error("UPSTASH_REDIS_REST_URL is not set");
}
if (!process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error("UPSTASH_REDIS_REST_TOKEN is not set");
}

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// ============================================================
// KEY FACTORIES
// ============================================================

export const RedisKeys = {
  /** Availability cache key */
  availability: (roomId: string, checkIn: string, checkOut: string) =>
    `avail:${roomId}:${checkIn}:${checkOut}`,

  /** Soft-lock key — SETNX, TTL 15 min */
  softLock: (roomId: string, checkIn: string, checkOut: string) =>
    `lock:${roomId}:${checkIn}:${checkOut}`,

  /** Computed price cache key */
  price: (categoryId: string, checkIn: string, checkOut: string) =>
    `price:${categoryId}:${checkIn}:${checkOut}`,

  /** RBAC permissions cache per staff session */
  staffPermissions: (staffId: string) => `rbac:staff:${staffId}`,

  /** Rate limit key per IP + route */
  rateLimit: (ip: string, route: string) => `rl:${route}:${ip}`,
} as const;

// ============================================================
// SOFT LOCK TTL (15 minutes = 900 seconds)
// ============================================================

export const SOFT_LOCK_TTL_SECONDS = 900;
export const AVAILABILITY_CACHE_TTL_SECONDS = 60;
export const PRICE_CACHE_TTL_SECONDS = 900;

// ============================================================
// SOFT LOCK HELPERS
// ============================================================

/**
 * Attempt to acquire a soft lock for a room+date combination.
 * Uses SETNX (SET if Not eXists) — atomic, no race condition.
 *
 * @returns Result<true>  — lock acquired
 * @returns Result<false> — lock already held by another session
 */
export async function acquireSoftLock(
  roomId: string,
  checkIn: string,
  checkOut: string,
  sessionId: string
): Promise<Result<boolean>> {
  try {
    const key = RedisKeys.softLock(roomId, checkIn, checkOut);
    const result = await redis.set(key, sessionId, {
      nx: true,          // only set if key does not exist
      ex: SOFT_LOCK_TTL_SECONDS,
    });

    if (result === "OK") {
      return { success: true, data: true };
    }

    // Key already exists — room locked by another session
    return { success: true, data: false };
  } catch {
    return {
      success: false,
      error: "Redis soft-lock acquisition failed",
      code: "REDIS_ERROR",
    };
  }
}

/**
 * Release a soft lock. Only releases if the session ID matches
 * (prevents accidentally releasing another user's lock).
 */
export async function releaseSoftLock(
  roomId: string,
  checkIn: string,
  checkOut: string,
  sessionId: string
): Promise<Result<void>> {
  try {
    const key = RedisKeys.softLock(roomId, checkIn, checkOut);

    // Lua script: atomic check-and-delete to prevent cross-session release
    const luaScript = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;

    await redis.eval(luaScript, [key], [sessionId]);
    return { success: true, data: undefined };
  } catch {
    return {
      success: false,
      error: "Redis soft-lock release failed",
      code: "REDIS_ERROR",
    };
  }
}

/**
 * Check if a soft lock exists for a room+date combination.
 * Returns the session ID that holds the lock, or null if no lock.
 */
export async function checkSoftLock(
  roomId: string,
  checkIn: string,
  checkOut: string
): Promise<string | null> {
  const key = RedisKeys.softLock(roomId, checkIn, checkOut);
  return await redis.get<string>(key);
}

/**
 * Get the remaining TTL (seconds) on a soft lock.
 * Returns -2 if key does not exist, -1 if key has no expiry.
 */
export async function getSoftLockTtl(
  roomId: string,
  checkIn: string,
  checkOut: string
): Promise<number> {
  const key = RedisKeys.softLock(roomId, checkIn, checkOut);
  return await redis.ttl(key);
}

// ============================================================
// AVAILABILITY CACHE HELPERS
// ============================================================

export async function getCachedAvailability(
  roomId: string,
  checkIn: string,
  checkOut: string
): Promise<boolean | null> {
  const key = RedisKeys.availability(roomId, checkIn, checkOut);
  return await redis.get<boolean>(key);
}

export async function setCachedAvailability(
  roomId: string,
  checkIn: string,
  checkOut: string,
  available: boolean
): Promise<void> {
  const key = RedisKeys.availability(roomId, checkIn, checkOut);
  await redis.set(key, available, { ex: AVAILABILITY_CACHE_TTL_SECONDS });
}

export async function invalidateAvailabilityCache(
  roomId: string,
  checkIn: string,
  checkOut: string
): Promise<void> {
  const key = RedisKeys.availability(roomId, checkIn, checkOut);
  await redis.del(key);
}

// ============================================================
// PRICE CACHE HELPERS
// ============================================================

export async function getCachedPrice(
  categoryId: string,
  checkIn: string,
  checkOut: string
): Promise<string | null> {
  const key = RedisKeys.price(categoryId, checkIn, checkOut);
  return await redis.get<string>(key);
}

export async function setCachedPrice(
  categoryId: string,
  checkIn: string,
  checkOut: string,
  priceJson: string
): Promise<void> {
  const key = RedisKeys.price(categoryId, checkIn, checkOut);
  await redis.set(key, priceJson, { ex: PRICE_CACHE_TTL_SECONDS });
}

export async function invalidatePriceCache(
  categoryId: string,
  checkIn: string,
  checkOut: string
): Promise<void> {
  const key = RedisKeys.price(categoryId, checkIn, checkOut);
  await redis.del(key);
}
