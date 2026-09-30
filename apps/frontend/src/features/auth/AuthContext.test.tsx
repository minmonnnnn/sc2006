import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from './AuthContext'
import { AUTH_STORAGE_KEY } from './authStorage'

const profile = {
  id: 'user-1',
  email: 'driver@example.com',
  name: 'Driver',
  vehicleType: 'EV' as const,
  createdAt: '2026-09-30T00:00:00.000Z',
}

function Harness() {
  const auth = useAuth()
  return <>
    <output data-testid="session">{auth.session?.userId ?? 'signed-out'}</output>
    <output data-testid="profile">{auth.profile?.name ?? 'no-profile'}</output>
    <button onClick={() => void auth.register({ email: profile.email, password: 'secret', name: profile.name, vehicleType: 'EV' })}>register</button>
    <button onClick={() => void auth.login({ email: profile.email, password: 'secret' })}>login</button>
    <button onClick={() => void auth.logout()}>logout</button>
    <button onClick={() => void auth.deleteAccount().catch(() => undefined)}>delete</button>
  </>
}

function renderAuth() {
  return render(<AuthProvider><Harness /></AuthProvider>)
}

describe('AuthContext', () => {
  afterEach(() => {
    cleanup()
    localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('removes malformed persisted JSON', async () => {
    localStorage.setItem(AUTH_STORAGE_KEY, '{broken')
    renderAuth()
    await waitFor(() => expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull())
  })

  it('keeps only userId and token in persisted session data', () => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
      userId: 'user-1', token: 'secret-token', password: 'must-not-persist',
    }))
    renderAuth()

    expect(JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) ?? '{}')).toEqual({
      userId: 'user-1', token: 'secret-token',
    })
  })

  it('stores only the session returned by login', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(Response.json({ userId: 'user-1', token: 'secret-token' }))
      .mockResolvedValueOnce(Response.json(profile)))
    const user = userEvent.setup()
    renderAuth()
    await user.click(screen.getByText('login'))

    await waitFor(() => expect(screen.getByTestId('profile')).toHaveTextContent('Driver'))
    expect(JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) ?? '{}')).toEqual({ userId: 'user-1', token: 'secret-token' })
  })

  it('does not authenticate after registration', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(
      { userId: 'user-1', email: profile.email, name: profile.name }, { status: 201 },
    )))
    const user = userEvent.setup()
    renderAuth()
    await user.click(screen.getByText('register'))

    await waitFor(() => expect(screen.getByTestId('session')).toHaveTextContent('signed-out'))
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull()
  })

  it('clears session on logout', async () => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ userId: 'user-1', token: 'secret-token' }))
    const user = userEvent.setup()
    renderAuth()
    await user.click(screen.getByText('logout'))

    expect(screen.getByTestId('session')).toHaveTextContent('signed-out')
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull()
  })

  it('preserves the session when account deletion fails', async () => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ userId: 'user-1', token: 'secret-token' }))
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 503 })))
    const user = userEvent.setup()
    renderAuth()
    await user.click(screen.getByText('delete'))

    await waitFor(() => expect(screen.getByTestId('session')).toHaveTextContent('user-1'))
    expect(JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) ?? '{}')).toEqual({ userId: 'user-1', token: 'secret-token' })
  })
})
