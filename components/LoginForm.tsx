import { useState, FormEvent } from 'react'
import { supabase } from '@/lib/initSupabase'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setPending(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setPending(false)
    if (error) setError(error.message)
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3" data-testid="login-form">
      <label className="flex flex-col gap-1">
        <span className="text-sm">Email address</span>
        <input
          id="email"
          type="email"
          name="email"
          placeholder="Your email address"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border rounded px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm">Password</span>
        <input
          id="password"
          type="password"
          name="password"
          placeholder="Your password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border rounded px-3 py-2"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="btn-black mt-2"
        aria-busy={pending}
      >
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
      {error && (
        <div role="alert" className="rounded-md bg-red-100 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <p className="text-xs text-gray-500 mt-2">
        Demo credentials: <code>demo@example.com</code> / <code>demo1234</code>
      </p>
    </form>
  )
}
