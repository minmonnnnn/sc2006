import type { RequestHandler } from 'express'
import { ApiException } from '../../lib/api-error.js'
import type { AuthGateway } from './auth.types.js'

export function createRequireAuth(gateway: AuthGateway): RequestHandler {
  return async (request, _response, next) => {
    const match = /^Bearer ([^\s,]+)$/i.exec(request.headers.authorization ?? '')
    if (!match) throw new ApiException(401, 'UNAUTHORIZED', 'Unauthorized')

    let auth: { userId: string } | null
    try {
      auth = await gateway.verifyToken(match[1]!)
    } catch {
      throw new ApiException(503, 'AUTH_UNAVAILABLE', 'Authentication service unavailable')
    }
    if (!auth) throw new ApiException(401, 'UNAUTHORIZED', 'Unauthorized')
    request.auth = auth
    next()
  }
}
