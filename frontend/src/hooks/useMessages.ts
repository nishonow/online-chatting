import { useEffect, useRef, useState } from 'react'
import { listMessages, sendMessage, type Message } from '../utils/api'

type UseMessagesResult = {
  messages: Message[]
  messageText: string
  setMessageText: (value: string) => void
  send: (event: React.FormEvent<HTMLFormElement>) => Promise<void>
}

export function useMessages(
  token: string,
  selectedGroupId: number | null,
  isMember: boolean | undefined,
  onError: (message: string) => void,
): UseMessagesResult {
  const [messages, setMessages] = useState<Message[]>([])
  const [messageText, setMessageText] = useState('')
  const cacheRef = useRef(new Map<number, Message[]>())

  useEffect(() => {
    if (!token || !selectedGroupId || isMember === false) {
      setMessages([])
      return
    }
    if (isMember === undefined) {
      return
    }

    const cached = cacheRef.current.get(selectedGroupId)
    if (cached) {
      setMessages(cached)
    }

    const load = async () => {
      try {
        const data = await listMessages(token, selectedGroupId)
        setMessages(data)
        cacheRef.current.set(selectedGroupId, data)
      } catch (err) {
        onError(err instanceof Error ? err.message : 'Failed to load messages')
      }
    }

    load()
  }, [isMember, onError, selectedGroupId, token])

  useEffect(() => {
    if (!token || !selectedGroupId || isMember !== true) {
      return
    }

    const wsBase = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(
      /^http/,
      'ws',
    )
    const socket = new WebSocket(`${wsBase}/ws/groups/${selectedGroupId}?token=${token}`)

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data)
        if (payload.type === 'message') {
          const incoming: Message = payload.data
          setMessages((prev) =>
            prev.some((item) => item.id === incoming.id) ? prev : [...prev, incoming],
          )
          cacheRef.current.set(
            selectedGroupId,
            cacheRef.current
              .get(selectedGroupId)
              ?.some((item) => item.id === incoming.id)
              ? (cacheRef.current.get(selectedGroupId) as Message[])
              : [...(cacheRef.current.get(selectedGroupId) || []), incoming],
          )
        }
      } catch (err) {
        return
      }
    }

    return () => {
      socket.close()
    }
  }, [isMember, selectedGroupId, token])

  const send = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!token || !selectedGroupId || isMember !== true || !messageText.trim()) {
      return
    }

    try {
      const newMessage = await sendMessage(token, selectedGroupId, messageText.trim())
      setMessages((prev) =>
        prev.some((item) => item.id === newMessage.id) ? prev : [...prev, newMessage],
      )
      cacheRef.current.set(
        selectedGroupId,
        cacheRef.current
          .get(selectedGroupId)
          ?.some((item) => item.id === newMessage.id)
          ? (cacheRef.current.get(selectedGroupId) as Message[])
          : [...(cacheRef.current.get(selectedGroupId) || []), newMessage],
      )
      setMessageText('')
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to send message')
    }
  }

  return { messages, messageText, setMessageText, send }
}
