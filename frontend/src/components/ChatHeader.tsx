import { ArrowLeftIcon, InformationCircleIcon, UsersIcon } from '@heroicons/react/24/outline'

type ChatHeaderProps = {
  title: string
  subtitle: string
  onBack?: () => void
  onInfo?: () => void
}

function ChatHeader({ title, subtitle, onBack, onInfo }: ChatHeaderProps) {
  return (
    <div className="border-b border-blue-300 bg-gradient-to-r from-blue-950 via-blue-900 to-blue-700 px-5 py-4 text-white">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              aria-label="Back"
              className="rounded-full p-1 text-blue-100 transition hover:bg-white/10 lg:hidden"
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </button>
          ) : null}
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-blue-100">
            <UsersIcon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold">{title}</p>
            <p className="truncate text-xs text-blue-100/90">{subtitle}</p>
          </div>
        </div>
        {onInfo ? (
          <button
            type="button"
            onClick={onInfo}
            aria-label="Info"
            className="rounded-full p-1 text-blue-100 transition hover:bg-white/10 lg:hidden"
          >
            <InformationCircleIcon className="h-5 w-5" />
          </button>
        ) : null}
      </div>
    </div>
  )
}

export default ChatHeader
