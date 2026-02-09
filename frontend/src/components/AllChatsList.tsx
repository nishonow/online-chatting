import { HashtagIcon, UserCircleIcon } from '@heroicons/react/24/outline'
import type { DirectUser, Group } from '../utils/api'

type AllChatsListProps = {
    groups: Group[]
    users: DirectUser[]
    selectedId: { type: 'group' | 'dm'; id: number | string } | null
    onSelectGroup: (group: Group) => void
    onSelectUser: (user: DirectUser) => void
}

type CombinedItem =
    | { type: 'group'; data: Group; sortName: string; id: number }
    | { type: 'user'; data: DirectUser; sortName: string; id: number }

function AllChatsList({
    groups,
    users,
    selectedId,
    onSelectGroup,
    onSelectUser,
}: AllChatsListProps) {
    const combined: CombinedItem[] = [
        ...groups.map((g) => ({
            type: 'group' as const,
            data: g,
            sortName: g.name,
            id: g.id,
        })),
        ...users.map((u) => ({
            type: 'user' as const,
            data: u,
            sortName: u.full_name || u.username,
            id: u.id,
        })),
    ].sort((a, b) => a.sortName.localeCompare(b.sortName))

    if (combined.length === 0) {
        return <p className="text-xs text-slate-500">No chats yet.</p>
    }

    return (
        <div className="flex flex-col gap-2">
            {combined.map((item) => {


                // Simpler active check based on how `GroupChatContainer` will likely pass it.
                // Actually `GroupChatContainer` passes `selectedGroupId` (number) or `selectedDmUser` (object with id).
                // Let's standardise the prop `selectedId` to be more flexible or simple.
                // Let's refine the prop above.

                // Re-evaluating inside the map for cleanliness
                const isSelected =
                    item.type === 'group'
                        ? (selectedId?.type === 'group' && selectedId.id === item.id)
                        : (selectedId?.type === 'dm' && selectedId.id === item.id)

                return (
                    <button
                        key={`${item.type}-${item.id}`}
                        type="button"
                        onClick={() => {
                            if (item.type === 'group') {
                                onSelectGroup(item.data)
                            } else {
                                onSelectUser(item.data)
                            }
                        }}
                        className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm text-slate-700 ${isSelected
                            ? 'border-blue-400 bg-blue-200'
                            : 'border-blue-200 bg-white/90 hover:bg-blue-100'
                            }`}
                    >
                        <span
                            className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-semibold ${item.type === 'group'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-indigo-100 text-indigo-700'
                                }`}
                        >
                            {item.type === 'group' ? (
                                <HashtagIcon className="h-4 w-4" />
                            ) : (
                                <UserCircleIcon className="h-4 w-4" />
                            )}
                        </span>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                                <span className="truncate font-semibold">{item.sortName}</span>
                                {item.type === 'group' && !item.data.is_member ? (
                                    <span className="ml-2 shrink-0 text-[10px] font-medium text-blue-600">
                                        Join
                                    </span>
                                ) : null}
                            </div>
                            <p className="truncate text-[10px] text-slate-400">
                                {item.type === 'group' ? 'Group' : `@${item.data.username}`}
                            </p>
                        </div>
                    </button>
                )
            })}
        </div>
    )
}

export default AllChatsList
