import { useEffect, useMemo, useRef, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { TextStreamChatTransport } from 'ai'

import type { OperatorMessage, ToolEvent } from '@/features/simulator/contracts'
import { buildApiUrl } from '@/shared/api/http'

const INITIAL_TOOL_EVENTS: ToolEvent[] = [
  {
    id: 'tool-1',
    tool: 'collect_system_dangers',
    status: 'Completed',
    summary: 'Aggregated danger indices and active requests across all systems.',
  },
  {
    id: 'tool-2',
    tool: 'merge_prediction_context',
    status: 'Completed',
    summary: 'Synchronized prediction model outputs with the active operational queue.',
  },
]

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function getMessageText(message: {
  id: string
  role: string
  parts?: Array<{ type: string; text?: string }>
}) {
  return (message.parts ?? [])
    .filter((part) => part.type === 'text' && typeof part.text === 'string')
    .map((part) => part.text ?? '')
    .join('')
    .trim()
}

export function useOperatorAssistant() {
  const [toolEvents, setToolEvents] = useState(INITIAL_TOOL_EVENTS)
  const completedReplyCountRef = useRef(0)

  const { messages, sendMessage, status, error } = useChat({
    transport: new TextStreamChatTransport({
      api: buildApiUrl('/api/chat'),
    }),
  })

  const threadMessages = useMemo<OperatorMessage[]>(() => {
    return messages
      .map((message) => {
        const text = getMessageText(message)
        if (!text) return null

        return {
          id: message.id,
          role: message.role === 'assistant' ? 'operator' : 'user',
          text,
        } satisfies OperatorMessage
      })
      .filter((message): message is OperatorMessage => message !== null)
  }, [messages])

  useEffect(() => {
    const completedReplies = threadMessages.filter((message) => message.role === 'operator').length
    if (completedReplies <= completedReplyCountRef.current) return

    completedReplyCountRef.current = completedReplies
    setToolEvents((current) =>
      current.map((event, index) =>
        index === 0 && event.status === 'Running'
          ? { ...event, status: 'Completed', summary: 'Operator response is ready for review.' }
          : event,
      ),
    )
  }, [threadMessages])

  useEffect(() => {
    if (!error) return

    setToolEvents((current) =>
      current.map((event, index) =>
        index === 0 && event.status === 'Running'
          ? {
              ...event,
              status: 'Queued',
              summary: 'Backend request failed. Check the API proxy or fall back to mock contracts.',
            }
          : event,
      ),
    )
  }, [error])

  function submitRequest(request: string) {
    const trimmedRequest = request.trim()
    if (!trimmedRequest) return false

    setToolEvents((current) =>
      [
        {
          id: createId('tool'),
          tool: 'draft_policy_card',
          status: 'Running' as const,
          summary: 'Synthesizing operator request with backend strategy context.',
        },
        ...current,
      ].slice(0, 8),
    )

    void sendMessage({ text: trimmedRequest })
    return true
  }

  return {
    threadMessages,
    toolEvents,
    submitRequest,
    isPending: status === 'submitted' || status === 'streaming',
    errorMessage: error instanceof Error ? error.message : null,
  }
}
