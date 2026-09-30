import type { ErrorRequestHandler } from 'express'

export class ApiException extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message)
    this.name = 'ApiException'
  }
}

export const errorHandler: ErrorRequestHandler = (error: unknown, _request, response, _next) => {
  void _next
  if (error instanceof ApiException) {
    response.status(error.status).json({
      error: {
        code: error.code,
        message: error.message,
        ...(error.details === undefined ? {} : { details: error.details }),
      },
    })
    return
  }

  response.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
  })
}
