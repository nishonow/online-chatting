import { InformationCircleIcon, UsersIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ChatHeader from '../components/ChatHeader'
import Composer from '../components/Composer'
import GroupList from '../components/GroupList'
import JoinModal from '../components/JoinModal'
import MemberList from '../components/MemberList'
import MessageList from '../components/MessageList'
import { useAuth } from '../hooks/useAuth'
import { useGroups } from '../hooks/useGroups'
import { useMembers } from '../hooks/useMembers'
import { useMessages } from '../hooks/useMessages'

type GroupChatContainerProps = {
  initialGroupId: number | null
}

function GroupChatContainer({ initialGroupId }: GroupChatContainerProps) {
  const [leftTab, setLeftTab] = useState<'groups' | 'users'>('groups')
  const [error, setError] = useState('')
  const [bannedNotice, setBannedNotice] = useState('')
  const { token, me } = useAuth()
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
  const messageScrollRef = useRef<HTMLDivElement | null>(null)

  const activeMembers = members.filter((member) => !member.is_banned)

  useEffect(() => {
    setError('')
    setBannedNotice('')
    if (!selectedGroupId) {
      setMobileView('list')
    }
  }, [selectedGroupId])

  useEffect(() => {
    if (!selectedGroupId) {
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        clearSelection()
        navigate('/')
        setMobileView('list')
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [clearSelection, navigate, selectedGroupId])

  useEffect(() => {
    if (!selectedGroup?.is_member || !messageScrollRef.current) {
      return
    }

    if (messageScrollRef.current) {
      messageScrollRef.current.scrollTo({
        top: messageScrollRef.current.scrollHeight,
        behavior: 'auto',
      })
    }
  }, [messages, selectedGroup?.is_member, selectedGroupId])

  const headerTitle = bannedNotice ? 'Access restricted' : selectedGroup?.name || 'Select a group'
  const headerSubtitle = bannedNotice
    ? 'You are banned from this group.'
    : selectedGroup?.description || 'Group chat'

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
                    setMobileView('chat')
                }}
              />
            ) : (
              <MemberList members={members} />
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
              clearSelection()
              navigate('/')
              setMobileView('list')
            }}
            onInfo={() => setMobileView('info')}
          />

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex min-h-0 flex-1 flex-col bg-blue-100/70 px-8 py-6">
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
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
            </div>
            <Composer
              value={messageText}
              onChange={setMessageText}
              onSubmit={send}
              disabled={!selectedGroupId || !selectedGroup?.is_member}
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
              <span>Group info</span>
            </div>
            <div className="flex items-center gap-2">
              {selectedGroup ? (
                <button
                  type="button"
                  onClick={() => {
                    clearSelection()
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
                <div
                  key={member.user_id}
                  className="flex items-center gap-3 rounded-lg border border-blue-200 bg-white/90 px-3 py-2 text-xs text-slate-700"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-blue-200 text-xs font-semibold text-blue-800">
                    {member.username[0]?.toUpperCase()}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{member.username}</p>
                    <p className="text-[10px] text-slate-400">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
      {joinTarget ? (
        <JoinModal
          groupName={joinTarget.name}
          isJoining={isJoining}
          onCancel={() => setJoinTarget(null)}
          onConfirm={confirmJoin}
        />
      ) : null}
      {bannedNotice ? (
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
