export interface BackendEnv {
  supabaseUrl: string
  supabaseServiceRoleKey: string
  port: number
}

export function loadEnv(source: Record<string, string | undefined>): BackendEnv {
  const supabaseUrl = source.SUPABASE_URL?.trim()
  if (!supabaseUrl) throw new Error('SUPABASE_URL is required')

  const supabaseServiceRoleKey = source.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!supabaseServiceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')

  const portValue = source.PORT === undefined ? '4000' : source.PORT.trim()
  const port = Number(portValue)
  if (!/^\d+$/.test(portValue) || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer from 1 to 65535')
  }

  return { supabaseUrl, supabaseServiceRoleKey, port }
}
