import 'dotenv/config'
import { createApp } from './app.js'
import { loadEnv } from './config/env.js'
import { createSupabaseAuthGateway, createSupabaseClients } from './lib/supabase.js'
import { createAuthRouter } from './modules/auth/auth.routes.js'

const env = loadEnv(process.env)
const gateway = createSupabaseAuthGateway(createSupabaseClients(env))
createApp({ auth: createAuthRouter({ gateway }) }).listen(env.port)
