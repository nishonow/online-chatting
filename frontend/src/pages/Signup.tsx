import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signup } from '../utils/api'

function Signup() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await signup({ username, full_name: fullName || undefined, email, password })
      navigate('/login')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#d7e7ff] via-[#cfe0ff] to-[#e3efff] px-4 py-10">
      <div className="mx-auto flex min-h-[80vh] max-w-md items-center">
        <div className="w-full rounded-2xl border border-blue-200 bg-white p-8 shadow-[0_20px_50px_rgba(30,41,59,0.12)]">
          <h1 className="text-2xl font-semibold text-slate-900">Create account</h1>
          <p className="mt-2 text-sm text-slate-500">Join the chat in minutes.</p>
          <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-600">Username</label>
              <input
                type="text"
                placeholder="yourname"
                value={username}
                onChange={(event) => {
                  const val = event.target.value.replace(/[^a-zA-Z0-9_]/g, '')
                  setUsername(val)
                }}
                className="rounded-md border border-blue-200 px-3 py-2 text-base lg:text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-600">Full name</label>
              <input
                type="text"
                placeholder="Your name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="rounded-md border border-blue-200 px-3 py-2 text-base lg:text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-600">Email</label>
              <input
                type="email"
                placeholder="you@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="rounded-md border border-blue-200 px-3 py-2 text-base lg:text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-600">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="rounded-md border border-blue-200 px-3 py-2 text-base lg:text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            {error ? <p className="text-xs text-red-600">{error}</p> : null}
            <button
              type="submit"
              className="mt-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
              disabled={isLoading}
            >
              {isLoading ? 'Signing up...' : 'Sign up'}
            </button>
          </form>
          <p className="mt-6 text-sm text-slate-500">
            Already have an account?{' '}
            <Link className="font-semibold text-blue-600" to="/login">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Signup
