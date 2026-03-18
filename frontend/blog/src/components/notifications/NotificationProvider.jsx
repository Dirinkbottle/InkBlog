import React, { useEffect, useMemo, useRef } from 'react'
import { toast } from 'sonner'
import useAuthStore from '@/store/authStore'
import { useSuccessStore } from '@/store/successStore'
import { useErrorStore } from '@/store/errorStore'
import { getClientSessionId } from '@/services/clientSession'

const MAX_SEEN_IDS = 200

function getSeenKey(sessionId) {
  return `inkblog_notification_seen_${sessionId}`
}

function getAckKey(sessionId) {
  return `inkblog_notification_ack_queue_${sessionId}`
}

function readJsonFromSessionStorage(key, fallback) {
  try {
    const value = sessionStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

function writeJsonToSessionStorage(key, value) {
  sessionStorage.setItem(key, JSON.stringify(value))
}

function rememberDelivery(sessionId, deliveryId) {
  const key = getSeenKey(sessionId)
  const entries = readJsonFromSessionStorage(key, [])
  const existing = entries.find((item) => item.deliveryId === deliveryId)
  const now = Date.now()

  if (existing) {
    existing.seenAt = now
    writeJsonToSessionStorage(key, entries)
    return false
  }

  const nextEntries = [...entries, { deliveryId, seenAt: now }].slice(-MAX_SEEN_IDS)
  writeJsonToSessionStorage(key, nextEntries)
  return true
}

function enqueueAck(sessionId, deliveryId) {
  const key = getAckKey(sessionId)
  const queue = readJsonFromSessionStorage(key, [])
  if (!queue.includes(deliveryId)) {
    queue.push(deliveryId)
    writeJsonToSessionStorage(key, queue)
  }
}

function getAckQueue(sessionId) {
  return readJsonFromSessionStorage(getAckKey(sessionId), [])
}

function dequeueAck(sessionId, deliveryId) {
  const key = getAckKey(sessionId)
  const queue = readJsonFromSessionStorage(key, [])
  writeJsonToSessionStorage(key, queue.filter((item) => item !== deliveryId))
}

function dispatchBackendToast(payload) {
  if (payload.level === 'success') {
    useSuccessStore.getState().addSuccess({
      message: payload.message,
      details: payload.title || undefined,
    })
    return
  }

  if (payload.level === 'error') {
    useErrorStore.getState().addError({
      title: payload.title || '错误',
      message: payload.message,
    })
    return
  }

  if (payload.level === 'warning') {
    toast.warning(payload.message, {
      description: payload.title || undefined,
    })
    return
  }

  toast.info(payload.message, {
    description: payload.title || undefined,
  })
}

function parseSSEBlock(block) {
  const lines = block.split(/\r?\n/)
  let event = 'message'
  const dataLines = []

  for (const line of lines) {
    if (!line) continue
    if (line.startsWith('event:')) {
      event = line.slice(6).trim()
      continue
    }
    if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trim())
    }
  }

  if (!dataLines.length) {
    return null
  }

  try {
    return {
      event,
      data: JSON.parse(dataLines.join('\n')),
    }
  } catch {
    return null
  }
}

async function readSSEStream(stream, onEvent) {
  const reader = stream.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  while (true) {
    const { value, done } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const blocks = buffer.split('\n\n')
    buffer = blocks.pop() || ''

    for (const block of blocks) {
      const parsed = parseSSEBlock(block)
      if (parsed) {
        onEvent(parsed)
      }
    }
  }
}

export default function NotificationProvider({ children }) {
  const token = useAuthStore((state) => state.token)
  const sessionId = useMemo(() => getClientSessionId(), [])
  const ackFlushingRef = useRef(false)

  useEffect(() => {
    let active = true
    let reconnectTimer = null
    let controller = null
    let retryDelay = 1000

    const flushAckQueue = async () => {
      if (ackFlushingRef.current) return
      ackFlushingRef.current = true

      try {
        while (active) {
          const queue = getAckQueue(sessionId)
          if (!queue.length) {
            break
          }

          const deliveryId = queue[0]
          try {
            const response = await fetch(`/api/v1/notifications/${deliveryId}/ack`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Client-Session-Id': sessionId,
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({
                client_session_id: sessionId,
              }),
            })

            if (!response.ok) {
              if (response.status === 403 || response.status === 404) {
                dequeueAck(sessionId, deliveryId)
                continue
              }
              break
            }

            dequeueAck(sessionId, deliveryId)
          } catch {
            break
          }
        }
      } finally {
        ackFlushingRef.current = false
      }
    }

    const handleNotificationEvent = (payload) => {
      if (!payload?.delivery_id) {
        return
      }

      const firstSeen = rememberDelivery(sessionId, payload.delivery_id)
      enqueueAck(sessionId, payload.delivery_id)
      if (firstSeen) {
        dispatchBackendToast(payload)
      }
      void flushAckQueue()
    }

    const openStream = async () => {
      controller = new AbortController()

      const response = await fetch('/events/notifications/stream', {
        method: 'GET',
        headers: {
          Accept: 'text/event-stream',
          'Cache-Control': 'no-cache',
          'X-Client-Session-Id': sessionId,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        signal: controller.signal,
      })

      if (!response.ok || !response.body) {
        throw new Error(`notification stream failed: ${response.status}`)
      }

      retryDelay = 1000
      void flushAckQueue()

      await readSSEStream(response.body, ({ event, data }) => {
        if (event === 'notification') {
          handleNotificationEvent(data)
        }
      })
    }

    const scheduleReconnect = () => {
      if (!active) return
      reconnectTimer = window.setTimeout(() => {
        void connectLoop()
      }, retryDelay)
      retryDelay = Math.min(retryDelay * 2, 10000)
    }

    const connectLoop = async () => {
      if (!active) return
      try {
        await openStream()
      } catch (error) {
        if (!active || controller?.signal.aborted) {
          return
        }
        console.warn('[NotificationProvider] stream disconnected:', error)
      }
      scheduleReconnect()
    }

    const handleOnline = () => {
      void flushAckQueue()
      if (!controller || controller.signal.aborted) {
        void connectLoop()
      }
    }

    window.addEventListener('online', handleOnline)
    void connectLoop()

    return () => {
      active = false
      window.removeEventListener('online', handleOnline)
      if (reconnectTimer) {
        window.clearTimeout(reconnectTimer)
      }
      if (controller) {
        controller.abort()
      }
    }
  }, [sessionId, token])

  return children
}
