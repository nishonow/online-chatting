import type { Message, User } from '../utils/api'

type MessageListProps = {
  messages: Message[]
  me: User | null
}

function MessageList({ messages, me }: MessageListProps) {
  return (
    <div className="flex flex-col gap-3">
      {messages.map((message, index) => {
        const isMe = message.user_id === me?.id
        const showSender = index === 0 || messages[index - 1].user_id !== message.user_id

        return (
          <div
            key={message.id}
            className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}
          >
            {showSender ? (
              <div className="text-xs font-semibold text-slate-600">
                {message.sender_username}
              </div>
            ) : null}
            <div
              className={`relative max-w-[90%] rounded-lg border px-4 py-3 pr-14 text-sm text-slate-800 shadow-sm ${
                isMe ? 'border-blue-300 bg-blue-200' : 'border-blue-200 bg-white'
              }`}
            >
              {message.content}
              <span className="absolute bottom-2 right-3 text-[10px] text-slate-400">
                {new Date(message.created_at).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default MessageList
