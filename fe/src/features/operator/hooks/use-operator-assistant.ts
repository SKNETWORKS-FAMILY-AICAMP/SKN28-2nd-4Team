import { useEffect, useMemo, useRef, useState } from 'react'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { convertToModelMessages, readUIMessageStream, stepCountIs, streamText, tool, type UIMessage } from 'ai'
import { z } from 'zod'

import { buildStrategyInputSnapshot } from '@/features/operator/strategy-input-context'
import {
  applyIncidentDegradation,
  buildStrategyBudgetPreview,
  normalizeStrategyFieldValue,
} from '@/features/simulator/strategy-budget'
import type { Incident } from '@/features/simulator/contracts'
import type { ModelFeatureField, PredictionState, StrategyBudget } from '@/shared/api/contracts'
import { env } from '@/shared/config/env'
import { useSimulationUiStore } from '@/stores/simulation-ui-store'


type AssistantPromptContext = {
  monthlyLabel: string
  systemName: string
  currentState: PredictionState
  incident: {
    id: string
    eventId: string
    title: string
    summary: string
    severity: string
    impact: string
    window: string
    request: string
    affectedFeatures: string[]
    featureMultipliers: Record<string, number>
    featureAdditions: Record<string, number>
    lossRateBias: number
  }
  visibleIncidents: Incident[]
  modelSchema: ModelFeatureField[]
  strategyBudget: StrategyBudget | null
  armedPolicies: Array<{
    title: string
    effect: string
  }>
  latestTrend?: {
    actualUsers: number | null
    predictedUsers: number
    churnRisk: number
  }
}

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function upsertUiMessage(messages: UIMessage[], nextMessage: UIMessage) {
  const index = messages.findIndex((message) => message.id === nextMessage.id)
  if (index === -1) return [...messages, nextMessage]

  const updated = [...messages]
  updated[index] = nextMessage
  return updated
}

export function useOperatorAssistant(initialMessages: UIMessage[], sessionKey: string | number) {
  const [uiThreadMessages, setUiThreadMessages] = useState<UIMessage[]>(initialMessages)
  const [isPending, setIsPending] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const selectedStrategyModel = useSimulationUiStore((state) => state.selectedStrategyModel)
  const activeRequestIdRef = useRef(0)
  const initialMessageSignature = useMemo(
    () => initialMessages.map((message) => message.id).join('|'),
    [initialMessages],
  )

  useEffect(() => {
    activeRequestIdRef.current += 1
    setUiThreadMessages(initialMessages)
    setIsPending(false)
    setErrorMessage(null)
  }, [initialMessageSignature, sessionKey])

  async function submitRequest(
    request: string,
    context: AssistantPromptContext,
  ) {
    const trimmedRequest = request.trim()
    if (!trimmedRequest) return false
    if (isPending) return false

    const requestId = activeRequestIdRef.current + 1
    activeRequestIdRef.current = requestId

    function buildIncidentBaseInput() {
      return applyIncidentDegradation(
        context.currentState.model_input,
        context.incident,
        context.modelSchema,
      )
    }

    function buildCurrentStrategySnapshot() {
      const draftInput = useSimulationUiStore.getState().strategyDraftInput

      return buildStrategyInputSnapshot({
        currentInput: draftInput ?? buildIncidentBaseInput(),
        incidentAffectedFeatures: context.incident.affectedFeatures,
        modelSchema: context.modelSchema,
      })
    }

    function buildCurrentBudgetPreview() {
      const draftInput = useSimulationUiStore.getState().strategyDraftInput
      return buildStrategyBudgetPreview({
        degradedInput: buildIncidentBaseInput(),
        draftInput,
        modelSchema: context.modelSchema,
        strategyBudget: context.strategyBudget,
      })
    }

    const strategyInputSnapshot = buildCurrentStrategySnapshot()
    const budgetPreview = buildCurrentBudgetPreview()

    const userMessage: UIMessage = {
      id: createId('user'),
      role: 'user',
      parts: [{ type: 'text', text: trimmedRequest }],
    }
    const requestUiMessages = [
      ...uiThreadMessages,
      userMessage,
    ]

    setUiThreadMessages(requestUiMessages)
    setIsPending(true)
    setErrorMessage(null)

    try {
      if (!env.llmApiKey) {
        throw new Error('VITE_LLM_API_KEY is required for live strategy inference in the frontend.')
      }

      const openrouter = createOpenRouter({
        apiKey: env.llmApiKey,
      })

      console.groupCollapsed('[strategy:agent-context]')
      console.log('operator_request', trimmedRequest)
      console.log('incident', context.incident)
      console.log('visible_incidents', context.visibleIncidents)
      console.log('current_model_input', context.currentState.model_input)
      console.log('current_strategy_draft_input', useSimulationUiStore.getState().strategyDraftInput)
      console.log('incident_degraded_input', buildIncidentBaseInput())
      console.log('model_schema', context.modelSchema)
      console.log('strategy_budget', context.strategyBudget)
      console.log('strategy_budget_preview', budgetPreview)
      console.log('editable_strategy_inputs', strategyInputSnapshot.editableInputs)
      console.log('locked_strategy_inputs', strategyInputSnapshot.lockedInputs)
      console.log('focus_strategy_inputs', strategyInputSnapshot.focusInputs)
      console.log('influence_rules', strategyInputSnapshot.influenceRules)
      console.groupEnd()

      const result = streamText({
        model: openrouter(selectedStrategyModel),
        system: [
          env.llmSystemPrompt,
          '반드시 한국어로만 답변해.',
          '이전 대화 문맥이 함께 주어지면 그 흐름을 이어서 답해. 이전 답변과 충돌하면 이유를 짧게 설명해.',
          '답변을 시작하기 전에 tools를 사용해 현재 시뮬레이션 상태, 현재 event 상황, FE에 보이는 scenario event 목록, strategy options 입력 스키마를 확인해.',
          '현재 event 가 어떤 영향을 주는 상황인지 먼저 읽고, 그 다음 visible scenario board 에 어떤 카드들이 떠 있는지 함께 고려해 답해.',
          '항상 현재 남은 예산과 이번 조정안의 예상 spend 를 확인하고, 예산 안에서만 추천해.',
          '사용자가 직접 바꿀 수 있는 값과 바꿀 수 없는 컨텍스트 값을 반드시 구분해.',
          '편집 가능한 값은 range/enum/binary 제약 안에서만 추천하고, 편집 불가능한 값은 상황 설명에만 써.',
          '절대로 "만족도를 올리세요", "체류시간을 높이세요" 같이 스탯 이름만 말하고 끝내지 마라.',
          '각 권장안은 반드시 "무슨 운영 행동을 한다 -> 어떤 스탯이 어떻게 바뀐다 -> 왜 churn 방어에 도움이 된다" 흐름으로 설명해.',
          '가능하면 필드마다 1개 이상 구체 행동을 써라. 예: 공지 수정, CS 전담 큐 분리, 복귀 쿠폰 발송, 재구매 리마인드, 배송 우선순위 재조정.',
          '추천 조치 섹션에서는 필드명만 나열하지 말고, 실제 팀이 실행할 수 있는 운영 액션을 먼저 쓰고 그 다음 기대 스탯 변화를 연결해라.',
          '사용자가 명시적으로 적용/수정/바꿔달라고 요청하지 않았다면 값을 바로 바꾸지 말고, 추천값과 이유를 제시한 뒤 "이 값들로 진행할까요?"라고 먼저 확인해.',
          '예산이 부족하면 우선순위가 높은 소수 필드만 제안하고, 어떤 값은 왜 포기했는지도 짧게 설명해.',
          '사용자가 "진행", "적용", "세팅해", "맞춰줘"처럼 명시적으로 진행을 요청하면 update_strategy_input_value 도구를 필요한 횟수만큼 사용해서 strategy options form 값을 실제로 바꿔라.',
          '이 경우 prediction 을 실행하지 말고, Apply Strategy Input 버튼을 누르기 직전의 staged 상태까지만 만든다.',
          '값을 바꾼 뒤에는 get_budget_status 로 최신 planned spend 와 remaining after apply 를 다시 확인해 반영해라.',
          '값을 바꾼 경우 어떤 필드를 몇으로 바꿨는지, 왜 그렇게 바꿨는지, 아직 prediction 은 실행되지 않았다는 점을 답변에 명시해.',
          'preset action 이름만 제안하지 말고, 어떤 입력값을 올릴지/내릴지와 현재값 대비 권장 방향을 함께 설명해.',
          'incident affected feature, 현재 값 상태, influence rule 을 우선순위에 반영해.',
          '답변에서 추천 조치마다 가능한 한 해당 필드의 actionExamples 를 우선 참조해 구체 행동을 설명해.',
          '도구 결과를 근거로 1) 상황 요약 2) 권장 조치 3) 주의할 리스크 순서로 짧고 명확하게 답해.',
        ].join('\n'),
        messages: await convertToModelMessages(requestUiMessages),
        stopWhen: stepCountIs(6),
        onStepFinish: ({ stepNumber, toolCalls, toolResults }) => {
          console.groupCollapsed(`[strategy:step:${stepNumber}]`)
          if (toolCalls.length > 0) console.log('tool_calls', toolCalls)
          if (toolResults.length > 0) console.log('tool_results', toolResults)
          console.groupEnd()
        },
        tools: {
          get_current_state: tool({
            description: '현재 FE가 유지 중인 시뮬레이션 상태를 조회한다.',
            inputSchema: z.object({}),
            execute: async () => ({
              month: context.monthlyLabel,
              system: context.systemName,
              state: context.currentState,
            }),
          }),
          get_priority_incident: tool({
            description: '현재 선택된 우선 인시던트의 상세 정보를 조회한다.',
            inputSchema: z.object({}),
            execute: async () => ({
              incident: context.incident,
            }),
          }),
          get_visible_scenario_events: tool({
            description: '현재 FE 우측 Scenario Event 영역에 보이는 시나리오 카드 목록 전체를 조회한다.',
            inputSchema: z.object({}),
            execute: async () => ({
              current_event: context.incident,
              visible_scenario_events: context.visibleIncidents,
            }),
          }),
          get_strategy_input_schema: tool({
            description: 'strategy options form 에서 사용자가 바꿀 수 있는 값, 바꿀 수 없는 값, 현재값, 허용 range/enum, incident 관련도, 권장 변화 방향, 그리고 해당 값을 움직일 수 있는 실제 운영 행동 예시를 조회한다.',
            inputSchema: z.object({}),
            execute: async () => {
              const snapshot = buildCurrentStrategySnapshot()
              const preview = buildCurrentBudgetPreview()
              return {
                editable_inputs: snapshot.editableInputs,
                locked_inputs: snapshot.lockedInputs,
                focus_inputs: snapshot.focusInputs,
                influence_rules: snapshot.influenceRules,
                budget_preview: preview,
              }
            },
          }),
          get_budget_status: tool({
            description: '현재 남은 budget, incident degraded baseline, 현재 draft 기준 예상 spend 를 조회한다.',
            inputSchema: z.object({}),
            execute: async () => ({
              strategy_budget: context.strategyBudget,
              degraded_input: buildIncidentBaseInput(),
              budget_preview: buildCurrentBudgetPreview(),
            }),
          }),
          update_strategy_input_value: tool({
            description: 'strategy options form 의 편집 가능한 필드 값을 strict schema 와 current budget 안에서 갱신한다. editable=false 인 필드는 수정할 수 없다.',
            inputSchema: z.object({
              fieldName: z.string(),
              value: z.union([z.string(), z.number()]),
            }),
            execute: async ({ fieldName, value }) => {
              const snapshot = buildCurrentStrategySnapshot()
              const targetField = snapshot.editableInputs.find((field) => field.name === fieldName)
              if (!targetField) {
                return {
                  updated: false,
                  fieldName,
                  reason: '편집 가능한 strategy field 가 아니거나 존재하지 않는 필드입니다.',
                }
              }

              const schemaField = context.modelSchema.find((field) => field.name === fieldName)
              if (!schemaField) {
                return {
                  updated: false,
                  fieldName,
                  reason: 'model schema 에 없는 필드입니다.',
                }
              }

              const normalized = normalizeStrategyFieldValue(schemaField, value)
              if (!normalized.ok) {
                return {
                  updated: false,
                  fieldName,
                  reason: normalized.error,
                }
              }

              const currentDraft = useSimulationUiStore.getState().strategyDraftInput
              if (!currentDraft) {
                return {
                  updated: false,
                  fieldName,
                  reason: '현재 strategy draft 가 초기화되지 않았습니다.',
                }
              }

              const nextDraft = {
                ...currentDraft,
                [fieldName]: normalized.normalized,
              }
              const preview = buildStrategyBudgetPreview({
                degradedInput: buildIncidentBaseInput(),
                draftInput: nextDraft,
                modelSchema: context.modelSchema,
                strategyBudget: context.strategyBudget,
              })
              if (preview.overBudget) {
                return {
                  updated: false,
                  fieldName,
                  reason: `예산이 부족합니다. planned=${preview.plannedSpend}, remaining=${preview.remainingBudget}`,
                }
              }

              useSimulationUiStore.getState().updateStrategyDraftField(
                fieldName as keyof PredictionState['model_input'],
                normalized.normalized,
              )

              const nextSnapshot = buildCurrentStrategySnapshot()
              const nextBudgetPreview = buildCurrentBudgetPreview()
              const updatedField = nextSnapshot.editableInputs.find((field) => field.name === fieldName)

              return {
                updated: true,
                fieldName,
                appliedValue: normalized.normalized,
                field: updatedField ?? null,
                budget_preview: nextBudgetPreview,
              }
            },
          }),
          get_active_directives: tool({
            description: '현재 Armed 상태인 디렉티브 목록을 조회한다.',
            inputSchema: z.object({}),
            execute: async () => ({
              armed_directives: context.armedPolicies,
            }),
          }),
          get_latest_trend: tool({
            description: '가장 최근 사용자 수 및 이탈 위험 추세를 조회한다.',
            inputSchema: z.object({}),
            execute: async () => ({
              latest_trend: context.latestTrend ?? null,
            }),
          }),
        },
      })

      for await (const uiMessage of readUIMessageStream({
        stream: result.toUIMessageStream({
          originalMessages: requestUiMessages,
          generateMessageId: () => createId('assistant'),
        }),
      })) {
        if (activeRequestIdRef.current !== requestId) {
          return false
        }
        if (uiMessage.role === 'user') {
          continue
        }
        setUiThreadMessages((current) => upsertUiMessage(current, uiMessage))
      }

      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Live strategy inference failed.'
      console.error('[strategy:llm:error]', {
        model: selectedStrategyModel,
        provider: 'openrouter',
        message,
        error,
      })
      setErrorMessage(message)
      return false
    } finally {
      if (activeRequestIdRef.current === requestId) {
        setIsPending(false)
      }
    }
  }

  function resetAssistant() {
    activeRequestIdRef.current += 1
    setUiThreadMessages(initialMessages)
    setIsPending(false)
    setErrorMessage(null)
  }

  return {
    threadMessages: uiThreadMessages,
    submitRequest,
    resetAssistant,
    isPending,
    errorMessage,
  }
}
