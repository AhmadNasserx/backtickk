import mongoose from 'mongoose';
import { z } from 'zod';
import { AppError, badRequest, isAppError } from '@/lib/errors';

/** JSON body of every error response: `{ error: { message, details? } }`. */
interface ErrorBody {
  error: { message: string; details?: unknown };
}

function errorResponse(error: unknown): Response {
  if (isAppError(error)) {
    return failure(error);
  }
  if (error instanceof z.ZodError) {
    const body: ErrorBody = { error: { message: 'Validation failed', details: z.flattenError(error) } };
    return Response.json(body, { status: 400 });
  }
  if (error instanceof mongoose.Error.CastError) {
    const body: ErrorBody = { error: { message: 'Invalid identifier' } };
    return Response.json(body, { status: 400 });
  }
  console.error('[api] unhandled error', error);
  const body: ErrorBody = { error: { message: 'Internal server error' } };
  return Response.json(body, { status: 500 });
}

function failure(error: AppError): Response {
  const body: ErrorBody = {
    error: error.details === undefined ? { message: error.message } : { message: error.message, details: error.details },
  };
  return Response.json(body, { status: error.status });
}

type RouteHandler<C> = (request: Request, context: C) => Promise<Response> | Response;

/**
 * Wraps a Route Handler so thrown errors become JSON responses:
 * AppError -> its status, ZodError -> 400 with flattened issues, anything else -> logged 500.
 */
export function route<C = unknown>(handler: RouteHandler<C>): (request: Request, context: C) => Promise<Response> {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      return errorResponse(error);
    }
  };
}

export function json<T>(data: T, status = 200): Response {
  return Response.json(data, { status });
}

/** Parses a JSON body with a Zod schema. Invalid JSON is a 400; schema failures throw a ZodError. */
export async function parseJson<S extends z.ZodType>(request: Request, schema: S): Promise<z.output<S>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw badRequest('Request body must be valid JSON');
  }
  const result = schema.safeParse(body);
  if (!result.success) {
    throw result.error;
  }
  return result.data;
}

/** Parses the URL's query string with a Zod schema (repeated keys: last one wins). */
export function parseSearchParams<S extends z.ZodType>(url: string, schema: S): z.output<S> {
  const params = Object.fromEntries(new URL(url).searchParams);
  const result = schema.safeParse(params);
  if (!result.success) {
    throw result.error;
  }
  return result.data;
}
