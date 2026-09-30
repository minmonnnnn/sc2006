import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { BackendEnv } from '../config/env.js'
import { AuthGatewayError, type AuthGateway } from '../modules/auth/auth.types.js'

type Clients = { adminClient: SupabaseClient; loginClient: SupabaseClient }

async function safe<T>(action: () => Promise<T>): Promise<T> {
  try {
    return await action()
  } catch (error) {
    if (error instanceof AuthGatewayError) throw error
    throw new AuthGatewayError('UNAVAILABLE')
  }
}

export function createSupabaseClients(env: Pick<BackendEnv, 'supabaseUrl' | 'supabaseServiceRoleKey'>): Clients {
  const options = { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } }
  return {
    adminClient: createClient(env.supabaseUrl, env.supabaseServiceRoleKey, options),
    loginClient: createClient(env.supabaseUrl, env.supabaseServiceRoleKey, options),
  }
}

export function createSupabaseAuthGateway({ adminClient, loginClient }: Clients): AuthGateway {
  return {
    register: (input) => safe(async () => {
      const { data, error } = await adminClient.auth.admin.createUser({
        email: input.email,
        password: input.password,
        email_confirm: true,
      })
      if (error) {
        const duplicate = error.code === 'email_exists' || error.code === 'user_already_exists'
        throw new AuthGatewayError(duplicate ? 'ACCOUNT_EXISTS' : 'UNAVAILABLE')
      }
      if (!data.user) throw new AuthGatewayError('UNAVAILABLE')
      return { userId: data.user.id }
    }),

    createProfile: (userId, input) => safe(async () => {
      const { error } = await adminClient.from('profiles').insert({
        id: userId,
        name: input.name,
        vehicle_type: input.vehicleType,
      })
      if (error) throw new AuthGatewayError('UNAVAILABLE')
    }),

    removeAuthUser: (userId) => safe(async () => {
      const { error } = await adminClient.auth.admin.deleteUser(userId)
      if (error) throw new AuthGatewayError('UNAVAILABLE')
    }),

    login: (input) => safe(async () => {
      const { data, error } = await loginClient.auth.signInWithPassword(input)
      if (error) {
        throw new AuthGatewayError(error.code === 'invalid_credentials' ? 'INVALID_CREDENTIALS' : 'UNAVAILABLE')
      }
      if (!data.user || !data.session?.access_token) throw new AuthGatewayError('UNAVAILABLE')
      return { userId: data.user.id, token: data.session.access_token }
    }),

    verifyToken: (token) => safe(async () => {
      const { data, error } = await adminClient.auth.getUser(token)
      if (error) {
        if (error.code === 'bad_jwt' || error.status === 401 || error.status === 403) return null
        throw new AuthGatewayError('UNAVAILABLE')
      }
      return data.user ? { userId: data.user.id } : null
    }),
  }
}
