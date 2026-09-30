import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from '@smart-parking/shared-types'
import { ApiException } from '../../lib/api-error.js'
import { AuthGatewayError, type AuthGateway } from './auth.types.js'

function unavailable(): ApiException {
  return new ApiException(503, 'AUTH_UNAVAILABLE', 'Authentication service unavailable')
}

export function createAuthService(gateway: AuthGateway) {
  return {
    async register(input: RegisterRequest): Promise<RegisterResponse> {
      let userId: string
      try {
        ;({ userId } = await gateway.register(input))
      } catch (error) {
        if (error instanceof AuthGatewayError && error.kind === 'ACCOUNT_EXISTS') {
          throw new ApiException(409, 'ACCOUNT_ALREADY_EXISTS', 'Account already exists')
        }
        throw unavailable()
      }

      try {
        await gateway.createProfile(userId, { name: input.name, vehicleType: input.vehicleType })
      } catch {
        try {
          await gateway.removeAuthUser(userId)
        } catch {
          // Keep the profile failure response stable; the failed rollback needs operator attention.
        }
        throw unavailable()
      }
      return { userId, email: input.email, name: input.name }
    },

    async login(input: LoginRequest): Promise<LoginResponse> {
      try {
        return await gateway.login(input)
      } catch (error) {
        if (error instanceof AuthGatewayError && error.kind === 'INVALID_CREDENTIALS') {
          throw new ApiException(401, 'INVALID_CREDENTIALS', 'Invalid credentials')
        }
        throw unavailable()
      }
    },
  }
}
