import type { Group } from '../../utils/api'

type AdminGroupListProps = {
  groups: Group[]
  onEdit: (group: Group) => void
  onDelete: (group: Group) => void
}

function AdminGroupList({ groups, onEdit, onDelete }: AdminGroupListProps) {
  return (
    <div className="rounded-2xl border border-blue-200 bg-white p-6">
      <p className="text-sm font-semibold text-slate-700">All groups</p>
      <ul className="mt-3 space-y-3 text-sm text-slate-600">
        {groups.map((group) => (
          <li key={group.id} className="rounded-lg border border-blue-100 p-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-800">{group.name}</p>
                <p className="text-xs text-slate-500">
                  {group.description || 'No description'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="text-xs font-semibold text-blue-600"
                  onClick={() => onEdit(group)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="text-xs font-semibold text-red-600"
                  onClick={() => onDelete(group)}
                >
                  Delete
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default AdminGroupList
