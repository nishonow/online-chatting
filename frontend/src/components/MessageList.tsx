import { CheckIcon } from '@heroicons/react/16/solid'
import type { User } from '../utils/api'
import { formatDayLabel, formatRelativeTime, isSameDay } from '../utils/date'

type ChatMessage = {
  id: number
  user_id: number
  sender_username: string
  sender_name: string
  content: string
  created_at: string
}

type MessageListProps = {
  messages: ChatMessage[]
  me: User | null
  showSenderLabel?: boolean
}

function MessageList({ messages, me, showSenderLabel = true }: MessageListProps) {
  return (
    <div className="flex flex-col gap-3">
      {messages.map((message, index) => {
        const isMe = message.user_id === me?.id
        const showSender = index === 0 || messages[index - 1].user_id !== message.user_id
        const senderLabel = message.sender_name || message.sender_username

        const prevMessage = index > 0 ? messages[index - 1] : null
        const showDaySeparator = !prevMessage || !isSameDay(prevMessage.created_at, message.created_at)

        return (
          <div key={message.id} className="flex flex-col gap-3">
            {showDaySeparator && (
              <div className="flex items-center gap-4 py-4">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {formatDayLabel(message.created_at)}
                </span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>
            )}
            <div
              className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}
            >
              {showSender && showSenderLabel ? (
                <div className="text-xs font-semibold text-slate-600">{senderLabel}</div>
              ) : null}
              <div
                className={`max-w-[85%] rounded-2xl border px-3 py-2 text-sm shadow-sm ${isMe
                  ? 'border-blue-300 bg-blue-600 text-white'
                  : 'border-slate-200 bg-white text-slate-800'
                  }`}
              >
                <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
                  <div className="min-w-0 flex-1 break-words">
                    {message.content.split(/(https?:\/\/[^\s]+|(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s]*)?)/gi).map((part, i) => {
                      const isFullUrl = /^https?:\/\//i.test(part)
                      const isDomainUrl = /^[a-z0-9-]+\.[a-z]{2,}/i.test(part)

                      if (isFullUrl || isDomainUrl) {
                        return (
                          <a
                            key={i}
                            href={isFullUrl ? part : `https://${part}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${isMe ? 'text-blue-100' : 'text-blue-600'} underline-offset-2 hover:underline`}
                          >
                            {part}
                          </a>
                        )
                      }
                      return part
                    })}
                  </div>
                  <div className={`flex items-center gap-1 shrink-0 mb-[-2px] ${isMe ? 'text-blue-100/70' : 'text-slate-400'}`}>
                    <span className="text-[10px]">
                      {formatRelativeTime(message.created_at)}
                    </span>
                    {isMe && (
                      <CheckIcon className="h-3 w-3" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default MessageList
