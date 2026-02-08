import { PaperAirplaneIcon } from '@heroicons/react/24/outline'

type ComposerProps = {
  value: string
  disabled: boolean
  onChange: (value: string) => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
}

function Composer({ value, disabled, onChange, onSubmit }: ComposerProps) {
  return (
    <div className="border-t border-blue-200 px-8 py-5">
      <form className="flex items-center gap-3" onSubmit={onSubmit}>
        <input
          type="text"
          placeholder="Type your message"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="flex-1 rounded-md border border-blue-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
        />
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white"
          disabled={disabled}
        >
          <PaperAirplaneIcon className="h-4 w-4" />
          Send
        </button>
      </form>
    </div>
  )
}

export default Composer
