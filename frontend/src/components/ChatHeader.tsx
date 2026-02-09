import {
  ArrowLeftIcon,
  InformationCircleIcon,
  UserIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'

type ChatHeaderProps = {
  title: string
  subtitle: string
  onBack?: () => void
  onInfo?: () => void
  variant?: 'group' | 'dm'
}

function ChatHeader({ title, subtitle, onBack, onInfo, variant = 'group' }: ChatHeaderProps) {
  const AvatarIcon = variant === 'dm' ? UserIcon : UsersIcon

  return (
    <div className="border-b border-blue-300 bg-gradient-to-r from-blue-950 via-blue-900 to-blue-700 px-5 py-4 text-white">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              aria-label="Back"
              className="rounded-full p-2 lg:p-1 text-blue-100 transition hover:bg-white/10 lg:hidden"
            >
              <ArrowLeftIcon className="h-6 w-6 lg:h-4 lg:w-4" />
            </button>
          ) : null}
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-blue-100">
            <AvatarIcon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold">{title}</p>
            <p className="truncate text-xs text-blue-100/90">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onInfo ? (
            <button
              type="button"
              onClick={onInfo}
              aria-label="Info"
              className="rounded-full p-2 lg:p-1 text-blue-100 transition hover:bg-white/10"
            >
              <InformationCircleIcon className="h-6 w-6 lg:h-5 lg:w-5" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default ChatHeader
