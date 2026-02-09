import { useEffect, useRef, useState } from 'react'
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
  const cacheRef = useRef(new Map<string, DirectMessage[]>())

  useEffect(() => {
    if (!token || !selectedUser) {
      setMessages([])
      setMessageText('')
      return
    }

    const cached = cacheRef.current.get(selectedUser.username)
    if (cached) {
      setMessages(cached)
    }

    const load = async () => {
      try {
        const data = await listDirectMessages(token, selectedUser.username)
        setMessages(data)
        cacheRef.current.set(selectedUser.username, data)
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

    let socket: WebSocket | null = null
    let reconnectTimer: number | null = null

    const connect = () => {
      const wsBase = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(
        /^http/,
        'ws',
      )
      socket = new WebSocket(`${wsBase}/ws/dm/${selectedUser.username}?token=${token}`)

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data)
          if (payload.type === 'dm_message') {
            const incoming: DirectMessage = payload.data
            setMessages((prev) =>
              prev.some((item) => item.id === incoming.id) ? prev : [...prev, incoming],
            )
            cacheRef.current.set(
              selectedUser.username,
              cacheRef.current
                .get(selectedUser.username)
                ?.some((item) => item.id === incoming.id)
                ? (cacheRef.current.get(selectedUser.username) as DirectMessage[])
                : [...(cacheRef.current.get(selectedUser.username) || []), incoming],
            )
          }
        } catch (err) {
          return
        }
      }

      socket.onclose = () => {
        reconnectTimer = window.setTimeout(() => {
          connect()
        }, 3000)
      }

      socket.onerror = () => {
        socket?.close()
      }
    }

    connect()

    return () => {
      if (socket) {
        socket.onclose = null
        socket.close()
      }
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
      }
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
      cacheRef.current.set(
        selectedUser.username,
        cacheRef.current
          .get(selectedUser.username)
          ?.some((item) => item.id === newMessage.id)
          ? (cacheRef.current.get(selectedUser.username) as DirectMessage[])
          : [...(cacheRef.current.get(selectedUser.username) || []), newMessage],
      )
      setMessageText('')
      onSent?.()
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to send message')
    }
  }

  return { messages, messageText, setMessageText, send }
}
