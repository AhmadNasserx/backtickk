import mongoose from 'mongoose';
import { badRequest } from '@/lib/errors';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // Cached on globalThis so hot reloads in dev do not open a new connection each time.
  var mongooseCache: MongooseCache | undefined;
}

const cache: MongooseCache = globalThis.mongooseCache ?? { conn: null, promise: null };
globalThis.mongooseCache = cache;

export async function connectDB(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set. Add it to .env.local (see .env.example).');
  }

  cache.promise ??= mongoose.connect(uri, { bufferCommands: false }).catch((error: unknown) => {
    // Do not cache a failed connection attempt; the next request should retry.
    cache.promise = null;
    throw error;
  });
  cache.conn = await cache.promise;
  return cache.conn;
}

const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

export function isObjectId(value: string): boolean {
  return OBJECT_ID_PATTERN.test(value);
}

/** Use at the boundary of every service that takes an id, so bad input is a 400, not a CastError 500. */
export function assertObjectId(value: string, label = 'id'): string {
  if (!isObjectId(value)) {
    throw badRequest(`Invalid ${label}`);
  }
  return value;
}

/** MongoDB E11000: a unique index rejected the write. */
export function isDuplicateKeyError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}
