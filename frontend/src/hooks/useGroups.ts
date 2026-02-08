import { useEffect, useState } from 'react'
import { joinGroup, listAllGroups, type Group } from '../utils/api'

type UseGroupsResult = {
  groups: Group[]
  selectedGroupId: number | null
  selectedGroup: Group | undefined
  joinTarget: Group | null
  isJoining: boolean
  selectGroup: (group: Group) => void
  confirmJoin: () => Promise<void>
  setJoinTarget: (group: Group | null) => void
  clearSelection: () => void
}

export function useGroups(
  token: string,
  initialGroupId: number | null,
  onError: (message: string) => void,
): UseGroupsResult {
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const [joinTarget, setJoinTarget] = useState<Group | null>(null)
  const [isJoining, setIsJoining] = useState(false)

  useEffect(() => {
    if (!token) {
      return
    }

    const load = async () => {
      try {
        const allGroups = await listAllGroups(token)
        setGroups(allGroups)
        const initial = initialGroupId
          ? allGroups.find((group) => group.id === initialGroupId)
          : undefined
        if (initial) {
          setSelectedGroupId(initial.id)
        } else {
          setSelectedGroupId(null)
        }
      } catch (err) {
        onError('Failed to load groups')
      }
    }

    load()
  }, [initialGroupId, onError, token])

  useEffect(() => {
    if (!initialGroupId || groups.length === 0) {
      return
    }

    const match = groups.find((group) => group.id === initialGroupId)
    if (match && match.id !== selectedGroupId) {
      setSelectedGroupId(match.id)
    }
  }, [groups, initialGroupId, selectedGroupId])

  const selectGroup = (group: Group) => {
    setSelectedGroupId(group.id)
    if (!group.is_member) {
      setJoinTarget(group)
    }
  }

  const clearSelection = () => {
    setSelectedGroupId(null)
    setJoinTarget(null)
  }

  const confirmJoin = async () => {
    if (!joinTarget || !token) {
      return
    }

    setIsJoining(true)
    try {
      await joinGroup(token, joinTarget.id)
      setGroups((prev) =>
        prev.map((item) =>
          item.id === joinTarget.id ? { ...item, is_member: true } : item,
        ),
      )
      setSelectedGroupId(joinTarget.id)
      setJoinTarget(null)
    } catch (err) {
      onError('Failed to join group')
    } finally {
      setIsJoining(false)
    }
  }

  const selectedGroup = groups.find((group) => group.id === selectedGroupId)

  return {
    groups,
    selectedGroupId,
    selectedGroup,
    joinTarget,
    isJoining,
    selectGroup,
    confirmJoin,
    setJoinTarget,
    clearSelection,
  }
}
