import type { Group, UserSummary } from '../../utils/api'

type AdminMemberManagerProps = {
  groups: Group[]
  selectedGroupId: number | null
  members: UserSummary[]
  isLoading: boolean
  currentUserId: number | null
  onSelectGroup: (groupId: number) => void
  onToggleBan: (member: UserSummary) => void
}

function AdminMemberManager({
  groups,
  selectedGroupId,
  members,
  isLoading,
  currentUserId,
  onSelectGroup,
  onToggleBan,
}: AdminMemberManagerProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">Member controls</p>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-600">
          Admin
        </p>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-[220px_1fr]">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-slate-500">Select group</p>
          <div className="flex flex-col gap-2">
            {groups.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => onSelectGroup(group.id)}
                className={`rounded-md border px-3 py-2 text-left text-xs font-semibold transition ${
                  selectedGroupId === group.id
                    ? 'border-emerald-400 bg-emerald-50 text-slate-900'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/40'
                }`}
              >
                {group.name}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          {selectedGroupId ? (
            <div className="flex flex-col gap-3">
              {members.length === 0 ? (
                <p className="text-xs text-slate-500">No members yet.</p>
              ) : null}
              {members.map((member) => (
                <div
                  key={member.user_id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      {member.username}
                      {currentUserId === member.user_id ? (
                        <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                          You
                        </span>
                      ) : null}
                    </p>
                    <p className="text-[10px] text-slate-400">{member.role}</p>
                  </div>
                  <button
                    type="button"
                    className={`text-xs font-semibold transition ${
                      member.is_banned ? 'text-emerald-600' : 'text-red-600'
                    } ${
                      currentUserId === member.user_id
                        ? 'cursor-not-allowed text-slate-300'
                        : 'hover:text-red-700'
                    }`}
                    onClick={() => onToggleBan(member)}
                    disabled={isLoading || currentUserId === member.user_id}
                  >
                    {member.is_banned ? 'Unban' : 'Ban'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">Choose a group to manage.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminMemberManager
