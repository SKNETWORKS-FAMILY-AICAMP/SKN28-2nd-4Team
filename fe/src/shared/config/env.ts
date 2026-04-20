import { z } from 'zod'

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().default(''),
  VITE_LLM_API_KEY: z.string().optional(),
  VITE_LLM_BASE_URL: z.string().default('https://api.openai.com/v1'),
  VITE_LLM_MODEL: z.string().default('gpt-4o-mini'),
  VITE_STRATEGY_MODEL_OPTIONS: z.string().default('gpt-4o-mini,gpt-4.1-mini,o4-mini'),
  VITE_LLM_APP_NAME: z.string().default('SKN28 Simulator'),
  VITE_LLM_SYSTEM_PROMPT: z.string().default(
    'You are the strategy operator for a retention simulator. Keep answers concise, action-oriented, and tied to the current incident, active policies, and projected user loss.'
  ),
})

const parsedEnv = envSchema.parse({
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  VITE_LLM_API_KEY: import.meta.env.VITE_LLM_API_KEY,
  VITE_LLM_BASE_URL: import.meta.env.VITE_LLM_BASE_URL,
  VITE_LLM_MODEL: import.meta.env.VITE_LLM_MODEL,
  VITE_STRATEGY_MODEL_OPTIONS: import.meta.env.VITE_STRATEGY_MODEL_OPTIONS,
  VITE_LLM_APP_NAME: import.meta.env.VITE_LLM_APP_NAME,
  VITE_LLM_SYSTEM_PROMPT: import.meta.env.VITE_LLM_SYSTEM_PROMPT,
})

const strategyModelOptions = parsedEnv.VITE_STRATEGY_MODEL_OPTIONS
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean)

export const env = {
  apiBaseUrl: parsedEnv.VITE_API_BASE_URL,
  apiSource: 'live' as const,
  llmApiKey: parsedEnv.VITE_LLM_API_KEY,
  llmBaseUrl: parsedEnv.VITE_LLM_BASE_URL,
  llmModel: parsedEnv.VITE_LLM_MODEL,
  strategyModelOptions: strategyModelOptions.length > 0 ? strategyModelOptions : [parsedEnv.VITE_LLM_MODEL],
  llmAppName: parsedEnv.VITE_LLM_APP_NAME,
  llmSystemPrompt: parsedEnv.VITE_LLM_SYSTEM_PROMPT,
}
