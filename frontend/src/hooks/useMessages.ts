import { useEffect, useState } from 'react'
import { listMessages, sendMessage, type Group, type Message, type User } from '../utils/api'

type UseMessagesResult = {
  messages: Message[]
  messageText: string
  setMessageText: (value: string) => void
  send: (event: React.FormEvent<HTMLFormElement>) => Promise<void>
}

export function useMessages(
  token: string,
  selectedGroup: Group | undefined,
  me: User | null,
  onError: (message: string) => void,
): UseMessagesResult {
  const [messages, setMessages] = useState<Message[]>([])
  const [messageText, setMessageText] = useState('')

  useEffect(() => {
    if (!token || !selectedGroup || !selectedGroup.is_member) {
      setMessages([])
      return
    }

    const load = async () => {
      try {
        const data = await listMessages(token, selectedGroup.id)
        setMessages(data)
      } catch (err) {
        onError(err instanceof Error ? err.message : 'Failed to load messages')
      }
    }

    load()
  }, [onError, selectedGroup, token])

  useEffect(() => {
    if (!token || !selectedGroup || !selectedGroup.is_member) {
      return
    }

    const wsBase = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(
      /^http/,
      'ws',
    )
    const socket = new WebSocket(`${wsBase}/ws/groups/${selectedGroup.id}?token=${token}`)

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data)
        if (payload.type === 'message') {
          const incoming: Message = payload.data
          setMessages((prev) =>
            prev.some((item) => item.id === incoming.id) ? prev : [...prev, incoming],
          )
        }
      } catch (err) {
        return
      }
    }

    return () => {
      socket.close()
    }
  }, [selectedGroup, token])

  const send = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!token || !selectedGroup || !selectedGroup.is_member || !messageText.trim()) {
      return
    }

    try {
      const newMessage = await sendMessage(token, selectedGroup.id, messageText.trim())
      setMessages((prev) =>
        prev.some((item) => item.id === newMessage.id) ? prev : [...prev, newMessage],
      )
      setMessageText('')
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to send message')
    }
  }

  return { messages, messageText, setMessageText, send }
}
