import { describe, expect, it } from 'vitest'
import { loadEnv } from './env.js'

const validSource = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
}

describe('loadEnv', () => {
  it('rejects missing Supabase configuration', () => {
    expect(() => loadEnv({ PORT: '4000' })).toThrow('SUPABASE_URL')
    expect(() => loadEnv({ SUPABASE_URL: validSource.SUPABASE_URL })).toThrow(
      'SUPABASE_SERVICE_ROLE_KEY',
    )
  })

  it('trims configuration values and parses a valid port', () => {
    expect(
      loadEnv({
        SUPABASE_URL: `  ${validSource.SUPABASE_URL}  `,
        SUPABASE_SERVICE_ROLE_KEY: `  ${validSource.SUPABASE_SERVICE_ROLE_KEY}  `,
        PORT: ' 4000 ',
      }),
    ).toEqual({
      supabaseUrl: validSource.SUPABASE_URL,
      supabaseServiceRoleKey: validSource.SUPABASE_SERVICE_ROLE_KEY,
      port: 4000,
    })
  })

  it.each(['0', '65536', '3.5', '4000abc', ''])('rejects invalid port %j', (port) => {
    expect(() => loadEnv({ ...validSource, PORT: port })).toThrow('PORT')
  })

  it('defaults to port 4000 when PORT is absent', () => {
    expect(loadEnv(validSource).port).toBe(4000)
  })
})
