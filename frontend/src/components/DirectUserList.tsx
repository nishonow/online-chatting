import type { DirectUser } from '../utils/api'

type DirectUserListProps = {
  users: DirectUser[]
  selectedUserId: number | null
  onSelect: (user: DirectUser) => void
}

function DirectUserList({ users, selectedUserId, onSelect }: DirectUserListProps) {
  if (users.length === 0) {
    return <p className="text-xs text-slate-500">No conversations yet.</p>
  }

  return (
    <div className="flex flex-col gap-2">
      {users.map((user) => {
        const isActive = user.id === selectedUserId
        const displayName = user.full_name || user.username
        return (
          <button
            key={user.id}
            type="button"
            onClick={() => onSelect(user)}
            className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm text-slate-700 ${
              isActive
                ? 'border-blue-400 bg-blue-200'
                : 'border-blue-200 bg-white/90 hover:bg-blue-100'
            }`}
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-blue-200 text-xs font-semibold text-blue-800">
              {displayName[0]?.toUpperCase()}
            </span>
            <div className="flex flex-col">
              <span className="font-semibold">{displayName}</span>
              <span className="text-[10px] text-slate-400">@{user.username}</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}

export default DirectUserList
