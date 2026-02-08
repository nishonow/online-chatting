import type { Group, UserSummary } from '../../utils/api'

type AdminMemberManagerProps = {
  groups: Group[]
  selectedGroupId: number | null
  members: UserSummary[]
  isLoading: boolean
  onSelectGroup: (groupId: number) => void
  onToggleBan: (member: UserSummary) => void
}

function AdminMemberManager({
  groups,
  selectedGroupId,
  members,
  isLoading,
  onSelectGroup,
  onToggleBan,
}: AdminMemberManagerProps) {
  return (
    <div className="rounded-2xl border border-blue-200 bg-white p-6">
      <p className="text-sm font-semibold text-slate-700">Manage members</p>
      <div className="mt-3 grid gap-3 md:grid-cols-[1fr_2fr]">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-slate-500">Select group</p>
          <div className="flex flex-col gap-2">
            {groups.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => onSelectGroup(group.id)}
                className={`rounded-md border px-3 py-2 text-left text-xs font-semibold ${
                  selectedGroupId === group.id
                    ? 'border-blue-400 bg-blue-100 text-slate-800'
                    : 'border-blue-200 bg-white text-slate-600'
                }`}
              >
                {group.name}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-4">
          {selectedGroupId ? (
            <div className="flex flex-col gap-3">
              {members.length === 0 ? (
                <p className="text-xs text-slate-500">No members yet.</p>
              ) : null}
              {members.map((member) => (
                <div
                  key={member.user_id}
                  className="flex items-center justify-between rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      {member.username}
                    </p>
                    <p className="text-[10px] text-slate-400">{member.role}</p>
                  </div>
                  <button
                    type="button"
                    className={`text-xs font-semibold ${
                      member.is_banned ? 'text-emerald-600' : 'text-red-600'
                    }`}
                    onClick={() => onToggleBan(member)}
                    disabled={isLoading}
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
