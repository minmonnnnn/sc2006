import 'dotenv/config'
import { createApp } from './app.js'
import { loadEnv } from './config/env.js'

const env = loadEnv(process.env)
createApp({}).listen(env.port)
