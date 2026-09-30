import { Router } from 'express'
import { createAuthService } from './auth.service.js'
import type { AuthGateway } from './auth.types.js'
import { parseLoginRequest, parseRegisterRequest } from './auth.validation.js'

export function createAuthRouter(dependencies: { gateway: AuthGateway }): Router {
  const router = Router()
  const service = createAuthService(dependencies.gateway)

  router.post('/register', async (request, response) => {
    const input = parseRegisterRequest(request.body)
    response.status(201).json(await service.register(input))
  })

  router.post('/login', async (request, response) => {
    const input = parseLoginRequest(request.body)
    response.json(await service.login(input))
  })

  return router
}
