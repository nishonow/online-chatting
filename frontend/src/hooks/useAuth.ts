import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMe, type User } from '../utils/api'

type UseAuthResult = {
  token: string
  me: User | null
}

export function useAuth(): UseAuthResult {
  const navigate = useNavigate()
  const token = useMemo(() => localStorage.getItem('access_token') || '', [])
  const [me, setMe] = useState<User | null>(null)

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }

    const load = async () => {
      try {
        const user = await getMe(token)
        setMe(user)
      } catch (err) {
        localStorage.removeItem('access_token')
        navigate('/login')
      }
    }

    load()
  }, [navigate, token])

  return { token, me }
}
