import { z } from 'zod'

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().default(''),
  VITE_API_SOURCE: z.enum(['mock', 'fallback', 'live']).optional(),
  VITE_ENABLE_API_FALLBACK: z.enum(['true', 'false']).default('true'),
})

const parsedEnv = envSchema.parse({
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  VITE_API_SOURCE: import.meta.env.VITE_API_SOURCE,
  VITE_ENABLE_API_FALLBACK: import.meta.env.VITE_ENABLE_API_FALLBACK ?? 'true',
})

const defaultApiSource = import.meta.env.DEV
  ? 'mock'
  : (parsedEnv.VITE_ENABLE_API_FALLBACK === 'true' ? 'fallback' : 'live')

const apiSource = parsedEnv.VITE_API_SOURCE
  ?? defaultApiSource

export const env = {
  apiBaseUrl: parsedEnv.VITE_API_BASE_URL,
  apiSource,
  enableApiFallback: parsedEnv.VITE_ENABLE_API_FALLBACK === 'true',
}
