import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'
import type { LoginResponse, RegisterResponse, UpdateProfileRequest, User } from '@smart-parking/shared-types'
import { apiRequest } from '../../lib/apiClient'
import { clearSession, loadSession, saveSession } from './authStorage'
import type { AuthContextValue, AuthSession, LoginRequest, RegisterRequest } from './auth.types'

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession | null>(() => loadSession())
  const [profile, setProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(() => session !== null)
  const [error, setError] = useState<Error | null>(null)

  const loadProfile = useCallback(async (): Promise<User> => {
    if (!session) throw new Error('Not authenticated')
    setLoading(true)
    setError(null)
    try {
      const result = await apiRequest<User>('/api/users/me', { token: session.token })
      setProfile(result)
      return result
    } catch (cause) {
      const nextError = cause instanceof Error ? cause : new Error('Profile request failed')
      setError(nextError)
      throw nextError
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    if (session) void Promise.resolve().then(loadProfile).catch(() => undefined)
  }, [session, loadProfile])

  const register = useCallback(async (input: RegisterRequest): Promise<RegisterResponse> => {
    setLoading(true)
    setError(null)
    try {
      return await apiRequest<RegisterResponse>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(input),
      })
    } catch (cause) {
      const nextError = cause instanceof Error ? cause : new Error('Registration failed')
      setError(nextError)
      throw nextError
    } finally {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (input: LoginRequest): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      const result = await apiRequest<LoginResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(input),
      })
      const nextSession = { userId: result.userId, token: result.token }
      saveSession(nextSession)
      setSession(nextSession)
    } catch (cause) {
      const nextError = cause instanceof Error ? cause : new Error('Login failed')
      setError(nextError)
      throw nextError
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setSession(null)
    setProfile(null)
    setError(null)
    setLoading(false)
  }, [])

  const updateProfile = useCallback(async (input: UpdateProfileRequest): Promise<User> => {
    if (!session) throw new Error('Not authenticated')
    setLoading(true)
    setError(null)
    try {
      const result = await apiRequest<User>('/api/users/me', {
        method: 'PUT',
        token: session.token,
        body: JSON.stringify(input),
      })
      setProfile(result)
      return result
    } catch (cause) {
      const nextError = cause instanceof Error ? cause : new Error('Profile update failed')
      setError(nextError)
      throw nextError
    } finally {
      setLoading(false)
    }
  }, [session])

  const deleteAccount = useCallback(async (): Promise<void> => {
    if (!session) throw new Error('Not authenticated')
    setLoading(true)
    setError(null)
    try {
      await apiRequest<void>('/api/users/me', { method: 'DELETE', token: session.token })
      clearSession()
      setSession(null)
      setProfile(null)
    } catch (cause) {
      const nextError = cause instanceof Error ? cause : new Error('Account deletion failed')
      setError(nextError)
      throw nextError
    } finally {
      setLoading(false)
    }
  }, [session])

  const value = useMemo<AuthContextValue>(() => ({
    session, profile, loading, error, register, login, logout, loadProfile, updateProfile, deleteAccount,
  }), [session, profile, loading, error, register, login, logout, loadProfile, updateProfile, deleteAccount])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
