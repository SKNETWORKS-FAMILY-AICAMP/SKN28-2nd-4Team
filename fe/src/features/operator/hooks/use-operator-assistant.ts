import { useState } from 'react'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { readUIMessageStream, stepCountIs, streamText, tool } from 'ai'
import { z } from 'zod'

import type { OperatorMessage, OperatorToolPart, OperatorTextPart } from '@/features/simulator/contracts'
import type { PredictionState } from '@/shared/api/contracts'
import { env } from '@/shared/config/env'
import { useSimulationUiStore } from '@/stores/simulation-ui-store'


type AssistantPromptContext = {
  monthlyLabel: string
  systemName: string
  currentState: PredictionState
  incident: {
    title: string
    summary: string
    impact: string
    request: string
  }
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

type UIMessageLike = {
  id: string
  role: string
  parts: Array<Record<string, unknown>>
}

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function mapUiMessageToOperatorMessage(uiMessage: UIMessageLike): OperatorMessage {
  return {
    id: uiMessage.id,
    role: uiMessage.role === 'user' ? 'user' : 'operator',
    parts: uiMessage.parts.flatMap<OperatorTextPart | OperatorToolPart>((part, index) => {
      if (part.type === 'text' && typeof part.text === 'string') {
        return [{ type: 'text' as const, text: part.text }]
      }

      if (typeof part.type === 'string' && part.type.startsWith('tool-')) {
        return [{
          type: 'tool' as const,
          toolCallId: String(part.toolCallId ?? `${uiMessage.id}-tool-${index}`),
          toolName: part.type.replace(/^tool-/, ''),
          state: String(part.state ?? 'input-available') as 'input-streaming' | 'input-available' | 'output-available' | 'output-error',
          input: part.input,
          output: part.output,
          errorText: typeof part.errorText === 'string' ? part.errorText : undefined,
        }]
      }

      return []
    }),
  }
}

function upsertMessage(messages: OperatorMessage[], nextMessage: OperatorMessage) {
  const index = messages.findIndex((message) => message.id === nextMessage.id)
  if (index === -1) return [...messages, nextMessage]

  const updated = [...messages]
  updated[index] = nextMessage
  return updated
}

export function useOperatorAssistant() {
  const [threadMessages, setThreadMessages] = useState<OperatorMessage[]>([])
  const [isPending, setIsPending] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const selectedStrategyModel = useSimulationUiStore((state) => state.selectedStrategyModel)

  async function submitRequest(request: string, context: AssistantPromptContext) {
    const trimmedRequest = request.trim()
    if (!trimmedRequest) return false

    const prompt = [
      '운영자 요청을 처리해.',
      '답변 전에 반드시 도구를 사용해서 현재 상태를 확인해.',
      '최소한 현재 상태, 우선 인시던트, 활성 디렉티브를 확인한 뒤 답해.',
      '',
      `운영자 요청: ${trimmedRequest}`,
    ].join('\n')

    const userMessage: OperatorMessage = {
      id: createId('user'),
      role: 'user',
      parts: [{ type: 'text', text: trimmedRequest }],
    }

    setThreadMessages((current) => [...current, userMessage])
    setIsPending(true)
    setErrorMessage(null)

    try {
      if (!env.llmApiKey) {
        throw new Error('VITE_LLM_API_KEY is required for live strategy inference in the frontend.')
      }

      const openrouter = createOpenRouter({
        apiKey: env.llmApiKey,
      })

      const result = streamText({
        model: openrouter(selectedStrategyModel),
        system: [
          env.llmSystemPrompt,
          '반드시 한국어로만 답변해.',
          '답변을 시작하기 전에 tools를 사용해 현재 시뮬레이션 상태를 확인해.',
          '도구 결과를 근거로 1) 상황 요약 2) 권장 조치 3) 주의할 리스크 순서로 짧고 명확하게 답해.',
        ].join('\n'),
        prompt,
        stopWhen: stepCountIs(5),
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
        stream: result.toUIMessageStream(),
      })) {
        const mappedMessage = mapUiMessageToOperatorMessage(uiMessage as UIMessageLike)
        setThreadMessages((current) => upsertMessage(current, mappedMessage))
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
      setIsPending(false)
    }
  }

  function resetAssistant() {
    setThreadMessages([])
    setIsPending(false)
    setErrorMessage(null)
  }

  return {
    threadMessages,
    submitRequest,
    resetAssistant,
    isPending,
    errorMessage,
  }
}
