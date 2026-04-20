import { useEffect, useState } from 'react'

import type { EcommerceCustomerModelInput, ModelFeatureField, SimulationTrendPointDto } from '@/shared/api/contracts'
import { runPredictionTurn, startPredictionSession } from '@/shared/api/prediction'
import type { SystemId, TrendPoint } from '@/features/simulator/contracts'
import { useSimulationUiStore } from '@/stores/simulation-ui-store'


function toTrendPoint(dto: SimulationTrendPointDto): TrendPoint {
  return {
    label: dto.label,
    actualUsers: dto.actual_users,
    predictedUsers: dto.predicted_users,
    churnRisk: dto.churn_risk,
  }
}

function randomInitialUsers() {
  return 10000 + Math.floor(Math.random() * 10001)
}

export function useSimulationPrediction(
  selectedSystemId: SystemId,
  initialTrend: TrendPoint[],
  enabled: boolean,
  restartToken: number,
) {
  const simulationSessionId = useSimulationUiStore((state) => state.simulationSessionId)
  const predictionState = useSimulationUiStore((state) => state.predictionState)
  const strategyBudget = useSimulationUiStore((state) => state.strategyBudget)
  const liveTrend = useSimulationUiStore((state) => state.liveTrend)
  const hydrateSimulationSession = useSimulationUiStore((state) => state.hydrateSimulationSession)
  const applyPredictionTurn = useSimulationUiStore((state) => state.applyPredictionTurn)
  const resetSimulationSession = useSimulationUiStore((state) => state.resetSimulationSession)
  const setSelectedIncidentId = useSimulationUiStore((state) => state.setSelectedIncidentId)

  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [modelSchema, setModelSchema] = useState<ModelFeatureField[]>([])
  useEffect(() => {
    if (!enabled) return

    let isCancelled = false
    setIsPending(true)
    resetSimulationSession()

    const initRequest = {
      system_id: selectedSystemId,
      initial_users: randomInitialUsers(),
    }

    void startPredictionSession(initRequest)
      .then((response) => {
        if (isCancelled) return
        hydrateSimulationSession(response.session_id, response.state, response.strategy_budget, [toTrendPoint(response.initial_trend_point)])
        setModelSchema(response.model_schema)
        console.groupCollapsed('[simulation:init]')
        console.log('selected_system', selectedSystemId)
        console.log('fe_init_request', initRequest)
        console.log('session_id', response.session_id)
        console.log('be_init_response', response)
        console.log('be_model_schema', response.model_schema)
        console.log('be_strategy_budget', response.strategy_budget)
        console.log('fe_prediction_state', response.state)
        console.groupEnd()
        setErrorMessage(null)
      })
      .catch((error) => {
        if (isCancelled) return
        setModelSchema([])
        setErrorMessage(error instanceof Error ? error.message : 'Failed to start live prediction session.')
      })
      .finally(() => {
        if (isCancelled) return
        setIsPending(false)
      })

    return () => {
      isCancelled = true
    }
  }, [enabled, hydrateSimulationSession, initialTrend, resetSimulationSession, restartToken, selectedSystemId])

  async function runPrediction(
    modelInput: EcommerceCustomerModelInput,
    incidentId?: string | null,
  ) {
    if (!simulationSessionId || !predictionState) {
      setErrorMessage('Prediction session has not been initialized yet.')
      return null
    }

    setIsPending(true)
    const requestPayload = {
      session_id: simulationSessionId,
      state: {
        ...predictionState,
        system_id: selectedSystemId,
        model_input: modelInput,
      },
      incident_id: incidentId ?? null,
    }

    try {
      const response = await runPredictionTurn(requestPayload)

      applyPredictionTurn(response.next_state, response.strategy_budget, toTrendPoint(response.trend_point))
      if (response.next_incident_id) {
        setSelectedIncidentId(response.next_incident_id)
      }
      console.groupCollapsed('[simulation:turn]')
      console.log('fe_request_payload', requestPayload)
      console.log('be_response', response)
      console.log('fe_next_state', response.next_state)
      console.log('be_next_incident_id', response.next_incident_id)
      console.log('be_next_incident_options', response.next_incident_options)
      console.log('be_degraded_model_input', response.degraded_model_input)
      console.log('be_applied_adjustments', response.applied_adjustments)
      console.log('be_strategy_budget', response.strategy_budget)
      console.groupEnd()
      setErrorMessage(null)
      return response
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to run live prediction turn.')
      return null
    } finally {
      setIsPending(false)
    }
  }

  return {
    isPending,
    errorMessage,
    modelSchema,
    strategyBudget,
    liveTrend,
    predictionState,
    runPrediction,
  }
}
