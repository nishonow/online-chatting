import type { Group } from '../utils/api'

type GroupListProps = {
  groups: Group[]
  selectedGroupId: number | null
  onSelect: (group: Group) => void
}

function GroupList({ groups, selectedGroupId, onSelect }: GroupListProps) {
  if (groups.length === 0) {
    return <p className="text-xs text-slate-500">No groups yet.</p>
  }

  return (
    <div className="flex flex-col gap-2">
      {groups.map((group) => {
        const isActive = group.id === selectedGroupId
        return (
          <button
            key={group.id}
            type="button"
            onClick={() => onSelect(group)}
            className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm text-slate-700 ${
              isActive
                ? 'border-blue-400 bg-blue-200'
                : 'border-blue-200 bg-white/90 hover:bg-blue-100'
            }`}
          >
            <span>{group.name}</span>
            {!group.is_member ? (
              <span className="text-[10px] font-semibold text-blue-600">Join</span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

export default GroupList
