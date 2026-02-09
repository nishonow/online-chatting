import type { UserSummary } from '../utils/api'

type MemberListProps = {
  members: UserSummary[]
  emptyText?: string
}

function MemberList({ members, emptyText = 'No users yet.' }: MemberListProps) {
  if (members.length === 0) {
    return <p className="text-xs text-slate-500">{emptyText}</p>
  }

  return (
    <div className="flex flex-col gap-2">
      {members.map((member) => (
        <div
          key={member.user_id}
          className="flex items-center justify-between rounded-lg border border-blue-200 bg-white/90 px-3 py-2 text-sm text-slate-700"
        >
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-blue-200 text-xs font-semibold text-blue-800">
              {(member.full_name || member.username)[0]?.toUpperCase()}
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-700">
                {member.full_name || member.username}
              </p>
              <p className="text-[10px] text-slate-400">@{member.username}</p>
            </div>
          </div>
          {member.is_banned ? (
            <span className="text-[10px] font-semibold text-red-500">Banned</span>
          ) : (
            <span className="text-[10px] text-slate-400">DM</span>
          )}
        </div>
      ))}
    </div>
  )
}

export default MemberList
