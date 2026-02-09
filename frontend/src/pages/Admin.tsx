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
  const [activeSection, setActiveSection] = useState<
    'overview' | 'groups' | 'members' | 'create'
  >('overview')

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
    if (member.user_id === me?.id) {
      setError('You cannot ban yourself.')
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

  const selectedGroup = groups.find((group) => group.id === memberGroupId) || null
  const bannedCount = members.filter((member) => member.is_banned).length

  if (me && !me.is_admin) {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-50 via-slate-50 to-slate-100 px-4 py-10">
        <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
          <h1 className="text-xl font-semibold text-slate-900">Admin access required</h1>
          <p className="mt-2 text-sm text-slate-600">
            You do not have permission to view this page.
          </p>
          <Link className="mt-4 inline-block text-sm font-semibold text-emerald-700" to="/">
            Return to chat
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-50 via-slate-50 to-slate-100 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <aside className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-sm font-semibold text-white">
                AC
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Admin Console</p>
                <p className="text-xs text-slate-500">{me?.username}</p>
              </div>
            </div>
            <nav className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setActiveSection('overview')}
                className={`rounded-lg border px-3 py-2 text-left text-xs font-semibold transition ${
                  activeSection === 'overview'
                    ? 'border-emerald-400 bg-emerald-50 text-slate-900'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/40'
                }`}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => setActiveSection('create')}
                className={`rounded-lg border px-3 py-2 text-left text-xs font-semibold transition ${
                  activeSection === 'create'
                    ? 'border-emerald-400 bg-emerald-50 text-slate-900'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/40'
                }`}
              >
                Create group
              </button>
              <button
                type="button"
                onClick={() => setActiveSection('groups')}
                className={`rounded-lg border px-3 py-2 text-left text-xs font-semibold transition ${
                  activeSection === 'groups'
                    ? 'border-emerald-400 bg-emerald-50 text-slate-900'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/40'
                }`}
              >
                Groups
              </button>
              <button
                type="button"
                onClick={() => setActiveSection('members')}
                className={`rounded-lg border px-3 py-2 text-left text-xs font-semibold transition ${
                  activeSection === 'members'
                    ? 'border-emerald-400 bg-emerald-50 text-slate-900'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/40'
                }`}
              >
                Members
              </button>
            </nav>
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-600">Quick info</p>
              <p className="mt-2 text-xs text-slate-500">Groups: {groups.length}</p>
              <p className="text-xs text-slate-500">
                Selected: {selectedGroup ? selectedGroup.name : 'None'}
              </p>
            </div>
            <Link
              className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-emerald-700"
              to="/"
            >
              Return to chat
            </Link>
          </aside>
          <main className="flex flex-col gap-6">
            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
                {error}
              </div>
            ) : null}
            {activeSection === 'overview' ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-600">
                  Admin overview
                </p>
                <h2 className="mt-2 text-lg font-semibold text-slate-900">
                  Welcome back, {me?.full_name || me?.username}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Keep groups tidy and manage member access from one place.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">Total groups</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">
                      {groups.length}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">Selected members</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">
                      {selectedGroup ? members.length : '--'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">Banned in group</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">
                      {selectedGroup ? bannedCount : '--'}
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveSection('create')}
                    className="rounded-md bg-emerald-600 px-4 py-2 text-xs font-semibold text-white"
                  >
                    Create a group
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSection('members')}
                    className="rounded-md border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700"
                  >
                    Manage members
                  </button>
                </div>
              </div>
            ) : null}
            {activeSection === 'create' ? (
              <AdminGroupForm
                name={name}
                description={description}
                error={error}
                isLoading={isLoading}
                onNameChange={setName}
                onDescriptionChange={setDescription}
                onSubmit={handleCreate}
              />
            ) : null}
            {activeSection === 'groups' ? (
              <AdminGroupList
                groups={groups}
                onEdit={startEdit}
                onDelete={handleDeleteConfirm}
              />
            ) : null}
            {activeSection === 'members' ? (
              <AdminMemberManager
                groups={groups}
                selectedGroupId={memberGroupId}
                members={members}
                isLoading={isLoading}
                currentUserId={me?.id ?? null}
                onSelectGroup={handleSelectMemberGroup}
                onToggleBan={toggleBan}
              />
            ) : null}
          </main>
        </div>
      </div>
      {modalMode === 'edit' && activeGroup ? (
        <AdminModal title="Edit group" onClose={() => setModalMode(null)}>
          <form className="flex flex-col gap-3" onSubmit={handleUpdate}>
            <input
              type="text"
              value={editName}
              onChange={(event) => setEditName(event.target.value)}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
            <input
              type="text"
              value={editDescription}
              onChange={(event) => setEditDescription(event.target.value)}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
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
                className="rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"
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
