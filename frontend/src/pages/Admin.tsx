import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AdminGroupForm from '../components/admin/AdminGroupForm'
import AdminGroupList from '../components/admin/AdminGroupList'
import AdminMemberManager from '../components/admin/AdminMemberManager'
import AdminModal from '../components/admin/AdminModal'
import {
  banGroupMember,
  createGroup,
  deleteGroup,
  getMe,
  listGroupMembers,
  listAllGroups,
  unbanGroupMember,
  updateGroup,
  type Group,
  type UserSummary,
  type User,
} from '../utils/api'

function Admin() {
  const navigate = useNavigate()
  const token = useMemo(() => localStorage.getItem('access_token') || '', [])
  const [me, setMe] = useState<User | null>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [modalMode, setModalMode] = useState<'edit' | 'delete' | null>(null)
  const [activeGroup, setActiveGroup] = useState<Group | null>(null)
  const [memberGroupId, setMemberGroupId] = useState<number | null>(null)
  const [members, setMembers] = useState<UserSummary[]>([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }

    const load = async () => {
      try {
        const user = await getMe(token)
        setMe(user)
        const allGroups = await listAllGroups(token)
        setGroups(allGroups)
      } catch (err) {
        localStorage.removeItem('access_token')
        navigate('/login')
      }
    }

    load()
  }, [navigate, token])

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!token) {
      return
    }

    setIsLoading(true)
    try {
      const newGroup = await createGroup(token, {
        name,
        description: description || undefined,
      })
      setGroups((prev) => [newGroup, ...prev])
      setName('')
      setDescription('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create group')
    } finally {
      setIsLoading(false)
    }
  }

  const startEdit = (group: Group) => {
    setEditingGroupId(group.id)
    setEditName(group.name)
    setEditDescription(group.description || '')
    setActiveGroup(group)
    setModalMode('edit')
  }

  const handleUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!token || editingGroupId === null) {
      return
    }

    setIsLoading(true)
    try {
      const updated = await updateGroup(token, editingGroupId, {
        name: editName,
        description: editDescription || undefined,
      })
      setGroups((prev) => prev.map((group) => (group.id === updated.id ? updated : group)))
      setEditingGroupId(null)
      setModalMode(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update group')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (groupId: number) => {
    if (!token) {
      return
    }

    setIsLoading(true)
    try {
      await deleteGroup(token, groupId)
      setGroups((prev) => prev.filter((group) => group.id !== groupId))
      if (editingGroupId === groupId) {
        setEditingGroupId(null)
      }
      if (activeGroup?.id === groupId) {
        setActiveGroup(null)
      }
      setModalMode(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete group')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteConfirm = (group: Group) => {
    setActiveGroup(group)
    setModalMode('delete')
  }

  const loadMembers = async (groupId: number) => {
    if (!token) {
      return
    }

    try {
      const data = await listGroupMembers(token, groupId)
      setMembers(data)
    } catch (err) {
      setMembers([])
    }
  }

  const handleSelectMemberGroup = async (groupId: number) => {
    setMemberGroupId(groupId)
    await loadMembers(groupId)
  }

  const toggleBan = async (member: UserSummary) => {
    if (!token || !memberGroupId) {
      return
    }

    setIsLoading(true)
    try {
      if (member.is_banned) {
        await unbanGroupMember(token, memberGroupId, member.user_id)
      } else {
        await banGroupMember(token, memberGroupId, member.user_id)
      }
      await loadMembers(memberGroupId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update member')
    } finally {
      setIsLoading(false)
    }
  }

  if (me && !me.is_admin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#bcd6ff] via-[#b2ccff] to-[#c7ddff] px-4 py-10">
        <div className="mx-auto max-w-xl rounded-2xl border border-blue-200 bg-white p-8 text-center">
          <h1 className="text-xl font-semibold text-slate-900">Admin access required</h1>
          <p className="mt-2 text-sm text-slate-600">
            You do not have permission to view this page.
          </p>
          <Link className="mt-4 inline-block text-sm font-semibold text-blue-600" to="/">
            Return to chat
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#bcd6ff] via-[#b2ccff] to-[#c7ddff] px-4 py-10">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <AdminGroupForm
          name={name}
          description={description}
          error={error}
          isLoading={isLoading}
          onNameChange={setName}
          onDescriptionChange={setDescription}
          onSubmit={handleCreate}
        />

        <AdminGroupList groups={groups} onEdit={startEdit} onDelete={handleDeleteConfirm} />

        <AdminMemberManager
          groups={groups}
          selectedGroupId={memberGroupId}
          members={members}
          isLoading={isLoading}
          onSelectGroup={handleSelectMemberGroup}
          onToggleBan={toggleBan}
        />
      </div>
      {modalMode === 'edit' && activeGroup ? (
        <AdminModal title="Edit group" onClose={() => setModalMode(null)}>
          <form className="flex flex-col gap-3" onSubmit={handleUpdate}>
            <input
              type="text"
              value={editName}
              onChange={(event) => setEditName(event.target.value)}
              className="rounded-md border border-blue-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            <input
              type="text"
              value={editDescription}
              onChange={(event) => setEditDescription(event.target.value)}
              className="rounded-md border border-blue-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            {error ? <p className="text-xs text-red-600">{error}</p> : null}
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white"
                disabled={isLoading}
              >
                Save
              </button>
            </div>
          </form>
        </AdminModal>
      ) : null}
      {modalMode === 'delete' && activeGroup ? (
        <AdminModal title="Delete group" onClose={() => setModalMode(null)}>
          <p className="text-sm text-slate-600">
            Delete <span className="font-semibold">{activeGroup.name}</span>?
          </p>
          <div className="mt-6 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setModalMode(null)}
              className="text-xs font-semibold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleDelete(activeGroup.id)}
              className="rounded-md bg-red-600 px-3 py-2 text-xs font-semibold text-white"
              disabled={isLoading}
            >
              Delete
            </button>
          </div>
        </AdminModal>
      ) : null}
    </div>
  )
}

export default Admin
