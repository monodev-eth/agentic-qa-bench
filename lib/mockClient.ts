/**
 * Mock client for the benchmark. Implements just enough of the Supabase JS
 * surface (auth + from('todos') CRUD) for this app to function offline.
 * Backed by an in-memory store. Resets on full page reload.
 */

type Listener = (event: string, session: Session | null) => void

export type Session = {
  access_token: string
  refresh_token: string
  user: { id: string; email: string }
}

type Todo = {
  id: number
  user_id: string
  task: string | null
  is_complete: boolean | null
  inserted_at: string
}

export const SEED_USER = {
  id: 'mock-user-00000000-0000-0000-0000-000000000001',
  email: 'demo@example.com',
  password: 'demo1234',
}

const SEED_TODOS: Todo[] = [
  {
    id: 1,
    user_id: SEED_USER.id,
    task: 'Walk the dog',
    is_complete: false,
    inserted_at: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 2,
    user_id: SEED_USER.id,
    task: 'Buy groceries',
    is_complete: true,
    inserted_at: '2026-01-01T09:00:00.000Z',
  },
]

const STORAGE_KEY = 'mock-supabase-session'

let todos: Todo[] = [...SEED_TODOS]
let nextId = 3
const listeners: Listener[] = []

function loadSession(): Session | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

function saveSession(s: Session | null) {
  if (typeof window === 'undefined') return
  if (s) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
  else window.localStorage.removeItem(STORAGE_KEY)
}

function emit(event: string, session: Session | null) {
  for (const l of listeners) l(event, session)
}

function makeSession(email: string): Session {
  return {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    user: { id: SEED_USER.id, email },
  }
}

// --- Query builder for from('todos') ---

type Builder = {
  select: (cols?: string) => Builder
  insert: (row: Partial<Todo>) => Builder
  update: (row: Partial<Todo>) => Builder
  delete: () => Builder
  eq: (col: keyof Todo, val: unknown) => Builder
  order: (col: keyof Todo, opts?: { ascending?: boolean }) => Builder
  single: () => Promise<{ data: Todo | null; error: Error | null }>
  throwOnError: () => Builder
  then: <T>(onfulfilled: (v: { data: Todo[] | null; error: Error | null }) => T) => Promise<T>
}

function todosBuilder(): Builder {
  let op: 'select' | 'insert' | 'update' | 'delete' = 'select'
  let payload: Partial<Todo> | null = null
  const filters: Array<[keyof Todo, unknown]> = []
  let orderCol: keyof Todo | null = null
  let orderAsc = true

  const run = (): { data: Todo[]; error: Error | null } => {
    let result: Todo[] = []
    if (op === 'select') {
      result = todos.filter((t) => filters.every(([c, v]) => t[c] === v))
      if (orderCol) {
        const col = orderCol
        result = [...result].sort((a, b) => {
          const av = a[col] as number
          const bv = b[col] as number
          return orderAsc ? av - bv : bv - av
        })
      }
    } else if (op === 'insert' && payload) {
      const created: Todo = {
        id: nextId++,
        user_id: payload.user_id ?? SEED_USER.id,
        task: payload.task ?? null,
        is_complete: payload.is_complete ?? false,
        inserted_at: new Date().toISOString(),
      }
      todos.push(created)
      result = [created]
    } else if (op === 'update' && payload) {
      todos = todos.map((t) =>
        filters.every(([c, v]) => t[c] === v) ? { ...t, ...payload } : t,
      )
      result = todos.filter((t) => filters.every(([c, v]) => t[c] === v))
    } else if (op === 'delete') {
      const kept = todos.filter((t) => !filters.every(([c, v]) => t[c] === v))
      result = todos.filter((t) => filters.every(([c, v]) => t[c] === v))
      todos = kept
    }
    return { data: result, error: null }
  }

  const builder: Builder = {
    select() {
      if (op === 'select' && !payload) op = 'select'
      return builder
    },
    insert(row) {
      op = 'insert'
      payload = row
      return builder
    },
    update(row) {
      op = 'update'
      payload = row
      return builder
    },
    delete() {
      op = 'delete'
      return builder
    },
    eq(col, val) {
      filters.push([col, val])
      return builder
    },
    order(col, opts) {
      orderCol = col
      orderAsc = opts?.ascending ?? true
      return builder
    },
    async single() {
      const { data } = run()
      return { data: data[0] ?? null, error: null }
    },
    throwOnError() {
      return builder
    },
    then(onfulfilled) {
      const result = run()
      return Promise.resolve(onfulfilled(result))
    },
  }
  return builder
}

// --- Public client ---

export const mockClient = {
  auth: {
    async getSession() {
      return { data: { session: loadSession() }, error: null }
    },
    onAuthStateChange(cb: Listener) {
      listeners.push(cb)
      return {
        data: {
          subscription: {
            unsubscribe() {
              const i = listeners.indexOf(cb)
              if (i >= 0) listeners.splice(i, 1)
            },
          },
        },
      }
    },
    async signInWithPassword({ email, password }: { email: string; password: string }) {
      if (email !== SEED_USER.email || password !== SEED_USER.password) {
        return {
          data: { session: null, user: null },
          error: { message: 'Invalid login credentials', name: 'AuthApiError', status: 400 },
        }
      }
      const session = makeSession(email)
      saveSession(session)
      emit('SIGNED_IN', session)
      return { data: { session, user: session.user }, error: null }
    },
    async signUp({ email }: { email: string; password: string }) {
      const session = makeSession(email)
      saveSession(session)
      emit('SIGNED_IN', session)
      return { data: { session, user: session.user }, error: null }
    },
    async signInWithOAuth({ provider }: { provider: string }) {
      return {
        data: { provider, url: '#mock-oauth' },
        error: { message: 'OAuth is mocked in benchmark mode', name: 'AuthError', status: 501 },
      }
    },
    async resetPasswordForEmail(_email: string) {
      return { data: {}, error: null }
    },
    async signOut() {
      saveSession(null)
      emit('SIGNED_OUT', null)
      return { error: null }
    },
  },
  from(_table: string) {
    return todosBuilder()
  },
}

export type MockClient = typeof mockClient
