import { useEffect, useState } from 'react'
import { listGroupMembers, type Group, type UserSummary } from '../utils/api'

type UseMembersResult = {
  members: UserSummary[]
}

export function useMembers(
  token: string,
  selectedGroup: Group | undefined,
  onError: (message: string) => void,
): UseMembersResult {
  const [members, setMembers] = useState<UserSummary[]>([])

  useEffect(() => {
    if (!token || !selectedGroup || !selectedGroup.is_member) {
      setMembers([])
      return
    }

    const load = async () => {
      try {
        const data = await listGroupMembers(token, selectedGroup.id)
        setMembers(data)
      } catch (err) {
        onError(err instanceof Error ? err.message : 'Failed to load members')
      }
    }

    load()
  }, [onError, selectedGroup, token])

  return { members }
}
