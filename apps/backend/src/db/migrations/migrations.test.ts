import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const migrationsDirectory = new URL('.', import.meta.url)
const readMigration = (name: string) =>
  readFileSync(new URL(name, migrationsDirectory), 'utf8').toLowerCase()

describe('database migrations', () => {
  it('protects profiles with Supabase ownership and vehicle constraints', () => {
    const sql = readMigration('001_profiles.sql')

    expect(sql).toContain('references auth.users(id) on delete cascade')
    expect(sql).toMatch(/vehicle_type\s+text[^,]*check\s*\(\s*vehicle_type\s+in\s*\('ev',\s*'petrol',\s*'hybrid'\)\s*\)/)
    expect(sql).toContain('enable row level security')
    expect(sql).toMatch(/create policy[^;]*for select[^;]*auth\.uid\(\)\s*=\s*id/)
    expect(sql).toMatch(/create policy[^;]*for update[^;]*auth\.uid\(\)\s*=\s*id/)
  })

  it('protects favourite locations with ownership and coordinate constraints', () => {
    const sql = readMigration('002_favourite_locations.sql')

    expect(sql).toContain('references public.profiles(id) on delete cascade')
    expect(sql).toContain('unique (user_id, latitude, longitude)')
    expect(sql).toMatch(/latitude\s+between\s+-90\s+and\s+90/)
    expect(sql).toMatch(/longitude\s+between\s+-180\s+and\s+180/)
    expect(sql).toContain('enable row level security')
    for (const command of ['select', 'insert', 'update', 'delete']) {
      expect(sql).toMatch(new RegExp(`create policy[^;]*for ${command}[^;]*auth\\.uid\\(\\)\\s*=\\s*user_id`))
    }
  })
})
