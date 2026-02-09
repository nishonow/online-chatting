import { useEffect, useState } from 'react'
import {
  listDirectMessages,
  sendDirectMessage,
  type DirectMessage,
  type DirectUser,
} from '../utils/api'

type UseDirectMessagesResult = {
  messages: DirectMessage[]
  messageText: string
  setMessageText: (value: string) => void
  send: (event: React.FormEvent<HTMLFormElement>) => Promise<void>
}

export function useDirectMessages(
  token: string,
  selectedUser: DirectUser | null,
  onError: (message: string) => void,
  onSent?: () => void,
): UseDirectMessagesResult {
  const [messages, setMessages] = useState<DirectMessage[]>([])
  const [messageText, setMessageText] = useState('')

  useEffect(() => {
    if (!token || !selectedUser) {
      setMessages([])
      setMessageText('')
      return
    }

    const load = async () => {
      try {
        const data = await listDirectMessages(token, selectedUser.username)
        setMessages(data)
      } catch (err) {
        onError(err instanceof Error ? err.message : 'Failed to load messages')
      }
    }

    load()
  }, [onError, selectedUser, token])

  useEffect(() => {
    if (!token || !selectedUser) {
      return
    }

    const wsBase = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(
      /^http/,
      'ws',
    )
    const socket = new WebSocket(`${wsBase}/ws/dm/${selectedUser.username}?token=${token}`)

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data)
        if (payload.type === 'dm_message') {
          const incoming: DirectMessage = payload.data
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
  }, [selectedUser, token])

  const send = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!token || !selectedUser || !messageText.trim()) {
      return
    }

    try {
      const newMessage = await sendDirectMessage(
        token,
        selectedUser.username,
        messageText.trim(),
      )
      setMessages((prev) =>
        prev.some((item) => item.id === newMessage.id) ? prev : [...prev, newMessage],
      )
      setMessageText('')
      onSent?.()
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to send message')
    }
  }

  return { messages, messageText, setMessageText, send }
}
