import { postJson } from '@/shared/api/http'
import type {
  PredictionRequest,
  PredictionResponse,
  PredictionSessionStartRequest,
  PredictionSessionStartResponse,
} from '@/shared/api/contracts'

export function startPredictionSession(body: PredictionSessionStartRequest) {
  return postJson<PredictionSessionStartResponse>('/api/prediction/session/start', body)
}

export function runPredictionTurn(body: PredictionRequest) {
  return postJson<PredictionResponse>('/api/prediction/churn', body)
}
