import { env } from '@/shared/config/env'

export type ApiSource = 'live' | 'mock'

export class ApiError extends Error {
  status?: number

  constructor(
    message: string,
    status?: number,
  ) {
    super(message)
    this.status = status
  }
}

export function buildApiUrl(path: string) {
  const base = env.apiBaseUrl.replace(/\/$/, '')
  if (!base) return path
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return `${base}${path}`
}

export async function getJsonWithFallback<T>(
  path: string,
  fallback: () => T | Promise<T>,
): Promise<{ data: T; source: ApiSource }> {
  if (env.apiSource === 'mock') {
    return { data: await fallback(), source: 'mock' }
  }

  try {
    const response = await fetch(buildApiUrl(path), {
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      throw new ApiError(`Request failed with status ${response.status}.`, response.status)
    }

    const data = (await response.json()) as T
    return { data, source: 'live' }
  } catch (error) {
    if (env.apiSource !== 'fallback' && !env.enableApiFallback) {
      throw error
    }

    return { data: await fallback(), source: 'mock' }
  }
}
