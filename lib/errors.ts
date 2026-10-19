/**
 * Domain errors thrown by services and converted into HTTP responses by `route()`.
 * Note: `notFound()` here is distinct from `notFound()` in next/navigation; pages that
 * want a 404 page should call the next/navigation one.
 */
export class AppError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.details = details;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function badRequest(message = 'Bad request', details?: unknown): AppError {
  return new AppError(400, message, details);
}

export function unauthorized(message = 'Authentication required'): AppError {
  return new AppError(401, message);
}

export function forbidden(message = 'You do not have permission to do this'): AppError {
  return new AppError(403, message);
}

export function notFound(message = 'Not found'): AppError {
  return new AppError(404, message);
}

export function conflict(message: string, details?: unknown): AppError {
  return new AppError(409, message, details);
}
