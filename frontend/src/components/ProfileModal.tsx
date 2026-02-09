import { XMarkIcon } from '@heroicons/react/24/outline'
import { useEffect, useMemo, useState } from 'react'

type ProfileModalProps = {
  isOpen: boolean
  initialFullName: string
  initialUsername: string
  initialEmail: string
  isSaving: boolean
  error: string
  onClose: () => void
  onSave: (payload: {
    full_name?: string | null
    username?: string
    email?: string
    password?: string
  }) => void
}

function ProfileModal({
  isOpen,
  initialFullName,
  initialUsername,
  initialEmail,
  isSaving,
  error,
  onClose,
  onSave,
}: ProfileModalProps) {
  const [fullName, setFullName] = useState(initialFullName)
  const [username, setUsername] = useState(initialUsername)
  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState('')

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setFullName(initialFullName)
    setUsername(initialUsername)
    setEmail(initialEmail)
    setPassword('')
  }, [initialEmail, initialFullName, initialUsername, isOpen])

  const isDirty = useMemo(() => {
    return (
      fullName !== initialFullName ||
      username !== initialUsername ||
      email !== initialEmail ||
      password.trim().length > 0
    )
  }, [email, fullName, initialEmail, initialFullName, initialUsername, password, username])

  if (!isOpen) {
    return null
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const payload: {
      full_name?: string | null
      username?: string
      email?: string
      password?: string
    } = {}

    if (fullName !== initialFullName) {
      const trimmed = fullName.trim()
      payload.full_name = trimmed.length > 0 ? trimmed : null
    }

    if (username !== initialUsername) {
      const trimmed = username.trim()
      if (trimmed.length > 0) {
        payload.username = trimmed
      }
    }

    if (email !== initialEmail) {
      const trimmed = email.trim()
      if (trimmed.length > 0) {
        payload.email = trimmed
      }
    }

    if (password.trim().length > 0) {
      payload.password = password
    }

    onSave(payload)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-md rounded-2xl border border-blue-200 bg-white p-6 shadow-[0_20px_50px_rgba(30,41,59,0.2)]">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Profile</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1 text-slate-500 transition hover:bg-blue-100"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
        <form className="mt-4 flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-600">Full name</label>
            <input
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="rounded-md border border-blue-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-600">Username</label>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="rounded-md border border-blue-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-600">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-md border border-blue-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-600">Password</label>
            <input
              type="password"
              placeholder="Leave blank to keep current"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-md border border-blue-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          {error ? <p className="text-xs text-red-600">{error}</p> : null}
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
            disabled={!isDirty || isSaving}
          >
            {isSaving ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ProfileModal
