import { useCallback, useEffect, useState } from 'react'
import { listDirectUsers, type DirectUser } from '../utils/api'

type UseDirectUsersResult = {
  users: DirectUser[]
  refresh: () => Promise<void>
}

export function useDirectUsers(token: string, onError: (message: string) => void): UseDirectUsersResult {
  const [users, setUsers] = useState<DirectUser[]>([])

  const load = useCallback(async () => {
    if (!token) {
      setUsers([])
      return
    }

    try {
      const data = await listDirectUsers(token)
      setUsers(data)
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to load direct users')
    }
  }, [onError, token])

  useEffect(() => {
    load()
  }, [load])

  return { users, refresh: load }
}
