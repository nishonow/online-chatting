import {
  InformationCircleIcon,
  UserCircleIcon,
  UsersIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import ChatHeader from '../components/ChatHeader'
import Composer from '../components/Composer'
import DirectUserList from '../components/DirectUserList'
import GroupList from '../components/GroupList'
import JoinModal from '../components/JoinModal'
import MessageList from '../components/MessageList'
import AllChatsList from '../components/AllChatsList'
import ProfileModal from '../components/ProfileModal'
import { Toast } from '../components/Toast'
import { useAuth } from '../hooks/useAuth'
import { useDirectMessages } from '../hooks/useDirectMessages'
import { useDirectUsers } from '../hooks/useDirectUsers'
import { useGroups } from '../hooks/useGroups'
import { useMembers } from '../hooks/useMembers'
import { useMessages } from '../hooks/useMessages'
import { getUserByUsername, updateMe, type DirectUser } from '../utils/api'

interface GroupChatContainerProps {
  initialGroupId?: number | null
  initialUsername?: string | null
}

function GroupChatContainer({
  initialGroupId: propGroupId,
  initialUsername: propUsername,
}: GroupChatContainerProps = {}) {
  const { groupId, username } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const leftTab = (searchParams.get('tab') as 'all' | 'groups' | 'users') || 'all'

  const initialGroupId =
    propGroupId !== undefined
      ? propGroupId
      : groupId
        ? Number(groupId)
        : null
  const initialUsername =
    propUsername !== undefined ? propUsername : username || null

  const setLeftTab = (tab: 'all' | 'groups' | 'users') => {
    setSearchParams((prev) => {
      prev.set('tab', tab)
      return prev
    }, { replace: true })
  }

  const hasInitialSelection = Boolean(initialGroupId || initialUsername)
  const [activeChat, setActiveChat] = useState<'group' | 'dm'>(
    initialUsername ? 'dm' : 'group',
  )
  const [selectedDmUser, setSelectedDmUser] = useState<DirectUser | null>(null)
  const [error, setError] = useState('')
  const [profileError, setProfileError] = useState('')
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isProfileSaving, setIsProfileSaving] = useState(false)
  const [bannedNotice, setBannedNotice] = useState('')
  const [isInfoOpen, setIsInfoOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const { token, me, refresh } = useAuth()
  const [mobileView, setMobileView] = useState<'list' | 'chat' | 'info'>(
    hasInitialSelection ? 'chat' : 'list',
  )
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

  const handleConfirmJoin = async () => {
    try {
      await confirmJoin()
      setToast({ message: `Successfully joined ${joinTarget?.name}`, type: 'success' })
    } catch (err) {
      handleError(err instanceof Error ? err.message : 'Failed to join group')
    }
  }

  const { members } = useMembers(token, selectedGroup, handleError)
  const { messages, messageText, setMessageText, send } = useMessages(
    token,
    selectedGroupId,
    selectedGroup?.is_member,
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

  const activeMessages = activeChat === 'dm' ? directMessages : messages

  useEffect(() => {
    if (!token || !initialUsername) {
      return
    }

    const load = async () => {
      try {
        const user = await getUserByUsername(token, initialUsername)
        setSelectedDmUser(user)
        setActiveChat('dm')
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
    setMobileView('chat')
    if (window.innerWidth >= 1024) {
      setIsInfoOpen(true)
    }
  }, [initialGroupId])

  useEffect(() => {
    setError('')
    setBannedNotice('')
    if (!selectedGroupId && !selectedDmUser) {
      if (!hasInitialSelection) {
        setMobileView('list')
      }
      setIsInfoOpen(false)
      return
    }

    setMobileView('chat')
    if (window.innerWidth >= 1024) {
      setIsInfoOpen(true)
    }
  }, [hasInitialSelection, selectedDmUser, selectedGroupId])

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
        navigate(`/?tab=${leftTab}`)
        setMobileView('list')
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeChat, clearSelection, navigate, selectedDmUser, selectedGroupId, leftTab])

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
      ? selectedDmUser
        ? dmDisplayName || ''
        : ''
      : bannedNotice
        ? 'Access restricted'
        : selectedGroup?.name || ''
  const headerSubtitle =
    activeChat === 'dm'
      ? selectedDmUser
        ? `@${selectedDmUser.username}`
        : ''
      : bannedNotice
        ? 'You are banned from this group.'
        : selectedGroup?.description || ''

  const handleSelectDirectUser = (user: DirectUser) => {
    clearSelection()
    setSelectedDmUser(user)
    setActiveChat('dm')
    navigate(`/dm/${user.username}?tab=${leftTab}`)
    setMobileView('chat')
  }

  const handleToggleInfo = () => {
    setIsInfoOpen((prev) => {
      const next = !prev
      if (next) {
        setMobileView('info')
      } else if (mobileView === 'info') {
        setMobileView('chat')
      }
      return next
    })
  }

  const handleHideInfo = () => {
    setIsInfoOpen(false)
    if (mobileView === 'info') {
      setMobileView('chat')
    }
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
      setToast({ message: 'Profile updated successfully!', type: 'success' })
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
  const hasActiveChat = Boolean(selectedGroupId || selectedDmUser)
  const isInitialLoading = hasInitialSelection && !hasActiveChat
  const gridColumns = isInfoOpen
    ? 'lg:grid-cols-[280px_1fr_320px]'
    : 'lg:grid-cols-[280px_1fr_0px]'

  return (
    <div className="fixed inset-0 z-50 bg-white lg:static lg:h-screen lg:bg-gradient-to-br lg:from-[#bcd6ff] lg:via-[#b2ccff] lg:to-[#c7ddff] lg:px-4 lg:py-6 overflow-x-hidden">
      <div
        className={`mx-auto grid h-full lg:h-[92vh] max-w-[96rem] grid-cols-1 lg:gap-5 transition-[grid-template-columns] duration-500 ease-in-out ${gridColumns}`}
      >
        <aside
          className={`${mobileView === 'list' ? 'flex' : 'hidden'
            } h-full lg:h-[92vh] flex-col gap-4 overflow-hidden lg:rounded-2xl lg:border lg:border-blue-200 bg-blue-50 lg:bg-blue-100/70 p-4 lg:shadow-[0_12px_30px_rgba(30,41,59,0.1)] lg:flex`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Navigation
            </p>
            <button
              type="button"
              onClick={() => setIsProfileOpen(true)}
              aria-label="Profile"
              className="rounded-full p-2 lg:p-1 text-slate-500 transition hover:bg-blue-200/60 hover:text-blue-900"
            >
              <UserCircleIcon className="h-7 w-7 lg:h-5 lg:w-5" />
            </button>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLeftTab('all')}
                className={`flex-1 rounded-md px-2 py-1 text-[10px] lg:text-xs font-semibold ${leftTab === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-white/50'
                  }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setLeftTab('groups')}
                className={`flex-1 rounded-md px-2 py-1 text-[10px] lg:text-xs font-semibold ${leftTab === 'groups'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-white/50'
                  }`}
              >
                Groups
              </button>
              <button
                type="button"
                onClick={() => setLeftTab('users')}
                className={`flex-1 rounded-md px-2 py-1 text-[10px] lg:text-xs font-semibold ${leftTab === 'users'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-white/50'
                  }`}
              >
                Users
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {leftTab === 'all' ? (
              <AllChatsList
                groups={groups}
                users={directUsers}
                selectedId={
                  activeChat === 'group' && selectedGroupId
                    ? { type: 'group', id: selectedGroupId }
                    : activeChat === 'dm' && selectedDmUser
                      ? { type: 'dm', id: selectedDmUser.id }
                      : null
                }
                onSelectGroup={(group) => {
                  navigate(`/group/${group.id}?tab=${leftTab}`)
                  setSelectedDmUser(null)
                  selectGroup(group)
                  setActiveChat('group')
                  setMobileView('chat')
                }}
                onSelectUser={(user) => {
                  handleSelectDirectUser(user)
                }}
              />
            ) : leftTab === 'groups' ? (
              <GroupList
                groups={groups}
                selectedGroupId={selectedGroupId}
                onSelect={(group) => {
                  navigate(`/group/${group.id}?tab=${leftTab}`)
                  setSelectedDmUser(null)
                  selectGroup(group)
                  setActiveChat('group')
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
          className={`${mobileView === 'chat' ? 'flex' : 'hidden'
            } h-full lg:h-[92vh] flex-col overflow-hidden lg:rounded-2xl lg:border lg:border-blue-200 bg-white lg:shadow-[0_20px_50px_rgba(30,41,59,0.14)] lg:flex`}
        >
          {hasActiveChat ? (
            <ChatHeader
              title={headerTitle}
              subtitle={headerSubtitle}
              variant={activeChat === 'dm' ? 'dm' : 'group'}
              onBack={() => {
                if (activeChat === 'dm') {
                  setSelectedDmUser(null)
                } else {
                  clearSelection()
                }
                navigate(`/?tab=${leftTab}`)
                setMobileView('list')
              }}
              onInfo={handleToggleInfo}
            />
          ) : null}

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex min-h-0 flex-1 flex-col bg-blue-100/70 px-4 py-2 lg:px-8 lg:py-6">
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              {activeChat === 'group' ? (
                <>
                  {!selectedGroupId && !isInitialLoading ? (
                    <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
                      Select a chat.
                    </div>
                  ) : null}
                  {selectedGroup && !selectedGroup.is_member ? (
                    <div className="flex flex-1 items-center justify-center text-sm text-slate-600">
                      Join this group to see messages.
                    </div>
                  ) : null}
                  {selectedGroup?.is_member ? (
                    <div className="min-h-0 flex-1">
                      {activeMessages.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-sm text-slate-600">
                          No messages yet.
                        </div>
                      ) : null}
                      {activeMessages.length > 0 ? (
                        <div
                          className="min-h-0 h-full overflow-y-auto pr-2 scroll-auto"
                          ref={messageScrollRef}
                        >
                          <MessageList messages={activeMessages} me={me} />
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </>
              ) : (
                <>
                  {!selectedDmUser && !isInitialLoading ? (
                    <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
                      Select a chat.
                    </div>
                  ) : null}
                  {selectedDmUser ? (
                    <div className="min-h-0 flex-1">
                      {activeMessages.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-sm text-slate-600">
                          No messages yet.
                        </div>
                      ) : null}
                      {activeMessages.length > 0 ? (
                        <div
                          className="min-h-0 h-full overflow-y-auto pr-2 scroll-auto"
                          ref={messageScrollRef}
                        >
                          <MessageList
                            messages={activeMessages}
                            me={me}
                            showSenderLabel={false}
                          />
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </>
              )}
            </div>
            {hasActiveChat ? (
              <Composer
                value={activeMessageText}
                onChange={setActiveMessageText}
                onSubmit={sendActiveMessage}
                disabled={isComposerDisabled}
              />
            ) : null}
          </div>
        </main>

        <aside
          className={`${mobileView === 'info' ? 'flex' : 'hidden'
            } h-full lg:h-[92vh] flex-col gap-4 overflow-hidden lg:rounded-2xl bg-blue-50 lg:bg-blue-100/70 p-4 lg:p-5 lg:shadow-[0_12px_30px_rgba(30,41,59,0.1)] lg:flex transition-all duration-500 ${isInfoOpen
              ? 'lg:opacity-100 lg:border lg:border-blue-200'
              : 'lg:opacity-0 lg:p-0 lg:border-0 lg:pointer-events-none'
            }`}
        >
          <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
            <div className="flex items-center gap-2">
              <InformationCircleIcon className="h-4 w-4 text-slate-400" />
              <span>{activeChat === 'dm' ? 'Direct chat' : 'Group info'}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleHideInfo}
                aria-label="Hide info"
                className="rounded-full p-1 text-slate-500 transition hover:bg-blue-200/60"
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
                      className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-xs text-slate-700 ${member.is_banned
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
          onConfirm={handleConfirmJoin}
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
                  navigate(`/?tab=${leftTab}`)
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
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}

export default GroupChatContainer

