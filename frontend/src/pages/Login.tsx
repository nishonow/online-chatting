import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../utils/api'

function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const data = await login({ username, password })
      localStorage.setItem('access_token', data.access_token)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#d7e7ff] via-[#cfe0ff] to-[#e3efff] px-4 py-10">
      <div className="mx-auto flex min-h-[80vh] max-w-md items-center">
        <div className="w-full rounded-2xl border border-blue-200 bg-white p-8 shadow-[0_20px_50px_rgba(30,41,59,0.12)]">
          <h1 className="text-2xl font-semibold text-slate-900">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-500">Log in to your chat workspace.</p>
          <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-600">Username or email</label>
              <input
                type="text"
                placeholder="you@email.com"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="rounded-md border border-blue-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-600">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="rounded-md border border-blue-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            {error ? <p className="text-xs text-red-600">{error}</p> : null}
            <button
              type="submit"
              className="mt-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Log in'}
            </button>
          </form>
          <p className="mt-6 text-sm text-slate-500">
            New here?{' '}
            <Link className="font-semibold text-blue-600" to="/signup">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
