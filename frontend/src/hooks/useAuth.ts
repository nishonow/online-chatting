import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMe, type User } from '../utils/api'

type UseAuthResult = {
  token: string
  me: User | null
  refresh: () => Promise<void>
}

export function useAuth(): UseAuthResult {
  const navigate = useNavigate()
  const token = useMemo(() => localStorage.getItem('access_token') || '', [])
  const [me, setMe] = useState<User | null>(null)

  const refresh = useCallback(async () => {
    if (!token) {
      return
    }

    try {
      const user = await getMe(token)
      setMe(user)
    } catch (err) {
      localStorage.removeItem('access_token')
      navigate('/login')
    }
  }, [navigate, token])

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }

    refresh()
  }, [navigate, refresh, token])

  return { token, me, refresh }
}
