export interface ApiRequestOptions extends Omit<RequestInit, 'headers'> {
  headers?: HeadersInit
  token?: string
}

interface ApiErrorBody {
  error?: {
    code?: unknown
    message?: unknown
  }
}

export class ApiClientError extends Error {
  public readonly status: number
  public readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
    this.name = 'ApiClientError'
  }
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { token, headers: requestHeaders, ...requestOptions } = options
  const headers = new Headers(requestHeaders)
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? ''}${path}`, { ...requestOptions, headers })
  if (response.status === 204) return undefined as T

  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as ApiErrorBody
    const code = typeof body.error?.code === 'string' ? body.error.code : 'INTERNAL_ERROR'
    const message = typeof body.error?.message === 'string' ? body.error.message : 'Request failed'
    throw new ApiClientError(response.status, code, message)
  }

  return await response.json() as T
}
