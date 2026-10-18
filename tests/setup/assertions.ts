import { expect } from 'vitest';
import { AppError } from '@/lib/errors';

/** Awaits a service call that must fail, and checks the AppError status it throws. */
export async function expectStatus(promise: Promise<unknown>, status: number): Promise<AppError> {
  const error: unknown = await promise.then(
    () => undefined,
    (reason: unknown) => reason,
  );
  expect(error, `expected a ${status} AppError`).toBeInstanceOf(AppError);
  expect((error as AppError).status).toBe(status);
  return error as AppError;
}
