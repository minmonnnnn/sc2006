import express from 'express'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from './app.js'
import { ApiException } from './lib/api-error.js'

const fakeDependencies = {}

describe('createApp', () => {
  it('serves health without constructing live Supabase dependencies', async () => {
    await request(createApp(fakeDependencies)).get('/health').expect(200, { ok: true })
  })

  it('mounts injected feature routers under their API paths', async () => {
    const auth = express.Router().post('/login', (_request, response) => {
      response.json({ reached: 'auth' })
    })
    const users = express.Router().get('/me', (_request, response) => {
      response.json({ reached: 'users' })
    })
    const favourites = express.Router().get('/', (_request, response) => {
      response.json({ reached: 'favourites' })
    })
    const app = createApp({ auth, users, favourites })

    await request(app).post('/api/auth/login').expect(200, { reached: 'auth' })
    await request(app).get('/api/users/me').expect(200, { reached: 'users' })
    await request(app).get('/api/favourites').expect(200, { reached: 'favourites' })
  })

  it('parses JSON for injected routers', async () => {
    const auth = express.Router().post('/echo', (incoming, response) => {
      response.json(incoming.body)
    })

    await request(createApp({ auth }))
      .post('/api/auth/echo')
      .send({ email: 'driver@example.com' })
      .expect(200, { email: 'driver@example.com' })
  })

  it('returns the shared error shape for missing routes', async () => {
    await request(createApp(fakeDependencies))
      .get('/does-not-exist')
      .expect(404, { error: { code: 'NOT_FOUND', message: 'Not found' } })
  })

  it('serializes known exceptions with optional details', async () => {
    const auth = express.Router().get('/fail', () => {
      throw new ApiException(422, 'VALIDATION_ERROR', 'Invalid email', { field: 'email' })
    })

    await request(createApp({ auth })).get('/api/auth/fail').expect(422, {
      error: { code: 'VALIDATION_ERROR', message: 'Invalid email', details: { field: 'email' } },
    })
  })

  it('hides unknown error details', async () => {
    const auth = express.Router().get('/fail', () => {
      throw new Error('secret failure')
    })

    const response = await request(createApp({ auth })).get('/api/auth/fail').expect(500)
    expect(response.body).toEqual({
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
    })
  })
})
