import { InformationCircleIcon, UsersIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ChatHeader from '../components/ChatHeader'
import Composer from '../components/Composer'
import DirectUserList from '../components/DirectUserList'
import GroupList from '../components/GroupList'
import JoinModal from '../components/JoinModal'
import MessageList from '../components/MessageList'
import ProfileModal from '../components/ProfileModal'
import { useAuth } from '../hooks/useAuth'
import { useDirectMessages } from '../hooks/useDirectMessages'
import { useDirectUsers } from '../hooks/useDirectUsers'
import { useGroups } from '../hooks/useGroups'
import { useMembers } from '../hooks/useMembers'
import { useMessages } from '../hooks/useMessages'
import { getUserByUsername, updateMe, type DirectUser } from '../utils/api'

type GroupChatContainerProps = {
  initialGroupId: number | null
  initialUsername?: string | null
}

function GroupChatContainer({
  initialGroupId,
  initialUsername = null,
}: GroupChatContainerProps) {
  const [leftTab, setLeftTab] = useState<'groups' | 'users'>('groups')
  const [activeChat, setActiveChat] = useState<'group' | 'dm'>(
    initialUsername ? 'dm' : 'group',
  )
  const [selectedDmUser, setSelectedDmUser] = useState<DirectUser | null>(null)
  const [error, setError] = useState('')
  const [profileError, setProfileError] = useState('')
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isProfileSaving, setIsProfileSaving] = useState(false)
  const [bannedNotice, setBannedNotice] = useState('')
  const { token, me, refresh } = useAuth()
  const [mobileView, setMobileView] = useState<'list' | 'chat' | 'info'>('list')
  const navigate = useNavigate()
  const handleError = useCallback((message: string) => {
    let normalized = message

    try {
      const parsed = JSON.parse(message)
      if (parsed?.detail) {
        normalized = parsed.detail
      }
    } catch {
      normalized = message
    }

    if (normalized.toLowerCase().includes('banned')) {
      setBannedNotice(normalized)
      setError('')
      return
    }

    setError(normalized)
  }, [])

  const {
    groups,
    selectedGroupId,
    selectedGroup,
    joinTarget,
    isJoining,
    selectGroup,
    confirmJoin,
    setJoinTarget,
    clearSelection,
  } = useGroups(token, initialGroupId, handleError)
  const { members } = useMembers(token, selectedGroup, handleError)
  const { messages, messageText, setMessageText, send } = useMessages(
    token,
    selectedGroup,
    me,
    handleError,
  )
  const { users: directUsers, refresh: refreshDirectUsers } = useDirectUsers(token, handleError)
  const {
    messages: directMessages,
    messageText: directMessageText,
    setMessageText: setDirectMessageText,
    send: sendDirectMessage,
  } = useDirectMessages(token, selectedDmUser, handleError, () => {
    refreshDirectUsers()
  })
  const messageScrollRef = useRef<HTMLDivElement | null>(null)

  const activeMembers = members.filter((member) => !member.is_banned)

  useEffect(() => {
    if (!token || !initialUsername) {
      return
    }

    const load = async () => {
      try {
        const user = await getUserByUsername(token, initialUsername)
        setSelectedDmUser(user)
        setActiveChat('dm')
        setLeftTab('users')
        setMobileView('chat')
      } catch (err) {
        handleError(err instanceof Error ? err.message : 'Failed to load user')
      }
    }

    load()
  }, [handleError, initialUsername, token])

  useEffect(() => {
    if (!initialGroupId) {
      return
    }

    setActiveChat('group')
    setLeftTab('groups')
  }, [initialGroupId])

  useEffect(() => {
    setError('')
    setBannedNotice('')
    if (!selectedGroupId && !selectedDmUser) {
      setMobileView('list')
    }
  }, [selectedDmUser, selectedGroupId])

  useEffect(() => {
    if (isProfileOpen) {
      setProfileError('')
    }
  }, [isProfileOpen])

  useEffect(() => {
    if (!selectedGroupId && !selectedDmUser) {
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (activeChat === 'dm') {
          setSelectedDmUser(null)
        } else {
          clearSelection()
        }
        navigate('/')
        setMobileView('list')
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeChat, clearSelection, navigate, selectedDmUser, selectedGroupId])

  useEffect(() => {
    if (!messageScrollRef.current) {
      return
    }

    if (activeChat === 'group' && !selectedGroup?.is_member) {
      return
    }

    if (activeChat === 'dm' && !selectedDmUser) {
      return
    }

    messageScrollRef.current.scrollTo({
      top: messageScrollRef.current.scrollHeight,
      behavior: 'auto',
    })
  }, [activeChat, directMessages, messages, selectedDmUser, selectedGroup?.is_member])

  const dmDisplayName = selectedDmUser?.full_name || selectedDmUser?.username
  const headerTitle =
    activeChat === 'dm'
      ? dmDisplayName || 'Select a user'
      : bannedNotice
        ? 'Access restricted'
        : selectedGroup?.name || 'Select a group'
  const headerSubtitle =
    activeChat === 'dm'
      ? selectedDmUser
        ? `@${selectedDmUser.username}`
        : 'Direct message'
      : bannedNotice
        ? 'You are banned from this group.'
        : selectedGroup?.description || 'Group chat'

  const handleSelectDirectUser = (user: DirectUser) => {
    setSelectedDmUser(user)
    setActiveChat('dm')
    setLeftTab('users')
    navigate(`/dm/${user.username}`)
    setMobileView('chat')
  }

  const handleProfileSave = async (payload: {
    full_name?: string | null
    username?: string
    email?: string
    password?: string
  }) => {
    if (!token) {
      return
    }

    setProfileError('')
    setIsProfileSaving(true)

    try {
      await updateMe(token, payload)
      await refresh()
      setIsProfileOpen(false)
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setIsProfileSaving(false)
    }
  }

  const activeMessageText = activeChat === 'dm' ? directMessageText : messageText
  const setActiveMessageText =
    activeChat === 'dm' ? setDirectMessageText : setMessageText
  const sendActiveMessage = activeChat === 'dm' ? sendDirectMessage : send
  const isComposerDisabled =
    activeChat === 'dm'
      ? !selectedDmUser
      : !selectedGroupId || !selectedGroup?.is_member

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-[#bcd6ff] via-[#b2ccff] to-[#c7ddff] px-4 py-6">
      <div className="mx-auto grid h-[92vh] max-w-[96rem] grid-cols-1 gap-5 lg:grid-cols-[280px_1fr_320px]">
        <aside
          className={`${
            mobileView === 'list' ? 'flex' : 'hidden'
          } h-[92vh] flex-col gap-4 overflow-hidden rounded-2xl border border-blue-200 bg-blue-100/70 p-4 shadow-[0_12px_30px_rgba(30,41,59,0.1)] lg:flex`}
        >
          <div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLeftTab('groups')}
                className={`flex-1 rounded-md px-3 py-1 text-xs font-semibold ${
                  leftTab === 'groups'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600'
                }`}
              >
                Groups
              </button>
              <button
                type="button"
                onClick={() => setLeftTab('users')}
                className={`flex-1 rounded-md px-3 py-1 text-xs font-semibold ${
                  leftTab === 'users'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600'
                }`}
              >
                Users
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {leftTab === 'groups' ? (
              <GroupList
                groups={groups}
                selectedGroupId={selectedGroupId}
                onSelect={(group) => {
                  navigate(`/group/${group.id}`)
                  selectGroup(group)
                  setActiveChat('group')
                  setLeftTab('groups')
                  setMobileView('chat')
                }}
              />
            ) : (
              <DirectUserList
                users={directUsers}
                selectedUserId={selectedDmUser?.id ?? null}
                onSelect={handleSelectDirectUser}
              />
            )}
          </div>
        </aside>

        <main
          className={`${
            mobileView === 'chat' ? 'flex' : 'hidden'
          } h-[92vh] flex-col overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-[0_20px_50px_rgba(30,41,59,0.14)] lg:flex`}
        >
          <ChatHeader
            title={headerTitle}
            subtitle={headerSubtitle}
            onBack={() => {
              if (activeChat === 'dm') {
                setSelectedDmUser(null)
              } else {
                clearSelection()
              }
              navigate('/')
              setMobileView('list')
            }}
            onInfo={() => setMobileView('info')}
            onProfile={() => setIsProfileOpen(true)}
          />

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex min-h-0 flex-1 flex-col bg-blue-100/70 px-8 py-6">
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              {activeChat === 'group' ? (
                <>
                  {!selectedGroup ? (
                    <button
                      type="button"
                      onClick={() => {
                        clearSelection()
                        navigate('/')
                      }}
                      className="flex flex-1 items-center justify-center text-sm text-slate-600"
                    >
                      Select a group to start chatting.
                    </button>
                  ) : null}
                  {selectedGroup && !selectedGroup.is_member ? (
                    <div className="flex flex-1 items-center justify-center text-sm text-slate-600">
                      Join this group to see messages.
                    </div>
                  ) : null}
                  {selectedGroup?.is_member && messages.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center text-sm text-slate-600">
                      No messages yet.
                    </div>
                  ) : null}
                  {selectedGroup?.is_member && messages.length > 0 ? (
                    <div
                      className="min-h-0 flex-1 overflow-y-auto pr-2 scroll-auto"
                      ref={messageScrollRef}
                    >
                      <MessageList messages={messages} me={me} />
                    </div>
                  ) : null}
                </>
              ) : (
                <>
                  {!selectedDmUser ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDmUser(null)
                        navigate('/')
                      }}
                      className="flex flex-1 items-center justify-center text-sm text-slate-600"
                    >
                      Select a user to start chatting.
                    </button>
                  ) : null}
                  {selectedDmUser && directMessages.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center text-sm text-slate-600">
                      No messages yet.
                    </div>
                  ) : null}
                  {selectedDmUser && directMessages.length > 0 ? (
                    <div
                      className="min-h-0 flex-1 overflow-y-auto pr-2 scroll-auto"
                      ref={messageScrollRef}
                    >
                      <MessageList messages={directMessages} me={me} showSenderLabel={false} />
                    </div>
                  ) : null}
                </>
              )}
            </div>
            <Composer
              value={activeMessageText}
              onChange={setActiveMessageText}
              onSubmit={sendActiveMessage}
              disabled={isComposerDisabled}
            />
          </div>
        </main>

        <aside
          className={`${
            mobileView === 'info' ? 'flex' : 'hidden'
          } h-[92vh] flex-col gap-4 overflow-hidden rounded-2xl border border-blue-200 bg-blue-100/70 p-5 shadow-[0_12px_30px_rgba(30,41,59,0.1)] lg:flex`}
        >
          <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
            <div className="flex items-center gap-2">
              <InformationCircleIcon className="h-4 w-4 text-slate-400" />
              <span>{activeChat === 'dm' ? 'Direct chat' : 'Group info'}</span>
            </div>
            <div className="flex items-center gap-2">
              {selectedGroup || selectedDmUser ? (
                <button
                  type="button"
                  onClick={() => {
                    if (activeChat === 'dm') {
                      setSelectedDmUser(null)
                    } else {
                      clearSelection()
                    }
                    navigate('/')
                    setMobileView('list')
                  }}
                  className="text-xs font-semibold text-slate-500"
                >
                  Clear
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setMobileView('chat')}
                className="lg:hidden"
              >
                <XMarkIcon className="h-4 w-4 text-slate-500" />
              </button>
            </div>
          </div>
          {activeChat === 'group' ? (
            <>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <UsersIcon className="h-4 w-4 text-slate-400" />
                {selectedGroup
                  ? `${activeMembers.length} member${activeMembers.length === 1 ? '' : 's'}`
                  : 'Select a group'}
              </div>
              <div className="rounded-lg border border-blue-200 bg-white/90 p-3 text-xs text-slate-600">
                {selectedGroup?.description || 'No group description yet.'}
              </div>
              <div className="flex min-h-0 flex-1 flex-col">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Members
                </p>
                <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                  {activeMembers.length === 0 ? (
                    <p className="text-xs text-slate-500">No members yet.</p>
                  ) : null}
                  {activeMembers.map((member) => (
                    <button
                      key={member.user_id}
                      type="button"
                      disabled={member.is_banned}
                      onClick={() =>
                        handleSelectDirectUser({
                          id: member.user_id,
                          username: member.username,
                          full_name: member.full_name,
                        })
                      }
                      className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-xs text-slate-700 ${
                        member.is_banned
                          ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                          : 'border-blue-200 bg-white/90 hover:bg-blue-100'
                      }`}
                    >
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-blue-200 text-xs font-semibold text-blue-800">
                        {(member.full_name || member.username)[0]?.toUpperCase()}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-700">
                          {member.full_name || member.username}
                        </p>
                        <p className="text-[10px] text-slate-400">@{member.username}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col gap-4">
              <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-white/90 px-4 py-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-blue-200 text-sm font-semibold text-blue-800">
                  {(selectedDmUser?.full_name || selectedDmUser?.username || '?')[0]?.toUpperCase()}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    {selectedDmUser?.full_name || selectedDmUser?.username || 'No user selected'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {selectedDmUser ? `@${selectedDmUser.username}` : 'Direct message'}
                  </p>
                </div>
              </div>
              <div className="rounded-lg border border-blue-200 bg-white/90 p-3 text-xs text-slate-600">
                Start a private conversation with this user.
              </div>
            </div>
          )}
        </aside>
      </div>
      <ProfileModal
        isOpen={isProfileOpen}
        initialFullName={me?.full_name || ''}
        initialUsername={me?.username || ''}
        initialEmail={me?.email || ''}
        isSaving={isProfileSaving}
        error={profileError}
        onClose={() => setIsProfileOpen(false)}
        onSave={handleProfileSave}
      />
      {joinTarget ? (
        <JoinModal
          groupName={joinTarget.name}
          isJoining={isJoining}
          onCancel={() => setJoinTarget(null)}
          onConfirm={confirmJoin}
        />
      ) : null}
      {bannedNotice && activeChat === 'group' ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-sm rounded-xl border border-blue-200 bg-white p-6 shadow-[0_20px_50px_rgba(30,41,59,0.2)]">
            <h2 className="text-lg font-semibold text-slate-900">Access denied</h2>
            <p className="mt-2 text-sm text-slate-600">{bannedNotice}</p>
            <div className="mt-6 flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  setBannedNotice('')
                  clearSelection()
                  navigate('/')
                  setMobileView('list')
                }}
                className="rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white"
              >
                Okay
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default GroupChatContainer
